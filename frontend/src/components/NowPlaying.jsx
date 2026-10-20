import { SKIP_THRESHOLD, formatMs } from "../playback.js";

export function NowPlaying({ track }) {
  const item = track?.item;
  const progress = track?.progress_ms || 0;
  const duration = item?.duration_ms || 0;
  const percent = duration
    ? Math.min(100, Math.max(0, (progress / duration) * 100))
    : 0;
  const cover = item?.album?.images?.[0]?.url;
  const threshold = duration * SKIP_THRESHOLD;
  const backgroundImage = cover
    ? `linear-gradient(135deg, rgba(61, 99, 255, 0.18), rgba(255, 90, 118, 0.4)), url(${JSON.stringify(cover)})`
    : "linear-gradient(135deg, rgba(61, 99, 255, 0.22), rgba(255, 90, 118, 0.4))";
  return (
    <aside className="now-playing-card dashboard-now-playing">
      <div
        className="now-playing-cover"
        id="now-playing-cover"
        style={{ backgroundImage }}
      />
      <div className="now-playing-meta">
        <p className="mini-label">Now playing</p>
        <h2 id="now-playing-title">{item?.name || "No active track"}</h2>
        <p id="now-playing-artist">
          {item
            ? item.artists?.[0]?.name || "Unknown artist"
            : "Nothing is playing right now."}
        </p>
      </div>
      <p id="threshold-notice" className="threshold-notice">
        {duration > 0 &&
          (progress >= threshold
            ? `Threshold reached at ${formatMs(threshold)}. Safe to skip for a completed-test.`
            : `Completed-test threshold at ${formatMs(threshold)}.`)}
      </p>
      <div className="progress-block">
        <div className="progress-line">
          <span id="now-playing-progress" style={{ width: `${percent}%` }} />
        </div>
        <div className="progress-time">
          <span id="now-playing-current-time">
            {item ? formatMs(progress) : "--:--"}
          </span>
          <span id="now-playing-duration">
            {item ? formatMs(duration) : "--:--"}
          </span>
        </div>
      </div>
    </aside>
  );
}
