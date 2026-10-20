export const SKIP_THRESHOLD = 0.55;
export const ACTIVE_POLL_MS = 5000;
export const IDLE_POLL_MS = 60000;

export function formatMs(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "--:--";
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function playbackSnapshot(data) {
  if (!data?.item?.id || !data.item.duration_ms) return null;
  return {
    listenId: crypto.randomUUID(),
    observedAt: new Date().toISOString(),
    id: data.item.id,
    name: data.item.name || "Unknown track",
    durationMs: data.item.duration_ms,
    progressMs: data.progress_ms || 0,
  };
}

export function listeningEvent(snapshot, reason) {
  const progressMs = Math.min(snapshot.progressMs, snapshot.durationMs);
  return {
    id: snapshot.listenId,
    trackId: snapshot.id,
    trackName: snapshot.name,
    durationMs: snapshot.durationMs,
    progressMs,
    timestamp: snapshot.observedAt,
    classificationReason:
      reason ||
      (progressMs / snapshot.durationMs >= SKIP_THRESHOLD
        ? "switched_after_threshold"
        : "switched_before_threshold"),
  };
}
