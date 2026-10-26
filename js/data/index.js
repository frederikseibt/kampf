// Datenschicht: die UI spricht nur mit diesen Funktionen.
// Quelle tauschen = hier den Provider ändern (z. B. später Cloudflare Worker).

import { APP } from '../config.js';
import { espnProvider } from './espn.js';

const provider = espnProvider;
const CACHE_KEY = `events:${provider.name}:v2`;

let memory = null;

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
}

function writeCache(events) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), events }));
  } catch {
    /* Speicher voll oder gesperrt: egal */
  }
}

async function load(force = false) {
  if (memory && !force) return memory;
  const cached = readCache();
  const fresh = cached && Date.now() - cached.at < APP.cacheMinutes * 60000;
  if (fresh && !force) return (memory = cached.events);

  const day = 86400000;
  const now = Date.now();
  try {
    let events = await provider.getEvents({
      from: new Date(now - APP.daysBack * day),
      to: new Date(now + APP.daysAhead * day),
    });
    if (APP.hideContenderSeries) events = events.filter((e) => !/contender series/i.test(e.name));
    writeCache(events);
    return (memory = events);
  } catch (err) {
    // Offline oder Quelle down: letzten bekannten Stand zeigen, falls vorhanden
    if (cached) return (memory = cached.events);
    throw err;
  }
}

export async function getUpcoming(force) {
  const all = await load(force);
  return all.filter((e) => e.state !== 'post').sort((a, b) => a.date.localeCompare(b.date));
}

export async function getResults(force) {
  const all = await load(force);
  return all.filter((e) => e.state === 'post').sort((a, b) => b.date.localeCompare(a.date));
}

export async function getEvent(id) {
  const all = await load();
  return all.find((e) => e.id === id) || null;
}
