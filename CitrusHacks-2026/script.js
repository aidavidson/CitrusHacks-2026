//needs to be compatible with user's current song and their location in
//the song
const nowPlaying = {
  title: "Midnight City",
  artist: "M83",
  currentTime: "1:42",
  duration: "4:03",
  coverImage:
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80",
  percentCompletion: 50
};

const likedSongs = [
  { title: "Saturn Nights", artist: "Leisure Club", skips: 1 },
  { title: "Golden Hour", artist: "Kacey Musgraves", skips: 2 },
  { title: "Pink + White", artist: "Frank Ocean", skips: 3 },
  { title: "Electric Feel", artist: "MGMT", skips: 4 }
];

const skippedSongs = [
  { name: "Blinding Lights", genre: "The Weeknd", score: 28 },
  { name: "Kill Bill", genre: "SZA", score: 22 },
  { name: "Bad Habit", genre: "Steve Lacy", score: 19 },
  { name: "As It Was", genre: "Harry Styles", score: 16 }
];

document.documentElement.style.setProperty('--percent-completion', nowPlaying.percentCompletion + '%');
const formatSkips = (value) => `${value} ${value === 1 ? "skip" : "skips"}`;
const likedSongsContainer = document.getElementById("liked-songs");
const skippedSongsContainer = document.getElementById("skipped-songs");
const nowPlayingTitle = document.getElementById("now-playing-title");
const nowPlayingArtist = document.getElementById("now-playing-artist");
const nowPlayingCurrentTime = document.getElementById("now-playing-current-time");
const nowPlayingDuration = document.getElementById("now-playing-duration");
const nowPlayingCover = document.getElementById("now-playing-cover");

document.querySelector(".clean-button").addEventListener("click", function(){
    window.open("https://open.spotify.com/", "_blank");
});
nowPlayingTitle.textContent = nowPlaying.title;
nowPlayingArtist.textContent = nowPlaying.artist;
nowPlayingCurrentTime.textContent = nowPlaying.currentTime;
nowPlayingDuration.textContent = nowPlaying.duration;
nowPlayingCover.style.backgroundImage = `
  linear-gradient(135deg, rgba(61, 99, 255, 0.18), rgba(255, 90, 118, 0.52)),
  url("${nowPlaying.coverImage}")
`;

likedSongs.forEach((track, index) => {
  const row = document.createElement("div");
  row.className = "track-row";
  row.innerHTML = `
    <div class="track-rank">${index + 1}</div>
    <div>
      <div class="track-title">${track.title}</div>
      <div class="track-subtitle">${track.artist}</div>
    </div>
    <div class="track-time">${formatSkips(track.skips)}</div>
  `;
  likedSongsContainer.appendChild(row);
});

skippedSongs.forEach((artist, index) => {
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
