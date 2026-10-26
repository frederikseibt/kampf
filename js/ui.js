import { esc, initials } from './format.js';

export const skeleton = '<div class="card skeleton"></div><div class="card skeleton"></div><div class="card skeleton"></div>';

export const errorBox = (msg) => `
  <div class="card center">
    <p>Daten konnten nicht geladen werden.</p>
    <p class="muted small">${esc(msg)}</p>
    <button class="btn" data-action="reload">Erneut versuchen</button>
  </div>`;

export const backLink = (fallback) => `<a class="back" href="${fallback}" data-action="back">‹ Zurück</a>`;

export const flagImg = (src) => (src ? `<img class="flag" src="${esc(src)}" alt="" loading="lazy" />` : '');

// Kämpfername als Link zum Profil
export const fighterLink = (f) =>
  f.id ? `<a class="flink" href="#/fighter/${esc(f.id)}">${esc(f.name)}</a>` : esc(f.name);

export const avatar = (name) => `<span class="avatar" aria-hidden="true">${esc(initials(name))}</span>`;
