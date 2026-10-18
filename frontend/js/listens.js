import { apiFetch } from "./auth.js";

let listens = [];
let generation = 0;
export function getSortifySessions() {
  return listens;
}
function changed() {
  window.dispatchEvent(new CustomEvent("sortify-stats-changed"));
}
export async function loadSortifySessions() {
  const current = generation;
  const response = await apiFetch("/api/listens");
  if (!response.ok) throw new Error("Could not load your listening history.");
  const data = await response.json();
  if (current !== generation) return;
  listens = data.listens;
  changed();
}
export async function saveSortifySession(event) {
  const current = generation;
  const response = await apiFetch("/api/listens", {
    method: "POST",
    body: JSON.stringify(event),
  });
  if (!response.ok)
    throw new Error(
      "Could not save listening history. Sortify will retry on the next poll.",
    );
  const saved = await response.json();
  if (current !== generation) return;
  if (!listens.some((listen) => listen.id === saved.id)) listens.push(saved);
  changed();
}
window.addEventListener("spotify-auth-changed", (event) => {
  if (!event.detail.connected) {
    generation++;
    listens = [];
    changed();
  }
});
