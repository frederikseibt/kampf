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

// Offizielle Streaming-Anbieter. Nur Links auf die Websites der Anbieter,
// keine inoffiziellen Streams. Bitte prüfen, wer die Rechte in deinem Land hat.
export const STREAMING = {
  // Anbieter, der standardmäßig auf dem Button "Jetzt schauen" landet
  default: 'dazn',
  providers: {
    dazn: {
      label: 'DAZN',
      url: 'https://www.dazn.com/de-DE/home',
    },
    paramount: {
      label: 'Paramount+',
      url: 'https://www.paramountplus.com/',
    },
  },
  // Optional: Überschreibung pro Event-ID, z. B. { '600061420': 'paramount' }
  perEvent: {},
};
