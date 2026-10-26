// Persönliche Daten (nur auf diesem Gerät, im Browser gespeichert): Favoriten und Einstellungen.

const KEY = 'mma:me:v1';
const DEFAULTS = { favs: {}, notify: { fightStart: true, favorites: true, results: false } };

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY)) || {};
    return { favs: s.favs || {}, notify: { ...DEFAULTS.notify, ...s.notify } };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
}

let state = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* gesperrt: Änderungen gelten nur bis zum Schließen */
  }
}

export const isFav = (id) => !!state.favs[id];
export const favList = () => Object.values(state.favs);

export function toggleFav(f) {
  if (state.favs[f.id]) delete state.favs[f.id];
  else state.favs[f.id] = { id: f.id, name: f.name, flag: f.flag || '' };
  save();
  return isFav(f.id);
}

export const getNotify = () => ({ ...state.notify });

export function setNotify(key, value) {
  state.notify[key] = !!value;
  save();
}
