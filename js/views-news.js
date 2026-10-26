import { getNews } from './data/news.js';
import { esc, ago } from './format.js';
import { skeleton, errorBox } from './ui.js';

export async function newsView(root) {
  root.innerHTML = `<h1 class="page-title">News</h1>${skeleton}`;
  try {
    const { items, skipped, failed } = await getNews();
    const cards = items.map((n) => `
      <a class="card news" href="${esc(n.link)}" target="_blank" rel="noopener">
        ${n.image ? `<img class="news-img" src="${esc(n.image)}" alt="" loading="lazy" />` : ''}
        <div class="news-body">
          <p class="muted small"><b class="src">${esc(n.source)}</b>${n.date ? ' · ' + esc(ago(n.date)) : ''}</p>
          <h3>${esc(n.title)}</h3>
          ${n.teaser ? `<p class="muted teaser">${esc(n.teaser)}</p>` : ''}
        </div>
      </a>`).join('');
    const notes = [
      skipped.length ? `${skipped.join(' und ')} kommen, sobald der Cloudflare-Server eingerichtet ist.` : '',
      failed.length ? `${failed.join(', ')} konnte gerade nicht geladen werden.` : '',
    ].filter(Boolean).map((t) => `<p class="muted small center note">${esc(t)}</p>`).join('');
    root.innerHTML = `<h1 class="page-title">News</h1>${cards || '<p class="muted center">Keine News gefunden.</p>'}${notes}`;
  } catch (e) {
    root.innerHTML = `<h1 class="page-title">News</h1>${errorBox(e.message)}`;
  }
}
