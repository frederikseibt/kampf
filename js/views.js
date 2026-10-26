import { getAllEvents, getEvent } from './data/index.js';
import { esc, dayShort, dayLong, time, relative, resultText, weightLabel, weekday, dayMonth } from './format.js';
import { skeleton, errorBox, backLink, flagImg, fighterLink } from './ui.js';
import { isFav } from './store.js';

function mainEventLine(ev) {
  const m = ev.mainEvent;
  if (!m) return '';
  if (ev.state === 'post') {
    const w = m.fighters.find((f) => f.winner);
    if (w) return `<span class="win">${fighterLink(w)}</span> <span class="muted">${esc(resultText(m.result))}</span>`;
  }
  return m.fighters.map(fighterLink).join(' <span class="muted">vs</span> ');
}

const hasFavorite = (ev) => ev.segments.some((s) => s.fights.some((f) => f.fighters.some((x) => isFav(x.id))));

function eventCard(ev) {
  const live = ev.state === 'in';
  const rel = live ? '' : relative(ev.date);
  return `
  <article class="card event ${ev.state === 'post' ? 'past' : ''}" data-id="${esc(ev.id)}" data-href="#/event/${esc(ev.id)}" tabindex="0">
    <div class="event-top">
      <span class="chip ${live ? 'chip-live' : ''}">${live ? 'LIVE' : esc(dayShort(ev.date))}</span>
      ${rel ? `<span class="chip chip-accent">${rel}</span>` : ''}
      ${hasFavorite(ev) ? '<span class="chip chip-fav">★ Favorit</span>' : ''}
      ${ev.canceled ? '<span class="chip">Abgesagt</span>' : ''}
      <span class="muted time">${ev.state === 'post' ? '' : esc(time(ev.date))}</span>
    </div>
    <h3>${esc(ev.title)}</h3>
    ${ev.subtitle ? `<p class="subtitle">${esc(ev.subtitle)}</p>` : ''}
    <p class="main-line">${mainEventLine(ev)}</p>
    <p class="muted small">${esc([ev.venue, ev.location].filter(Boolean).join(' · '))}</p>
  </article>`;
}

// Eine Liste für alles: Vergangenes oben, ab "Aktuell" kommende Events. Oben eine Datumsleiste.
// restoreY: Scrollposition, falls man vom Detail zurückkommt; sonst Sprung zum nächsten Event.
export async function eventsView(root, restoreY) {
  root.innerHTML = `<h1 class="page-title">Events</h1>${skeleton}`;
  try {
    const events = await getAllEvents();
    const firstUp = events.findIndex((e) => e.state !== 'post');
    const chips = events.map((e, i) => `
      <button class="day ${e.state === 'post' ? 'day-past' : ''}" data-jump="${esc(e.id)}">
        <span>${esc(weekday(e.date))}</span><b>${esc(dayMonth(e.date))}</b>
      </button>`).join('');
    const list = events.map((e, i) => (i === firstUp ? `<div class="today-marker" id="today">Aktuell &amp; kommend</div>` : '') + eventCard(e)).join('');
    root.innerHTML = `
      <nav class="strip" aria-label="Datum wählen">
        <button class="day day-today" data-jump="today"><span>Zum</span><b>Heute</b></button>
        <div class="strip-days">${chips}</div>
      </nav>
      <h1 class="page-title">Events</h1>
      ${events.length ? list : '<p class="muted center">Keine Events gefunden.</p>'}`;

    const target = firstUp >= 0 ? root.querySelector('#today') : null;
    if (restoreY) window.scrollTo(0, restoreY);
    else if (target) target.scrollIntoView({ block: 'start' });

    // aktives Datum in der Leiste mitführen
    const strip = root.querySelector('.strip-days');
    const cards = [...root.querySelectorAll('.event')];
    let activeId = null;
    let waiting = false;
    const update = () => {
      waiting = false;
      if (!root.contains(strip)) return window.removeEventListener('scroll', onScroll);
      // aktiv ist das letzte Event, dessen Oberkante schon unter der Leiste angekommen ist
      const line = 150;
      const current = [...cards].reverse().find((c) => c.getBoundingClientRect().top <= line) || cards[0];
      if (!current || current.dataset.id === activeId) return;
      activeId = current.dataset.id;
      root.querySelectorAll('.day.active').forEach((d) => d.classList.remove('active'));
      const chip = root.querySelector(`.day[data-jump="${activeId}"]`);
      if (chip) {
        chip.classList.add('active');
        strip.scrollTo({ left: chip.offsetLeft - strip.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' });
      }
    };
    function onScroll() {
      if (!waiting) {
        waiting = true;
        requestAnimationFrame(update);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  } catch (e) {
    root.innerHTML = `<h1 class="page-title">Events</h1>${errorBox(e.message)}`;
  }
}

function fighterRow(f, done) {
  const cls = done ? (f.winner ? 'fighter winner' : 'fighter loser') : 'fighter';
  return `<div class="${cls}">${flagImg(f.flag)}<span class="fname">${fighterLink(f)}</span>${isFav(f.id) ? '<span class="star">★</span>' : ''}${f.record ? `<span class="muted small rec">${esc(f.record)}</span>` : ''}${done && f.winner ? '<span class="tick" aria-label="Sieger">✓</span>' : ''}</div>`;
}

function fightRow(fight) {
  const done = fight.state === 'post';
  const [a, b] = fight.fighters;
  return `
  <div class="fight ${fight.isMain ? 'fight-main' : ''}">
    <div class="fight-meta muted small">
      <span>${fight.isMain ? 'Hauptkampf · ' : ''}${esc(weightLabel(fight.weightClass))}</span>
      <span>${done ? esc(resultText(fight.result)) : fight.canceled ? 'Abgesagt' : ''}</span>
    </div>
    ${fighterRow(a, done)}
    ${b ? fighterRow(b, done) : ''}
  </div>`;
}

export async function eventView(root, id) {
  root.innerHTML = `${backLink('#/')}${skeleton}`;
  try {
    const ev = await getEvent(id);
    if (!ev) {
      root.innerHTML = `${backLink('#/')}<p class="muted center">Event nicht gefunden.</p>`;
      return;
    }
    root.innerHTML = `
      ${backLink('#/')}
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
    root.innerHTML = `${backLink('#/')}${errorBox(e.message)}`;
  }
}
