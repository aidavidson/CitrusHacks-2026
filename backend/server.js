import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createStore } from "./store.js";

const config = loadConfig();
const store = createStore(config.dataDir);
store.prune();
const server = createApp({ config, store }).listen(
  config.port,
  "127.0.0.1",
  () => {
    console.log(`Sortify is running at ${config.origin}`);
    if (!config.clientId)
      console.log("Set SPOTIFY_CLIENT_ID in .env to enable Spotify login.");
  },
);
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Port ${config.port} is busy. Set PORT to another port in .env.`
      : error.message,
  );
  store.close();
  process.exitCode = 1;
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () =>
    server.close(() => {
      store.close();
      process.exit(0);
    }),
  );
}
