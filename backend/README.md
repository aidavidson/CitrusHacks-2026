# Sortify Backend

Run from the repository root with `npm run dev`, or `npm run build` then `npm start`. See the root README for Spotify setup and security boundaries.

The backend serves the React dashboard and its REST API from one loopback origin. The React source lives in `frontend/`; older DOM scaffolding is under `frontend/legacy/` and is not served. It uses Express 5, Helmet, express-rate-limit, Zod, and Node's built-in SQLite driver (Node 24+).

In development, `frontend.js` mounts Vite behind the API routes on the same HTTP server, including React Fast Refresh. In the built mode, only `dist/assets` and the compiled root HTML are served. A per-response CSP nonce is substituted into Vite's HTML; API authentication, CSRF/Origin checks, and database storage are unchanged. Vite's filesystem allowlist excludes backend source and private data.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Backend health and whether Spotify is configured |
| GET | `/api/session` | Session status, public profile, and CSRF token |
| POST | `/auth/login` | Begin server-side Spotify PKCE login |
| GET | `/auth/callback` | Validate state, exchange code, rotate session |
| POST | `/auth/logout` | Delete the session and clear its cookie |
| GET | `/api/spotify/me` | Authenticated Spotify profile proxy |
| GET | `/api/spotify/me/player/currently-playing` | Authenticated playback proxy |
| GET | `/api/spotify/me/player/recently-played` | Authenticated recent-history proxy, fixed limit 50 |
| GET | `/api/listens` | Current Spotify account's saved listening events |
| POST | `/api/listens` | Validate and idempotently save a listening event |

All POST requests require `Origin` equal to the configured app origin and an `X-CSRF-Token` obtained from `/api/session`. API responses are not cacheable. The frontend never receives Spotify access or refresh tokens.

Listening events accept `id` (UUID), `trackId`, `trackName`, `durationMs`, `progressMs`, `classificationReason`, and an ISO `timestamp`. Unknown fields are rejected. The server computes the 55% classification and normalizes switch reasons. IDs are unique per Spotify account, so replaying a save returns the previously stored event.

The `sessions` table stores encrypted session payloads under hashed cookie IDs. The `listens` table stores account-scoped events under a composite primary key. SQLite uses prepared statements and WAL journaling. The local encryption key and database are created in `.data/` with restricted filesystem permissions. Do not serve that directory or commit it.

`createApp` accepts an injectable Spotify fetch implementation and store for isolated tests. `npm test` uses temporary databases and no Spotify network calls; `npm run test:browser` additionally requires a Playwright browser.
