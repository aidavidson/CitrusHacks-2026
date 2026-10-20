export function ListeningSummary({ listens }) {
  return (
    <section className="stat-strip dashboard-stat-strip">
      <article>
        <span className="stat-number" id="songs-played-value">
          {listens.length}
        </span>
        <span className="stat-label" id="songs-played-label">
          Songs Played
        </span>
      </article>
      <article>
        <span className="stat-number" id="songs-skipped-value">
          {
            listens.filter((listen) => listen.classification === "skipped")
              .length
          }
        </span>
        <span className="stat-label" id="songs-skipped-label">
          Songs Skipped
        </span>
      </article>
    </section>
  );
}
