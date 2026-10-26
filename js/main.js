import { homeView, resultsView, eventView } from './views.js';

const root = document.getElementById('app');
const tabs = document.querySelectorAll('.tabbar a');

function route(force = false) {
  const hash = location.hash || '#/';
  const [, page, id] = hash.split('/');
  let active = 'home';
  if (page === 'results') {
    active = 'results';
    resultsView(root, force);
  } else if (page === 'event' && id) {
    eventView(root, decodeURIComponent(id));
  } else {
    homeView(root, force);
  }
  tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === active));
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', () => route());

root.addEventListener('click', (e) => {
  if (e.target.closest('[data-action="reload"]')) return route(true);
  if (e.target.closest('a')) return;
  const card = e.target.closest('[data-href]');
  if (card) location.hash = card.dataset.href;
});
root.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.dataset.href) location.hash = e.target.dataset.href;
});

route();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
