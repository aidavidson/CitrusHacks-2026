# DEMO_NOTES

## Problem Statement (30 seconds)

Most Spotify users have playlists they've been adding to for years. Over time, those playlists fill up with songs they always skip. Spotify Wrapped tells you what you loved - it doesn't tell you what you ignored. There's no native tool to identify songs you consistently skip or barely engage with.

## Solution (30 seconds)

Sortify runs in the background while you listen on Spotify. It tracks how far into each song you get before switching. If you skip before reaching 55% of the track, Sortify marks it. Over time, you get a clear picture of which songs you're not actually listening to.

## Key Innovation

Spotify counts a stream after 30 seconds regardless of track length. A 4-minute song played for 31 seconds counts the same as one played all the way through. Sortify uses a proportional threshold instead - 55% of the track - which captures actual engagement, not just whether the song started.

This makes Sortify more meaningful for playlist curation. A song that always gets skipped at the 40% mark is a candidate for removal even if it technically "counts" in Spotify's system.

## Technical Explanation

Sortify polls the Spotify API every 5 seconds to get the current track and playback position. When it detects a track change, it looks at how far the previous song played. It computes `progress / duration` and classifies the result. Everything is stored locally in the browser - no external database required.

## Limitations (be upfront)

- 5-second polling means skip detection has up to 5 seconds of approximation error
- Very short tracks or rapid skips may not be captured accurately
- No segment-level tracking yet - only total progress at the moment of track change
- Classification is an estimate, not a verified Spotify signal

## Future Vision

- Skip counters per track across multiple sessions
- Top 5 most skipped songs
- Bottom 5 least skipped songs
- Playlist cleanup recommendations: "You've skipped this song 8 times - consider removing it"
- Export to CSV or shareable summary
