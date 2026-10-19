import { DashboardHeader } from "./DashboardHeader.jsx";
import { ListeningSummary } from "./ListeningSummary.jsx";
import { MostSkippedSongs } from "./MostSkippedSongs.jsx";
import { NowPlaying } from "./NowPlaying.jsx";

export function Dashboard({ profile, listens, track, busy, onDisconnect }) {
  return (
    <section className="dashboard-page" id="dashboard-page">
      <DashboardHeader profile={profile} busy={busy} onSignOut={onDisconnect} />
      <ListeningSummary listens={listens} />
      <section
        className="dashboard-grid"
        aria-label="Playback and skipped songs"
      >
        <NowPlaying track={track} />
        <MostSkippedSongs listens={listens} />
      </section>
    </section>
  );
}
