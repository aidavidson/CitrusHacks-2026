# Did It Count?

A beginner-friendly Citrus Hacks 2026 web project that estimates whether a Spotify listen likely qualified under Spotify's 30-second stream rule, then compares that estimate against visible listening history.

## Project Idea

Sometimes a song feels like it should show up in Spotify history, Airbuds, or Wrapped, but it does not. This project tracks playback progress, applies a simple prediction rule, and compares that prediction against Spotify's visible listening history.

## MVP

- Spotify login
- Live "Now Playing" tracker
- 30-second threshold indicator
- Session history saved locally
- Comparison against Spotify recently played
- Simple dashboard with skip rate, finish rate, and model accuracy

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

## How the App Works

1. The user signs in with Spotify.
2. The app checks the current track and playback progress.
3. The app stores listen sessions locally.
4. The app estimates whether a listen likely qualified under Spotify's 30-second rule.
5. The app compares those predictions with Spotify recently played results.
6. The dashboard shows listening patterns and model accuracy.

## Accuracy Definition

For this project:

- prediction = whether our model thinks a listen likely qualified
- outcome = whether that track later appeared in Spotify recently played
- accuracy = the percentage of listens where our prediction matched that visible outcome

This is an empirical score for our model, not a direct measurement of Spotify's internal stream-counting system.

## Repo Structure

Current scaffold:

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
    ├── css/
    ├── index.html
    ├── js/
    └── pages/
```

Fastest hackathon fallback:

```text
frontend/
├── index.html
├── css/styles.css
└── js/
    ├── app.js
    ├── auth.js
    └── storage.js
```

If time gets tight, collapse the prototype into one main page with sections for Now Playing, History, and Stats.

## Team Split

- Person 1: Frontend and styling
- Person 2: Spotify auth and playback polling
- Person 3: prediction logic, dashboard, README, and demo

Detailed role instructions live in [docs/team-roles.md](/Users/setup/Documents/CitrusHacks-2026/docs/team-roles.md).

## Fast Start

1. Create a Spotify developer app.
2. Put your redirect URI and client ID into `.env.example`, then copy those values into your local setup.
3. Build the login flow first.
4. Poll every 5 seconds, log track changes and max observed progress, and treat "crossed 30s before track changed" as the core experiment if live tracking gets flaky.
5. Get one page working end-to-end before adding polish.
6. Take screenshots as you go for the final demo and README.

## Important Honesty Note

Spotify's public API does not expose an official "this play counted" flag. This project should present itself as an estimator backed by a real experiment, not as a perfect verifier of Spotify's private systems.

Airbuds should be treated as an optional manual visual comparison in the demo, not as a required integration.

## Before Submission

- Add team names
- Add screenshots
- Add a short demo link if you record one
- Update the README with what actually got finished
