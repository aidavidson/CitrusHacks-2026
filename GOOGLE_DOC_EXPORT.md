PROJECT OVERVIEW

Sortify is a Spotify listening tracker built to help users find the songs they skip and clean up playlists they no longer truly enjoy. Instead of focusing only on favorite songs, Sortify highlights low-engagement tracks that users start but rarely finish.

THE PROBLEM

Most Spotify users build playlists over long periods of time. Those playlists slowly fill up with songs that no longer match their taste, but Spotify's native tools do not make those low-engagement tracks easy to spot. Spotify Wrapped shows what users loved, not what they consistently skipped or barely listened to.

THE SOLUTION

Sortify tracks playback behavior and classifies songs based on how much of each track was played before the user moved on. It builds a local listening history of skipped versus completed songs so users can identify tracks worth removing from their playlists.

HOW IT WORKS

Sortify polls Spotify for the current song and playback position. When the track changes, it looks back at the previous track, calculates progress divided by duration, and classifies that song as skipped or completed using a proportional threshold. The result is saved locally in the browser and can also be compared with Spotify's recently played history.

FEATURES

- Spotify OAuth login
- Real-time playback polling
- Snapshot-based skip detection
- Threshold classification for skipped versus completed tracks
- Session history saved to localStorage
- Recently played comparison through the Spotify API
- Planned skipped-song rankings and cleanup recommendations

TECHNICAL APPROACH

The app is built with HTML, CSS, and JavaScript using the Spotify Web API. Authentication uses OAuth 2.0 with PKCE. No backend database is required for the MVP because test results and session history are stored locally in the browser.

DEMO FLOW

- Introduce the problem: playlists grow over time and Spotify does not show which songs users repeatedly skip.
- Show the Sortify login flow and connect a Spotify account.
- Play a song, point out the live playback tracker, and explain the threshold-based classification rule.
- Skip or complete a song, then show the resulting session entry and threshold event in the app.
- Close by explaining how this data helps users decide which songs to remove from their playlists.

TEST PROTOCOL SUMMARY

Manual testing is performed with songs of different lengths and planned stop times on the same Spotify account and device. Each test checks whether Sortify classifies a song correctly as skipped or completed based on a 55 percent threshold, while acknowledging that polling introduces a small timing approximation.

KNOWN LIMITATIONS

- Polling introduces approximation error
- Very short tracks and rapid skips may be missed
- Classification is based on total playback progress, not segment-level listening behavior
- Results are estimates and not official Spotify counted-stream signals

FUTURE ROADMAP

- Skip counters across repeated sessions
- Top 5 most skipped songs
- Bottom 5 least skipped songs
- Playlist cleanup recommendations
- CSV export or shareable summaries
