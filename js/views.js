import { getUpcoming, getResults, getEvent } from './data/index.js';
import { esc, dayShort, dayLong, time, relative, resultText } from './format.js';

const flag = (f) => (f.flag ? `<img class="flag" src="${esc(f.flag)}" alt="" loading="lazy" />` : '');

function mainEventLine(ev) {
  const m = ev.mainEvent;
  if (!m) return '';
  if (ev.state === 'post') {
    const w = m.fighters.find((f) => f.winner);
    if (w) return `<span class="win">${esc(w.name)}</span> <span class="muted">${esc(resultText(m.result))}</span>`;
  }
  return m.fighters.map((f) => esc(f.name)).join(' <span class="muted">vs</span> ');
}

function eventCard(ev) {
  const live = ev.state === 'in';
  const rel = live ? '' : relative(ev.date);
  return `
  <article class="card event" data-href="#/event/${esc(ev.id)}" tabindex="0">
    <div class="event-top">
      <span class="chip ${live ? 'chip-live' : ''}">${live ? 'LIVE' : esc(dayShort(ev.date))}</span>
      ${rel ? `<span class="chip chip-accent">${rel}</span>` : ''}
      ${ev.canceled ? '<span class="chip">Abgesagt</span>' : ''}
      <span class="muted time">${ev.state === 'post' ? '' : esc(time(ev.date))}</span>
    </div>
    <h3>${esc(ev.title)}</h3>
    ${ev.subtitle ? `<p class="subtitle">${esc(ev.subtitle)}</p>` : ''}
    <p class="main-line">${mainEventLine(ev)}</p>
    <p class="muted small">${esc([ev.venue, ev.location].filter(Boolean).join(' · '))}</p>
  </article>`;
}

const skeleton = `<div class="card skeleton"></div><div class="card skeleton"></div><div class="card skeleton"></div>`;

const errorBox = (msg) => `
  <div class="card center">
    <p>Daten konnten nicht geladen werden.</p>
    <p class="muted small">${esc(msg)}</p>
    <button class="btn" data-action="reload">Erneut versuchen</button>
  </div>`;

export async function homeView(root, force) {
  root.innerHTML = `<h1 class="page-title">Kommende Events</h1>${skeleton}`;
  try {
    const events = await getUpcoming(force);
    root.innerHTML = `<h1 class="page-title">Kommende Events</h1>` +
      (events.length ? events.map(eventCard).join('') : '<p class="muted center">Keine kommenden Events gefunden.</p>');
  } catch (e) {
    root.innerHTML = `<h1 class="page-title">Kommende Events</h1>${errorBox(e.message)}`;
  }
}

export async function resultsView(root, force) {
  root.innerHTML = `<h1 class="page-title">Ergebnisse</h1>${skeleton}`;
  try {
    const events = await getResults(force);
    root.innerHTML = `<h1 class="page-title">Ergebnisse</h1>` +
      (events.length ? events.map(eventCard).join('') : '<p class="muted center">Noch keine Ergebnisse.</p>');
  } catch (e) {
    root.innerHTML = `<h1 class="page-title">Ergebnisse</h1>${errorBox(e.message)}`;
  }
}

function fighterRow(f, done) {
  const cls = done ? (f.winner ? 'fighter winner' : 'fighter loser') : 'fighter';
  return `<div class="${cls}">${flag(f)}<span class="fname">${esc(f.name)}</span>${f.record ? `<span class="muted small rec">${esc(f.record)}</span>` : ''}${done && f.winner ? '<span class="tick" aria-label="Sieger">✓</span>' : ''}</div>`;
}

function fightRow(fight) {
  const done = fight.state === 'post';
  const [a, b] = fight.fighters;
  return `
  <div class="fight ${fight.isMain ? 'fight-main' : ''}">
    <div class="fight-meta muted small">
      <span>${fight.isMain ? 'Hauptkampf · ' : ''}${esc(fight.weightClass)}</span>
      <span>${done ? esc(resultText(fight.result)) : fight.canceled ? 'Abgesagt' : ''}</span>
    </div>
    ${fighterRow(a, done)}
    ${b ? fighterRow(b, done) : ''}
  </div>`;
}

export async function eventView(root, id) {
  root.innerHTML = `<a class="back" href="#/">‹ Zurück</a>${skeleton}`;
  try {
    const ev = await getEvent(id);
    if (!ev) {
      root.innerHTML = `<a class="back" href="javascript:history.back()">‹ Zurück</a><p class="muted center">Event nicht gefunden.</p>`;
      return;
    }
    const back = ev.state === 'post' ? '#/results' : '#/';
    root.innerHTML = `
      <a class="back" href="${back}">‹ Zurück</a>
      <header class="hero">
        <p class="muted small">${esc(dayLong(ev.date))}${ev.state === 'post' ? '' : ' · ' + esc(time(ev.date))}</p>
        <h1>${esc(ev.title)}</h1>
        ${ev.subtitle ? `<p class="subtitle">${esc(ev.subtitle)}</p>` : ''}
        <p class="muted small">${esc([ev.venue, ev.location].filter(Boolean).join(' · '))}</p>
      </header>
      ${ev.segments.map((s) => `
        <section>
          <h2 class="seg">${esc(s.name)}</h2>
          <div class="card fights">${s.fights.map(fightRow).join('')}</div>
        </section>`).join('') || '<p class="muted center">Fight Card noch nicht veröffentlicht.</p>'}
      <p class="muted small center note">Zeiten in Berlin. Card-Aufteilung aus den Startzeiten abgeleitet.</p>`;
  } catch (e) {
    root.innerHTML = `<a class="back" href="#/">‹ Zurück</a>${errorBox(e.message)}`;
  }
}
