# Build Plan

## Main Hypothesis

Sortify should be able to identify low-engagement playlist tracks by comparing how much of a song was played before the user switched away. The goal is not to estimate whether a stream "counted," but to surface which songs users consistently skip and which ones they actually finish.

## MVP Features

### Must Have

- Spotify sign-in
- Current track display
- Live playback progress
- A visible skip/completed threshold marker
- Stored session history
- Recently played comparison

### Nice to Have

- Accuracy percentage
- "Most skipped artist" insight
- "You usually stop around X seconds" insight
- Better charts

### Cut If Needed

- backend
- database
- Airbuds anything beyond manual demo comparison
- multiple accounts
- anything involving mobile apps

## Suggested Work Blocks

### Hours 0-2

- set up repo
- register Spotify app
- confirm redirect URI
- assign owners

### Hours 2-6

- build login flow
- build player page layout
- fetch current playback data
- default to polling every 5 seconds instead of chasing high-precision timing

### Hours 6-10

- save listens locally
- add threshold-based skip logic
- render history page

### Hours 10-16

- compare against recently played
- compute accuracy
- build dashboard

### Hours 16-20

- clean UI
- fix obvious bugs
- collect screenshots

### Hours 20-24

- rehearse demo
- update README with final results
- cut unstable features

## Fallback Plan

If Spotify auth becomes too hard:

- use a manual mock dataset
- let the user simulate listen sessions
- focus the demo on the prediction logic and dashboard

If recently played comparison becomes flaky:

- show the tracked session data cleanly
- explain that comparison is in progress
- demo the experiment design instead of pretending the endpoint is perfect

If the multi-page UI slows the team down:

- collapse the app into one page
- use sections for Now Playing, History, and Stats
- keep the demo flow simple
