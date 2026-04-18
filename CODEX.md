# 🎧 Sortify — Project Codex

> A Spotify listening tracker that estimates whether a song play actually counted, validated empirically against Spotify & Airbuds history.

---

## 🧠 What We're Building

A web app that:
- Logs into Spotify via OAuth
- Tracks your current song + playback progress in real time
- Estimates whether each listen "counted" (based on the 30-second stream rule)
- Compares predictions against your Spotify recently played history
- Shows a personal dashboard: skips, finishes, accuracy score

---

## 💡 The Problem

Sometimes songs don't show up in Spotify history, Airbuds, or Wrapped even when it feels like you listened to them. Users have no visibility into why. We're building a tracker that makes that process more transparent.

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

Spotify says a song stream is counted after at least **30 seconds** of playback.

Our app does **not** have access to Spotify's internal stream-counting system, so we estimate whether a listen likely qualified under that rule.

| Progress Reached | Our Label |
|---|---|
| < 30 seconds | ❌ Likely did NOT qualify |
| ≥ 30 seconds | ✅ Likely qualified |
| ≥ 90% of track | 🔥 Strong completion signal |

We then compare our prediction against whether the track later appears in `/me/player/recently-played`. That gives us an empirical accuracy score for our model, not a direct measurement of Spotify's internal counting.

---

## 📊 The Experiment

We're testing the hypothesis:
> "If a song reaches 30 seconds of playback, how often does it later appear in Spotify recently played history?"

**For each listen, we store:**
- Track ID + name + artist
- Track duration
- Max `progress_ms` reached
- Whether it crossed 30 seconds
- Whether the user skipped
- Timestamp

**Later we check:**
- Did it appear in recently played? (yes/no)
- Did our prediction match that visible outcome?

**Output:**
- % accuracy of our 30s model
- "Songs over 30s appeared in your history X% of the time"
- Personal listening patterns

**Accuracy definition:**
- prediction = whether our model thinks a listen likely qualified
- outcome = whether the track later appeared in Spotify recently played
- accuracy = the percentage of listens where prediction matched outcome

---

## 🖥️ App Pages

1. **Login** — Spotify OAuth button
2. **Now Playing** — Current song card, live progress bar, countdown to 30s
3. **Session History** — List of today's listens with prediction labels
4. **Stats Dashboard** — Accuracy score, skip rate, finish rate, and fun insights

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
- Write the Sortify prediction logic
- Run the empirical test during the hackathon (listen to songs, check results)
- Build the stats/accuracy dashboard
- Prepare the demo script

---

## ⏰ 24-Hour Timeline

| Time | Milestone |
|---|---|
| Hour 0–2 | Spotify app registered, OAuth login working, repo set up |
| Hour 2–5 | Now Playing page polling current track + showing progress |
| Hour 5–8 | Session logging to localStorage, 30s threshold labeling |
| Hour 8–12 | Recently played fetch, compare predictions vs. history |
| Hour 12–16 | Stats dashboard + accuracy score |
| Hour 16–20 | UI polish, mobile-friendly layout, README screenshots |
| Hour 20–23 | Demo run-through, edge case fixes, final README |
| Hour 23–24 | Submit, rest |

---

## ⚠️ Known Limitations (be honest in the demo)

- Spotify's public API **does not expose an official "this stream counted" flag**. Our predictions are estimates based on Spotify's published 30-second rule.
- `recently-played` is listening history, not an internal stream-accounting ledger
- Airbuds is used only as an **optional manual visual check** in the demo, not programmatic integration
- Some edge cases (Spotify Jam, offline mode) may behave differently

## 🛟 Fallback MVP

If real-time polling is flaky:

- poll every 5 seconds
- log track changes and max observed `progress_ms`
- treat "crossed 30 seconds before track changed" as the core experiment
- demo the estimator cleanly instead of chasing edge cases

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
