import path from "node:path";

export function loadConfig(env = process.env) {
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  const origin = new URL(env.APP_ORIGIN || `http://127.0.0.1:${port}`);
  if (
    origin.protocol !== "http:" ||
    origin.hostname !== "127.0.0.1" ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    Number(origin.port || 80) !== port
  ) {
    throw new Error(
      "APP_ORIGIN must be http://127.0.0.1:PORT. This server is local-only.",
    );
  }
  const clientId = env.SPOTIFY_CLIENT_ID?.trim() || "";
  if (clientId && !/^[a-fA-F0-9]{32}$/.test(clientId)) {
    throw new Error(
      "SPOTIFY_CLIENT_ID must be your 32-character Spotify app ID.",
    );
  }
  return {
    port,
    origin: origin.origin,
    clientId,
    redirectUri: `${origin.origin}/auth/callback`,
    dataDir: path.resolve(env.DATA_DIR || ".data"),
  };
}
