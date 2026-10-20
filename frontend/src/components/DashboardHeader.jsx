import logo from "../../book-logo2.png";

export function DashboardHeader({ profile, busy, onSignOut }) {
  return (
    <header className="dashboard-topbar">
      <img
        className="logo dashboard-hero-image"
        src={logo}
        alt="Sortify bookshelf illustration"
      />
      <div className="dashboard-branding">
        <h2 className="sortify-title">Sortify</h2>
        <p className="welcome-title">
          Welcome{" "}
          <span id="welcome-user-name">
            {profile?.display_name || profile?.id || "Spotify user"}
          </span>
        </p>
      </div>
      <button
        className="primary-button sign-out-button"
        id="disconnect-button"
        disabled={busy}
        onClick={onSignOut}
      >
        {busy ? "Signing out..." : "Sign out"}
      </button>
    </header>
  );
}
