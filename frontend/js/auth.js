import { spotifyConfig } from "./config.js";

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_URL = "https://api.spotify.com/v1";

const STORAGE_KEYS = {
  codeVerifier: "spotify_code_verifier",
  oauthState: "spotify_oauth_state",
  tokens: "spotify_tokens",
};

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
  window.localStorage.removeItem(STORAGE_KEYS.codeVerifier);
  window.localStorage.removeItem(STORAGE_KEYS.oauthState);
}

function clearTokens() {
  window.localStorage.removeItem(STORAGE_KEYS.tokens);
}

function validateSpotifyConfig() {
  if (!spotifyConfig.clientId || spotifyConfig.clientId === "ADD_YOUR_CLIENT_ID") {
    throw new Error(
      "Set window.__APP_CONFIG__.spotifyClientId before starting Spotify login."
    );
  }
}

async function exchangeCodeForTokens(code) {
  const codeVerifier = window.localStorage.getItem(STORAGE_KEYS.codeVerifier);
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
    throw new Error("Spotify token exchange failed.");
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

  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();
    return fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${refreshedToken.accessToken}`,
      },
    });
  }

  return response;
}

export async function fetchCurrentUserProfile() {
  const response = await spotifyFetch("/me");
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

  window.localStorage.setItem(STORAGE_KEYS.codeVerifier, codeVerifier);
  window.localStorage.setItem(STORAGE_KEYS.oauthState, state);

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

  const savedState = window.localStorage.getItem(STORAGE_KEYS.oauthState);
  if (!savedState || savedState !== state) {
    clearOAuthState();
    throw new Error("Spotify OAuth state mismatch.");
  }

  const tokens = await exchangeCodeForTokens(code);
  clearOAuthState();
  window.history.replaceState({}, document.title, window.location.pathname);
  return tokens;
}
