import { APP, DIVISIONS } from './config.js';

const fmt = (opts) => new Intl.DateTimeFormat(APP.locale, { timeZone: APP.timeZone, ...opts });

const fDay = fmt({ weekday: 'short', day: '2-digit', month: 'short' });
const fLong = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fTime = fmt({ hour: '2-digit', minute: '2-digit' });
const fKey = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' });
const fWd = fmt({ weekday: 'short' });
const fDm = fmt({ day: '2-digit', month: '2-digit' });
const rtf = new Intl.RelativeTimeFormat(APP.locale, { numeric: 'auto' });

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const dayShort = (iso) => fDay.format(new Date(iso));
export const dayLong = (iso) => fLong.format(new Date(iso));
export const time = (iso) => `${fTime.format(new Date(iso))} Uhr`;
export const weekday = (iso) => fWd.format(new Date(iso)).replace('.', '');
export const dayMonth = (iso) => fDm.format(new Date(iso));

export function relative(iso) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.round((new Date(fKey.format(new Date(iso))) - new Date(fKey.format(new Date()))) / 86400000);
  if (diff < 0) return '';
  if (days === 0) return 'Heute';
  if (days === 1) return 'Morgen';
  if (days < 14) return `in ${days} Tagen`;
  return '';
}

export function ago(iso) {
  const sec = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(sec);
  if (abs < 3600) return rtf.format(Math.round(sec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(sec / 86400), 'day');
  return fDay.format(new Date(iso));
}

export function resultText(r) {
  if (!r) return '';
  return [r.method, [r.round, r.time].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
}

// "W Strawweight" / "Lightweight" -> Schlüssel in DIVISIONS ("Women's Strawweight"), sonst null
export function divisionKeyOf(abbr = '') {
  const women = /^W\s/.test(abbr);
  const base = abbr.replace(/^W\s/, '').replace(/^Women's\s/, '');
  const key = (women ? "Women's " : '') + base;
  return DIVISIONS[key] ? key : null;
}

// "W Strawweight" / "Lightweight" -> "Frauen-Strohgewicht · bis 52 kg"
export function weightLabel(abbr = '') {
  const d = DIVISIONS[divisionKeyOf(abbr)];
  return d ? `${d.de} · bis ${d.kg} kg` : abbr;
}

export const lbsToKg = (lbs) => (lbs ? `${(lbs * 0.45359).toLocaleString(APP.locale, { maximumFractionDigits: 1 })} kg` : '–');
export const inToCm = (inch) => (inch ? `${Math.round(inch * 2.54)} cm` : '–');

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
