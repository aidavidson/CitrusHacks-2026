import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import http from "node:http";
import { createApp } from "./app.js";
import { createStore } from "./store.js";
import { loadConfig } from "./config.js";

async function fixture(t) {
  const dir = mkdtempSync(path.join(tmpdir(), "sortify-test-"));
  const store = createStore(dir);
  const calls = [];
  let account = "alice";
  let expired = false;
  let failRefresh = false;
  let rateLimited = false;
  const config = loadConfig({ SPOTIFY_CLIENT_ID: "a".repeat(32) });
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith("/api/token")) {
      if (init.body.get("grant_type") === "refresh_token")
        await new Promise((resolve) => setTimeout(resolve, 20));
      if (failRefresh && init.body.get("grant_type") === "refresh_token")
        return new Response("{}", { status: 400 });
      return Response.json({
        access_token: "private-access-token",
        refresh_token: "private-refresh-token",
        expires_in: expired ? 1 : 3600,
      });
    }
    if (url.endsWith("/me"))
      return Response.json({ id: account, display_name: account });
    if (rateLimited)
      return new Response("{}", {
        status: 429,
        headers: { "Retry-After": "42" },
      });
    return new Response(null, { status: 204 });
  };
  const server = createApp({ config, store, fetchImpl }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  config.origin = `http://127.0.0.1:${server.address().port}`;
  config.redirectUri = `${config.origin}/auth/callback`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    store.close();
    rmSync(dir, { force: true, recursive: true });
  });
  function client() {
    let cookie = "";
    let csrf = "";
    return {
      get cookie() {
        return cookie;
      },
      async request(url, init = {}) {
        const response = await fetch(`${config.origin}${url}`, {
          ...init,
          redirect: "manual",
          headers: {
            Cookie: cookie,
            Origin: config.origin,
            "X-CSRF-Token": csrf,
            ...(init.body ? { "Content-Type": "application/json" } : {}),
            ...init.headers,
          },
        });
        const next = response.headers.get("set-cookie");
        if (next) cookie = next.split(";")[0];
        return response;
      },
      async session() {
        const response = await this.request("/api/session");
        const data = await response.json();
        csrf = data.csrfToken;
        return { response, data };
      },
      async login() {
        await this.session();
        const response = await this.request("/auth/login", { method: "POST" });
        assert.equal(response.status, 200);
        const url = new URL((await response.json()).url);
        const callback = await this.request(
          `/auth/callback?code=fake-code&state=${url.searchParams.get("state")}`,
        );
        assert.equal(callback.status, 302);
        await this.session();
        return url;
      },
    };
  }
  return {
    client,
    calls,
    config,
    store,
    dir,
    setAccount(value) {
      account = value;
    },
    expire() {
      expired = true;
    },
    unexpire() {
      expired = false;
    },
    expireSession(client) {
      const id = client.cookie.split("=")[1];
      const session = store.getSession(id);
      session.tokens.expiresAt = 0;
      store.putSession(id, session);
    },
    failRefresh() {
      failRefresh = true;
    },
    rateLimit() {
      rateLimited = true;
    },
  };
}

test("session cookie, CSRF, Host checks and private-file boundaries", async (t) => {
  const f = await fixture(t);
  const client = f.client();
  const { response, data } = await client.session();
  assert.equal(data.connected, false);
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  assert.match(response.headers.get("set-cookie"), /SameSite=Lax/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(
    response.headers.get("content-security-policy"),
    /script-src 'self'/,
  );
  assert.equal(
    (
      await client.request("/auth/login", {
        method: "POST",
        headers: { "X-CSRF-Token": "wrong" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await client.request("/auth/login", {
        method: "POST",
        headers: { Origin: "https://evil.example" },
      })
    ).status,
    403,
  );
  const wrongHost = await new Promise((resolve, reject) => {
    http
      .get(
        `${f.config.origin}/api/session`,
        { headers: { Host: "evil.example" } },
        (response) => {
          response.resume();
          resolve(response.statusCode);
        },
      )
      .on("error", reject);
  });
  assert.equal(wrongHost, 403);
  assert.equal(
    (
      await client.request("/api/session", {
        headers: { "Sec-Fetch-Site": "cross-site" },
      })
    ).status,
    403,
  );
  assert.equal((await client.request("/api/listens")).status, 401);
  for (const file of [
    "/.env",
    "/.git/config",
    "/.data/token.key",
    "/backend/store.js",
    "/package.json",
    "/frontend/js/config.js",
    "/app-config.js",
  ]) {
    assert.equal((await client.request(file)).status, 404, file);
  }
});

test("external links can open the app but cannot navigate to APIs or frame it", async (t) => {
  const f = await fixture(t);
  async function navigation(url, overrides = {}, method = "GET") {
    return new Promise((resolve, reject) => {
      const request = http.request(`${f.config.origin}${url}`, {
        method,
        headers: {
          "Sec-Fetch-Site": "cross-site",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Dest": "document",
          ...overrides,
        },
      }, (response) => {
        response.resume();
        resolve(response.statusCode);
      });
      request.on("error", reject);
      request.end();
    });
  }
  assert.equal(await navigation("/"), 200);
  assert.equal(await navigation("/auth/callback?state=invalid"), 400);
  assert.equal(await navigation("/api/session"), 403);
  assert.equal(await navigation("/api/listens"), 403);
  assert.equal(await navigation("/", { "Sec-Fetch-Dest": "iframe" }), 403);
  assert.equal(await navigation("/", { "Sec-Fetch-Mode": "cors" }), 403);
  assert.equal(await navigation("/", {}, "POST"), 403);
});

test("OAuth uses server-side PKCE, rejects state mismatch and rotates sessions", async (t) => {
  const f = await fixture(t);
  const client = f.client();
  await client.session();
  const anonymousCookie = client.cookie;
  assert.equal(
    (await client.request("/auth/callback?code=bad&state=bad")).status,
    400,
  );
  assert.equal(f.calls.length, 0);
  const url = await client.login();
  assert.notEqual(client.cookie, anonymousCookie);
  const exchange = f.calls.find((call) => call.url.endsWith("/api/token"));
  assert.equal(
    createHash("sha256")
      .update(exchange.init.body.get("code_verifier"))
      .digest("base64url"),
    url.searchParams.get("code_challenge"),
  );
  const { data } = await client.session();
  assert.equal(data.profile.id, "alice");
  assert.doesNotMatch(
    JSON.stringify(data),
    /private-access-token|private-refresh-token/,
  );
  assert.equal(
    (
      await client.request(
        `/auth/callback?code=fake-code&state=${url.searchParams.get("state")}`,
      )
    ).status,
    400,
  );
  const oldCookie = client.cookie;
  assert.equal(
    (await client.request("/auth/logout", { method: "POST" })).status,
    204,
  );
  assert.equal(
    (await client.request("/api/listens", { headers: { Cookie: oldCookie } }))
      .status,
    401,
  );
});

test("listens are validated, classified on the server, deduplicated and isolated by account", async (t) => {
  const f = await fixture(t);
  const alice = f.client();
  await alice.login();
  const event = {
    id: randomUUID(),
    trackId: "a".repeat(22),
    trackName: '<img src=x onerror="alert(1)">',
    durationMs: 100000,
    progressMs: 54999,
    classificationReason: "switched_after_threshold",
    timestamp: new Date().toISOString(),
  };
  const save = (value) =>
    alice.request("/api/listens", {
      method: "POST",
      body: JSON.stringify(value),
    });
  const first = await save(event);
  assert.equal(first.status, 201);
  const saved = await first.json();
  assert.equal(saved.classification, "skipped");
  assert.equal(saved.classificationReason, "switched_before_threshold");
  await save(event);
  const completed = await (
    await save({ ...event, id: randomUUID(), progressMs: 55000 })
  ).json();
  assert.equal(completed.classification, "completed");
  assert.equal((await save({ ...event, progressMs: 100001 })).status, 400);
  assert.equal((await save({ ...event, userId: "bob" })).status, 400);
  assert.equal(
    (await save({ ...event, classification: "completed" })).status,
    400,
  );
  assert.equal(
    (await (await alice.request("/api/listens")).json()).listens.length,
    2,
  );
  f.setAccount("bob");
  const bob = f.client();
  await bob.login();
  assert.deepEqual(
    (await (await bob.request("/api/listens")).json()).listens,
    [],
  );
  assert.equal((await bob.request("/api/spotify/me/tracks")).status, 404);
  assert.equal(
    (await bob.request("/api/spotify/me", { method: "POST" })).status,
    404,
  );
});

test("Spotify refresh is serialized, rate limits are forwarded, invalid refresh requires reconnect", async (t) => {
  const f = await fixture(t);
  f.expire();
  const client = f.client();
  await client.login();
  f.unexpire();
  const before = f.calls.filter((call) =>
    call.url.endsWith("/api/token"),
  ).length;
  await Promise.all(
    Array.from({ length: 3 }, () =>
      client.request("/api/spotify/me/player/currently-playing"),
    ),
  );
  assert.equal(
    f.calls.filter((call) => call.url.endsWith("/api/token")).length,
    before + 1,
  );
  f.rateLimit();
  const limited = await client.request(
    "/api/spotify/me/player/currently-playing",
  );
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("retry-after"), "42");
  f.failRefresh();
  f.expireSession(client);
  assert.equal(
    (await client.request("/api/spotify/me/player/currently-playing")).status,
    401,
  );
  assert.equal((await client.session()).data.connected, false);
});

test("database survives restart and stores token material encrypted", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "sortify-store-"));
  let store;
  try {
    store = createStore(dir);
    store.putSession("cookie-secret", {
      tokens: { accessToken: "access-secret", refreshToken: "refresh-secret" },
      expires: Date.now() + 60000,
    });
    store.addListen("alice", {
      id: "listen-1",
      timestamp: "2026-10-17T00:00:00.000Z",
      classification: "skipped",
    });
    store.close();
    const bytes = readFileSync(path.join(dir, "sortify.sqlite")).toString();
    assert.doesNotMatch(bytes, /access-secret|refresh-secret|cookie-secret/);
    store = createStore(dir);
    assert.equal(
      store.getSession("cookie-secret").tokens.refreshToken,
      "refresh-secret",
    );
    assert.equal(store.getListens("alice").length, 1);
    assert.equal(store.getListens("bob").length, 0);
  } finally {
    store?.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("configuration rejects network exposure and malformed ports", () => {
  for (const env of [
    { PORT: "NaN" },
    { APP_ORIGIN: "http://0.0.0.0:3000" },
    { APP_ORIGIN: "http://127.0.0.1:3000/private" },
  ]) {
    assert.throws(() => loadConfig(env));
  }
});
