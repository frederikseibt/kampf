// News aus RSS-Feeds. Zeigt nur Titel, Teaser, Bild und Quelle; Klick öffnet den Originalartikel.
// Item: { title, teaser, image, link, date, source }

import { NEWS } from '../config.js';
import { cached } from './cache.js';

const text = (el, sel) => el.querySelector(sel)?.textContent?.trim() || '';

function stripHtml(s) {
  const d = new DOMParser().parseFromString(s, 'text/html');
  return (d.body.textContent || '').replace(/\s+/g, ' ').trim();
}

function parseDate(s) {
  // "Mon, 26 Oct 2026 08:49:04 EST" -> Safari/Chrome vertragen Zeitzonen-Kürzel nicht immer
  const fixed = s.replace(/\bEST\b/, '-0500').replace(/\bEDT\b/, '-0400').replace(/\bPST\b/, '-0800').replace(/\bPDT\b/, '-0700');
  const t = Date.parse(fixed);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

function parseFeed(xml, source) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  return [...doc.querySelectorAll('item')].map((it) => {
    const media = it.getElementsByTagNameNS('*', 'thumbnail')[0] || it.getElementsByTagNameNS('*', 'content')[0] || it.querySelector('enclosure');
    const raw = text(it, 'description') || text(it, 'summary');
    const teaser = stripHtml(raw);
    return {
      title: stripHtml(text(it, 'title')),
      teaser: teaser.length > 160 ? `${teaser.slice(0, 157).trimEnd()}…` : teaser,
      image: media?.getAttribute('url') || '',
      link: text(it, 'link'),
      date: parseDate(text(it, 'pubDate')),
      source,
    };
  }).filter((i) => i.title && i.link);
}

async function loadFeed(feed) {
  const url = feed.needsProxy ? `${NEWS.proxy}?url=${encodeURIComponent(feed.url)}` : feed.url;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${feed.name}: ${res.status}`);
  return parseFeed(await res.text(), feed.name);
}

// Liefert { items, skipped: [Namen der Quellen, die noch nicht laufen], failed: [...] }
export async function getNews() {
  const active = NEWS.feeds.filter((f) => !f.needsProxy || NEWS.proxy);
  const skipped = NEWS.feeds.filter((f) => !active.includes(f)).map((f) => f.name);
  const failed = [];
  const lists = await Promise.all(
    active.map((f) =>
      cached(`news:v1:${f.id}`, NEWS.cacheMinutes, () => loadFeed(f)).catch(() => {
        failed.push(f.name);
        return [];
      })
    )
  );
  const items = lists.flat().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 50);
  return { items, skipped, failed };
}
