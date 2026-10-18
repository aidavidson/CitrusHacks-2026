# Sortify

Sortify tracks Spotify playback and highlights the songs you repeatedly skip. It now runs as a local full-stack app: a vanilla JavaScript dashboard, a Node/Express REST API, and a SQLite database.

## Run Locally

Requires Node.js 24 or newer and npm.

1. Run `npm install` from the repository root.
2. Create `.env` using `.env.example` if it does not already exist. Set `SPOTIFY_CLIENT_ID` to your Spotify developer app's client ID. No client secret is needed: the backend uses authorization code flow with PKCE.
3. Register **`http://127.0.0.1:3000/auth/callback`** as a redirect URI in the [Spotify developer dashboard](https://developer.spotify.com/dashboard).
4. Run `npm run dev` for automatic server restarts, or `npm start`.
5. Open **http://127.0.0.1:3000** and connect Spotify.

Spotify requires an explicit loopback IP for local HTTP redirects, so use `127.0.0.1` rather than `localhost`. If port 3000 is occupied, set `PORT` in `.env` and register the matching callback URL. Spotify development-mode account restrictions still apply to your developer app.

The page and health endpoint work without Spotify configuration; connecting requires the client ID and callback registration. Serve the app through this backend rather than Live Server or a static file server.

## What Works

- Server-side Spotify OAuth with PKCE, refresh tokens, and expiring cookie sessions.
- Current-track polling every five seconds while the page is visible; idle polling backs off to one minute.
- Track switches below 55% of the highest observed playback position count as skips; 55% or more counts as completed.
- Listening history persists in SQLite, separated by Spotify account, and reloads with the dashboard.
- Stable listening-event IDs prevent duplicate saves when requests are retried.
- Song totals, skip totals, and a most-skipped ranking.

## Security

- Spotify access and refresh tokens stay on the server. They are encrypted with AES-256-GCM in the session database, using a generated local key. The browser only receives a random session ID in an HttpOnly, SameSite cookie.
- State-changing requests require the expected Origin and a session CSRF token. OAuth uses short-lived, single-use state and rotates the session ID after login.
- Spotify requests go through an exact allowlist of read endpoints. There is no arbitrary URL proxy or playlist-write permission.
- The server validates input and calculates classifications rather than accepting browser-supplied classification labels.
- Helmet sets security headers and a content security policy; executable inline scripts are disabled. Song names are rendered with `textContent`.
- Requests are rate-limited and body sizes are bounded. The server listens only on `127.0.0.1` and checks Host headers.
- `.env`, the database, and encryption keys are ignored by Git and are outside the served frontend directories.

Private backend files live in `.data/` (or `DATA_DIR`). Keep `sortify.sqlite` and `token.key` together when backing up a stopped server. Losing the key requires signing in again. Listening history itself is not encrypted; filesystem permissions restrict the data directory to the current OS user. Logout invalidates the session but keeps listening history for your next login. To disconnect the app's Spotify authorization entirely, remove it in your Spotify account's app settings.

This configuration is for local use. Internet hosting needs HTTPS, Secure cookies, deployment-specific origins, and a separate review of operational security. The local HTTP cookie intentionally does not use Secure.

## Tests

```sh
npm test
```

The API tests mock Spotify and cover OAuth state/PKCE, session rotation/logout, CSRF and Host checks, private-file protection, account isolation, input validation, the exact 55% boundary, idempotency, refresh handling, rate-limit forwarding, and encrypted token persistence.

For an end-to-end browser check with a temporary database and mocked Spotify playback:

```sh
npx playwright install chromium
npm run test:browser
```

An installed Google Chrome can be used instead: `PLAYWRIGHT_CHANNEL=chrome npm run test:browser`. This checks real backend saves, a failed-save retry, history after reload, safe title rendering, logout, and desktop/mobile layout. It does not connect to a real Spotify account.

## Project Layout

```text
backend/                  Express API, OAuth, encrypted sessions, SQLite, tests
dashboard/               Dashboard HTML/CSS, rendering, playback polling
frontend/js/auth.js       Same-origin backend client; no browser token storage
frontend/js/listens.js    In-memory dashboard history backed by the API
.env.example              Local configuration template
```

Some files under `frontend/` and `docs/` are earlier hackathon scaffolding. The entry point is `backend/server.js`; the active page is `dashboard/index.html`.

## Remaining Limitations

- Playback observation still runs in the browser. Keep the page open and visible; closing it or hiding the tab stops observations. The backend is not yet a background listening worker.
- Polling can miss rapid skips and short tracks. Seeking forward counts toward the observed-position threshold; same-track repeats are not yet separate listens. A missing playback response finalizes the previous observation, which may represent a stop rather than a deliberate skip.
- The backend validates events but trusts browser-reported progress. These are personal listening estimates, not verified playback telemetry or Spotify stream counts.
- A failed save is retried while the page stays open. There is no durable offline queue, and separate tabs can observe the same listen independently.
- Earlier `localStorage` history stays in your browser and is not automatically imported into a Spotify account. The active app clears legacy browser OAuth tokens and uses the database for new history.
- History is currently loaded as one list. Pagination, export/delete controls, and database migrations should accompany further growth.

Next development priorities: accurate pause/repeat handling, background tracking, history filters and data controls, then playlist cleanup recommendations.
