import { useEffect, useState } from "react";
import { apiRequest } from "../api.js";
import {
  ACTIVE_POLL_MS,
  IDLE_POLL_MS,
  listeningEvent,
  playbackSnapshot,
} from "../playback.js";

export function usePlayback({ enabled, csrfToken, onSaved, onError }) {
  const [track, setTrack] = useState(null);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let previous = null;
    let timer;
    let inFlight = false;
    let nextPollAt = 0;
    let interval = ACTIVE_POLL_MS;

    async function savePrevious(reason) {
      if (!previous) return;
      const saved = await apiRequest("/api/listens", {
        method: "POST",
        csrfToken,
        signal: controller.signal,
        body: JSON.stringify(listeningEvent(previous, reason)),
      });
      if (!controller.signal.aborted) onSaved(saved);
    }

    function schedule() {
      clearTimeout(timer);
      if (!controller.signal.aborted && !document.hidden) {
        timer = setTimeout(poll, Math.max(0, nextPollAt - Date.now()));
      }
    }

    async function poll() {
      if (controller.signal.aborted || document.hidden || inFlight) return;
      inFlight = true;
      let delay = interval;
      try {
        const data = await apiRequest(
          "/api/spotify/me/player/currently-playing",
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        const current = playbackSnapshot(data);
        if (!data) {
          await savePrevious("playback_stopped");
          previous = null;
          interval = IDLE_POLL_MS;
        } else if (current) {
          interval = ACTIVE_POLL_MS;
          if (previous?.id === current.id) {
            previous = {
              ...current,
              listenId: previous.listenId,
              progressMs: Math.max(previous.progressMs, current.progressMs),
            };
          } else {
            // Keep the prior event ID until saving succeeds so retries stay idempotent.
            await savePrevious();
            previous = current;
          }
        }
        if (controller.signal.aborted) return;
        setTrack(data);
        setWarning("");
        delay = interval;
      } catch (failure) {
        if (controller.signal.aborted) return;
        if (failure.status === 429) {
          delay = failure.retryAfterSeconds * 1000;
          setWarning(
            `Spotify rate limit hit. Retrying in ${failure.retryAfterSeconds} seconds.`,
          );
        } else {
          setWarning(failure.message);
          if (failure.status === 401) onError(failure);
        }
      } finally {
        inFlight = false;
        nextPollAt = Date.now() + delay;
        schedule();
      }
    }

    function visibilityChanged() {
      clearTimeout(timer);
      if (!document.hidden) schedule();
    }
    setTrack(null);
    setWarning("");
    document.addEventListener("visibilitychange", visibilityChanged);
    poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [enabled, csrfToken, onSaved, onError]);

  return { track: enabled ? track : null, warning: enabled ? warning : "" };
}
