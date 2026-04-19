# Team Roles

This split is designed for a three-person team building Sortify, a Spotify listening tracker that highlights skipped and low-engagement songs so users can clean up their playlists. The goal is to reduce confusion, keep everyone focused on one clear product, and make sure the team ships visible progress quickly.

## Person 1: Frontend and Design

Own:

- [frontend/index.html](/Users/setup/Documents/CitrusHacks-2026/frontend/index.html)
- [frontend/pages/player.html](/Users/setup/Documents/CitrusHacks-2026/frontend/pages/player.html)
- [frontend/pages/history.html](/Users/setup/Documents/CitrusHacks-2026/frontend/pages/history.html)
- [frontend/pages/dashboard.html](/Users/setup/Documents/CitrusHacks-2026/frontend/pages/dashboard.html)
- [frontend/css/styles.css](/Users/setup/Documents/CitrusHacks-2026/frontend/css/styles.css)

Responsibilities:

- Build the page layouts
- Make the app look clean and consistent
- Create the progress bar and score cards
- Keep the interface simple enough to demo quickly

Do not get stuck on:

- perfect animation
- fancy frameworks
- advanced responsiveness before the main pages exist

## Person 2: Spotify Integration

Own:

- [frontend/js/auth.js](/Users/setup/Documents/CitrusHacks-2026/frontend/js/auth.js)
- [frontend/js/config.js](/Users/setup/Documents/CitrusHacks-2026/frontend/js/config.js)
- parts of [frontend/js/app.js](/Users/setup/Documents/CitrusHacks-2026/frontend/js/app.js)

Responsibilities:

- Set up Spotify OAuth with PKCE
- Get access tokens working
- Fetch current playback state
- Fetch recently played data

Do not get stuck on:

- making it production secure
- building a server unless truly necessary
- every Spotify endpoint under the sun

## Person 3: Logic, Dashboard, and Demo

Own:

- [frontend/js/storage.js](/Users/setup/Documents/CitrusHacks-2026/frontend/js/storage.js)
- parts of [frontend/js/app.js](/Users/setup/Documents/CitrusHacks-2026/frontend/js/app.js)
- [README.md](/Users/setup/Documents/CitrusHacks-2026/README.md)
- [docs/demo-checklist.md](/Users/setup/Documents/CitrusHacks-2026/docs/demo-checklist.md)

Responsibilities:

- Define what counts as skip, partial, and completed
- Save and compare sessions
- Compute stats for the dashboard
- Write the story for the judges
- Keep screenshots and demo flow organized

Do not get stuck on:

- trying to prove Spotify's private rules exactly
- overcomplicating the model
- writing a huge presentation deck

## Shared Rules

- Build the smallest working version first
- Push changes often
- If one feature is stuck for more than 45 minutes, simplify it
- Demo quality matters more than technical complexity
- Update the README as you build, not at the very end

## Suggested Order

1. Login page works
2. Now playing data appears
3. Session data saves locally
4. History page renders stored sessions
5. Dashboard shows simple stats
6. Polish and screenshots
