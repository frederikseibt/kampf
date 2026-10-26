// Kleiner Cache im Browser: frische Daten direkt nutzen, bei Fehlern den letzten Stand zeigen.
export async function cached(key, ttlMinutes, fetcher) {
  let hit = null;
  try {
    hit = JSON.parse(localStorage.getItem(key));
  } catch {
    /* kein Cache verfügbar */
  }
  if (hit && Date.now() - hit.at < ttlMinutes * 60000) return hit.value;
  try {
    const value = await fetcher();
    try {
      localStorage.setItem(key, JSON.stringify({ at: Date.now(), value }));
    } catch {
      /* Speicher voll: egal */
    }
    return value;
  } catch (err) {
    if (hit) return hit.value;
    throw err;
  }
}
