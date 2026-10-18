import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { randomBytes, timingSafeEqual, createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { createSpotify, HttpError } from "./spotify.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const random = () => randomBytes(32).toString("base64url");
const COOKIE = "sortify_session";
const SESSION_AGE = 7 * 24 * 60 * 60 * 1000;
const scopes =
  "user-read-currently-playing user-read-playback-state user-read-recently-played";
const listenSchema = z
  .object({
    id: z.uuid(),
    trackId: z.string().regex(/^[a-zA-Z0-9]{22}$/),
    trackName: z.string().min(1).max(500),
    durationMs: z.number().int().min(1).max(86400000),
    progressMs: z.number().int().min(0).max(86400000),
    classificationReason: z.enum([
      "switched_before_threshold",
      "switched_after_threshold",
      "playback_stopped",
      "track_changed",
    ]),
    timestamp: z.iso.datetime(),
  })
  .strict()
  .refine((value) => value.progressMs <= value.durationMs);

export function createApp({ config, store, fetchImpl }) {
  const app = express();
  const spotify = createSpotify(config, fetchImpl);
  app.disable("x-powered-by");
  app.use(
    helmet({
      strictTransportSecurity: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          scriptSrcAttr: ["'none'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: [
            "'self'",
            "data:",
            "https://i.scdn.co",
            "https://mosaic.scdn.co",
          ],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: null,
        },
      },
    }),
  );
  app.use((req, res, next) => {
    if (req.get("host") !== new URL(config.origin).host)
      return res
        .status(403)
        .json({ error: "Use the configured loopback address." });
    const pageNavigation =
      req.method === "GET" &&
      req.get("sec-fetch-mode") === "navigate" &&
      req.get("sec-fetch-dest") === "document" &&
      ["/", "/auth/callback"].includes(req.path);
    if (req.get("sec-fetch-site") === "cross-site" && !pageNavigation) {
      return res.status(403).json({ error: "Cross-site request rejected." });
    }
    next();
  });
  app.use(["/api", "/auth"], (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(
    ["/api", "/auth"],
    rateLimit({
      windowMs: 60000,
      limit: 180,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.use(express.json({ limit: "16kb", type: "application/json" }));

  function setCookie(res, id, maxAge) {
    res.cookie(COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge,
    });
  }
  app.use(["/api", "/auth"], (req, res, next) => {
    const raw = req.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${COOKIE}=`))
      ?.slice(COOKIE.length + 1);
    req.sessionId = /^[a-zA-Z0-9_-]{43}$/.test(raw || "") ? raw : null;
    req.session = req.sessionId ? store.getSession(req.sessionId) : null;
    req.persist = (session = req.session) => {
      // A logout in another request must not resurrect the old session.
      if (store.getSession(req.sessionId))
        store.putSession(req.sessionId, session);
    };
    next();
  });
  function newSession(req, res, data = {}, age = SESSION_AGE) {
    if (req.sessionId) store.deleteSession(req.sessionId);
    req.sessionId = random();
    req.session = { ...data, csrf: random(), expires: Date.now() + age };
    store.putSession(req.sessionId, req.session);
    setCookie(res, req.sessionId, age);
  }
  function authenticated(req, res, next) {
    if (!req.session?.userId || !req.session.tokens)
      return res.status(401).json({ error: "Please connect Spotify." });
    next();
  }
  app.use(["/api", "/auth"], (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    const csrf = req.get("x-csrf-token");
    const expected = req.session?.csrf;
    if (
      req.get("origin") !== config.origin ||
      !csrf ||
      !expected ||
      Buffer.byteLength(csrf) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(csrf), Buffer.from(expected))
    ) {
      return res
        .status(403)
        .json({ error: "Invalid request origin or CSRF token." });
    }
    next();
  });

  app.get("/api/health", (req, res) =>
    res.json({ ok: true, spotifyConfigured: Boolean(config.clientId) }),
  );
  app.get("/api/session", (req, res) => {
    if (!req.session) newSession(req, res);
    res.json({
      connected: Boolean(req.session.userId && req.session.tokens),
      profile: req.session.profile || null,
      csrfToken: req.session.csrf,
      spotifyConfigured: Boolean(config.clientId),
    });
  });
  app.post(
    "/auth/login",
    rateLimit({ windowMs: 60000, limit: 10, legacyHeaders: false }),
    (req, res) => {
      if (!config.clientId)
        throw new HttpError(
          503,
          "Set SPOTIFY_CLIENT_ID in .env and restart the server.",
        );
      store.prune();
      const state = random();
      const verifier = random();
      newSession(
        req,
        res,
        { oauth: { state, verifier, expires: Date.now() + 600000 } },
        600000,
      );
      const params = new URLSearchParams({
        client_id: config.clientId,
        response_type: "code",
        redirect_uri: config.redirectUri,
        scope: scopes,
        state,
        code_challenge_method: "S256",
        code_challenge: createHash("sha256")
          .update(verifier)
          .digest("base64url"),
      });
      res.json({ url: `https://accounts.spotify.com/authorize?${params}` });
    },
  );
  app.get("/auth/callback", async (req, res) => {
    const oauth = req.session?.oauth;
    if (
      !oauth ||
      oauth.expires <= Date.now() ||
      typeof req.query.state !== "string" ||
      req.query.state !== oauth.state
    ) {
      throw new HttpError(
        400,
        "Invalid or expired Spotify login. Start again from Sortify.",
      );
    }
    delete req.session.oauth;
    req.persist();
    if (req.query.error) return res.redirect("/?auth=denied");
    if (typeof req.query.code !== "string" || req.query.code.length > 2048)
      throw new HttpError(400, "Missing authorization code.");
    const tokens = await spotify.exchange(req.query.code, oauth.verifier);
    const temporary = { tokens };
    const response = await spotify.api(
      "/me",
      temporary,
      () => {},
      req.sessionId,
    );
    if (!response.ok)
      throw new HttpError(
        502,
        "Could not load your Spotify account. Please try connecting again.",
      );
    const profile = await response.json();
    if (typeof profile.id !== "string" || !profile.id)
      throw new HttpError(502, "Invalid Spotify profile.");
    newSession(req, res, {
      tokens: temporary.tokens,
      userId: profile.id,
      profile: {
        id: profile.id,
        display_name: profile.display_name || profile.id,
      },
    });
    res.redirect("/");
  });
  app.post("/auth/logout", (req, res) => {
    if (req.sessionId) store.deleteSession(req.sessionId);
    res.clearCookie(COOKIE, { httpOnly: true, sameSite: "lax", path: "/" });
    res.status(204).end();
  });
  // Exact routes prevent this from becoming an arbitrary Spotify or HTTP proxy.
  for (const [local, remote] of [
    ["/api/spotify/me", "/me"],
    [
      "/api/spotify/me/player/currently-playing",
      "/me/player/currently-playing",
    ],
    [
      "/api/spotify/me/player/recently-played",
      "/me/player/recently-played?limit=50",
    ],
  ]) {
    app.get(local, authenticated, async (req, res) => {
      const response = await spotify.api(
        remote,
        req.session,
        req.persist,
        req.sessionId,
      );
      if (response.status === 429)
        res.set("Retry-After", response.headers.get("Retry-After") || "30");
      if (response.status === 204) return res.status(204).end();
      if (!response.ok)
        return res
          .status(response.status)
          .json({ error: "Spotify request failed." });
      res.json(await response.json());
    });
  }
  app.get("/api/listens", authenticated, (req, res) =>
    res.json({ listens: store.getListens(req.session.userId) }),
  );
  app.post("/api/listens", authenticated, (req, res) => {
    const parsed = listenSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid listening event.");
    const event = parsed.data;
    const percentPlayed = event.progressMs / event.durationMs;
    const classification = percentPlayed < 0.55 ? "skipped" : "completed";
    const classificationReason = event.classificationReason.startsWith(
      "switched_",
    )
      ? `switched_${classification === "skipped" ? "before" : "after"}_threshold`
      : event.classificationReason;
    const listen = store.addListen(req.session.userId, {
      ...event,
      classificationReason,
      percentPlayed,
      threshold: 0.55,
      thresholdReached: percentPlayed >= 0.55,
      classification,
    });
    res.status(201).json(listen);
  });
  app.use(["/api", "/auth"], (req, res) =>
    res.status(404).json({ error: "Unknown endpoint." }),
  );
  app.get("/", (req, res) =>
    res.sendFile(path.join(root, "dashboard/index.html")),
  );
  for (const file of ["style.css", "script.js", "playback.js", "book-logo2.png"]) {
    app.get(`/${file}`, (req, res) =>
      res.sendFile(path.join(root, "dashboard", file)),
    );
  }
  for (const file of ["auth.js", "listens.js"]) {
    app.get(`/frontend/js/${file}`, (req, res) =>
      res.sendFile(path.join(root, "frontend/js", file)),
    );
  }
  app.use((req, res) => res.status(404).json({ error: "Not found." }));
  app.use((error, req, res, next) => {
    const status =
      error.status || (error.type === "entity.too.large" ? 413 : 500);
    if (status >= 500) console.error("[Sortify] Request failed:", error.name);
    res
      .status(status)
      .json({
        error:
          status >= 500 && status !== 503
            ? "Server request failed. Please try again."
            : error.message,
      });
  });
  return app;
}
