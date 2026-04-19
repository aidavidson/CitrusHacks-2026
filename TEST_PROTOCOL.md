# TEST_PROTOCOL

## Purpose

This procedure is used to validate whether an 8-second polling interval is reliable enough for the final demo. The previous interval was 15 seconds. The goal is to confirm that threshold crossings can be detected consistently, identify where 8-second polling still fails, and select 2-3 strong live demo scenarios.

Important note: the tracked repo currently uses a 5-second active polling interval, not 8 seconds. To run this exact protocol as written, temporarily change the active polling constant to 8000, run the tests below, and then restore it to the repo value afterward.

## Test-Only Threshold

For this test procedure only, use a 20% threshold to validate threshold-crossing behavior in isolation. This is not the product's real classification threshold. The product threshold remains whatever value is currently in the repo. All test results in this document use the 20% threshold unless explicitly labeled otherwise.

In the tracked repo, the threshold constant already exists at [CitrusHacks-2026/index.html](/Users/setup/Documents/CitrusHacks-2026/CitrusHacks-2026/index.html:177) as:

```js
const SKIP_THRESHOLD = 0.20;
```

That means no threshold change is needed to run this test procedure right now. If the team later raises the product threshold, temporarily change that constant back to `0.20` for testing and revert it afterward.

If you want the procedure to use a true 8-second active polling interval, the tracked repo currently defines the active interval at [CitrusHacks-2026/index.html](/Users/setup/Documents/CitrusHacks-2026/CitrusHacks-2026/index.html:178):

```js
const ACTIVE_POLL_INTERVAL_MS = 5000;
```

Temporarily change that line to:

```js
const ACTIVE_POLL_INTERVAL_MS = 8000;
```

Then revert it when testing is complete.

## Why 8 Seconds Is Better Than 15 Seconds

At 15 seconds, a song under 30 seconds total might only receive 1-2 polls before ending, making threshold detection unreliable. At 8 seconds, the same song receives 2-4 polls, significantly improving the chance of capturing a threshold crossing. This makes short test songs much more useful because there is less chance of the entire event happening between polls. However, 8-second polling still introduces up to 8 seconds of approximation error on any skip event, which must be acknowledged during the demo.

## What Makes a Short Song Useful for This Test

- Duration between 30 and 90 seconds gives enough polls to cross a threshold without the test taking too long
- A song with a consistent energy level and no long intro or outro makes it easier to time a manual skip accurately
- Songs the tester knows well are preferable so playback position can be estimated by ear
- Avoid songs under 20 seconds - too few polls to be meaningful

Apply these criteria to the playlist you already prepared instead of rebuilding a new playlist from scratch.

## How to Run Tests Consistently

- Use the same Spotify account for all tests
- Use the same device and browser for all tests
- Do not pause or seek during a test - start the song, wait, then skip by changing tracks
- Open the browser console before starting each test and keep it visible
- Note the timestamp when you manually trigger the skip
- After each test, check localStorage (`sortify_sessions`) immediately and record the classification logged
- Wait at least 10 seconds between tests to avoid polling overlap between sessions
- Run each scenario at least twice to check for consistency

## Test Matrix

| # | Song (use "Song A", "Song B", etc.) | Duration | Polling Interval | Threshold % | Threshold Time | Planned Skip Time | Expected Result | Actual Result | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Song A | 0:45 | 8s | 20% | 0:09 | 0:05 | skipped | ___ | skip before threshold, very early |
| 2 | Song A | 0:45 | 8s | 20% | 0:09 | 0:07 | skipped | ___ | skip just before threshold |
| 3 | Song A | 0:45 | 8s | 20% | 0:09 | 0:12 | completed | ___ | skip just after threshold |
| 4 | Song A | 0:45 | 8s | 20% | 0:09 | 0:30 | completed | ___ | skip well after threshold |
| 5 | Song B | 1:00 | 8s | 20% | 0:12 | 0:06 | skipped | ___ | DEMO-SAFE: clear skip before threshold |
| 6 | Song B | 1:00 | 8s | 20% | 0:12 | 0:14 | completed | ___ | DEMO-SAFE: skip just after threshold |
| 7 | Song C | 1:30 | 8s | 20% | 0:18 | 0:10 | skipped | ___ | skip before threshold |
| 8 | Song C | 1:30 | 8s | 20% | 0:18 | 0:20 | completed | ___ | skip just after threshold |
| 9 | Song D | 0:30 | 8s | 20% | 0:06 | 0:03 | skipped | ___ | very short song, 1-2 polls only |
| 10 | Song D | 0:30 | 8s | 20% | 0:06 | 0:08 | completed | ___ | very short song, crosses threshold |
| 11 | Song A | 0:45 | 8s | 20% | 0:09 | natural end | completed | ___ | DEMO-SAFE: song allowed to finish naturally |
| 12 | Song B | 1:00 | 8s | 20% | 0:12 | natural end | completed | ___ | song allowed to finish naturally |
| 13 | Song A | 0:45 | 8s | 20% | 0:09 | 0:07 | skipped | ___ | repeat play, second attempt - check consistency |
| 14 | Fast transition: play Song A for 0:04, immediately switch to Song B for 0:04, then switch to Song C | mixed | 8s | 20% | - | - | both skipped | ___ | rapid transitions test |

## Edge Cases to Prioritize

- **Just-before-threshold skip**: the most important case. A song stopped 1-3 seconds before the 20% mark may be misclassified as completed if the poll fires after the threshold was crossed. Note how often this fails.
- **Very short songs with 1-2 polls**: songs under 30 seconds may only receive 1 poll before ending. Record whether classification fires at all.
- **Repeated plays**: run the same song twice consecutively. Check whether both events are logged separately in `sortify_sessions`.
- **Fast track transitions**: switch tracks before the next poll fires. The previous track may be missed entirely. Note whether any classification is logged.
- **Natural endings**: confirm that a song played to completion is correctly logged as `completed`. This is also a demo-safe scenario.

## Likely Polling Failure Modes

- Skip occurs between two polls: the `progress_ms` captured may be higher than the actual stop point, causing a skip to be classified as completed
- Track changes too fast: if two track changes happen within one polling interval, only the second change may be detected
- Poll fires after track has already changed: the `currently-playing` response may reflect the new track before the old one is classified
- Very short songs end between polls: classification never fires because no track change is detected in time
- Network latency: a slow API response may delay the poll, extending the effective interval beyond 8 seconds

## 2-3 Recommended Live Demo Scenarios

### Demo Scenario 1 - Clear Skip

Use a song of 45-60 seconds. Play it for about 5 seconds, then skip. Expected: `skipped` classification fires, console logs it, localStorage updates. Narrate: "I skipped this song early - Sortify detected it."

### Demo Scenario 2 - Completion

Use a song of 45-60 seconds. Let it play all the way through. Expected: `completed` classification fires. Narrate: "I listened to this one fully - Sortify logged it as completed."

### Demo Scenario 3 - Near-Threshold Skip

Use a short song. Play it past the threshold time, then skip a few seconds later. Expected: `completed` classification despite the skip. Narrate: "Even though I skipped this one, Sortify recognized I actually listened to most of it - so it counts."

The rows labeled DEMO-SAFE in the test matrix are the recommended live demo scenarios.

## How to Interpret Noisy Results

Because polling fires every 8 seconds, the progress value captured at the moment of classification is an approximation. A skip that happens at 8 seconds into a 45-second song may be logged with a progress value anywhere between 0 and 16 seconds depending on poll timing. When reviewing results, treat classifications within +/-8 seconds of the threshold as expected approximation, not bugs. If a result falls outside this window, investigate whether the polling interval, threshold value, or track-change detection logic is the cause.

## How to Explain This During the Demo

- "We moved from 15-second polling to 8-second polling because shorter songs were only getting one or two data points before ending. More frequent polling gives us a more accurate picture."
- "The threshold tells Sortify how much of a song counts as 'actually listened to.' We're testing with 20% here to validate the detection logic - the real product uses a higher threshold."
- "Skip detection isn't perfect. If you skip a song in the 5 seconds between polls, Sortify might not catch it exactly. But across many listens, the pattern is still accurate."
- "Short songs are great for testing because they let us run many scenarios quickly and stress-test the polling interval."
