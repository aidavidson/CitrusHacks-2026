export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function createSpotify(config, fetchImpl = fetch) {
  const refreshing = new Map();
  const request = (url, init = {}) =>
    fetchImpl(url, {
      ...init,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  async function token(body) {
    const response = await request("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: config.clientId, ...body }),
    });
    if (!response.ok)
      throw new HttpError(
        response.status === 400 ? 401 : 502,
        "Spotify authorization failed. Please reconnect.",
      );
    const data = await response.json();
    if (!data.access_token || !Number.isFinite(data.expires_in))
      throw new HttpError(502, "Invalid Spotify token response.");
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }
  async function refresh(session, persist, sessionId) {
    if (!refreshing.has(sessionId)) {
      refreshing.set(
        sessionId,
        (async () => {
          try {
            if (!session.tokens?.refreshToken)
              throw new HttpError(401, "Please reconnect Spotify.");
            const next = await token({
              grant_type: "refresh_token",
              refresh_token: session.tokens.refreshToken,
            });
            session.tokens = {
              ...next,
              refreshToken: next.refreshToken || session.tokens.refreshToken,
            };
            persist(session);
            return session.tokens;
          } catch (error) {
            if (error.status === 401) {
              delete session.tokens;
              persist(session);
            }
            throw error;
          }
        })().finally(() => refreshing.delete(sessionId)),
      );
    }
    session.tokens = await refreshing.get(sessionId);
  }
  return {
    exchange(code, verifier) {
      return token({
        grant_type: "authorization_code",
        code,
        code_verifier: verifier,
        redirect_uri: config.redirectUri,
      });
    },
    async api(path, session, persist, sessionId) {
      if (!session.tokens) throw new HttpError(401, "Please connect Spotify.");
      if (session.tokens.expiresAt < Date.now() + 60000)
        await refresh(session, persist, sessionId);
      const send = () =>
        request(`https://api.spotify.com/v1${path}`, {
          headers: { Authorization: `Bearer ${session.tokens.accessToken}` },
        });
      let response = await send();
      if (response.status === 401) {
        await refresh(session, persist, sessionId);
        response = await send();
      }
      return response;
    },
  };
}
