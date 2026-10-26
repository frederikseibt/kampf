import { getDivisions, getFighter } from './data/fighters.js';
import { getFightsOf } from './data/index.js';
import { DIVISIONS } from './config.js';
import { esc, dayShort, lbsToKg, inToCm, resultText, weightLabel } from './format.js';
import { skeleton, errorBox, backLink, flagImg, avatar } from './ui.js';
import { isFav } from './store.js';

const HEADING = 'Kämpfer';

export async function fightersView(root, key) {
  root.innerHTML = `<h1 class="page-title">${HEADING}</h1>${skeleton}`;
  try {
    const divisions = await getDivisions();
    const div = divisions.find((d) => d.key === key) || divisions[0];
    const chips = divisions.map((d) => `
      <a class="pill ${d.key === div.key ? 'active' : ''}" href="#/fighters/${encodeURIComponent(d.key)}">${esc(d.key.startsWith('P4P') ? d.de.replace('Pound for Pound · ', 'P4P ') : d.de)}</a>`).join('');
    const rows = div.fighters.map((f) => `
      <a class="rank-row ${f.champion ? 'champ' : ''}" href="#/fighter/${esc(f.id)}">
        <span class="rank">${f.champion ? '👑' : f.rank}</span>
        ${flagImg(f.flag)}
        <span class="fname">${esc(f.name)}${isFav(f.id) ? ' <span class="star">★</span>' : ''}</span>
        <span class="muted small rec">${esc(f.record)}</span>
      </a>`).join('');
    root.innerHTML = `
      <h1 class="page-title">${HEADING}</h1>
      <div class="pills" role="tablist">${chips}</div>
      <header class="div-head">
        <h2>${esc(div.de)}</h2>
        ${div.kg ? `<p class="muted">bis ${div.kg} kg</p>` : '<p class="muted">Die besten Kämpfer über alle Klassen</p>'}
      </header>
      <div class="card fights">${rows || '<p class="muted center">Keine Rangliste verfügbar.</p>'}</div>
      <p class="muted small center note">Rangliste laut ESPN.</p>`;
    root.querySelector('.pill.active')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  } catch (e) {
    root.innerHTML = `<h1 class="page-title">${HEADING}</h1>${errorBox(e.message)}`;
  }
}

const stat = (label, value) => `<div class="stat"><span class="muted small">${label}</span><b>${esc(value || '–')}</b></div>`;

export async function fighterView(root, id) {
  root.innerHTML = `${backLink('#/fighters')}${skeleton}`;
  try {
    const [f, fights] = await Promise.all([getFighter(id), getFightsOf(id)]);
    const born = f.born ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(f.born)) : '';
    const division = DIVISIONS[f.divisionKey] ? weightLabel(f.divisionKey) : f.divisionKey;
    const history = fights.map(({ event, fight }) => {
      const me = fight.fighters.find((x) => x.id === id);
      const opp = fight.fighters.find((x) => x.id !== id);
      const done = fight.state === 'post';
      const badge = done ? (me.winner ? '<span class="res res-w">S</span>' : '<span class="res res-l">N</span>') : '<span class="res">–</span>';
      return `
      <a class="hist" href="#/event/${esc(event.id)}">
        ${badge}
        <span class="hist-main"><b>${opp ? `vs ${esc(opp.name)}` : ''}</b><span class="muted small">${esc(event.title)} · ${esc(dayShort(event.date))}${done ? ' · ' + esc(resultText(fight.result)) : ''}</span></span>
      </a>`;
    }).join('');
    root.innerHTML = `
      ${backLink('#/fighters')}
      <header class="profile">
        ${avatar(f.name)}
        <div class="profile-name">
          <h1>${esc(f.name)}</h1>
          ${f.nickname ? `<p class="muted">„${esc(f.nickname)}“</p>` : ''}
          <p class="muted small">${flagImg(f.flag)} ${esc(f.country)}</p>
        </div>
        <button class="fav ${isFav(f.id) ? 'on' : ''}" data-fav="${esc(f.id)}" data-name="${esc(f.name)}" data-flag="${esc(f.flag)}" aria-label="Favorit">${isFav(f.id) ? '★' : '☆'}</button>
      </header>
      <div class="record card">
        <b>${esc(f.record || '–')}</b>
        <span class="muted small">${f.wins} Siege · ${f.losses} Niederlagen · ${f.draws} Unentschieden</span>
      </div>
      <div class="stats card">
        ${stat('Gewichtsklasse', division)}
        ${stat('Gewicht', lbsToKg(f.weight))}
        ${stat('Größe', inToCm(f.height))}
        ${stat('Reichweite', inToCm(f.reach))}
        ${stat('Alter', f.age ? `${f.age} Jahre` : '')}
        ${stat('Geboren', born)}
        ${stat('Kampfstil', f.stance)}
        ${stat('Team', f.team)}
        ${stat('Status', f.status === 'Active' ? 'Aktiv' : f.status)}
      </div>
      ${history ? `<h2 class="seg">Kämpfe in dieser App</h2><div class="card fights">${history}</div>` : ''}`;
  } catch (e) {
    root.innerHTML = `${backLink('#/fighters')}${errorBox(e.message)}`;
  }
}
