import { eventsView, eventView } from './views.js';
import { fightersView, fighterView } from './views-fighters.js';
import { newsView } from './views-news.js';
import { meView } from './views-me.js';
import { toggleFav, setNotify } from './store.js';

const root = document.getElementById('app');
const tabs = document.querySelectorAll('.tabbar a');

let current = '';
let eventsScrollY = 0;

function route(force = false) {
  const [, page = '', arg = ''] = (location.hash || '#/').split('/');
  const param = decodeURIComponent(arg);
  const previous = current;
  if (previous === 'events') eventsScrollY = window.scrollY;

  let tab = 'events';
  let scrollTop = true;
  switch (page) {
    case 'news':
      tab = 'news';
      newsView(root);
      break;
    case 'fighters':
      tab = 'fighters';
      fightersView(root, param);
      break;
    case 'fighter':
      tab = 'fighters';
      fighterView(root, param);
      break;
    case 'me':
      tab = 'me';
      meView(root);
      break;
    case 'event':
      eventView(root, param);
      break;
    default: {
      // Von einem Detail zurück in die Liste: alte Position behalten, sonst zum aktuellen Tag
      const back = previous === 'event' || previous === 'fighter';
      eventsView(root, back ? eventsScrollY : 0);
      scrollTop = false;
    }
  }
  current = page === 'event' || page === 'fighter' ? page : tab;
  tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  if (scrollTop) window.scrollTo(0, 0);
}

window.addEventListener('hashchange', () => route());

root.addEventListener('click', (e) => {
  const back = e.target.closest('[data-action="back"]');
  if (back) {
    e.preventDefault();
    if (history.length > 1) history.back();
    else location.hash = back.getAttribute('href');
    return;
  }
  if (e.target.closest('[data-action="reload"]')) return route(true);

  const fav = e.target.closest('[data-fav]');
  if (fav) {
    const on = toggleFav({ id: fav.dataset.fav, name: fav.dataset.name, flag: fav.dataset.flag });
    if (fav.dataset.rerender === 'me') return meView(root);
    fav.classList.toggle('on', on);
    fav.textContent = on ? '★' : '☆';
    return;
  }

  const jump = e.target.closest('[data-jump]');
  if (jump) {
    const id = jump.dataset.jump;
    const el = id === 'today' ? root.querySelector('#today') : root.querySelector(`.event[data-id="${CSS.escape(id)}"]`);
    el?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    return;
  }

  if (e.target.closest('a')) return;
  const card = e.target.closest('[data-href]');
  if (card) location.hash = card.dataset.href;
});

root.addEventListener('change', (e) => {
  const n = e.target.closest('[data-notify]');
  if (n) setNotify(n.dataset.notify, n.checked);
});

root.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.dataset.href) location.hash = e.target.dataset.href;
});

route();

if ('serviceWorker' in navigator) {
  // Neue App-Version erkannt: einmal neu laden, damit sofort der aktuelle Stand zu sehen ist
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
