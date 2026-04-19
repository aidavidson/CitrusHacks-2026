# Demo Checklist

## Story

Problem:
Users build playlists over time and end up with tracks they no longer finish, but Spotify does not clearly show which songs are consistently skipped.

Solution:
We built a web app that tracks playback progress, classifies songs as skipped or completed based on proportional playback, and helps users identify tracks worth removing from their playlists.

## Demo Flow

1. Show the login page
2. Show a currently playing song
3. Point to the live progress bar and skip/completed threshold
4. Explain the classification label
5. Show saved session history
6. Show dashboard stats and one interesting takeaway
7. End with what you learned from testing

## One-Sentence Pitch

"Sortify helps Spotify users find the songs they skip so they can clean up playlists they do not actually listen to."

## What To Say If Asked About Accuracy

- We classify songs using a proportional playback threshold instead of a Spotify-owned signal.
- Polling introduces small timing error, so the result is an estimate of engagement.
- The app is designed to support playlist cleanup, not to replicate Spotify Wrapped.

## What To Avoid Saying

- "We know exactly how Spotify Wrapped works."
- "We proved Spotify's private counting system."
- "This is an official Spotify skip metric."
