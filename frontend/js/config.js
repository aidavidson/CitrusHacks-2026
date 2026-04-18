const localConfig = window.__APP_CONFIG__ ?? {};

export const spotifyConfig = {
  clientId: localConfig.spotifyClientId ?? "ADD_YOUR_CLIENT_ID",
  redirectUri:
    localConfig.spotifyRedirectUri ??
    `${window.location.origin}${window.location.pathname}`,
  scopes: [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-recently-played",
  ],
};

export const appRules = {
  likelyCountedMs: 30000,
  fullListenRatio: 0.9,
  pollIntervalMs: 4000,
};
