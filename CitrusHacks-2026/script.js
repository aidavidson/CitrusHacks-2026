const connectedPlaceholders = {
  nowPlaying: {
    title: "Current song will appear here",
    artist: "Connected Spotify data pending",
    currentTime: "--:--",
    duration: "--:--",
    percentCompletion: 0
  }
};

const SORTIFY_SESSIONS_KEY = "sortify_sessions";
const formatSkips = (value) => `${value} ${value === 1 ? "skip" : "skips"}`;
const landingPage = document.getElementById("landing-page");
const dashboardPage = document.getElementById("dashboard-page");
const skippedSongsContainer = document.getElementById("skipped-songs");
const welcomeUserName = document.getElementById("welcome-user-name");
const songsPlayedValue = document.getElementById("songs-played-value");
const songsPlayedLabel = document.getElementById("songs-played-label");
const songsSkippedValue = document.getElementById("songs-skipped-value");
const songsSkippedLabel = document.getElementById("songs-skipped-label");
const nowPlayingTitle = document.getElementById("now-playing-title");
const nowPlayingArtist = document.getElementById("now-playing-artist");
const nowPlayingCurrentTime = document.getElementById("now-playing-current-time");
const nowPlayingDuration = document.getElementById("now-playing-duration");
const nowPlayingCover = document.getElementById("now-playing-cover");
const nowPlayingProgress = document.getElementById("now-playing-progress");
const nowPlayingMetaLabel = document.querySelector(".mini-label");
let isSpotifyConnected = false;

const getStoredSpotifyName = () =>
  window.localStorage.getItem("spotify_profile_name") ?? "Spotify user";

const getSortifySessions = () => {
  const rawSessions = window.localStorage.getItem(SORTIFY_SESSIONS_KEY);
  if (!rawSessions) {
    return [];
  }

  try {
    const parsedSessions = JSON.parse(rawSessions);
    return Array.isArray(parsedSessions) ? parsedSessions : [];
  } catch {
    return [];
  }
};

const getListeningSummary = () => {
  const sessions = getSortifySessions();
  return {
    songsPlayed: sessions.length,
    songsSkipped: sessions.filter((session) => session?.classification === "skipped").length
  };
};

const getMostSkippedSongs = () => {
  const skippedSessions = getSortifySessions().filter(
    (session) => session?.classification === "skipped" && session?.trackId
  );

  if (skippedSessions.length === 0) {
    return [
      {
        name: "Most skipped songs will appear here",
        genre: "Waiting for Spotify data",
        score: 0
      }
    ];
  }

  const skippedByTrack = new Map();

  skippedSessions.forEach((session) => {
    const existing = skippedByTrack.get(session.trackId) ?? {
      name: session.trackName ?? "Unknown track",
      genre: "Tracked skip",
      score: 0,
    };

    existing.score += 1;
    skippedByTrack.set(session.trackId, existing);
  });

  return Array.from(skippedByTrack.values()).sort((a, b) => b.score - a.score);
};

const renderListeningSummary = () => {
  const summary = getListeningSummary();
  songsPlayedValue.textContent = String(summary.songsPlayed);
  songsPlayedLabel.textContent = "Songs Played";
  songsSkippedValue.textContent = String(summary.songsSkipped);
  songsSkippedLabel.textContent = "Songs Skipped";
};

const setPageState = (connected, accountName = "Spotify user") => {
  landingPage.classList.toggle("is-hidden", connected);
  dashboardPage.classList.toggle("is-hidden", !connected);
  welcomeUserName.textContent = accountName;
};

const renderMostSkippedSongs = (songs) => {
  skippedSongsContainer.innerHTML = "";

  songs.forEach((artist, index) => {
    const row = document.createElement("div");
    row.className = "artist-row";
    row.innerHTML = `
      <div class="artist-rank">${index + 1}</div>
      <div>
        <div class="artist-name">${artist.name}</div>
        <div class="artist-meta">${artist.genre}</div>
      </div>
      <div class="artist-score">${formatSkips(artist.score)}</div>
    `;
    skippedSongsContainer.appendChild(row);
  });
};

const renderDisconnectedState = () => {
  isSpotifyConnected = false;
  setPageState(false);
  songsPlayedValue.textContent = "--";
  songsPlayedLabel.textContent = "Connect to load songs played";
  songsSkippedValue.textContent = "--";
  songsSkippedLabel.textContent = "Connect to load songs skipped";

  nowPlayingMetaLabel.textContent = "Now playing";
  nowPlayingTitle.textContent = "Connect Spotify to load current song";
  nowPlayingArtist.textContent = "Artist data will appear here";
  nowPlayingCurrentTime.textContent = "--:--";
  nowPlayingDuration.textContent = "--:--";
  nowPlayingProgress.style.width = "0%";
  nowPlayingCover.style.backgroundImage = `
    linear-gradient(135deg, rgba(61, 99, 255, 0.22), rgba(255, 90, 118, 0.4))
  `;
};

const renderConnectedState = (accountName = "Spotify user") => {
  isSpotifyConnected = true;
  setPageState(true, accountName);
  renderListeningSummary();
  nowPlayingTitle.textContent = connectedPlaceholders.nowPlaying.title;
  nowPlayingArtist.textContent = connectedPlaceholders.nowPlaying.artist;
  nowPlayingCurrentTime.textContent = connectedPlaceholders.nowPlaying.currentTime;
  nowPlayingDuration.textContent = connectedPlaceholders.nowPlaying.duration;
  nowPlayingProgress.style.width = `${connectedPlaceholders.nowPlaying.percentCompletion}%`;
  nowPlayingCover.style.backgroundImage = `
    linear-gradient(135deg, rgba(61, 99, 255, 0.22), rgba(255, 90, 118, 0.4))
  `;
  renderMostSkippedSongs(getMostSkippedSongs());
};

const renderConnectFirstState = () => {
  skippedSongsContainer.innerHTML =
    '<div class="empty-state">Once connected, your skipped songs will appear here.</div>';
};

const renderSkippedSongs = () => {
  if (!isSpotifyConnected) {
    renderConnectFirstState();
  }
};

window.addEventListener("spotify-auth-changed", (event) => {
  const { connected, profile } = event.detail;
  if (connected) {
    renderConnectedState(
      profile?.display_name ?? profile?.id ?? getStoredSpotifyName()
    );
    return;
  }

  renderDisconnectedState();
});

window.addEventListener("sortify-stats-changed", () => {
  if (!isSpotifyConnected) {
    return;
  }

  renderListeningSummary();
  renderMostSkippedSongs(getMostSkippedSongs());
});

renderDisconnectedState();
