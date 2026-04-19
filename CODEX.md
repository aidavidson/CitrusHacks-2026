# 🎧 Sortify — Project Codex

Sortify is a Spotify listening tracker focused on playlist cleanup, not stream-count estimation. It watches how much of each song a user actually plays, marks low-engagement tracks as skips, and builds a local history of skipped versus completed songs so users can decide what belongs in their playlists.

---

## 🛠️ Tech Stack

| Layer | Tool |
|---|---|
| Frontend | HTML + CSS + JavaScript (or lightweight React) |
| Auth | Spotify OAuth (Authorization Code + PKCE) |
| Data | Spotify Web API |
| Storage | localStorage (no backend needed for MVP) |
| Optional | Firebase if we want persistent data across sessions |

---

## 🔌 Key Spotify API Endpoints

| Endpoint | What It Does |
|---|---|
| `/me/player/currently-playing` | Current track + progress_ms |
| `/me/player` | Full playback state (device, shuffle, etc.) |
| `/me/player/recently-played` | Last 50 listens (listening history) |
| `/me/top/tracks` | Top tracks (for stats page, optional) |

**Scopes needed:**
```
user-read-currently-playing
user-read-playback-state
user-read-recently-played
```

---

## 📐 Our "Sortify" Rule

Sortify uses a proportional playback threshold to classify songs as skipped or completed. Instead of asking whether a song technically counted as a stream, the app looks at how much of the track the user actually played before moving on. That makes the data more useful for playlist cleanup, because the goal is to measure engagement rather than replicate Spotify's private metrics.

---

## 📊 The Experiment

We're testing whether snapshot-based polling can reliably separate low-engagement songs from songs users actually finish. For each listen, the app stores the track ID, name, duration, playback progress, classification result, and timestamp. It also records threshold-reached events and compares session output against Spotify recently played history as a sanity check on what the user actually listened to.

---

## 🖥️ App Pages

1. **Login** — Spotify OAuth button
2. **Now Playing** — Current song card, live progress bar, and threshold notice
3. **Session History** — List of listens with skip/completed labels
4. **Stats Dashboard** — Skip rate, finish rate, and cleanup insights

If time gets tight, collapse these into one page with sections instead of keeping separate routes.

---

## 👥 Team Roles

### Person 1 — Frontend & UI
- Build all HTML/CSS pages
- Design the Now Playing card, history list, dashboard
- Handle the visual progress bar + 30s marker
- Own screenshots + README visuals

### Person 2 — Spotify Integration
- Set up OAuth login flow (PKCE)
- Write polling logic for `/currently-playing` (every 5 seconds is enough)
- Fetch `/recently-played` and compare against saved sessions
- Store session data in localStorage

### Person 3 — Product, Demo & Docs
- Own the README and presentation
- Write the Sortify skip-classification logic
- Run the empirical test during the hackathon (listen to songs, check results)
- Build the stats/accuracy dashboard
- Prepare the demo script

---

## ⏰ 24-Hour Timeline

| Time | Milestone |
|---|---|
| Hour 0–2 | Spotify app registered, OAuth login working, repo set up |
| Hour 2–5 | Now Playing page polling current track + showing progress |
| Hour 5–8 | Session logging to localStorage, threshold labeling |
| Hour 8–12 | Recently played fetch, compare predictions vs. history |
| Hour 12–16 | Stats dashboard + accuracy score |
| Hour 16–20 | UI polish, mobile-friendly layout, README screenshots |
| Hour 20–23 | Demo run-through, edge case fixes, final README |
| Hour 23–24 | Submit, rest |

---

## ⚠️ Known Limitations (be honest in the demo)

- Polling is snapshot-based, so there is timing approximation around track changes
- `recently-played` is a useful comparison signal, but not the source of the skip classification itself
- Airbuds is used only as an optional manual visual check in the demo, not programmatic integration
- Some edge cases (Spotify Jam, offline mode) may behave differently

## 🛟 Fallback MVP

If real-time polling is flaky:

- poll every 5 seconds
- log track changes and max observed `progress_ms`
- treat threshold crossing plus final classification as the core experiment
- demo the playlist-cleanup insight cleanly instead of chasing edge cases

---

## 🏆 What Makes This Win

- **Real user pain point** — everyone has had a song not show up in Wrapped
- **Empirical experiment** — we're not just guessing, we're testing it live
- **Honest about limits** — we don't overclaim, which judges respect
- **Easy to demo** — play a song, skip it, play another, show the tracker catch it

---

## 📁 Repo Structure

Recommended fastest version:

```
frontend/
├── index.html
├── css/styles.css
└── js/
    ├── app.js
    ├── auth.js
    └── storage.js
```

One-page sections for Login, Now Playing, History, and Stats are safer than a multi-page build if the team starts running short on time.

---

## 📄 README Must-Haves (before submit)

- [ ] Project name + 1-sentence description
- [ ] The problem we're solving
- [ ] How it works (bullet points)
- [ ] Tech stack
- [ ] Screenshots of every page
- [ ] Known limitations section
- [ ] Team names
