// ESPN-Provider (inoffizielle, undokumentierte API). Wandelt die Rohdaten in das
// interne Format um, das die UI verwendet. Ein anderer Provider muss nur
// getEvents({ from, to }) mit demselben Rückgabeformat liefern.
//
// Event:  { id, name, title, subtitle, date, state, venue, location, broadcast, segments, mainEvent }
// Segment: { name, fights: Fight[] }
// Fight:  { id, weightClass, date, state, fighters: Fighter[], result, isMain }
// Fighter: { name, short, flag, record, winner }

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard';

const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');

// Ergebnis steckt in einem Detail wie "Unofficial Winner Decision" / "... Kotko" / "... Submission"
const WINNER_RE = /^(unofficial )?winner\s+/i;

function fixMojibake(s = '') {
  // ESPN liefert vereinzelt UTF-8, das als Latin-1 gelesen wurde (z. B. "ProchÃ¡zka")
  return /Ã./.test(s) ? decodeURIComponent(escape(s)) : s;
}

function fightResult(comp) {
  const st = comp.status?.type;
  if (st?.state !== 'post') return null;
  const hit = (comp.details || []).map((d) => d.type?.text || '').find((t) => WINNER_RE.test(t));
  const raw = hit ? hit.replace(WINNER_RE, '').trim() : '';
  const method = /^kotko$/i.test(raw) ? 'KO/TKO' : raw;
  const round = comp.status.period ? `R${comp.status.period}` : '';
  const time = comp.status.displayClock && comp.status.displayClock !== '-' ? comp.status.displayClock : '';
  return { method, round, time };
}

function normalizeFight(comp, index) {
  const fighters = [...comp.competitors]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((c) => ({
      name: fixMojibake(c.athlete?.displayName || c.athlete?.fullName || '?'),
      short: fixMojibake(c.athlete?.shortName || c.athlete?.displayName || '?'),
      flag: c.athlete?.flag?.href || '',
      record: c.records?.[0]?.summary || '',
      winner: !!c.winner,
    }));
  return {
    id: comp.id,
    index,
    weightClass: comp.type?.abbreviation || '',
    date: comp.date || comp.startDate,
    state: comp.status?.type?.state || 'pre',
    canceled: /cancel|postpone/i.test(comp.status?.type?.name || ''),
    fighters,
    result: fightResult(comp),
    isMain: false,
  };
}

// ESPN liefert keine Card-Segmente. Ableitung: Kämpfe sind von früh nach spät
// sortiert, die letzte Startzeit-Gruppe ist die Main Card. Haben alle Kämpfe
// dieselbe Zeit, zählen die letzten 5 als Main Card.
function buildSegments(fights) {
  if (!fights.length) return [];
  const groups = new Map();
  fights.forEach((f) => {
    if (!groups.has(f.date)) groups.set(f.date, []);
    groups.get(f.date).push(f);
  });
  const lists = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, l]) => l);
  let named;
  if (lists.length >= 3) {
    named = [
      ['Early Prelims', lists.slice(0, -2).flat()],
      ['Prelims', lists[lists.length - 2]],
      ['Main Card', lists[lists.length - 1]],
    ];
  } else if (lists.length === 2) {
    named = [['Prelims', lists[0]], ['Main Card', lists[1]]];
  } else {
    const all = lists[0];
    const cut = Math.max(0, all.length - 5);
    named = [['Prelims', all.slice(0, cut)], ['Main Card', all.slice(cut)]];
  }
  // Anzeige: Main Card zuerst, innerhalb eines Segments Hauptkampf oben
  return named
    .filter(([, l]) => l.length)
    .reverse()
    .map(([name, l]) => ({ name, fights: [...l].reverse() }));
}

function normalizeEvent(ev) {
  const comps = (ev.competitions || []).map(normalizeFight);
  const segments = buildSegments(comps);
  const mainEvent = segments[0]?.fights[0] || null;
  if (mainEvent) mainEvent.isMain = true;
  const [title, ...rest] = fixMojibake(ev.name || '').split(':');
  const v = ev.venues?.[0] || ev.competitions?.[0]?.venue;
  const addr = v?.address || {};
  return {
    id: ev.id,
    name: fixMojibake(ev.name || ''),
    title: title.trim(),
    subtitle: rest.join(':').trim(),
    date: ev.date,
    state: ev.status?.type?.state || 'pre',
    canceled: /cancel|postpone/i.test(ev.status?.type?.name || ''),
    venue: v?.fullName || '',
    location: [addr.city, addr.country].filter(Boolean).join(', '),
    broadcast: ev.competitions?.[0]?.broadcast || '',
    segments,
    mainEvent,
  };
}

export const espnProvider = {
  name: 'espn',
  async getEvents({ from, to }) {
    const res = await fetch(`${BASE}?dates=${ymd(from)}-${ymd(to)}`);
    if (!res.ok) throw new Error(`ESPN antwortete mit ${res.status}`);
    const json = await res.json();
    return (json.events || []).map(normalizeEvent);
  },
};
