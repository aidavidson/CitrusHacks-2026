import { spotifyConfig } from "./config.js";

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_URL = "https://api.spotify.com/v1";

const STORAGE_KEYS = {
  codeVerifier: "spotify_code_verifier",
  oauthState: "spotify_oauth_state",
  tokens: "spotify_tokens",
};

function setTransientStorage(key, value) {
  window.localStorage.setItem(key, value);

  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Session storage can fail in stricter browser modes; localStorage remains the fallback.
  }
}

function getTransientStorage(key) {
  const localValue = window.localStorage.getItem(key);
  if (localValue) {
    return localValue;
  }

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function removeTransientStorage(key) {
  window.localStorage.removeItem(key);

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore sessionStorage cleanup failures.
  }
}

function toBase64Url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createRandomString(byteLength = 64) {
  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

async function sha256(input) {
  const encoder = new TextEncoder();
  return window.crypto.subtle.digest("SHA-256", encoder.encode(input));
}

async function createCodeChallenge(codeVerifier) {
  const digest = await sha256(codeVerifier);
  return toBase64Url(new Uint8Array(digest));
}

function saveTokens(tokens) {
  const expiresAt = Date.now() + (tokens.expires_in ?? 0) * 1000;
  const nextTokens = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
    tokenType: tokens.token_type ?? "Bearer",
    scope: tokens.scope ?? spotifyConfig.scopes.join(" "),
  };

  window.localStorage.setItem(STORAGE_KEYS.tokens, JSON.stringify(nextTokens));
  return nextTokens;
}

function getStoredTokens() {
  const rawTokens = window.localStorage.getItem(STORAGE_KEYS.tokens);
  if (!rawTokens) {
    return null;
  }

  try {
    return JSON.parse(rawTokens);
  } catch {
    window.localStorage.removeItem(STORAGE_KEYS.tokens);
    return null;
  }
}

function clearOAuthState() {
  removeTransientStorage(STORAGE_KEYS.codeVerifier);
  removeTransientStorage(STORAGE_KEYS.oauthState);
}

function clearTokens() {
  window.localStorage.removeItem(STORAGE_KEYS.tokens);
}

function dispatchSpotifyRateLimitEvent(path, response) {
  const retryAfter = response.headers.get("Retry-After");
  window.dispatchEvent(
    new CustomEvent("sortify-rate-limit", {
      detail: {
        path,
        retryAfterSeconds: retryAfter ? Number(retryAfter) : null,
        status: response.status,
      },
    })
  );
}

function validateSpotifyConfig() {
  if (!spotifyConfig.clientId || spotifyConfig.clientId === "ADD_YOUR_CLIENT_ID") {
    throw new Error(
      "Set window.__APP_CONFIG__.spotifyClientId before starting Spotify login."
    );
  }
}

async function exchangeCodeForTokens(code) {
  const codeVerifier = getTransientStorage(STORAGE_KEYS.codeVerifier);
  if (!codeVerifier) {
    throw new Error("Missing PKCE code verifier.");
  }

  const body = new URLSearchParams({
    client_id: spotifyConfig.clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: spotifyConfig.redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Spotify token exchange failed (${response.status}): ${errorBody}`);
  }

  return saveTokens(await response.json());
}

async function refreshAccessToken() {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) {
    throw new Error("Missing Spotify refresh token.");
  }

  const body = new URLSearchParams({
    client_id: spotifyConfig.clientId,
    grant_type: "refresh_token",
    refresh_token: tokens.refreshToken,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    clearTokens();
    throw new Error("Spotify token refresh failed.");
  }

  const refreshed = await response.json();
  return saveTokens({
    ...refreshed,
    refresh_token: refreshed.refresh_token ?? tokens.refreshToken,
  });
}

export async function getValidAccessToken() {
  const tokens = getStoredTokens();
  if (!tokens) {
    return null;
  }

  const stillValid = Date.now() < tokens.expiresAt - 60_000;
  if (stillValid) {
    return tokens.accessToken;
  }

  return (await refreshAccessToken()).accessToken;
}

export async function spotifyFetch(path, init = {}) {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error("User is not authenticated with Spotify.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  console.log("[Sortify] spotifyFetch", path, response.status, response.headers.get("Retry-After"));

  if (response.status === 429) {
    dispatchSpotifyRateLimitEvent(path, response);
  }

  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();
    const retryResponse = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${refreshedToken.accessToken}`,
      },
    });
    console.log(
      "[Sortify] spotifyFetch retry",
      path,
      retryResponse.status,
      retryResponse.headers.get("Retry-After")
    );

    if (retryResponse.status === 429) {
      dispatchSpotifyRateLimitEvent(path, retryResponse);
    }

    return retryResponse;
  }

  return response;
}

export async function fetchCurrentUserProfile() {
  const response = await spotifyFetch("/me");
  if (response.status === 429) {
    const retryAfterSeconds = Number(response.headers.get("Retry-After") ?? "30");
    const error = new Error(
      `Spotify rate limit hit. Retry in ${retryAfterSeconds} second${retryAfterSeconds === 1 ? "" : "s"}.`
    );
    error.retryAfterSeconds = retryAfterSeconds;
    throw error;
  }

  if (!response.ok) {
    throw new Error("Could not load Spotify profile.");
  }

  return response.json();
}

export function isSpotifyConnected() {
  return Boolean(getStoredTokens());
}

export function logoutSpotify() {
  clearOAuthState();
  clearTokens();
}

export async function startSpotifyLogin() {
  validateSpotifyConfig();

  const codeVerifier = createRandomString(64);
  const state = createRandomString(16);
  const codeChallenge = await createCodeChallenge(codeVerifier);

  setTransientStorage(STORAGE_KEYS.codeVerifier, codeVerifier);
  setTransientStorage(STORAGE_KEYS.oauthState, state);

  const params = new URLSearchParams({
    client_id: spotifyConfig.clientId,
    response_type: "code",
    redirect_uri: spotifyConfig.redirectUri,
    scope: spotifyConfig.scopes.join(" "),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    state,
  });

  window.location.assign(`${AUTHORIZE_URL}?${params.toString()}`);
}

export async function handleSpotifyCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    clearOAuthState();
    throw new Error(`Spotify authorization failed: ${error}`);
  }

  if (!code) {
    return null;
  }

  const savedState = getTransientStorage(STORAGE_KEYS.oauthState);
  if (!savedState || savedState !== state) {
    clearOAuthState();
    throw new Error("Spotify OAuth state mismatch.");
  }

  const tokens = await exchangeCodeForTokens(code);
  clearOAuthState();
  window.history.replaceState({}, document.title, window.location.pathname);
  return tokens;
}
