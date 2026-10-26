// Service Worker: App-Shell offline, Daten network-first. Bei Änderungen an
// Dateien VERSION erhöhen, damit alte Caches verschwinden.
const VERSION = 'v5';
const SHELL = `shell-${VERSION}`;
const DATA = `data-${VERSION}`;

const SHELL_FILES = [
  './', './index.html', './manifest.json', './css/app.css',
  './js/main.js', './js/views.js', './js/views-fighters.js', './js/views-news.js', './js/views-me.js',
  './js/format.js', './js/config.js', './js/store.js', './js/ui.js',
  './js/data/index.js', './js/data/espn.js', './js/data/fighters.js', './js/data/news.js', './js/data/cache.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, DATA].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    // Shell: Cache zuerst, im Hintergrund aktualisieren
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then((hit) => {
        const net = fetch(req).then((res) => {
          if (res.ok) caches.open(SHELL).then((c) => c.put(req, res.clone()));
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  if (url.hostname.endsWith('espn.com')) {
    // Daten: Netz zuerst, offline der letzte Stand
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) caches.open(DATA).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
