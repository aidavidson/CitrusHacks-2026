export function SpotifyConnect({ loading, busy, error, onConnect }) {
  return (
    <section className="hero-card landing-page" id="landing-page">
      <div className="hero-copy">
        <p className="eyebrow">Personal music dashboard</p>
        <h1>Clean up Your Playlists.</h1>
        <p className="hero-text">
          find songs you may not want to listen to anymore and encourage musical
          growth.
        </p>
        <div className="hero-actions">
          <button
            className="primary-button"
            id="login-button"
            disabled={loading || busy}
            onClick={onConnect}
          >
            {busy ? "Connecting..." : "Connect Your Spotify"}
          </button>
        </div>
        <p className="auth-status" id="auth-status" role="status">
          {error ||
            (loading
              ? "Loading your account..."
              : "Connect Spotify to load your listening data.")}
        </p>
      </div>
    </section>
  );
}
