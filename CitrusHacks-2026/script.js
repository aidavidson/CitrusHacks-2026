const recentTracks = [
  { title: "Saturn Nights", artist: "Leisure Club", skips: "1 skip" },
  { title: "Golden Hour", artist: "Kacey Musgraves", skips: "2 skips" },
  { title: "Pink + White", artist: "Frank Ocean", skips: "3 skips" },
  { title: "Electric Feel", artist: "MGMT", skips: "4 skips" }
];

const topArtists = [
  { name: "Blinding Lights", genre: "The Weeknd", score: "28 skips" },
  { name: "Kill Bill", genre: "SZA", score: "22 skips" },
  { name: "Bad Habit", genre: "Steve Lacy", score: "19 skips" },
  { name: "As It Was", genre: "Harry Styles", score: "16 skips" }
];

const recentTracksContainer = document.getElementById("recent-tracks");
const topArtistsContainer = document.getElementById("top-artists");

recentTracks.forEach((track, index) => {
  const row = document.createElement("div");
  row.className = "track-row";
  row.innerHTML = `
    <div class="track-rank">${index + 1}</div>
    <div>
      <div class="track-title">${track.title}</div>
      <div class="track-subtitle">${track.artist}</div>
    </div>
    <div class="track-time">${track.skips}</div>
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
