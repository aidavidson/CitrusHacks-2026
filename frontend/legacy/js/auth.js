let session = null;

// Remove credentials left by the old browser-only OAuth implementation.
for (const key of [
  "spotify_tokens",
  "spotify_code_verifier",
  "spotify_oauth_state",
]) {
  for (const storage of ["localStorage", "sessionStorage"]) {
    try {
      window[storage].removeItem(key);
    } catch {
      /* Storage may be disabled. */
    }
  }
}

export async function apiFetch(path, init = {}) {
  const headers = new Headers(init.headers);
  if (init.method && !["GET", "HEAD"].includes(init.method.toUpperCase())) {
    headers.set("X-CSRF-Token", session?.csrfToken || "");
    if (init.body) headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  if (response.status === 401) {
    session = null;
    window.dispatchEvent(
      new CustomEvent("spotify-auth-changed", { detail: { connected: false } }),
    );
  }
  return response;
}

export async function handleSpotifyCallback() {
  const response = await apiFetch("/api/session");
  if (!response.ok)
    throw new Error("Could not connect to the Sortify backend.");
  session = await response.json();
  const params = new URLSearchParams(location.search);
  if (params.has("auth")) {
    history.replaceState({}, "", location.pathname);
    if (params.get("auth") === "denied")
      throw new Error("Spotify connection was cancelled.");
  }
  return session;
}

export function isSpotifyConnected() {
  return Boolean(session?.connected);
}

export async function startSpotifyLogin() {
  await handleSpotifyCallback();
  const response = await apiFetch("/auth/login", { method: "POST" });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Could not start Spotify login.");
  location.assign(data.url);
}

export async function logoutSpotify() {
  const response = await apiFetch("/auth/logout", { method: "POST" });
  if (!response.ok)
    throw new Error("Could not disconnect Spotify. Please try again.");
  session = null;
}

export async function spotifyFetch(path) {
  const response = await apiFetch(`/api/spotify${path}`);
  if (response.status === 429) {
    window.dispatchEvent(
      new CustomEvent("sortify-rate-limit", {
        detail: {
          path,
          retryAfterSeconds: Number(response.headers.get("Retry-After") || 30),
          status: 429,
        },
      }),
    );
  }
  return response;
}

export async function fetchCurrentUserProfile() {
  if (!session?.connected) throw new Error("Please connect Spotify.");
  return session.profile;
}
