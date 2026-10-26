// Ranglisten und Kämpferprofile (ESPN). Nur diese Datei kennt das ESPN-Format.
//
// Division: { key, de, kg, fighters: [{ id, name, flag, record, rank, champion }] }
// Profil:   { id, name, nickname, flag, divisionKey, weight, height, reach, age, born, stance, team, status, record, wins, losses, draws }

import { DIVISIONS } from '../config.js';
import { cached } from './cache.js';

const RANKINGS = 'https://site.api.espn.com/apis/site/v2/sports/mma/ufc/rankings';
const CORE = 'https://sports.core.api.espn.com/v2/sports/mma/athletes/';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN antwortete mit ${res.status}`);
  return res.json();
}

const toFighter = (r) => ({
  id: r.athlete.id,
  name: r.athlete.displayName,
  flag: r.athlete.flag || '',
  record: r.recordSummary || '',
  rank: r.current,
  champion: false,
});

function normalizeRankings(json) {
  const divisions = new Map();
  const get = (key, de, kg) => {
    if (!divisions.has(key)) divisions.set(key, { key, de, kg, fighters: [] });
    return divisions.get(key);
  };
  for (const r of json.rankings || []) {
    const p4p = /pound for pound/i.test(r.name);
    const women = /^women/i.test(r.name);
    const base = r.name.replace(/ (Division|Pound for Pound).*$/i, '');
    let div;
    if (p4p) div = get(women ? 'P4P-W' : 'P4P-M', women ? 'Pound for Pound · Frauen' : 'Pound for Pound · Männer', null);
    else if (DIVISIONS[base]) div = get(base, DIVISIONS[base].de, DIVISIONS[base].kg);
    else continue;
    const isChamps = /champions/i.test(r.name);
    for (const rank of r.ranks || []) {
      const f = toFighter(rank);
      if (isChamps) {
        f.champion = true;
        f.rank = 0;
        div.fighters = div.fighters.filter((x) => x.id !== f.id);
        div.fighters.unshift(f);
      } else if (!div.fighters.some((x) => x.id === f.id)) {
        div.fighters.push(f);
      }
    }
  }
  const order = ['P4P-M', 'P4P-W', ...Object.keys(DIVISIONS)];
  return order.map((k) => divisions.get(k)).filter(Boolean).map((d) => ({
    ...d,
    fighters: d.fighters.sort((a, b) => a.rank - b.rank),
  }));
}

export const getDivisions = () =>
  cached('divisions:v1', 60, async () => normalizeRankings(await getJson(RANKINGS)));

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
