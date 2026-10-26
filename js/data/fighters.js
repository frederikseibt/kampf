// Kämpferübersicht und Kämpferprofile.
//
// Die Ranglisten von ESPN sind veraltet (Stand ca. 2021), deshalb wird die Übersicht aus den
// Events abgeleitet: alle Kämpfer, die zuletzt gekämpft haben oder demnächst kämpfen.
//
// Division: { key, de, kg, fighters: [{ id, name, flag, record, next, last }] }
//   next / last: { eventId, eventTitle, date } des nächsten bzw. letzten Kampfs
// Profil:   { id, name, nickname, flag, divisionKey, weight, height, reach, age, born, stance, team, status, record, wins, losses, draws }

import { DIVISIONS } from '../config.js';
import { divisionKeyOf } from '../format.js';
import { cached } from './cache.js';
import { getAllEvents } from './index.js';

const CORE = 'https://sports.core.api.espn.com/v2/sports/mma/athletes/';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN antwortete mit ${res.status}`);
  return res.json();
}

export async function getDivisions() {
  const events = await getAllEvents();
  const byDivision = new Map(Object.keys(DIVISIONS).map((k) => [k, new Map()]));
  for (const ev of events) {
    for (const seg of ev.segments) {
      for (const fight of seg.fights) {
        const people = byDivision.get(divisionKeyOf(fight.weightClass));
        if (!people || fight.canceled) continue;
        for (const f of fight.fighters) {
          const entry = people.get(f.id) || { id: f.id, name: f.name, flag: f.flag, record: f.record, next: null, last: null };
          const ref = { eventId: ev.id, eventTitle: ev.title, date: ev.date };
          if (ev.state === 'post') {
            entry.last = ref; // Events sind aufsteigend sortiert, der letzte Treffer gewinnt
            entry.record = f.record || entry.record;
          } else if (!entry.next) {
            entry.next = ref;
          }
          people.set(f.id, entry);
        }
      }
    }
  }
  return Object.entries(DIVISIONS).map(([key, d]) => {
    const fighters = [...byDivision.get(key).values()].sort((a, b) => {
      if (a.next && b.next) return a.next.date.localeCompare(b.next.date);
      if (a.next || b.next) return a.next ? -1 : 1;
      return (b.last?.date || '').localeCompare(a.last?.date || '');
    });
    return { key, de: d.de, kg: d.kg, fighters };
  }).filter((d) => d.fighters.length);
}

export const getFighter = (id) =>
  cached(`fighter:v1:${id}`, 60 * 24, async () => {
    const [a, rec] = await Promise.all([getJson(CORE + id), getJson(`${CORE}${id}/records`)]);
    const overall = rec.items?.find((i) => i.type === 'total') || rec.items?.[0];
    const stat = (name) => overall?.stats?.find((s) => s.name === name)?.value ?? 0;
    const base = a.weightClass?.text || '';
    return {
      id: a.id,
      name: a.displayName || a.fullName,
      nickname: a.nickname || '',
      flag: a.flag?.href || '',
      country: a.citizenship || '',
      divisionKey: (a.gender === 'FEMALE' ? "Women's " : '') + base,
      weight: a.weight || 0,
      height: a.height || 0,
      reach: a.reach || 0,
      age: a.age || 0,
      born: a.dateOfBirth || '',
      stance: a.stance?.text || '',
      team: a.association?.name || '',
      status: a.status?.name || '',
      record: overall?.summary || '',
      wins: stat('wins'),
      losses: stat('losses'),
      draws: stat('draws'),
    };
  });
