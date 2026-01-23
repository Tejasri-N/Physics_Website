// merge-links-from-html.js
// Place AFTER your search scripts so it can merge into your running search instance.
(function(){
  const LINKS_PAGE = '/Physics_Website/links.html';
  const LOCAL_CACHE_KEY = 'siteSearchIndex'; // change if your site uses another key

  // parse an HTML string and extract link items (matches links.html structure)
  function parseLinksHtml(text) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const items = [];
    const blocks = doc.querySelectorAll('.links-item');
    blocks.forEach((block, sidx) => {
      const secEl = block.querySelector('.links-header .col-name');
      const section = secEl ? secEl.textContent.trim() : ('links-section-' + sidx);
      const rows = block.querySelectorAll('table.links-table tbody tr');
      rows.forEach((tr, ridx) => {
        const tds = tr.querySelectorAll('td');
        const title = (tds[1] && tds[1].textContent || '').trim();
        let url = '';
        if (tds[2]) {
          const a = tds[2].querySelector('a');
          url = a ? (a.getAttribute('href') || a.href) : tds[2].textContent.trim();
        }
        const desc = (tds[0] && tds[0].textContent || '').trim();
        if (!title && !url) return;
const ACRONYM_MAP = {
  cpda: 'career professional development allowance',
  erp: 'enterprise resource planning',
  noc: 'no objection certificate',
  hr: 'human resources',
  ta: 'travel allowance',
  da: 'dearness allowance'
};

const expanded = [];
Object.keys(ACRONYM_MAP).forEach(k => {
  if (title && title.toLowerCase().includes(k)) {
    expanded.push(ACRONYM_MAP[k]);
  }
});

const keywords = [
  title,
  section,
  desc,
  url,
  title && title.toLowerCase(),
  ...expanded            // 🔥 THIS is the key
].filter(Boolean).join(' ');


items.push({
  id: `link-${sidx}-${ridx}`,
  title: title || url,
  url: url || '',
  section: section,
  description: desc,
  content: keywords,   // 🔥 THIS is what search actually matches
  source: 'links'
});

        
      });
    });
    return items;
  }

  // If the current page already contains .links-item elements, parse DOM directly
  function parseLinksFromDOM() {
    const items = [];
    const blocks = document.querySelectorAll('.links-item');
    if (!blocks || !blocks.length) return null;
    blocks.forEach((block, sidx) => {
      const secEl = block.querySelector('.links-header .col-name');
      const section = secEl ? secEl.textContent.trim() : ('links-section-' + sidx);
      const rows = block.querySelectorAll('table.links-table tbody tr');
      rows.forEach((tr, ridx) => {
        const tds = tr.querySelectorAll('td');
        const title = (tds[1] && tds[1].textContent || '').trim();
        let url = '';
        if (tds[2]) {
          const a = tds[2].querySelector('a');
          url = a ? (a.getAttribute('href') || a.href) : tds[2].textContent.trim();
        }
        const desc = (tds[0] && tds[0].textContent || '').trim();
        if (!title && !url) return;
      const ACRONYM_MAP = {
  cpda: 'career professional development allowance',
  erp: 'enterprise resource planning',
  noc: 'no objection certificate',
  hr: 'human resources',
  ta: 'travel allowance',
  da: 'dearness allowance'
};

const expanded = [];
Object.keys(ACRONYM_MAP).forEach(k => {
  if (title && title.toLowerCase().includes(k)) {
    expanded.push(ACRONYM_MAP[k]);
  }
});

const keywords = [
  title,
  section,
  desc,
  url,
  title && title.toLowerCase(),
  ...expanded
].filter(Boolean).join(' ');

items.push({
  id: `link-${sidx}-${ridx}`,
  title: title || url,
  url: url || '',
  section: section,
  description: desc,
  content: keywords,   // 🔥 REQUIRED FOR SEARCH
  source: 'links'
});

      });
    });
    return items;
  }

  // merge helpers (try worker, fuse, then localStorage)
  function tryMergeIntoWorker(links) {
    if (window.worker && window.worker.postMessage) {
      try {
        window.worker.postMessage({ type: 'ADD_DOCS', items: links });
        console.log('[links-html merge] posted ADD_DOCS to worker (if supported)');
        return true;
      } catch (e) { console.warn('[links-html merge] worker post failed', e); }
    }
    return false;
  }

  function tryMergeIntoFuse(links) {
    // guess common global fuse instances
    const possible = ['fuse','_fuse','siteFuse','searchFuse','windowFuse'];
    for (const name of possible) {
      const inst = window[name];
      if (inst && typeof inst.add === 'function') {
        try { links.forEach(l=>inst.add(l)); console.log('[links-html merge] added to Fuse instance', name); return true; } catch(e){ console.warn('fuse.add failed', e); }
      }
    }
    // try developer-maintained arrays + builder hooks
    if (Array.isArray(window._siteIndexItems) && typeof window.buildFuseFromItems === 'function') {
      try { window._siteIndexItems = window._siteIndexItems.concat(links); window.buildFuseFromItems(window._siteIndexItems); console.log('[links-html merge] rebuilt fuse from _siteIndexItems'); return true; } catch(e){ console.warn('rebuild failed', e); }
    }
    return false;
  }

  function mergeIntoLocalStorage(links) {
    try {
      const existing = localStorage.getItem(LOCAL_CACHE_KEY);
      let arr = [];
      if (existing) {
        try { arr = JSON.parse(existing); } catch(e){ arr = []; }
      }
      arr = arr.filter(i => !(i && i.source === 'links'));
      arr = arr.concat(links);
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(arr));
      console.log('[links-html merge] merged links into localStorage key', LOCAL_CACHE_KEY);
      return true;
    } catch(e) { console.warn('[links-html merge] localStorage merge failed', e); return false; }
  }

  // main init: try DOM first, otherwise fetch links.html
  async function init() {
    try {
      let items = parseLinksFromDOM();
      if (!items || items.length === 0) {
        // fetch links.html and parse
        try {
          const res = await fetch(LINKS_PAGE, { credentials: 'same-origin', cache: 'no-store' });
          if (!res.ok) { console.warn('[links-html merge] fetch failed', res.status); return; }
          const text = await res.text();
          items = parseLinksHtml(text);
        } catch(e) {
          console.warn('[links-html merge] fetch error', e);
          return;
        }
      }
      if (!items || items.length === 0) { console.log('[links-html merge] no items found'); return; }
      console.log('[links-html merge] found items:', items.length);

      // attempt worker -> fuse -> localStorage
      if (tryMergeIntoWorker(items)) return;
      if (tryMergeIntoFuse(items)) return;
      if (mergeIntoLocalStorage(items)) {
        if (typeof window.ensureIndexBuilt === 'function') {
          try { await window.ensureIndexBuilt(); console.log('[links-html merge] re-ran ensureIndexBuilt'); } catch(e){ console.warn(e); }
        }
        return;
      }

      // fallback: attach to window for manual use
      window._externalLinkDocs = items;
      console.log('[links-html merge] fallback: saved to window._externalLinkDocs');
    } catch(e) {
      console.warn('[links-html merge] unexpected error', e);
    }
  }

  // run after a short delay (let search init first)
  setTimeout(init, 120);
})();
