# Demo Checklist

## Story

Problem:
Users do not understand why some Spotify listens seem to count and others do not.

Solution:
We built a web app that tracks playback progress and estimates whether a listen likely counted, then compares that prediction against Spotify's visible listening history.

## Demo Flow

1. Show the login page
2. Show a currently playing song
3. Point to the live progress bar and 30-second threshold
4. Explain the prediction label
5. Show saved session history
6. Show dashboard stats and one interesting takeaway
7. End with what you learned from testing

## One-Sentence Pitch

"Sortify helps Spotify users understand whether a listen likely counted by tracking playback progress and comparing it with visible listening history."

## What To Say If Asked About Accuracy

- We are estimating based on Spotify's public 30-second stream rule.
- Spotify does not expose a public per-play counted flag.
- Our app is honest about that and treats the project as an empirical experiment.

## What To Avoid Saying

- "We know exactly how Spotify Wrapped works."
- "We proved Spotify's private counting system."
- "Airbuds gave us official counted data."
