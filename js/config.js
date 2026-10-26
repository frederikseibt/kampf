// Zentrale Konfiguration. Hier anpassen, ohne den restlichen Code anzufassen.

export const APP = {
  timeZone: 'Europe/Berlin',
  locale: 'de-DE',
  // Zeitfenster, das die Datenschicht auf einmal lädt (Tage relativ zu heute)
  daysBack: 90,
  daysAhead: 180,
  // Cache-Dauer für Listen im Browser (Minuten)
  cacheMinutes: 10,
  // Dana White's Contender Series ausblenden?
  hideContenderSeries: true,
};

// Gewichtsklassen auf Deutsch mit Limit in kg (offizielle Limits, gerundet)
export const DIVISIONS = {
  'Heavyweight': { de: 'Schwergewicht', kg: 120 },
  'Light Heavyweight': { de: 'Halbschwergewicht', kg: 93 },
  'Middleweight': { de: 'Mittelgewicht', kg: 84 },
  'Welterweight': { de: 'Weltergewicht', kg: 77 },
  'Lightweight': { de: 'Leichtgewicht', kg: 70 },
  'Featherweight': { de: 'Federgewicht', kg: 66 },
  'Bantamweight': { de: 'Bantamgewicht', kg: 61 },
  'Flyweight': { de: 'Fliegengewicht', kg: 57 },
  "Women's Bantamweight": { de: 'Frauen-Bantamgewicht', kg: 61 },
  "Women's Flyweight": { de: 'Frauen-Fliegengewicht', kg: 57 },
  "Women's Strawweight": { de: 'Frauen-Strohgewicht', kg: 52 },
};

// News-Quellen. "needsProxy": Die Quelle erlaubt keinen direkten Browser-Zugriff
// und läuft erst, wenn hier unter `proxy` die Adresse des Cloudflare Workers steht.
export const NEWS = {
  proxy: '', // z. B. 'https://mma-proxy.dein-name.workers.dev'
  cacheMinutes: 15,
  feeds: [
    { id: 'espn', name: 'ESPN MMA', url: 'https://www.espn.com/espn/rss/mma/news', needsProxy: false },
    { id: 'mmafighting', name: 'MMA Fighting', url: 'https://www.mmafighting.com/rss/current.xml', needsProxy: true },
    { id: 'mmajunkie', name: 'MMA Junkie', url: 'https://mmajunkie.usatoday.com/feed', needsProxy: true },
  ],
};
