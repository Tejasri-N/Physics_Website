// js/search.js
(function () {
  // ---------- safety ----------
  function log() { try { console.log.apply(console, ['[search]'].concat([].slice.call(arguments))); } catch (e) {} }
  function onError(e) {
    try {
      console.error('[search:error]', e);
      var s = document.getElementById('search-status');
      if (s) s.textContent = 'Search unavailable: ' + (e && e.message ? e.message : e);
    } catch (_) {}
  }

  // ---------- Fuse shim ----------
  var FuseCtor = (typeof window !== 'undefined' && window.Fuse) ? window.Fuse : function(items, opts){
    this._items = Array.isArray(items) ? items : [];
    this._keys = (opts && opts.keys ? opts.keys.map(k=>k.name||k) : ['title_lc','content','tags']);
    this.search = function(q){
      var qq = (q||'').toLowerCase();
      var out = [];
      for (var i=0;i<this._items.length;i++){
        var it = this._items[i];
        var hay = '';
        for (var j=0;j<this._keys.length;j++){
          var key = this._keys[j];
          var v = (it[key] != null ? (Array.isArray(it[key])? it[key].join(' '): String(it[key])) : '');
          hay += ' ' + v;
        }
        if (hay.toLowerCase().indexOf(qq) !== -1){
          out.push({ item: it, score: 0.5 });
        }
      }
      return out;
    };
  };

  // ---------- DOM refs ----------
  const form    = document.getElementById('site-search');
  const input   = document.getElementById('search-input');
  const suggest = document.getElementById('search-suggest');

  const isResultsPage = /\/?search\.html$/i.test(location.pathname);
  const outEl    = document.getElementById('srch-out');
  const qEl      = document.getElementById('srch-q');
  const statusEl = document.getElementById('search-status'); // only on search.html

  // ---------- state ----------
  let fuse = null, indexData = null;

  // ---------- helpers ----------
  const cleanText = s => (s || '').replace(/\s+/g, ' ').trim();
  const getText   = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
  const norm = (s) => (s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const slug = s => norm(s).replace(/&/g, ' and ').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
  const debounce = (fn, ms=150) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };
  function nameTokens(name) { const lower = norm(name); const parts = lower.split(/[^a-z0-9]+/).filter(Boolean); return Array.from(new Set([lower, ...parts])); }

  // allow single-word proper names (≥3 chars) — ensures “Chengappa”/“Guhan” work
  function isNameish(s, { allowSingle = true } = {}) {
    if (!s) return false;
    const txt = cleanText(s);
    if (!txt) return false;

    // Multi-word TitleCase-like heuristic
    const parts = txt.replace(/[(),;:\/\-]+/g, ' ').split(/\s+/).filter(Boolean);
    const capish = parts.filter(w => /^[A-Z][A-Za-z.\-']+$/.test(w));
    if (capish.length >= 2 && capish.length <= 4) return true;

    // Single-token names (any case), min length 3, letters with optional . - '
    if (allowSingle && parts.length === 1) {
      const w = parts[0];
      const STOP = new Set(['and','or','of','in','to','for','with','by','at','on','a','an','the','dept','staff','student','faculty']);
      if (STOP.has(w.toLowerCase())) return false;
      if (!/^[A-Za-z][A-Za-z.\-']{2,}$/.test(w)) return false;
      return true;
    }
    return false;
  }

  function textAfter(el, limit=200) {
    let p = el && el.nextElementSibling;
    while (p && !/^(p|div|section|article)$/i.test(p.tagName)) p = p.nextElementSibling;
    const t = (p ? p.textContent : (el ? el.textContent : '')) || '';
    return t.replace(/\s+/g,' ').trim().slice(0, limit);
  }

  // Never mutate IDs. Prefer existing #id or Text Fragment.
  function anchorForElement(el, fallbackText, { prefix='sec' } = {}) {
    const existed = !!(el && el.id);
    if (existed) return { urlFrag: '#' + el.id, hasAnchor: true };
    const txt = (fallbackText || (el && el.textContent) || '').trim();
    if (txt.length >= 3) {
      const frag = '#:~:text=' + encodeURIComponent(txt.slice(0, 120));
      return { urlFrag: frag, hasAnchor: true };
    }
    return { urlFrag: '', hasAnchor: false };
  }

  function esc(s){
    return (s || '').replace(/[&<>"']/g, m => ({
      '&'  : '&amp;',
      '<'  : '&lt;',
      '>'  : '&gt;',
      '"'  : '&quot;',
      "'"  : '&#39;'
    })[m]);
  }

  function highlight(text, q){
    if (!text) return '';
    if (!q) return esc(text);
    const words = q.trim().split(/\s+/).filter(Boolean).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!words.length) return esc(text);
    const re = new RegExp('(' + words.join('|') + ')', 'ig');
    return esc(text).replace(re, '<mark>$1</mark>');
  }

  function normalizeUrl(u) {
    try {
      const a = new URL(u, location.origin); // keep only same-site
      if (a.origin !== location.origin) return null;
      const path = (a.pathname + (a.search || '')).replace(/^\/+/, '');
      return path.replace(/#.*$/, '');
    } catch { return null; }
  }

  function isIndexablePath(path) {
    if (!path) return false;
    if (!/\.html?($|\?)/i.test(path)) return false;
    if (/(^|\/)(assets?|static|img|images|css|js|fonts?)\//i.test(path)) return false;
    if (/^mailto:|^tel:/i.test(path)) return false;
    return true;
  }

  // ---------- extractors ----------
  function extractGeneric(doc, url) {
    const pageUrl = url.replace(/^\/+/, '');
    const rawTitle = getText(doc.querySelector('title')) || pageUrl;
    const title    = rawTitle.replace(/\s*\|\s*.*$/, '');
    const title_lc = norm(title);

    const metaDesc = getText(doc.querySelector('meta[name="description"]'));
    const h1       = getText(doc.querySelector('h1'));
    const firstP   = getText(doc.querySelector('main p, .page-container p, p'));
    const baseSnippet  = (metaDesc || firstP || h1 || title).slice(0, 180);
    const baseContent  = norm(((metaDesc||'')+' '+(h1||'')+' '+(firstP||'')+' '+(getText(doc.querySelector('main'))||getText(doc.body))).slice(0, 1200));

    const entries = [];
    // page-level
    entries.push({
      title, url: pageUrl, snippet: baseSnippet,
      title_lc,
      tags: Array.from(new Set([...title_lc.split(/\W+/).slice(0,8), ...norm(h1||'').split(/\W+/).slice(0,8)].filter(Boolean))),
      content: baseContent
    });

    // H2–H4 sections (use existing id or text fragment)
    doc.querySelectorAll('h2, h3, h4').forEach(h => {
      const heading = (h.textContent || '').trim(); if (!heading || heading.length < 3) return;
      const jump = anchorForElement(h, heading, { prefix: 'section' });
      const snippet = textAfter(h, 200);
      const entryTitle = `${title}: ${heading}`;
      entries.push({
        title: entryTitle,
        url: `${pageUrl}${jump.urlFrag}`,
        snippet,
        title_lc: norm(entryTitle),
        tags: Array.from(new Set([...heading.toLowerCase().split(/\W+/).slice(0,8), 'section'].filter(Boolean))),
        content: norm(heading + ' ' + snippet),
        hasAnchor: jump.hasAnchor
      });
    });

    // tabs/accordions/cards/spotlight blocks (use id or text fragment)
    doc.querySelectorAll('.tab-pane, [role="tabpanel"], .accordion-item, .accordion-panel, .card, .panel, .tile, #spotlight, section#spotlight, .spotlight, .spotlights, .spotlight-item, .spotlight-card, .spotlight__item')
      .forEach(block => {
        const head = block.querySelector('h2,h3,h4,h5,summary,.card-title,.accordion-header');
        const heading = head ? head.textContent.trim() : (block.getAttribute('aria-label') || '').trim();
        if (!heading || heading.length < 3) return;

        const jump = anchorForElement(block, heading, { prefix: 'block' });
        const snippet = (block.textContent || '').replace(/\s+/g,' ').trim().slice(0, 200);
        const entryTitle = `${title}: ${heading}`;
        entries.push({
          title: entryTitle,
          url: `${pageUrl}${jump.urlFrag}`,
          snippet,
          title_lc: norm(entryTitle),
          tags: Array.from(new Set([...heading.toLowerCase().split(/\W+/).slice(0,8), 'block'].filter(Boolean))),
          content: norm(heading + ' ' + snippet),
          hasAnchor: jump.hasAnchor
        });
      });

    // spotlight figures
    doc.querySelectorAll('#spotlight figure, .spotlight figure, .spotlight-item figure, .spotlight__item figure').forEach(fig => {
      const capEl = fig.querySelector('figcaption');
      const cap = capEl ? capEl.textContent : '';
      const heading = (cap || '').trim();
      if (!heading || heading.length < 3) return;

      const jump = anchorForElement(fig, heading, { prefix: 'spot' });
      const entryTitle = `${title}: ${heading}`;
      const snippet = (cap || fig.textContent || '').replace(/\s+/g,' ').trim().slice(0, 200);
      entries.push({
        title: entryTitle,
        url: `${pageUrl}${jump.urlFrag}`,
        snippet,
        title_lc: norm(entryTitle),
        tags: Array.from(new Set(['spotlight', ...heading.toLowerCase().split(/\W+/).slice(0,8)].filter(Boolean))),
        content: norm(heading + ' ' + snippet),
        hasAnchor: jump.hasAnchor
      });
    });

    // downloads
    doc.querySelectorAll('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"]').forEach(a => {
      const txt = (a.textContent || a.getAttribute('aria-label') || '').trim(); if (!txt || txt.length < 3) return;
      const entryTitle = `${title}: ${txt}`;
      entries.push({
        title: entryTitle,
        url: a.getAttribute('href') || pageUrl,
        snippet: 'Download',
        title_lc: norm(entryTitle),
        tags: Array.from(new Set(['download', ...txt.toLowerCase().split(/\W+/).slice(0,8)].filter(Boolean))),
        content: norm(txt)
      });
    });

    // plain links (including links.html)
    doc.querySelectorAll('a[href]').forEach(a => {
      const txt = (a.textContent || a.getAttribute('aria-label') || '').trim();
      const href = a.getAttribute('href') || '';
      if (!txt || txt.length < 3) return;
      if (/^mailto:|^tel:/i.test(href)) return;
      if (/(\.(pdf|docx?|pptx?))$/i.test(href)) return;

      const entryTitle = `${title}: ${txt}`;
      entries.push({
        title: entryTitle,
        url: href || pageUrl,
        snippet: 'Link',
        title_lc: norm(entryTitle),
        tags: Array.from(new Set(['link', ...txt.toLowerCase().split(/\W+/).slice(0,8)].filter(Boolean))),
        content: norm(txt)
      });
    });

    return entries;
  }

  function extractPeople(doc, pageHref, baseTag, titlePrefix) {
    const pageURL = pageHref.split('#')[0];
    const list = [];
    const pushItem = (name, role, areas, extra, elForAnchor=null) => {
      if (!name || name.length < 3) return;

      // Canonicalize single-token lowercase/uppercase names for display
      function canonicalName(n) {
        const t = cleanText(n);
        if (!t) return n;
        const cap = (w) => w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w;
        return t.split(/\s+/).map(cap).join(' ');
      }

      const display = canonicalName(name);
      const displayTitle = `${titlePrefix}: ${display}`;
      const snippet = (role || areas || extra || `Profile of ${display}.`).slice(0,160);
      const content = norm([role, areas, extra].filter(Boolean).join(' ').slice(0,1200));
      const ntokens = nameTokens(name);
      const atokens = areas ? norm(areas).split(/[;,\/]\s*|\s+/) : [];

      // Prefer real element anchor; otherwise use text fragment of the (canonical) name
      const jump = anchorForElement(elForAnchor, display, { prefix: baseTag });

      list.push({
        title: displayTitle,
        url: `${pageURL}${jump.urlFrag}`,
        snippet,
        title_lc: norm(displayTitle),
        tags: Array.from(new Set([baseTag, ...ntokens, ...atokens].filter(Boolean))),
        content,
        hasAnchor: jump.hasAnchor
      });
    };

    // hidden student dataset
    doc.querySelectorAll('#studentData [data-name]').forEach(node => {
      const name   = cleanText(node.getAttribute('data-name')); if (!name) return;
      const enroll = cleanText(node.getAttribute('data-enroll') || '');
      const role   = enroll ? `Enrollment: ${enroll}` : '';
      pushItem(name, role, '', '', node);
    });

    // broadened selectors
    const cardSel = [
      '.faculty-card', '.faculty-member', '.profile-card',
      '.person', '.member', '.card', '.profile', '.fac-card', '.member-card',
      '.staff-card', '.staff-member', '.staff',
      '.student-card', '.student',
      '.people-card', '.people-item', '.team-card', '.team-member', '.bio', '.bio-card'
    ].join(',');
    doc.querySelectorAll(cardSel).forEach(card => {
      const nameEl = card.querySelector('h1,h2,h3,h4,h5,span,div,a,strong,b,td,.member-name,.name,.staff-name,.student-name,.faculty-name,.faculty-profile');
      const raw   = nameEl ? nameEl.textContent : card.textContent;
      const name  = cleanText(raw);
      if (!name || !name.length || !isNameish(name, { allowSingle: true })) return;

      const role   = cleanText(card.querySelector('.role,.designation,.title,.position')?.textContent);
      const areas  = cleanText(card.querySelector('.areas,.research,.research-areas,.interests,.keywords')?.textContent);
      const firstP = cleanText(card.querySelector('p')?.textContent);
      pushItem(name, role, areas, firstP, card);
    });

    // tables
    doc.querySelectorAll('table tr').forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('th,td')).map(td => cleanText(td.textContent)).filter(Boolean);
      if (!cells.length) return;
      const first = cells[0]; if (!first || first.length < 3) return;
      const name = first;
      const role = cells.slice(1).find(t => /(prof|assistant|associate|lecturer|scientist|postdoc|staff|student|ph\.?d|ms|mtech|btech)/i.test(t)) || '';
      const areas= cells.slice(1).find(t => /(research|area|interest|topics|group|lab)/i.test(t)) || '';
      const extra= cells.slice(1).join(' ').slice(0,800);
      pushItem(name, role, areas, extra, tr);
    });

    // lists
    doc.querySelectorAll('ul li, ol li').forEach(li => {
      const line = cleanText(li.textContent); if (!line || line.length < 3) return;
      const firstChunk = cleanText(line.split(/[–—\-•|:;]\s*/)[0]); if (!firstChunk || firstChunk.length < 3) return;
      const name = firstChunk;
      const rest = cleanText(line.slice(firstChunk.length));
      pushItem(name, '', '', rest, li);
    });

    return list;
  }

  // ---------- site-wide discovery ----------
  async function discoverPages(seedPaths, maxPages = 300) {
    const seen = new Set();
    const queue = [];
    const out = [];

    seedPaths.forEach(p => {
      const n = normalizeUrl(p);
      if (n && isIndexablePath(n) && !seen.has(n)) { seen.add(n); queue.push(n); }
    });

    while (queue.length && out.length < maxPages) {
      const path = queue.shift();
      out.push(path);
      try {
        const res = await fetch('/' + path, { cache: 'no-store' });
        if (!res.ok) continue;
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('a[href]').forEach(a => {
          const n = normalizeUrl(a.getAttribute('href'));
          if (!n || !isIndexablePath(n)) return;
          if (!seen.has(n)) { seen.add(n); queue.push(n); }
        });
      } catch {}
    }
    return out;
  }

  // ---------- loaders ----------
  function loadDynamicPage(url, timeoutMs = 9000, readySelector) {
    const DEFAULT_READY = readySelector || 'main, article, section, .page-container, .container, [role="main"], body > *';
    return new Promise(resolve => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();

      const start = Date.now();
      function done(result) { try { requestAnimationFrame(() => iframe.remove()); } catch(_) {} resolve(result); }
      function tryResolveWhenReady() {
        try {
          const doc = iframe.contentDocument;
          if (doc && doc.body) {
            const ready = doc.querySelector(DEFAULT_READY);
            if (ready && doc.body.children.length) return done({ url, doc });
          }
        } catch (_) {}
        if (Date.now() - start >= timeoutMs) {
          try {
            const doc = iframe.contentDocument;
            if (doc && doc.body && doc.body.children.length) return done({ url, doc });
          } catch (_e) {}
          return done(null);
        }
        setTimeout(tryResolveWhenReady, 150);
      }
      iframe.onload = tryResolveWhenReady;
      document.body.appendChild(iframe);
    });
  }

  async function loadStaticPage(url) {
    const bust = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    const res = await fetch(bust, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return { url, doc };
  }

  async function loadPageResilient(url, readySelector) {
    const dyn = await loadDynamicPage(url, 9000, readySelector);
    if (dyn) return dyn;
    return await loadStaticPage(url);
  }

  // ---------- Worker & cache ----------
  let worker = null, workerReady = false;
  let pendingSuggestResolver = null, pendingResultsResolver = null;

  function startWorker() {
    try {
      worker = new Worker('js/search.worker.js');
      worker.onmessage = (e) => {
        const { type } = e.data || {};
        if (type === 'PONG' || type === 'BUILT') workerReady = true;
        if (type === 'RESULTS') {
          if (pendingSuggestResolver) { pendingSuggestResolver(e.data.items || []); pendingSuggestResolver = null; }
          else if (pendingResultsResolver) { pendingResultsResolver(e.data.items || []); pendingResultsResolver = null; }
        }
      };
      worker.postMessage({ type: 'PING' });
    } catch (_) {}
  }
  startWorker();

  // ---------- search helpers ----------
  function setProgress(pct) {
    var wrap = document.getElementById('search-progress');
    var bar  = document.getElementById('search-progress-bar');
    if (!wrap || !bar) return;
    wrap.style.display = (pct > 0 && pct < 100) ? 'block' : 'none';
    bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }
  function showStatus(msg) {
    if (statusEl) statusEl.textContent = msg || '';
  }

  function getType(item){
    const tags = item.tags || [];
    const tl   = (item.title || '').toLowerCase();
    const has  = t => tags.includes(t);
    if (tl.startsWith('faculty:') || has('faculty'))   return { key:'faculty',   label:'Faculty' };
    if (tl.startsWith('staff:')   || has('staff'))     return { key:'staff',     label:'Staff' };
    if (tl.startsWith('student:') || has('student'))   return { key:'student',   label:'Student' };
    if (has('spotlight') || tl.includes('spotlight'))  return { key:'spotlight', label:'Spotlight' };
    if (has('announcements'))                           return { key:'announce',  label:'Announcement' };
    if (has('download'))                                 return { key:'download',  label:'Download' };
    if (has('link'))                                     return { key:'link',      label:'Link' };
    if (has('section') || has('block'))                 return { key:'section',   label:'Section' };
    return { key:'page', label:'Page' };
  }

function sortForNameQuery(items, q) {
  if (!Array.isArray(items) || !q) return items || [];
  const nq = norm(q);

  // Priority weights (higher is better)
  const priBase = { faculty: 3, staff: 3, student: 3, spotlight: 1, announce: 1, section: 0, download: 0, link: 0, page: 0 };

  // stable sort helper that preserves original order for ties
  function stableSort(arr, cmp) {
    return arr
      .map((v, i) => ({ v, i }))
      .sort((a, b) => {
        const r = cmp(a.v, b.v);
        return r === 0 ? a.i - b.i : r;
      })
      .map(x => x.v);
  }

  // compute score for an item
  function scoreItem(it) {
    const tkey = getType(it).key;
    let score = priBase[tkey] || 0;

    const tl = (it.title_lc || '').trim();
    if (!tl) return score;

    // exact title match (best)
    if (tl === nq) score += 6;

    // starts-with match (strong)
    else if (tl.startsWith(nq)) score += 4;

    // token match inside title (bonus)
    else if (tl.includes(nq)) score += 2;

    // prefer entries that actually have an anchor (deep-linkable)
    if (it.hasAnchor || (it.url || '').indexOf('#') !== -1) score += 3;

    // prefer faculty/staff/student types for name-like queries
    return score;
  }

  // if query looks like a person-name (isNameish) we emphasize nameish scoring,
  // otherwise we keep items roughly as-is
  const nameish = isNameish(q, { allowSingle: true });

  // clone to avoid mutating original
  const arr = (items || []).slice();

  // compute score map
  const scored = arr.map(it => ({ it, s: nameish ? scoreItem(it) : 0 }));

  // stable sort by score descending
  const sorted = stableSort(scored, (a, b) => {
    return b.s - a.s;
  }).map(x => x.it);

  return sorted;
}


  function hasAnchorFlag(item){ return !!(item && (item.hasAnchor || ((item.url||'').indexOf('#') !== -1))); }

  function sortForLeaveQuery(items, q){
    const nq = norm(q);
    if (!/(leave|vacation|absence|on duty|od|el|cl|ml)/.test(nq)) return items;
    const links = [], others = [];
    for (const it of items) ((it.tags||[]).includes('link') ? links : others).push(it);
    return [...links, ...others];
  }

  // Worker + local fallback
  function queryWorker(q, { limit = 50 } = {}) {
    return new Promise(resolve => {
      if (worker && workerReady) {
        pendingSuggestResolver = items => resolve(items || []);
        worker.postMessage({ type: 'QUERY', q, limit });
        return;
      }
      // Fallback: local Fuse or substring filter
      let items = [];
      if (fuse && typeof fuse.search === 'function') {
        try { items = (fuse.search(norm(q), { limit }) || []).map(r => r.item); } catch(_) {}
      }
      if (!items || !items.length) {
        items = fallbackFilter(q).slice(0, limit);
      }
      resolve(items || []);
    });
  }

  function runSearch(q, { limit = 50 } = {}) {
    return new Promise((resolve) => {
      if (worker && workerReady) {
        pendingResultsResolver = (items) => resolve(items || []);
        worker.postMessage({ type: 'QUERY', q, limit });
      } else {
        const items = (fuse && fuse.search ? fuse.search(norm(q), { limit }) : []).map(r => r.item);
        resolve(items);
      }
    });
  }

  function fallbackFilter(query) {
    const q = norm(query);
    return (indexData || []).filter(it => {
      const inTitle = (it.title_lc || '').includes(q);
      const inTags  = (it.tags || []).some(t => (t || '').includes(q));
      const inBody  = (it.content || '').includes(q);
      return inTitle || inTags || inBody;
    });
  }

  function rankAndMaybeRedirect(query, items) {
    if (!items || !items.length) return { redirected:false, items: [] };
    if (tryAutoRedirect(query, items)) return { redirected:true, items: [] };
    items = sortForLeaveQuery(items, query);
    if (isNameish(query, { allowSingle: true })) items = sortForNameQuery(items, query);
    return { redirected:false, items };
  }

  // SMARTER auto-redirect
  function tryAutoRedirect(query, items){
    const nq = norm(query);

    // "leave" logic
    if (/(^|\b)(leave|vacation|absence|on duty|od|el|cl|ml|leave portal|leave rules)($|\b)/.test(nq)) {
      const links = items.filter(it => (it.tags||[]).includes('link') &&
        ((it.title_lc||'').includes('leave') || (it.content||'').includes('leave')));
      if (!links.length) return false;
      const wantFaculty = /\bfaculty\b/i.test(query);
      const wantStaff   = /\bstaff\b/i.test(query);
      if (wantFaculty || wantStaff) {
        const picked = links.find(it => (wantFaculty ? /faculty/i : /staff/i).test(it.title || ''));
        if (picked && picked.url) { window.location.href = picked.url; return true; }
      }
      if (links.length === 1 && links[0].url) { window.location.href = links[0].url; return true; }
    }

    // Single-keyword → direct link if only one good match
    const KEYWORDS = [
      {k:/(^|\b)(library|lib)($|\b)/, tag:'library'},
      {k:/(^|\b)(aims)($|\b)/, tag:'aims'},
      {k:/(^|\b)(intranet)($|\b)/, tag:'intranet'},
      {k:/(^|\b)(ocs|placements|internships)($|\b)/, tag:'ocs'},
      {k:/(^|\b)(crf|central research facilities?)($|\b)/, tag:'crf'},
      {k:/(^|\b)(sunshine|counsel(ling|ing)|wellness)($|\b)/, tag:'counseling'},
      {k:/(^|\b)(security|main gate)($|\b)/, tag:'security'},
      {k:/(^|\b)(gymkhana)($|\b)/, tag:'gymkhana'},
      {k:/(^|\b)(room booking|seminar room)($|\b)/, tag:'room'}
    ];

    for (const rule of KEYWORDS) {
      if (rule.k.test(nq)) {
        const links = items.filter(it => (it.tags||[]).includes('link') && (
          (it.title_lc||'').includes(rule.tag) || (it.content||'').includes(rule.tag)
        ));
        if (links.length === 1 && links[0].url) { window.location.href = links[0].url; return true; }
      }
    }
    return false;
  }

  function renderResultsList(container, items, q) {
    if (!container) return;
    if (!items || !items.length) { container.innerHTML = `<p>No results found.</p>`; return; }
    container.innerHTML = items.map(item => {
      const s = (item.snippet || item.content || '').slice(0, 180);
      const { key, label } = getType(item);
      const jump = hasAnchorFlag(item) ? `<a href="${item.url}" class="srch-pill" style="margin-left:6px" title="Jump to section">Jump ↪</a>` : '';
      return `<article class="search-result" style="padding:12px 0;border-bottom:1px solid #eee">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span class="srch-badge srch-badge--${key}">${label}</span>
          <div style="flex:1 1 auto;min-width:0">
            <h3 style="margin:0 0 6px 0;font-size:18px"><a href="${item.url}">${highlight(item.title, q)}</a>${jump}</h3>
            <div style="font-size:13px;color:#555">${highlight(s, q)}…</div>
            <div style="font-size:12px;color:#888">${(item.url || '')}</div>
          </div>
        </div>
      </article>`;
    }).join('');
  }

  // ---------- people augmentation ----------
  async function augmentPeopleFromPages(pages = ['faculty.html','staff.html','students.html']) {
    const added = [];
    for (const page of pages) {
      try {
        const { doc, url } = await loadPageResilient(page);
        const lower = (url || page).toLowerCase();

        // generic entries for the page too
        added.push(...extractGeneric(doc, url.split('#')[0]));

        let baseTag = 'faculty', titlePrefix = 'Faculty';
        if (/staff\.html/.test(lower))   { baseTag = 'staff';   titlePrefix = 'Staff'; }
        if (/students\.html/.test(lower)){ baseTag = 'student'; titlePrefix = 'Student'; }

        added.push(...extractPeople(doc, url, baseTag, titlePrefix));
      } catch(_) {}
    }
    return added;
  }

  // ---------- build index (lazy; tries prebuilt JSON, else crawl) ----------
  async function ensureIndexBuilt() {
    if (indexData) return indexData;

    showStatus('Preparing search index…');
    setProgress(8);

    // 1) Try prebuilt static index for instant results
    try {
      const res = await fetch('searchIndex.json', { cache: 'no-store' });
      if (res.ok) {
        const pages = await res.json();
        indexData = pages.map(it => ({
          title: it.title,
          url: it.url,
          snippet: it.snippet || '',
          title_lc: (it.title || '').toLowerCase(),
          tags: it.tags || [],
          content: (it.content || '').toLowerCase()
        }));

        // Local Fuse
        fuse = new FuseCtor(indexData, {
          includeScore: true,
          minMatchCharLength: 2,
          threshold: 0.45,
          ignoreLocation: true,
          keys: [
            { name: 'title_lc', weight: 0.5 },
            { name: 'content',  weight: 0.35 },
            { name: 'tags',     weight: 0.15 }
          ]
        });

        // Build worker too
        if (worker) worker.postMessage({
          type: 'BUILD',
          pages: indexData,
          fuseConfig: { keys: ['title_lc','content','tags'] }
        });

        // --- Augment with people so single-token names (e.g., "Chengappa") are findable
        try {
          const people = await augmentPeopleFromPages(['faculty.html','staff.html','students.html']);
          if (people && people.length) {
            const seen = new Set(indexData.map(it => (it.url||'') + '|' + (it.title||'')));
            for (const it of people) {
              const key = (it.url||'') + '|' + (it.title||'');
              if (!seen.has(key)) { seen.add(key); indexData.push(it); }
            }

            // Rebuild local Fuse with people included
            fuse = new FuseCtor(indexData, {
              includeScore: true,
              minMatchCharLength: 2,
              threshold: 0.45,
              ignoreLocation: true,
              keys: [
                { name: 'title_lc', weight: 0.5 },
                { name: 'content',  weight: 0.35 },
                { name: 'tags',     weight: 0.15 }
              ]
            });

            // Notify worker and cache augmented index
            if (worker) worker.postMessage({
              type: 'BUILD',
              pages: indexData,
              fuseConfig: { keys: ['title_lc','content','tags'] }
            });
            try {
              localStorage.setItem('siteSearchIndex',
                JSON.stringify({ v: '1.0.6+people', ts: Date.now(), index: indexData }));
            } catch(_) {}
          }
        } catch(_) {}

        showStatus('');
        setProgress(0);
        return indexData;
      }
    } catch (_) {}

    // 2) Slow path: crawl + extract
    showStatus('Indexing site… this can take a moment');
    setProgress(15);

    const SEED_PAGES = [
      'index.html','about-glance.html','hod-desk.html',
      'faculty.html','staff.html','students.html','alumni.html',
      'research.html','programs.html','academic_docs.html','academics.html',
      'opportunities.html','links.html','documents.html',
      'gallery.html','committees.html'
    ];

    let PAGES = await discoverPages(SEED_PAGES, 300);
    SEED_PAGES.forEach(p => { if (!PAGES.includes(p)) PAGES.unshift(p); });

    const index = [];
    let done = 0;
    for (const page of PAGES) {
      try {
        const loaded = await loadPageResilient(page);
        if (!loaded) continue;
        const { doc, url } = loaded;
        const lower = url.toLowerCase();

        if (/faculty\.html(\?|$)|staff\.html(\?|$)|students\.html(\?|$)/.test(lower)) {
          index.push(...extractGeneric(doc, url.split('#')[0]));
          let baseTag = 'faculty', titlePrefix = 'Faculty';
          if (/staff\.html/.test(lower))   { baseTag = 'staff';   titlePrefix = 'Staff'; }
          if (/students\.html/.test(lower)){ baseTag = 'student'; titlePrefix = 'Student'; }
          index.push(...extractPeople(doc, url, baseTag, titlePrefix));
        } else if (/index\.html/.test(lower)) {
          index.push(...extractGeneric(doc, 'index.html'));
          ['announcements','seminars-events','publications','spotlight','spotlights'].forEach(id => {
            const el = doc.getElementById(id); if (!el) return;
            const map = { announcements:'Announcements', 'seminars-events':'Seminars & Events', publications:'Recent Publications', spotlight:'Spotlight', spotlights:'Spotlight' };
            const t = map[id] || id;
            const text = (el.textContent || '').trim().slice(0, 240);
            index.push({ title: `${t}`, title_lc: norm(t), url: `index.html#${id}`, tags: ['home', id], snippet: text, content: norm(text), hasAnchor:true });
          });
        } else {
          index.push(...extractGeneric(doc, page));

          if (/links\.html/.test(lower)) {
            const crumbs = Array.from(doc.querySelectorAll('.breadcrumb li, .breadcrumb a, nav.breadcrumb a, .breadcrumbs li, .breadcrumbs a'))
              .map(el => (el.textContent || '').trim()).filter(Boolean);
            const breadcrumb = crumbs.length ? crumbs.join(' → ') : 'Resources → Links';

            function nearestHeadingText(node) {
              let cur = node;
              while (cur) {
                let sib = cur.previousElementSibling;
                while (sib) {
                  if (/^H[1-4]$/.test(sib.tagName)) return (sib.textContent || '').trim();
                  sib = sib.previousElementSibling;
                }
                cur = cur.parentElement;
              }
              return '';
            }

            doc.querySelectorAll('a[href]').forEach(a => {
              const txt = (a.textContent || a.getAttribute('aria-label') || '').trim();
              const href = a.getAttribute('href') || '';
              if (!txt || txt.length < 3) return;
              if (/^mailto:|^tel:/i.test(href)) return;

              const section = nearestHeadingText(a);
              const hierarchy = section ? `${breadcrumb} → ${section}` : breadcrumb;
              const entryTitle = `${hierarchy}: ${txt}`;
              const tags = ['link','resources'];
              if (/forms?/i.test(hierarchy) || /forms?/i.test(section)) tags.push('forms');

              index.push({
                title: entryTitle, url: href, snippet: 'Link from Links page',
                title_lc: norm(entryTitle), tags, content: norm(`${txt} ${hierarchy}`)
              });
            });
          }
        }
      } catch (_) {}
      // Update progress gently
      done++;
      const pct = 15 + Math.round((done / PAGES.length) * 80); // 15%..95%
      setProgress(pct);
      if (done % 5 === 0) showStatus(`Indexing… ${done}/${PAGES.length} pages`);
    }

    indexData = index;

    // Local Fuse
    fuse = new FuseCtor(indexData, {
      includeScore: true,
      minMatchCharLength: 2,
      threshold: 0.45,
      ignoreLocation: true,
      keys: [
        { name: 'title_lc', weight: 0.5 },
        { name: 'content',  weight: 0.35 },
        { name: 'tags',     weight: 0.15 }
      ]
    });

    // Worker
    if (worker) {
      worker.postMessage({
        type: 'BUILD',
        pages: indexData,
        fuseConfig: {
          includeScore: true,
          minMatchCharLength: 2,
          threshold: 0.45,
          ignoreLocation: true,
          keys: [
            { name: 'title_lc', weight: 0.5 },
            { name: 'content',  weight: 0.35 },
            { name: 'tags',     weight: 0.15 }
          ]
        }
      });
    }

    showStatus('');
    setProgress(0);
    return indexData;
  }

  // ---------- live suggestions ----------
  let selIdx = -1;

  function renderSuggestion(items) {
    // guard: never render dropdown on mobile/tablet
    if (window.matchMedia('(max-width: 900px)').matches) {
      if (suggest) { suggest.classList.remove('show'); suggest.style.display = 'none'; suggest.innerHTML = ''; }
      return;
    }
    if (!suggest) return;

    const q = (input && input.value) || '';
    items = sortForLeaveQuery(items, q);
    if (isNameish(q, { allowSingle: true })) items = sortForNameQuery(items, q);

    if (!items.length) {
      suggest.classList.remove('show');
      suggest.style.display = 'none';
      suggest.innerHTML = '';
      input && input.setAttribute('aria-expanded', 'false');
      selIdx = -1;
      return;
    }

    const groupsOrder = ['faculty','staff','student','link','section','spotlight','announce','page'];
    const labelMap = { faculty:'Faculty', staff:'Staff', student:'Students', link:'Links', section:'Sections', spotlight:'Spotlight', announce:'Announcements', page:'Pages' };
    const groups = {};
    items.forEach(it => { const k = (getType(it).key || 'page'); (groups[k] = groups[k] || []).push(it); });

    // top hit
    let topHitHtml = '';
    const first = items[0];
    if (first && (first.title_lc || '').startsWith(norm(q)) && q.length >= 2) {
      const { key, label } = getType(first);
      const s = (first.snippet || first.content || '').slice(0, 120);
      const jump = hasAnchorFlag(first) ? `<span class="srch-pill" title="Jump to section">↪</span>` : '';
      topHitHtml = `
        <div class="srch-group">
          <div class="srch-group__title">Top hit</div>
          <a href="${first.url}" class="srch-suggest-row" role="option" data-href="${first.url}">
            <span class="srch-badge srch-badge--${key}">${label}</span>
            <span style="flex:1">
              <div style="font-weight:600;margin-bottom:2px">${highlight(first.title, q)} ${jump}</div>
              <div style="font-size:12px;color:#666">${highlight(s, q)}…</div>
            </span>
          </a>
        </div>`;
    }

    const htmlGroups = groupsOrder.map(k => {
      const arr = groups[k]; if (!arr || !arr.length) return '';
      const label = labelMap[k] || 'Results';
      const rows = arr.slice(0, 5).map(it => {
        const s = (it.snippet || it.content || '').slice(0, 110);
        const jump = hasAnchorFlag(it) ? `<span class="srch-pill" title="Jump to section">↪</span>` : '';
        return `
          <a href="${it.url}" class="srch-suggest-row" role="option" data-href="${it.url}">
            <span class="srch-badge srch-badge--${k}">${label.replace(/s$/,'')}</span>
            <span style="flex:1">
              <div style="font-weight:600;margin-bottom:2px">${highlight(it.title, q)} ${jump}</div>
              <div style="font-size:12px;color:#666">${highlight(s, q)}…</div>
            </span>
          </a>`;
      }).join('');
      return `<div class="srch-group">
        <div class="srch-group__title">${label}</div>
        ${rows}
      </div>`;
    }).join('');

    const footer = `<div class="srch-footer"><a href="search.html?q=${encodeURIComponent(q)}" aria-label="View all results for ${q}">View all results ↵</a></div>`;

    suggest.innerHTML = `${topHitHtml}${htmlGroups}${footer}`;
    suggest.style.display = 'block';
    requestAnimationFrame(() => suggest.classList.add('show'));
    input && input.setAttribute('aria-expanded', 'true');

    const rows = [...suggest.querySelectorAll('.srch-suggest-row')];
   row.addEventListener('click', (e) => {
  e.preventDefault();

  // Try to find a usable link
  let href =
    row.getAttribute('data-href') ||
    row.getAttribute('href') ||
    (row.querySelector('a[href]') ? row.querySelector('a[href]').getAttribute('href') : '');

  // Extract visible text (for name canonicalization)
  const visible = (row.textContent || '').trim();

  // If it already includes an anchor hash, go directly
  if (href && href.includes('#')) {
    window.location.href = href;
    return;
  }

  // Canonicalize to match faculty IDs even if “Dr.” prefixes differ
  const canonical = (str) =>
    (str || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(dr|prof|professor|mr|mrs|ms)\b\.?/gi, '')
      .replace(/[^a-z0-9\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const domMap = window.__canonicalAnchorMapFromDOM || {};
  const key = canonical(visible);

  if (key && domMap[key]) {
    const base = href.split('#')[0] || 'faculty.html';
    window.location.href = base + domMap[key];
    return;
  }

  // Otherwise, fall back to text fragment to highlight
  if (visible) {
    const base = href.split('#')[0] || 'faculty.html';
    const frag = '#:~:text=' + encodeURIComponent(visible.slice(0, 80));
    window.location.href = base + frag;
    return;
  }

  // Final fallback
  window.location.href = href || 'search.html';
});

  }

  function moveSel(delta) {
    if (!suggest || !suggest.children.length) return;
    const rows = [...suggest.querySelectorAll('.srch-suggest-row')];
    if (!rows.length) return;
    selIdx = (selIdx + delta + rows.length) % rows.length;
    rows.forEach((n,i) => n.setAttribute('aria-selected', i === selIdx ? 'true' : 'false'));
  }

  // live suggest (with loading shimmer while index warms)
  async function liveSuggest(q) {
    if (!q || q.trim().length === 0) { renderSuggestion([]); return; }

    const loadingRow = `
      <div class="srch-suggest-row" aria-disabled="true"
           style="display:flex;gap:8px;align-items:center;padding:10px 12px;opacity:.85">
        <div class="skeleton" style="width:14px;height:14px;border-radius:50%;
             background:linear-gradient(90deg,#eee,#f5f5f5,#eee);animation:shimmer 1.2s infinite"></div>
        <div class="skeleton" style="flex:1;height:12px;border-radius:6px;
             background:linear-gradient(90deg,#eee,#f5f5f5,#eee);animation:shimmer 1.2s infinite"></div>
      </div>
      <style>@keyframes shimmer{0%{background-position:-120px 0}100%{background-position:120px 0}}</style>
    `;
    if (suggest) {
      suggest.innerHTML = loadingRow;
      suggest.style.display = 'block';
      input && input.setAttribute('aria-expanded', 'true');
    }

    await ensureIndexBuilt();

    setProgress(30);
    const items = await queryWorker(q, { limit: 15 });
    setProgress(0);
    renderSuggestion(items || []);
  }

  // ---------- results page ----------
  async function runResultsPage() {
    if (!isResultsPage) return;
    const params = new URLSearchParams(location.search);
    const q = (params.get('q') || '').trim();
    if (qEl) qEl.textContent = q ? `for “${q}”` : '';

    showStatus('Searching…');
    setProgress(35);
    await ensureIndexBuilt();

    const items = await queryWorker(q, { limit: 200 });
    setProgress(0);
    showStatus(items.length ? `${items.length} result${items.length>1?'s':''}` : 'No results');

    // Lazy paint: render 20, then 20 more during idle time
    const batch = 20;
    let i = 0;
    outEl && (outEl.innerHTML = '');
    function renderChunk() {
      if (!outEl) return;
      const stop = Math.min(i + batch, items.length);
      for (; i < stop; i++) {
        const it = items[i];
        const el = document.createElement('div');
        el.className = 'search-result';
        el.innerHTML = `
          <h3><a href="${it.url}">${highlight(it.title || '', q)}</a></h3>
          <div>${highlight(it.snippet || '', q)}</div>
          <div class="search-url">${it.url}</div>
        `;
        outEl.appendChild(el);
      }
      if (i < items.length) {
        if ('requestIdleCallback' in window) requestIdleCallback(renderChunk, { timeout: 300 });
        else setTimeout(renderChunk, 0);
      }
    }
    renderChunk();
  }

  // ---------- Deep-link scroll & highlight (fixed-header safe + text-fragment polyfill) ----------
  (function deepLinkScrollFix(){
    const SCROLL_OFFSET = (() => {
      // Try to detect a fixed header; fallback to 80px
      const header = document.querySelector('#site-header, header[role="banner"], .site-header, .navbar, .topbar');
      const h = header ? header.getBoundingClientRect().height : 80;
      return Math.max(0, Math.min(200, Math.round(h)));
    })();

    // Inject minimal styles (smooth + highlight)
    (function injectStyles(){
      const css = `
        html { scroll-behavior: smooth; }
        :target { scroll-margin-top: ${SCROLL_OFFSET}px; }
        .deeplink-highlight { animation: dlFlash 1.7s ease-out 1; }
        @keyframes dlFlash { 0%{ background: rgba(255,236,153,.9) } 100%{ background: transparent } }
      `;
      const style = document.createElement('style');
      style.setAttribute('data-deeplink-style','true');
      style.textContent = css;
      document.head.appendChild(style);
    })();

    function highlight(el){
      if (!el) return;
      el.classList.add('deeplink-highlight');
      setTimeout(()=> el.classList.remove('deeplink-highlight'), 1800);
    }

    function findNodeContaining(text){
      if (!text) return null;
      text = decodeURIComponent(text).trim();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node){
          const t = (node.nodeValue || '').trim();
          if (!t) return NodeFilter.FILTER_REJECT;
          const el = node.parentElement;
          const cs = el ? getComputedStyle(el) : null;
          if (cs && (cs.visibility==='hidden' || cs.display==='none')) return NodeFilter.FILTER_REJECT;
          return t.toLowerCase().includes(text.toLowerCase())
            ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      });
      const node = walker.nextNode();
      return node ? node.parentElement : null;
    }

    function parseTextFragment(hash){
      if (!hash || hash.indexOf(':~:text=') === -1) return null;
      const q = hash.split(':~:text=')[1] || '';
      const stop = q.split('&')[0];
      return (stop.split(',')[0] || '').trim();
    }

    function scrollToHashTarget(){
      const h = location.hash || '';
      if (!h) return;

      // 1) Normal #id → browser handles offset via :target; ensure highlight
      if (h.indexOf(':~:text=') === -1) {
        const el = document.getElementById(h.slice(1));
        if (el) { // ensure visible + highlight
          // extra nudge for some mobile browsers
          setTimeout(()=>window.scrollBy(0, -1), 50);
          highlight(el);
        }
        return;
      }

      // 2) Text Fragment — try to also find node & highlight; polyfill scroll if needed
      const txt = parseTextFragment(h);
      if (!txt) return;
      setTimeout(() => {
        const el = findNodeContaining(txt);
        if (el) {
          el.scrollIntoView({ block:'start' });
          // compensate fixed header on browsers that ignore :target for text fragments
          window.scrollBy(0, -SCROLL_OFFSET);
          highlight(el);
        }
      }, 100);
    }

    window.addEventListener('DOMContentLoaded', scrollToHashTarget);
    window.addEventListener('load', scrollToHashTarget);
    window.addEventListener('hashchange', scrollToHashTarget);

    // Optional: if suggestions link to same page anchors, smooth in-page jump
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const url = new URL(a.getAttribute('href'), location.href);
      const samePage = url.pathname.replace(/\/+$/,'') === location.pathname.replace(/\/+$/,'');
      if (samePage && url.hash) {
        // let hashchange handler do its job
        setTimeout(()=>window.scrollBy(0, -SCROLL_OFFSET), 60);
      }
    });
  })();

  // ---------- init ----------
  (async function init() {
    try {
      // warm cache (non-blocking)
      (function tryWarmStart() {
        try {
          const raw = localStorage.getItem('siteSearchIndex');
          if (!raw) return;
          const data = JSON.parse(raw);
          if (data && Array.isArray(data.index) && data.index.length) {
            indexData = data.index;
            if (worker) worker.postMessage({
              type: 'BUILD',
              pages: indexData,
              fuseConfig: {
                includeScore: true, minMatchCharLength: 2, threshold: 0.45, ignoreLocation: true,
                keys: [{name:'title_lc',weight:0.5},{name:'content',weight:0.35},{name:'tags',weight:0.15}]
              }
            });

            // Ensure local Fuse exists even on warm start
            fuse = new FuseCtor(indexData, {
              includeScore: true,
              minMatchCharLength: 2,
              threshold: 0.45,
              ignoreLocation: true,
              keys: [
                { name: 'title_lc', weight: 0.5 },
                { name: 'content',  weight: 0.35 },
                { name: 'tags',     weight: 0.15 }
              ]
            });
          }
        } catch (_) {}
      })();

      if (form && input) {
        // Debounced suggestions (desktop only)
        const debouncedSuggest = debounce(() => {
          if (window.matchMedia('(max-width: 900px)').matches) return; // no dropdown on mobile
          const q = input.value.trim();
          if (q.length < 1) { renderSuggestion([]); return; }
          liveSuggest(q);
        }, 120);

        input.addEventListener('input', debouncedSuggest);

        // keys
        input.addEventListener('keydown', e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
          else if (e.key === 'Enter') {
            const rows = suggest ? [...suggest.querySelectorAll('.srch-suggest-row')] : [];
            if (rows.length) {
              if (selIdx === -1) {
                const first = rows[0];
                const href = first.getAttribute('data-href') || first.getAttribute('href');
                if (href) { e.preventDefault(); window.location.href = href; return; }
              }
              if (selIdx >= 0) {
                const row = rows[selIdx];
                const href = row.getAttribute('data-href') || row.getAttribute('href');
                if (href) { e.preventDefault(); window.location.href = href; return; }
              }
            }
            const q = input.value.trim();
            if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
          } else if (e.key === 'Escape') {
            renderSuggestion([]); input.setAttribute('aria-expanded', 'false');
          }
        });

        input.addEventListener('focus', () => {
          if (window.matchMedia('(max-width: 900px)').matches) return;
          if (suggest && suggest.innerHTML.trim()) {
            suggest.style.display = 'block';
            requestAnimationFrame(() => suggest.classList.add('show'));
            input.setAttribute('aria-expanded', 'true');
          }
        });

        document.addEventListener('click', e => {
          if (!form.contains(e.target)) renderSuggestion([]);
        });
      }

      // Live search inside search.html (type-to-search behavior)
      (function attachResultsPageLiveSearch() {
        try {
          if (!/\/?search\.html$/i.test(location.pathname)) return;

          const input   = document.getElementById('search-input');
          const outEl   = document.getElementById('srch-out');
          const statusEl= document.getElementById('search-status');

          const debounceLocal = (fn, ms=150) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };

          async function doSearch(q) {
            const query = (q || '').trim();
            if (!query) {
              statusEl && (statusEl.textContent = '');
              outEl && (outEl.innerHTML = '');
              return;
            }

            const wrap = document.getElementById('search-progress');
            const bar  = document.getElementById('search-progress-bar');
            if (wrap && bar) { wrap.style.display='block'; bar.style.width='35%'; }
            statusEl && (statusEl.textContent = 'Searching…');

            await ensureIndexBuilt();

            let items = [];
            if (typeof queryWorker === 'function') {
              items = await queryWorker(query, { limit: 200 });
            } else if (typeof runSearch === 'function') {
              items = await runSearch(query, { limit: 200 });
            }

            if (wrap && bar) { bar.style.width='100%'; setTimeout(()=>{ wrap.style.display='none'; bar.style.width='0%'; }, 250); }
            statusEl && (statusEl.textContent = items.length ? `${items.length} result${items.length>1?'s':''}` : 'No results');

            if (typeof renderResultsList === 'function') {
              renderResultsList(outEl, items, query);
            } else {
              outEl.innerHTML = items.map(it => `
                <article class="search-result">
                  <h3><a href="${it.url}">${it.title || ''}</a></h3>
                  <div>${(it.snippet || it.content || '').slice(0,180)}…</div>
                  <div class="search-url">${it.url}</div>
                </article>`).join('');
            }
          }

          if (!input || !outEl) return;

          const urlQ = new URLSearchParams(location.search).get('q') || '';
          if (urlQ) { input.value = urlQ; doSearch(urlQ); }

          input.addEventListener('input', debounceLocal(e => doSearch(e.target.value), 160));
          input.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); doSearch(input.value); }
          });
        } catch (e) {
          console && console.error && console.error('[search live]', e);
        }
      })();

      // Full page results renderer
      runResultsPage();
    } catch (e) {
      onError(e);
    }
  })();

  // ---------- Typing placeholder animation ----------
  (function(){
    var input = document.getElementById('search-input');
    if (!input) return;

    // Skip animation for users who prefer reduced motion
    var reduceMotion = window.matchMedia &&
                       window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    // Rotating phrases
    var phrases = [
      "Search faculty, staff, students…",
      "Try: leave / OD / CL / EL",
      "Forms, timetables, CRF, committees…",
      "eg. “Ramesh”, “SQUID”, “Zeeman effect”"
    ];

    var typingSpeed = 55;     // ms per character
    var holdAfterType = 1300; // ms hold when full phrase typed
    var eraseSpeed = 35;      // ms per character erase speed
    var holdAfterErase = 400; // ms before typing next phrase
    var active = true;        // paused when user types

    var p = 0, i = 0, dir = 1; // phrase index, char index, direction
    input.placeholder = "";    // start blank
    input.classList.add('typing');

    function step() {
      if (!active) return;
      var text = phrases[p];
      i += dir;

      if (i < 0) i = 0;
      if (i > text.length) i = text.length;

      input.setAttribute('placeholder', text.slice(0, i));

      if (dir > 0 && i === text.length) {
        setTimeout(function(){ dir = -1; tick(); }, holdAfterType);
        return;
      }
      if (dir < 0 && i === 0) {
        p = (p + 1) % phrases.length;
        setTimeout(function(){ dir = 1; tick(); }, holdAfterErase);
        return;
      }
      setTimeout(tick, dir > 0 ? typingSpeed : eraseSpeed);
    }
    function tick(){ if (active) step(); }

    function pause() { active = false; input.classList.remove('typing'); }
    function resume() {
      if (input.value && input.value.trim()) return; // don’t animate over real input
      if (reduceMotion) return;
      active = true; input.classList.add('typing'); tick();
    }

    input.addEventListener('focus', pause);
    input.addEventListener('input', pause);
    input.addEventListener('blur', resume);
    document.addEventListener('visibilitychange', function(){
      if (document.hidden) pause(); else resume();
    });

    tick();
  })();
})();
