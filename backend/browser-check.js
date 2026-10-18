import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { chromium } from "playwright";
import { createApp } from "./app.js";
import { createStore } from "./store.js";
import { loadConfig } from "./config.js";

const dir = mkdtempSync(path.join(tmpdir(), "sortify-browser-"));
const store = createStore(dir);
const config = loadConfig({ SPOTIFY_CLIENT_ID: "a".repeat(32) });
const hostileName = '<img src=x onerror="window.injected=true">';
let current = { id: "a".repeat(22), name: hostileName, progress: 54999 };
const fetchImpl = async () =>
  Response.json({
    is_playing: true,
    progress_ms: current.progress,
    item: {
      id: current.id,
      name: current.name,
      duration_ms: 100000,
      artists: [{ name: "Test artist" }],
      album: { images: [] },
    },
  });
const server = createApp({ config, store, fetchImpl }).listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
config.origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const id = randomBytes(32).toString("base64url");
  store.putSession(id, {
    userId: "browser-user",
    profile: { id: "browser-user", display_name: "Test listener" },
    csrf: "browser-csrf",
    expires: Date.now() + 600000,
    tokens: {
      accessToken: "test-access",
      refreshToken: "test-refresh",
      expiresAt: Date.now() + 3600000,
    },
  });
  await context.addCookies([
    {
      name: "sortify_session",
      value: id,
      url: config.origin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  await page.route("https://sortify-navigation.test/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<a href="${config.origin}/">Open Sortify</a>`,
    }),
  );
  await page.goto("https://sortify-navigation.test/");
  const navigation = page.waitForResponse(`${config.origin}/`);
  await page.getByRole("link", { name: "Open Sortify" }).click();
  const navigationResponse = await navigation;
  assert.equal(navigationResponse.status(), 200);
  assert.equal(navigationResponse.request().isNavigationRequest(), true);
  await page
    .locator("#now-playing-title")
    .filter({ hasText: hostileName })
    .waitFor();
  assert.equal(await page.locator("#songs-played-value").textContent(), "0");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.setViewportSize({ width: 1440, height: 1000 });

  let failSave = true;
  await page.route("**/api/listens", async (route) => {
    if (route.request().method() === "POST" && failSave) {
      failSave = false;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: '{"error":"Test failure"}',
      });
    } else await route.continue();
  });
  current = { id: "b".repeat(22), name: "Second track", progress: 55000 };
  const failedSave = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/listens") && response.status() === 500,
  );
  await page.clock.fastForward(5100);
  await failedSave;
  await page.clock.fastForward(5100);
  await page.waitForFunction(
    () => document.getElementById("songs-played-value").textContent === "1",
  );
  assert.equal(await page.locator("#songs-skipped-value").textContent(), "1");
  assert.equal(await page.locator(".artist-name").textContent(), hostileName);
  assert.equal(await page.locator(".artist-name img").count(), 0);
  assert.equal(await page.evaluate(() => Boolean(window.injected)), false);

  current = { id: "c".repeat(22), name: "Third track", progress: 1000 };
  await page.clock.fastForward(5100);
  await page.waitForFunction(
    () => document.getElementById("songs-played-value").textContent === "2",
  );
  assert.equal(await page.locator("#songs-skipped-value").textContent(), "1");
  await page.reload();
  await page.waitForFunction(
    () => document.getElementById("songs-played-value").textContent === "2",
  );
  assert.deepEqual(
    store.getListens("browser-user").map((event) => event.classification),
    ["skipped", "completed"],
  );
  const storedKeys = await page.evaluate(() => Object.keys(localStorage));
  assert.ok(!storedKeys.includes("spotify_tokens"));
  assert.ok(!storedKeys.includes("sortify_sessions"));
  assert.equal(
    await page.evaluate(() => document.cookie.includes("sortify_session")),
    false,
  );
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({
      path: path.join(tmpdir(), `sortify-dashboard-${viewport.width}.png`),
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Disconnect Spotify" }).click();
  await page.locator("#landing-page:not(.is-hidden)").waitFor();
  assert.equal(await page.locator("#songs-played-value").textContent(), "--");
  assert.equal(store.getSession(id), null);
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: persistence, skip threshold, retry, safe rendering, logout, desktop/mobile.",
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  store.close();
  rmSync(dir, { recursive: true, force: true });
}
