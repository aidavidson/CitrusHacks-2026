const SESSION_KEY = "sortify-sessions";

export function getSavedSessions() {
  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveSession(session) {
  const existing = getSavedSessions();
  existing.unshift(session);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(existing));
}

export function seedExampleSessions() {
  if (getSavedSessions().length > 0) {
    return;
  }

  const demoSessions = [
    {
      trackName: "Example Song",
      artistName: "Demo Artist",
      progressMs: 32500,
      predictedLabel: "Likely counted",
    },
    {
      trackName: "Skipped Song",
      artistName: "Demo Artist",
      progressMs: 12000,
      predictedLabel: "Likely skipped",
    },
  ];

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(demoSessions));
}
