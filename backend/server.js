import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createStore } from "./store.js";
import { createServer } from "node:http";
import { createFrontend } from "./frontend.js";

const config = loadConfig();
const store = createStore(config.dataDir);
store.prune();
const development = process.argv.includes("--dev");
const server = createServer();
const frontend = await createFrontend(server, development);
server.on(
  "request",
  createApp({ config, store, development, frontend: frontend.middleware }),
);
server.listen(config.port, "127.0.0.1", () => {
  console.log(`Sortify is running at ${config.origin}`);
  if (!config.clientId)
    console.log("Set SPOTIFY_CLIENT_ID in .env to enable Spotify login.");
});
server.on("error", async (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Port ${config.port} is busy. Set PORT to another port in .env.`
      : error.message,
  );
  store.close();
  await frontend.close();
  process.exitCode = 1;
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await frontend.close();
    server.close(() => {
      store.close();
      process.exit(0);
    });
  });
}
