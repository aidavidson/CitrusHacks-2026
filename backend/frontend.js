import express from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

export function builtFrontend() {
  const router = express.Router();
  router.use(
    "/assets",
    express.static(path.join(root, "dist/assets"), {
      dotfiles: "deny",
      index: false,
      immutable: true,
      maxAge: "1y",
    }),
  );
  router.get("/", async (req, res, next) => {
    try {
      const html = await readFile(path.join(root, "dist/index.html"), "utf8");
      res
        .set("Cache-Control", "no-cache")
        .type("html")
        .send(html.replaceAll("__SORTIFY_NONCE__", res.locals.cspNonce));
    } catch (error) {
      if (error.code === "ENOENT")
        return res
          .status(503)
          .send(
            "Frontend build missing. Run npm run build, then restart the server.",
          );
      next(error);
    }
  });
  return router;
}

export async function createFrontend(server, development) {
  if (!development)
    return { middleware: builtFrontend(), close: async () => {} };
  const { createServer } = await import("vite");
  const vite = await createServer({
    configFile: path.join(root, "vite.config.js"),
    appType: "custom",
    server: {
      middlewareMode: true,
      hmr: { server },
      fs: {
        strict: true,
        allow: [path.join(root, "frontend"), path.join(root, "node_modules")],
      },
    },
  });
  const router = express.Router();
  router.get("/", async (req, res, next) => {
    try {
      const template = await readFile(
        path.join(root, "frontend/index.html"),
        "utf8",
      );
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res
        .set("Cache-Control", "no-store")
        .type("html")
        .send(html.replaceAll("__SORTIFY_NONCE__", res.locals.cspNonce));
    } catch (error) {
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });
  router.use(vite.middlewares);
  return { middleware: router, close: () => vite.close() };
}
