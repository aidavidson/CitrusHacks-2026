const connectedPlaceholders = {
  listeningSummary: {
    songsPlayed: "--",
    songsSkipped: "--"
  },
  nowPlaying: {
    title: "Current song will appear here",
    artist: "Connected Spotify data pending",
    currentTime: "--:--",
    duration: "--:--",
    percentCompletion: 0
  },
  leastSkippedSongs: [
    { title: "Least skipped songs will appear here", artist: "Waiting for Spotify data", skips: 0 }
  ],
  mostSkippedSongs: [
    { name: "Most skipped songs will appear here", genre: "Waiting for Spotify data", score: 0 }
  ]
};

const formatSkips = (value) => `${value} ${value === 1 ? "skip" : "skips"}`;
const likedSongsContainer = document.getElementById("liked-songs");
const skippedSongsContainer = document.getElementById("skipped-songs");
const connectSpotifyButton =
  document.getElementById("connect-spotify-button") || document.getElementById("login-button");
const checkSkippedButton = document.getElementById("check-skipped-button");
const cleanButton = document.querySelector(".clean-button");
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
let hasCheckedSkipped = false;

const updateCleanButtonState = () => {
  cleanButton.disabled = !(isSpotifyConnected && hasCheckedSkipped);
};

const renderLeastSkippedSongs = (songs) => {
  likedSongsContainer.innerHTML = "";
  songs.forEach((track, index) => {
    const row = document.createElement("div");
    row.className = "track-row";
    row.innerHTML = `
      <div class="track-rank">${index + 1}</div>
      <div>
        <div class="track-title">${track.title}</div>
        <div class="track-subtitle">${track.artist}</div>
      </div>
      <div class="track-time">${formatSkips(track.skips)}</div>`;
    likedSongsContainer.appendChild(row);
  });
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

const renderConnectedState = () => {
  isSpotifyConnected = true;
  hasCheckedSkipped = false;
  songsPlayedValue.textContent = connectedPlaceholders.listeningSummary.songsPlayed;
  songsPlayedLabel.textContent = "Songs Played";
  songsSkippedValue.textContent = connectedPlaceholders.listeningSummary.songsSkipped;
  songsSkippedLabel.textContent = "Songs Skipped";
  nowPlayingTitle.textContent = connectedPlaceholders.nowPlaying.title;
  nowPlayingArtist.textContent = connectedPlaceholders.nowPlaying.artist;
  nowPlayingCurrentTime.textContent = connectedPlaceholders.nowPlaying.currentTime;
  nowPlayingDuration.textContent = connectedPlaceholders.nowPlaying.duration;
  nowPlayingProgress.style.width = `${connectedPlaceholders.nowPlaying.percentCompletion}%`;
  nowPlayingCover.style.backgroundImage = `
    linear-gradient(135deg, rgba(61, 99, 255, 0.22), rgba(255, 90, 118, 0.4))
  `;
  renderLeastSkippedSongs(connectedPlaceholders.leastSkippedSongs);
  renderMostSkippedSongs(connectedPlaceholders.mostSkippedSongs);
  updateCleanButtonState();
};

const renderLockedState = () => {
  likedSongsContainer.innerHTML = '<div class="empty-state">Click "Check Skipped" to load your skip data.</div>';
  skippedSongsContainer.innerHTML = '<div class="empty-state">Your most skipped songs will appear here.</div>';
};

const renderConnectFirstState = () => {
  likedSongsContainer.innerHTML = '<div class="empty-state">Connect Spotify before checking skipped songs.</div>';
  skippedSongsContainer.innerHTML = '<div class="empty-state">Once connected, your skipped songs will appear here.</div>';
};

const renderSkippedSongs = () => {
  if (!isSpotifyConnected) {
    renderConnectFirstState();
    return;
  }
  hasCheckedSkipped = true;
  updateCleanButtonState();
};

cleanButton.addEventListener("click", function() {
  if (!isSpotifyConnected || !hasCheckedSkipped) {
    return;
  }
  window.open("https://open.spotify.com/", "_blank");
});

checkSkippedButton.addEventListener("click", renderSkippedSongs);
connectSpotifyButton.addEventListener("click", renderConnectedState);

renderDisconnectedState();
renderLockedState();
updateCleanButtonState();
