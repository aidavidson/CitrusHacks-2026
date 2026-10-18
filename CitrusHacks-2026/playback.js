import {
  fetchCurrentUserProfile,
  handleSpotifyCallback,
  isSpotifyConnected,
  logoutSpotify,
  spotifyFetch,
  startSpotifyLogin,
} from "../frontend/js/auth.js";
import {
  getSortifySessions,
  loadSortifySessions,
  saveSortifySession,
} from "../frontend/js/listens.js";

const loginButton = document.getElementById("login-button");
const disconnectButton = document.getElementById("disconnect-button");
const authStatus = document.getElementById("auth-status");
const nowPlayingTitle = document.getElementById("now-playing-title");
const nowPlayingArtist = document.getElementById("now-playing-artist");
const nowPlayingCover = document.getElementById("now-playing-cover");
const nowPlayingCurrentTime = document.getElementById(
  "now-playing-current-time",
);
const nowPlayingDuration = document.getElementById("now-playing-duration");
const nowPlayingProgress = document.getElementById("now-playing-progress");
const thresholdNotice = document.getElementById("threshold-notice");
const rateLimitWarning = document.getElementById("rate-limit-warning");
const sortifyDebug = document.getElementById("sortify-debug");
const SKIP_THRESHOLD = 0.55;
const ACTIVE_POLL_INTERVAL_MS = 5000;
const IDLE_POLL_INTERVAL_MS = 60000;
let nowPlayingPollId = null;
let spotifyCooldownTimeoutId = null;
let isNowPlayingRequestInFlight = false;
let previousTrack = null;
let playbackGeneration = 0;
let currentPlaybackDebug = null;
let currentPollIntervalMs = ACTIVE_POLL_INTERVAL_MS;
const thresholdEvents = [];
let lastThresholdEventTrackId = null;

function setAuthStatus(message) {
  if (authStatus) {
    authStatus.textContent = message;
  }
}

function setLoginButtonLabel(message) {
  if (loginButton) {
    loginButton.textContent = message;
  }
}

function hideRateLimitWarning() {
  if (rateLimitWarning) {
    rateLimitWarning.style.display = "none";
    rateLimitWarning.textContent = "";
  }
}

function showRateLimitWarning(message) {
  if (rateLimitWarning) {
    rateLimitWarning.textContent = message;
    rateLimitWarning.style.display = "block";
  }
}

function getRetryAfterSeconds(response) {
  const retryAfterHeader = Number(response.headers.get("Retry-After") ?? "30");
  return Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
    ? retryAfterHeader
    : 30;
}

function clearSpotifyCooldown() {
  if (spotifyCooldownTimeoutId) {
    window.clearTimeout(spotifyCooldownTimeoutId);
    spotifyCooldownTimeoutId = null;
  }
}

function scheduleSpotifyCooldown(retryAfterSeconds, onResume) {
  stopNowPlayingPolling();
  clearSpotifyCooldown();
  setAuthStatus(
    `Spotify rate limit hit. Cooling down for ${retryAfterSeconds} second${retryAfterSeconds === 1 ? "" : "s"}.`,
  );
  showRateLimitWarning(
    `Spotify rate limit hit. Stop testing in other tabs right now.${retryAfterSeconds ? ` Cooling down for about ${retryAfterSeconds} second${retryAfterSeconds === 1 ? "" : "s"}.` : ""}`,
  );

  spotifyCooldownTimeoutId = window.setTimeout(() => {
    spotifyCooldownTimeoutId = null;
    hideRateLimitWarning();
    if (typeof onResume === "function") {
      onResume();
    }
  }, retryAfterSeconds * 1000);
}

function formatMs(ms) {
  if (!Number.isFinite(ms) || ms < 0) {
    return "--:--";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function updateThresholdNotice(message = "") {
  if (thresholdNotice) {
    thresholdNotice.textContent = message;
  }
}

function getClassifiableProgressMs(trackSnapshot) {
  const observedProgress = [
    trackSnapshot?.progress_ms,
    trackSnapshot?.maxProgressMs,
  ].filter(Number.isFinite);

  if (observedProgress.length === 0) {
    return null;
  }

  return Math.max(...observedProgress);
}

function hasTrackReachedThreshold(trackSnapshot) {
  if (trackSnapshot?.thresholdReached) {
    return true;
  }

  const progressMs = getClassifiableProgressMs(trackSnapshot);
  if (
    !Number.isFinite(progressMs) ||
    !Number.isFinite(trackSnapshot?.duration_ms) ||
    trackSnapshot.duration_ms <= 0
  ) {
    return false;
  }

  return progressMs / trackSnapshot.duration_ms >= SKIP_THRESHOLD;
}

function getSortifyThresholdEvents() {
  return thresholdEvents;
}

function updateSortifyDebugPanel() {
  if (!sortifyDebug) {
    return;
  }

  const recentSessions = getSortifySessions().slice(-5);
  const recentThresholdEvents = getSortifyThresholdEvents().slice(-5);
  sortifyDebug.textContent = JSON.stringify(
    {
      currentPlayback: currentPlaybackDebug,
      recentThresholdEvents,
      recentSessions,
    },
    null,
    2,
  );
}

function saveSortifyThresholdEvent(eventEntry) {
  const events = getSortifyThresholdEvents();
  events.push(eventEntry);
  if (events.length > 100) events.shift();
  updateSortifyDebugPanel();
}

async function recordClassification(
  trackSnapshot,
  classificationReason = "track_changed",
) {
  if (!trackSnapshot?.id) {
    return;
  }

  const progressMs = getClassifiableProgressMs(trackSnapshot);
  const sessionEntry = {
    id: trackSnapshot.listenId,
    trackId: trackSnapshot.id,
    trackName: trackSnapshot.name,
    durationMs: trackSnapshot.duration_ms,
    progressMs: Math.min(progressMs, trackSnapshot.duration_ms),
    classificationReason,
    timestamp: trackSnapshot.observedAt,
  };

  await saveSortifySession(sessionEntry);
  updateSortifyDebugPanel();
}

function maybeRecordThresholdEvent(trackSnapshot) {
  if (
    !trackSnapshot?.id ||
    !Number.isFinite(trackSnapshot.duration_ms) ||
    trackSnapshot.duration_ms <= 0
  ) {
    return;
  }

  const thresholdMs = trackSnapshot.duration_ms * SKIP_THRESHOLD;
  if (trackSnapshot.progress_ms < thresholdMs) {
    return;
  }

  if (lastThresholdEventTrackId === trackSnapshot.id) {
    return;
  }

  const thresholdEvent = {
    trackId: trackSnapshot.id,
    trackName: trackSnapshot.name,
    threshold: SKIP_THRESHOLD,
    thresholdMs,
    progressMs: trackSnapshot.progress_ms,
    timestamp: new Date().toISOString(),
  };

  saveSortifyThresholdEvent(thresholdEvent);
  lastThresholdEventTrackId = trackSnapshot.id;
}

function mergeTrackSnapshots(previousSnapshot, currentSnapshot) {
  const previousProgressMs = getClassifiableProgressMs(previousSnapshot);
  const currentProgressMs = getClassifiableProgressMs(currentSnapshot);
  const maxProgressMs = Math.max(
    Number.isFinite(previousProgressMs) ? previousProgressMs : 0,
    Number.isFinite(currentProgressMs) ? currentProgressMs : 0,
  );

  return {
    ...currentSnapshot,
    listenId: previousSnapshot.listenId,
    maxProgressMs,
    thresholdReached:
      hasTrackReachedThreshold(previousSnapshot) ||
      hasTrackReachedThreshold(currentSnapshot),
  };
}

async function maybeClassifyPreviousTrack(currentTrack) {
  const generation = playbackGeneration;
  // HOOK: future skip counter and ranking logic goes here
  // Polling is snapshot-based, so very short tracks and rapid skips can be missed or misclassified.
  if (!currentTrack?.id) {
    return;
  }

  if (!previousTrack) {
    previousTrack = currentTrack;
    return;
  }

  if (previousTrack.id === currentTrack.id) {
    previousTrack = mergeTrackSnapshots(previousTrack, currentTrack);
    return;
  }

  const switchReason = hasTrackReachedThreshold(previousTrack)
    ? "switched_after_threshold"
    : "switched_before_threshold";
  await recordClassification(previousTrack, switchReason);
  if (generation === playbackGeneration) previousTrack = currentTrack;
}

async function finalizePreviousTrackOnStop() {
  const generation = playbackGeneration;
  if (!previousTrack?.id) {
    return;
  }

  await recordClassification(previousTrack, "playback_stopped");
  if (generation === playbackGeneration) previousTrack = null;
}

function restartNowPlayingPolling(intervalMs = currentPollIntervalMs) {
  currentPollIntervalMs = intervalMs;

  if (nowPlayingPollId) {
    window.clearInterval(nowPlayingPollId);
  }

  nowPlayingPollId = window.setInterval(() => {
    loadCurrentlyPlaying().catch((error) => {
      console.error(error);
      setAuthStatus(error.message);
    });
  }, currentPollIntervalMs);
}

function resetNowPlayingUi(message = "Nothing is playing right now.") {
  if (nowPlayingTitle) {
    nowPlayingTitle.textContent = "No active track";
  }

  if (nowPlayingArtist) {
    nowPlayingArtist.textContent = message;
  }

  if (nowPlayingCurrentTime) {
    nowPlayingCurrentTime.textContent = "--:--";
  }

  if (nowPlayingDuration) {
    nowPlayingDuration.textContent = "--:--";
  }

  if (nowPlayingProgress) {
    nowPlayingProgress.style.width = "0%";
  }

  if (nowPlayingCover) {
    nowPlayingCover.style.backgroundImage = `
	           linear-gradient(135deg, rgba(61, 99, 255, 0.22), rgba(255, 90, 118, 0.4))
	         `;
  }

  updateThresholdNotice("");
}

function renderNowPlaying(trackData) {
  const item = trackData?.item;
  if (!item) {
    resetNowPlayingUi();
    return;
  }

  const artistName = item.artists?.[0]?.name ?? "Unknown artist";
  const coverUrl = item.album?.images?.[0]?.url ?? "";
  const progressMs = trackData.progress_ms ?? 0;
  const durationMs = item.duration_ms ?? 0;
  const percentComplete = durationMs > 0 ? (progressMs / durationMs) * 100 : 0;
  const thresholdMs = durationMs * SKIP_THRESHOLD;

  if (nowPlayingTitle) {
    nowPlayingTitle.textContent = item.name ?? "Unknown track";
  }

  if (nowPlayingArtist) {
    nowPlayingArtist.textContent = artistName;
  }

  if (nowPlayingCurrentTime) {
    nowPlayingCurrentTime.textContent = formatMs(progressMs);
  }

  if (nowPlayingDuration) {
    nowPlayingDuration.textContent = formatMs(durationMs);
  }

  if (nowPlayingProgress) {
    nowPlayingProgress.style.width = `${Math.min(Math.max(percentComplete, 0), 100)}%`;
  }

  if (nowPlayingCover) {
    nowPlayingCover.style.backgroundImage = coverUrl
      ? `
             linear-gradient(135deg, rgba(61, 99, 255, 0.18), rgba(255, 90, 118, 0.4)),
             url("${coverUrl}")
           `
      : `
	             linear-gradient(135deg, rgba(61, 99, 255, 0.22), rgba(255, 90, 118, 0.4))
	           `;
  }

  if (durationMs > 0 && progressMs >= thresholdMs) {
    updateThresholdNotice(
      `Threshold reached at ${formatMs(thresholdMs)}. Safe to skip for a completed-test.`,
    );
    return;
  }

  if (durationMs > 0) {
    updateThresholdNotice(
      `Completed-test threshold at ${formatMs(thresholdMs)}.`,
    );
    return;
  }

  updateThresholdNotice("");
}

async function loadCurrentlyPlaying() {
  if (!isSpotifyConnected()) {
    resetNowPlayingUi("Connect Spotify to load current song data.");
    return null;
  }

  if (isNowPlayingRequestInFlight || document.hidden) {
    return null;
  }

  isNowPlayingRequestInFlight = true;
  const generation = playbackGeneration;

  try {
    const response = await spotifyFetch("/me/player/currently-playing");
    if (generation !== playbackGeneration) return null;

    if (response.status === 429) {
      const retryAfterSeconds = getRetryAfterSeconds(response);
      scheduleSpotifyCooldown(retryAfterSeconds, () => {
        if (isSpotifyConnected()) {
          startNowPlayingPolling();
        }
      });
      return null;
    }

    if (response.status === 204) {
      currentPlaybackDebug = {
        status: 204,
        isPlaying: false,
        note: "No active track",
        polledAt: new Date().toISOString(),
      };
      updateSortifyDebugPanel();
      await finalizePreviousTrackOnStop();
      if (currentPollIntervalMs !== IDLE_POLL_INTERVAL_MS) {
        restartNowPlayingPolling(IDLE_POLL_INTERVAL_MS);
      }
      resetNowPlayingUi();
      return null;
    }

    if (!response.ok) {
      throw new Error("Could not load current Spotify playback.");
    }

    const trackData = await response.json();
    if (generation !== playbackGeneration) return null;
    const currentTrack = {
      listenId: crypto.randomUUID(),
      observedAt: new Date().toISOString(),
      id: trackData?.item?.id ?? null,
      name: trackData?.item?.name ?? "Unknown track",
      duration_ms: trackData?.item?.duration_ms ?? 0,
      progress_ms: trackData?.progress_ms ?? 0,
      maxProgressMs: trackData?.progress_ms ?? 0,
      thresholdReached:
        (trackData?.item?.duration_ms ?? 0) > 0 &&
        (trackData?.progress_ms ?? 0) / (trackData?.item?.duration_ms ?? 1) >=
          SKIP_THRESHOLD,
      is_playing: trackData?.is_playing ?? false,
    };
    maybeRecordThresholdEvent(currentTrack);
    currentPlaybackDebug = {
      status: response.status,
      trackId: currentTrack.id,
      trackName: currentTrack.name,
      progress_ms: currentTrack.progress_ms,
      duration_ms: currentTrack.duration_ms,
      is_playing: currentTrack.is_playing,
      polledAt: new Date().toISOString(),
    };
    updateSortifyDebugPanel();
    if (currentPollIntervalMs !== ACTIVE_POLL_INTERVAL_MS) {
      restartNowPlayingPolling(ACTIVE_POLL_INTERVAL_MS);
    }
    await maybeClassifyPreviousTrack(currentTrack);
    if (generation !== playbackGeneration) return null;
    renderNowPlaying(trackData);
    return trackData;
  } finally {
    isNowPlayingRequestInFlight = false;
  }
}

function startNowPlayingPolling() {
  currentPollIntervalMs = ACTIVE_POLL_INTERVAL_MS;
  loadCurrentlyPlaying().catch((error) => {
    console.error(error);
    setAuthStatus(error.message);
  });

  restartNowPlayingPolling(ACTIVE_POLL_INTERVAL_MS);
}

function stopNowPlayingPolling() {
  if (nowPlayingPollId) {
    window.clearInterval(nowPlayingPollId);
    nowPlayingPollId = null;
  }
}

function updateAuthUi(profile) {
  if (profile) {
    setLoginButtonLabel("Disconnect Spotify");
    setAuthStatus(`Connected as ${profile.display_name ?? "Spotify user"}.`);
    window.dispatchEvent(
      new CustomEvent("spotify-auth-changed", {
        detail: {
          connected: true,
          profile,
        },
      }),
    );
    return;
  }

  if (isSpotifyConnected()) {
    setLoginButtonLabel("Disconnect Spotify");
    setAuthStatus("Spotify connected. Ready to fetch your listening data.");
    window.dispatchEvent(
      new CustomEvent("spotify-auth-changed", {
        detail: {
          connected: true,
          profile: null,
        },
      }),
    );
    return;
  }

  setLoginButtonLabel("Connect Your Spotify");
  setAuthStatus("Connect Spotify to load your listening data.");
  window.dispatchEvent(
    new CustomEvent("spotify-auth-changed", {
      detail: {
        connected: false,
        profile: null,
      },
    }),
  );
}

async function initializeSpotifyAuth() {
  try {
    await handleSpotifyCallback();

    if (isSpotifyConnected()) {
      const connectedProfile = await fetchCurrentUserProfile();
      updateAuthUi(connectedProfile);
      await loadSortifySessions();
      clearSpotifyCooldown();
      hideRateLimitWarning();
      startNowPlayingPolling();
    } else {
      updateAuthUi(null);
      resetNowPlayingUi("Connect Spotify to load current song data.");
    }
  } catch (error) {
    console.error(error);
    setAuthStatus(error.message);
    showRateLimitWarning(error.message);
    setLoginButtonLabel("Connect Your Spotify");
    resetNowPlayingUi("Current song data could not be loaded.");
  }
}

loginButton?.addEventListener("click", async () => {
  setAuthStatus("Redirecting to Spotify...");

  try {
    await startSpotifyLogin();
  } catch (error) {
    console.error(error);
    setAuthStatus(error.message);
  }
});

disconnectButton?.addEventListener("click", async () => {
  stopNowPlayingPolling();
  clearSpotifyCooldown();
  hideRateLimitWarning();
  currentPlaybackDebug = null;
  previousTrack = null;
  lastThresholdEventTrackId = null;
  try {
    await logoutSpotify();
  } catch (error) {
    showRateLimitWarning(error.message);
    startNowPlayingPolling();
    return;
  }
  thresholdEvents.length = 0;
  updateAuthUi(null);
});

window.addEventListener("spotify-auth-changed", (event) => {
  if (!event.detail.connected) {
    playbackGeneration++;
    stopNowPlayingPolling();
    clearSpotifyCooldown();
    previousTrack = null;
    thresholdEvents.length = 0;
    lastThresholdEventTrackId = null;
  }
});

document.addEventListener("visibilitychange", () => {
  if (!isSpotifyConnected()) {
    return;
  }

  if (document.hidden) {
    stopNowPlayingPolling();
    return;
  }

  if (!spotifyCooldownTimeoutId) {
    startNowPlayingPolling();
  }
});

window.addEventListener("sortify-rate-limit", (event) => {
  const retryAfterSeconds = event.detail?.retryAfterSeconds;
  const path = event.detail?.path ?? "Spotify API";
  showRateLimitWarning(
    `${path} returned 429. Stop testing in other tabs.${retryAfterSeconds ? ` Retry after about ${retryAfterSeconds} second${retryAfterSeconds === 1 ? "" : "s"}.` : ""}`,
  );
});

updateSortifyDebugPanel();
initializeSpotifyAuth();
