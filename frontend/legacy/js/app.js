import { appRules } from "./config.js";
import { getSavedSessions, seedExampleSessions } from "./storage.js";

function formatMs(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function updatePlayerPage() {
  const trackName = document.querySelector("#track-name");
  if (!trackName) {
    return;
  }

  const demoProgress = 32500;
  const demoDuration = 180000;
  const progressRatio = (demoProgress / demoDuration) * 100;

  document.querySelector("#track-name").textContent = "Example Song";
  document.querySelector("#artist-name").textContent = "Demo Artist";
  document.querySelector("#progress-label").textContent = formatMs(demoProgress);
  document.querySelector("#duration-label").textContent = formatMs(demoDuration);
  document.querySelector("#meter-fill").style.width = `${progressRatio}%`;

  const counted = demoProgress >= appRules.likelyCountedMs;
  document.querySelector("#prediction-pill").textContent = counted
    ? "Likely counted"
    : "Likely skipped";
  document.querySelector("#prediction-copy").textContent = counted
    ? "This session passed the 30-second threshold used by the app."
    : "This session has not reached the 30-second threshold yet.";
}

function updateHistoryPage() {
  const sessionList = document.querySelector("#session-list");
  if (!sessionList) {
    return;
  }

  seedExampleSessions();
  const sessions = getSavedSessions();

  sessionList.innerHTML = sessions
    .map((session) => {
      const success = session.predictedLabel === "Likely counted";
      return `
        <li class="session-item">
          <span>${session.trackName} - ${session.artistName}</span>
          <span>${formatMs(session.progressMs)}</span>
          <span class="session-tag ${success ? "success" : "danger"}">${session.predictedLabel}</span>
        </li>
      `;
    })
    .join("");
}

updatePlayerPage();
updateHistoryPage();
