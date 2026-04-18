# Did It Count?

A beginner-friendly Citrus Hacks 2026 project skeleton for a web app that estimates whether a Spotify listen likely counted based on playback progress and listening history.

## Project Idea

Sometimes a song feels like it should show up in Spotify history, Airbuds, or Wrapped, but it doesn't. This project tracks playback progress, applies a simple prediction rule, and compares that prediction against Spotify's visible listening history.

## MVP

- Spotify login
- Live "Now Playing" tracker
- 30-second threshold indicator
- Session history saved locally
- Accuracy comparison against Spotify recently played
- Simple dashboard with skip rate, finish rate, and prediction accuracy

## Cold, Hard Scope

What we are building:

- A website, not a mobile app
- A tracker and estimator, not a perfect verifier
- A hackathon MVP that uses Spotify's public API

What we are not building:

- A perfect clone of Spotify Wrapped
- A direct Airbuds integration
- A backend-heavy analytics platform
- A system that proves Spotify's private internal counting logic

## Recommended Stack

- Frontend: HTML, CSS, JavaScript
- Auth: Spotify OAuth with PKCE
- Data: Spotify Web API
- Storage: `localStorage`
- Optional later: Firebase or Supabase if you want persistence

## Repo Structure

```text
.
├── .env.example
├── CODEX.md
├── README.md
├── backend/
│   └── README.md
├── docs/
│   ├── build-plan.md
│   ├── demo-checklist.md
│   └── team-roles.md
└── frontend/
    ├── assets/
    │   └── .gitkeep
    ├── css/
    │   └── styles.css
    ├── index.html
    ├── js/
    │   ├── app.js
    │   ├── auth.js
    │   ├── config.js
    │   └── storage.js
    └── pages/
        ├── dashboard.html
        ├── history.html
        └── player.html
```

## How the App Works

1. The user signs in with Spotify.
2. The app checks the current track and playback progress.
3. The app stores listen sessions locally.
4. The app marks listens using a simple rule:
   - under 30 seconds: likely did not count
   - 30 seconds or more: likely counted
5. The app compares those predictions with Spotify recently played results.
6. The dashboard shows the user's patterns and the model's accuracy.

## Team Split

- Person 1: Frontend and styling
- Person 2: Spotify auth and playback polling
- Person 3: prediction logic, dashboard, README, and demo

Detailed role instructions live in [docs/team-roles.md](/Users/setup/Documents/CitrusHacks-2026/docs/team-roles.md).

## Fast Start

1. Create a Spotify developer app.
2. Put your redirect URI and client ID into `.env.example`, then copy those values into your local setup.
3. Build the login flow first.
4. Get one page working end-to-end before adding polish.
5. Take screenshots as you go for the final demo and README.

## Important Honesty Note

Spotify's public API does not expose an official "this play counted" flag. Your project should present itself as an estimator backed by a real experiment, not as a perfect verifier of Spotify's private systems.

## Before Submission

- Add team names
- Add screenshots
- Add a short demo link if you record one
- Update the README with what actually got finished
# CitrusHacks-2026

## Spotify Tracker - Description

A website using spotify API to document listens from different songs and tracking which songs are listened to the most




