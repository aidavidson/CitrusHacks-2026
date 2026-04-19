# Sortify

Find the songs you skip. Clean the playlists you don't.

Sortify is a Spotify listening tracker that helps users identify songs they skip or barely engage with so they can make smarter decisions about which songs to remove from their playlists. Most people have bloated playlists full of songs they never actually finish. Sortify makes that pattern visible.

## The Problem

Spotify playlists tend to grow for years without much cleanup. As users keep adding songs, those playlists start filling up with tracks they no longer enjoy or rarely finish. Spotify Wrapped and other native tools focus on favorites, but they do not clearly show which songs are consistently skipped. That makes it hard to identify low-engagement tracks that are just taking up space.

## The Solution

Sortify tracks playback in real time, detects when a song is skipped based on how much of it was played, and builds a personal history of skip versus complete events. Instead of only showing what users liked, it helps reveal the songs they keep abandoning. Users can then use that history to decide which tracks are worth removing from their playlists.

## Features

- Spotify OAuth login
- Real-time playback polling (every ~5 seconds)
- Snapshot-based skip detection
- Threshold classification: songs played to less than 55% are marked as skipped; 55% or more are marked as completed
- Session history saved to localStorage
- Recently played comparison via Spotify API
- Planned: most-skipped song ranking
- Planned: least-engaged track leaderboard
- Planned: playlist cleanup recommendations

## How It Works

The app polls Spotify every 5 seconds to get the current track and playback position. When the track changes, it classifies the previous track using `progress_ms / duration_ms`. If the result is below 55%, the track is logged as skipped; if it is 55% or above, it is logged as completed. Results are saved locally in the browser and compared against Spotify's recently played history.

## Screenshots

Placeholder: [Screenshot: App UI — Now Playing view]

Placeholder: [Screenshot: Debug panel — session classification output]

## Tech Stack

- HTML
- CSS
- JavaScript
- Spotify Web API
- OAuth 2.0 with PKCE
- localStorage

## Team

[Team member names]
