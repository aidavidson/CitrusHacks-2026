export function MostSkippedSongs({ listens }) {
  const counts = new Map();
  for (const listen of listens) {
    if (listen.classification !== "skipped") continue;
    const entry = counts.get(listen.trackId) || {
      id: listen.trackId,
      name: listen.trackName,
      count: 0,
    };
    entry.count++;
    counts.set(listen.trackId, entry);
  }
  const songs = [...counts.values()].sort((a, b) => b.count - a.count);
  return (
    <article className="panel accent-panel">
      <div className="panel-heading">
        <h3>Most Skipped Songs</h3>
      </div>
      <div className="artist-list" id="skipped-songs">
        {songs.length === 0 && (
          <div className="empty-state">
            Most skipped songs will appear here.
          </div>
        )}
        {songs.map((song, index) => (
          <div className="artist-row" key={song.id}>
            <div className="artist-rank">{index + 1}</div>
            <div>
              <div className="artist-name">{song.name}</div>
              <div className="artist-meta">Tracked skip</div>
            </div>
            <div className="artist-score">
              {song.count} {song.count === 1 ? "skip" : "skips"}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
