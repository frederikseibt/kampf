import { getUpcoming } from './data/index.js';
import { esc, dayShort, time, weightLabel } from './format.js';
import { favList, getNotify, isFav } from './store.js';
import { flagImg } from './ui.js';

const TOGGLES = [
  ['fightStart', 'Kampfbeginn', 'Kurz vor Start eines Events'],
  ['favorites', 'Meine Favoriten', 'Wenn ein Favorit kämpft'],
  ['results', 'Ergebnisse', 'Sobald ein Kampf entschieden ist'],
];

const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

export async function meView(root) {
  const favs = favList();
  const notify = getNotify();

  let upcoming = [];
  try {
    const events = await getUpcoming();
    for (const ev of events) {
      for (const seg of ev.segments) {
        for (const fight of seg.fights) {
          if (fight.fighters.some((f) => isFav(f.id))) upcoming.push({ ev, fight });
        }
      }
    }
  } catch {
    upcoming = [];
  }

  root.innerHTML = `
    <h1 class="page-title">Profil</h1>

    <h2 class="seg">Meine Favoriten</h2>
    ${favs.length ? `<div class="card fights">${favs.map((f) => `
      <div class="rank-row">
        ${flagImg(f.flag)}
        <a class="fname flink" href="#/fighter/${esc(f.id)}">${esc(f.name)}</a>
        <button class="fav on small-fav" data-fav="${esc(f.id)}" data-name="${esc(f.name)}" data-flag="${esc(f.flag)}" data-rerender="me" aria-label="Favorit entfernen">★</button>
      </div>`).join('')}</div>`
      : '<div class="card muted">Noch keine Favoriten. Öffne ein Kämpferprofil und tippe auf den Stern.</div>'}

    ${upcoming.length ? `<h2 class="seg">Nächste Kämpfe deiner Favoriten</h2>
    <div class="card fights">${upcoming.map(({ ev, fight }) => `
      <a class="hist" href="#/event/${esc(ev.id)}">
        <span class="hist-main"><b>${fight.fighters.map((f) => esc(f.name)).join(' vs ')}</b>
        <span class="muted small">${esc(ev.title)} · ${esc(dayShort(ev.date))}, ${esc(time(ev.date))} · ${esc(weightLabel(fight.weightClass))}</span></span>
      </a>`).join('')}</div>` : ''}

    <h2 class="seg">Benachrichtigungen</h2>
    <div class="card fights">
      ${TOGGLES.map(([key, title, sub]) => `
      <label class="toggle">
        <span><b>${title}</b><span class="muted small">${sub}</span></span>
        <input type="checkbox" data-notify="${key}" ${notify[key] ? 'checked' : ''} />
        <i class="switch" aria-hidden="true"></i>
      </label>`).join('')}
    </div>
    <p class="muted small note">Deine Auswahl wird gespeichert. Push-Nachrichten kommen aufs Handy, sobald der Server dafür eingerichtet ist. Das ist noch nicht aktiv.</p>

    ${isInstalled() ? '' : `<h2 class="seg">App installieren</h2>
    <div class="card muted small">Öffne diese Seite in Safari, tippe auf das Teilen-Symbol und wähle <b>Zum Home-Bildschirm</b>. Nur so funktionieren später Push-Nachrichten.</div>`}`;
}
