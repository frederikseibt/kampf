import { APP, STREAMING } from './config.js';

const fmt = (opts) => new Intl.DateTimeFormat(APP.locale, { timeZone: APP.timeZone, ...opts });

const fDay = fmt({ weekday: 'short', day: '2-digit', month: 'short' });
const fLong = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fTime = fmt({ hour: '2-digit', minute: '2-digit' });
const fKey = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' });

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const dayShort = (iso) => fDay.format(new Date(iso));
export const dayLong = (iso) => fLong.format(new Date(iso));
export const time = (iso) => `${fTime.format(new Date(iso))} Uhr`;

export function relative(iso) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.round((new Date(fKey.format(new Date(iso))) - new Date(fKey.format(new Date()))) / 86400000);
  if (diff < 0) return '';
  if (days === 0) return 'Heute';
  if (days === 1) return 'Morgen';
  if (days < 14) return `in ${days} Tagen`;
  return '';
}

export function watchLink(eventId) {
  const key = STREAMING.perEvent[eventId] || STREAMING.default;
  return STREAMING.providers[key] || Object.values(STREAMING.providers)[0];
}

export function resultText(r) {
  if (!r) return '';
  return [r.method, [r.round, r.time].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
}
