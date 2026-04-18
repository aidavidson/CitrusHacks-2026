const recentTracks = [
  { title: "Saturn Nights", artist: "Leisure Club", playedAt: "2 min ago" },
  { title: "Golden Hour", artist: "Kacey Musgraves", playedAt: "19 min ago" },
  { title: "Pink + White", artist: "Frank Ocean", playedAt: "42 min ago" },
  { title: "Electric Feel", artist: "MGMT", playedAt: "1 hr ago" }
];

const topArtists = [
  { name: "The Marías", genre: "Indie pop", score: "92 pts" },
  { name: "SZA", genre: "Alt R&B", score: "88 pts" },
  { name: "Tame Impala", genre: "Psychedelic pop", score: "81 pts" },
  { name: "Steve Lacy", genre: "Neo soul", score: "76 pts" }
];

const activity = [
  { day: "Mon", value: 42 },
  { day: "Tue", value: 68 },
  { day: "Wed", value: 54 },
  { day: "Thu", value: 86 },
  { day: "Fri", value: 74 },
  { day: "Sat", value: 96 },
  { day: "Sun", value: 58 }
];

const recentTracksContainer = document.getElementById("recent-tracks");
const topArtistsContainer = document.getElementById("top-artists");
const chartContainer = document.getElementById("activity-chart");

recentTracks.forEach((track, index) => {
  const row = document.createElement("div");
  row.className = "track-row";
  row.innerHTML = `
    <div class="track-rank">${index + 1}</div>
    <div>
      <div class="track-title">${track.title}</div>
      <div class="track-subtitle">${track.artist}</div>
    </div>
    <div class="track-time">${track.playedAt}</div>
  `;
  recentTracksContainer.appendChild(row);
});

topArtists.forEach((artist, index) => {
  const row = document.createElement("div");
  row.className = "artist-row";
  row.innerHTML = `
    <div class="artist-rank">${index + 1}</div>
    <div>
      <div class="artist-name">${artist.name}</div>
      <div class="artist-meta">${artist.genre}</div>
    </div>
    <div class="artist-score">${artist.score}</div>
  `;
  topArtistsContainer.appendChild(row);
});

activity.forEach((entry, index) => {
  const wrap = document.createElement("div");
  wrap.className = "chart-bar-wrap";
  wrap.innerHTML = `
    <div
      class="chart-bar"
      style="height: ${entry.value}%; animation-delay: ${index * 90}ms;"
    ></div>
    <div class="chart-label">${entry.day}</div>
  `;
  chartContainer.appendChild(wrap);
});
