import { Background } from "./components/Background.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { SpotifyConnect } from "./components/SpotifyConnect.jsx";
import { useSpotifySession } from "./hooks/useSpotifySession.js";
import { usePlayback } from "./hooks/usePlayback.js";

export default function App() {
  const auth = useSpotifySession();
  const connected = Boolean(auth.session?.connected);
  const playback = usePlayback({
    enabled: connected && !auth.busy,
    csrfToken: auth.session?.csrfToken,
    onSaved: auth.addListen,
    onError: auth.reportError,
  });
  const warning = playback.warning || auth.error;
  return (
    <>
      <Background />
      {connected && warning && (
        <div
          className="rate-limit-warning"
          id="rate-limit-warning"
          role="alert"
        >
          {warning}
        </div>
      )}
      <main className="page-shell">
        {connected ? (
          <Dashboard
            profile={auth.session.profile}
            listens={auth.listens}
            track={playback.track}
            busy={auth.busy}
            onDisconnect={auth.disconnect}
          />
        ) : (
          <SpotifyConnect
            loading={auth.loading}
            busy={auth.busy}
            error={auth.error}
            onConnect={auth.connect}
          />
        )}
      </main>
    </>
  );
}
