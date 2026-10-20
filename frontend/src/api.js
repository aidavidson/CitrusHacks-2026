export class ApiError extends Error {
  constructor(message, status, retryAfterSeconds) {
    super(message);
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function apiRequest(path, { csrfToken, ...init } = {}) {
  const headers = new Headers(init.headers);
  if (init.method && !["GET", "HEAD"].includes(init.method)) {
    headers.set("X-CSRF-Token", csrfToken || "");
    if (init.body) headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const retry = Number(response.headers.get("Retry-After"));
    throw new ApiError(
      data.error || "Could not reach Sortify. Please try again.",
      response.status,
      Number.isFinite(retry) && retry > 0 ? retry : 30,
    );
  }
  return data;
}

export function clearLegacyTokens() {
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
}
