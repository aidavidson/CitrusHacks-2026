function getRuntimeConfig() {
  const browserConfig = window.__APP_CONFIG__ ?? {};
  const savedClientId = window.localStorage.getItem("spotify_client_id");

  return {
    spotifyClientId: browserConfig.spotifyClientId ?? savedClientId ?? "ADD_YOUR_CLIENT_ID",
    spotifyRedirectUri:
      browserConfig.spotifyRedirectUri ??
      `${window.location.origin}${window.location.pathname}`,
  };
}

export const spotifyConfig = {
  get clientId() {
    return getRuntimeConfig().spotifyClientId;
  },
  get redirectUri() {
    return getRuntimeConfig().spotifyRedirectUri;
  },
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
