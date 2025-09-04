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

  // Fuse shim (keeps search working even if Fuse isn't loaded on main thread)
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

  const form    = document.getElementById('site-search');
  const input   = document.getElementById('search-input');
  const suggest = document.getElementById('search-suggest');

  const isResultsPage = /\/?search\.html$/.test(location.pathname);
  const outEl    = document.getElementById('srch-out');
  const qEl      = document.getElementById('srch-q');
  const statusEl = document.getElementById('search-status'); // only on search.html

  let fuse = null, indexData = null;

  // ---------- helpers ----------
  const cleanText = s => (s || '').replace(/\s+/g, ' ').trim();
  const getText   = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : '';

  const norm = (s) =>
    (s || '')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // strip accents
      .toLowerCase();

  const slug = s =>
    norm(s)
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  // allow single-word proper names (≥3 chars) too (relaxed) — DO NOT REMOVE (fixes Chengappa/Guhan)
  function isNameish(s, { allowSingle = true } = {}) {
    if (!s) return false;
    const txt   = cleanText(s);
    const parts = txt.replace(/[(),;:/\-]+/g, ' ').split(/\s+/).filter(Boolean);
    const capish = parts.filter(w => /^[A-Z][A-Za-z.\-']+$/.test(w));
    if (capish.length >= 2 && capish.length <= 4) return true;
    if (allowSingle && parts[0] && parts[0].length >= 3) return true;
    return false;
  }

  const debounce = (fn, ms=150) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };

  function nameTokens(name) {
    const lower = norm(name);
    const parts = lower.split(/[^a-z0-9]+/).filter(Boolean);
    return Array.from(new Set([lower, ...parts]));
  }

  // --- Helpers for section indexing & anchors ---
  function ensureId(el, prefix='sec') {
    const txt = (el.textContent || '').trim();
    if (!txt) return null;
    if (!el.id) el.id = prefix + '-' + txt
      .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .replace(/&/g,' and ').replace(/[^a-z0-9\s-]/gi,'')
      .trim().replace(/\s+/g,'-').replace(/-+/g,'-').toLowerCase();
    return el.id;
  }
  function textAfter(el, limit=200) {
    let p = el.nextElementSibling;
    while (p && !/^(p|div|section|article)$/i.test(p.tagName)) p = p.nextElementSibling;
    const t = (p ? p.textContent : el.textContent) || '';
    return t.replace(/\s+/g,' ').trim().slice(0, limit);
  }

  // ---------- UI/Ranking helpers (non-destructive) ----------
  function esc(s){return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function highlight(text, q){
    if (!text) return '';
    if (!q) return esc(text);
    const words = q.trim().split(/\s+/).filter(Boolean).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!words.length) return esc(text);
    const re = new RegExp('(' + words.join('|') + ')', 'ig');
    return esc(text).replace(re, '<mark>$1</mark>');
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
  function sortForNameQuery(items, q){
    const nq = norm(q);
    const pri = { faculty:3, staff:3, student:3, spotlight:1, announce:1, section:0, download:0, link:0, page:0 };
    const score = it => {
      const t = getType(it).key;
      let s = pri[t] || 0;
      const tl = it.title_lc || '';
      if (tl === nq) s += 3;
      else if (tl.startsWith(nq)) s += 2;
      return s;
    };
    return items.slice().sort((a,b) => score(b) - score(a));
  }
  function hasAnchor(url){ return (url||'').indexOf('#') !== -1; }

  // ---------- site-wide discovery (no sitemap needed) ----------
  function normalizeUrl(u) {
    try {
      const a = new URL(u, location.origin);
      if (a.origin !== location.origin) return null; // external
      const path = (a.pathname + (a.search || '')).replace(/^\/+/, '');
      return path.replace(/#.*$/, '');
    } catch { return null; }
  }
  function isIndexablePath(path) {
    if (!path) return false;
    if (!/\.html?($|\?)/i.test(path)) return false; // only HTML
    if (/(^|\/)(assets?|static|img|images|css|js|fonts?)\//i.test(path)) return false;
    if (/^mailto:|^tel:/i.test(path)) return false;
    return true;
  }
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

  // ---------- extractors ----------
  // Rich generic extractor (page + sections + tabs/accordions/cards + spotlight + downloads + links)
  function extractGeneric(doc, url) {
    const pageUrl = url.replace(/^\/+/, '');
    const rawTitle = getText(doc.querySelector('title')) || pageUrl;
    const title    = rawTitle.replace(/\s*\|\s*.*$/, '');
    const title_lc = norm(title);

    const metaDesc = getText(doc.querySelector('meta[name="description"]'));
    const h1       = getText(doc.querySelector('h1'));
    const firstP   = getText(doc.querySelector('main p, .page-container p, p'));
    const baseSnippet  = (metaDesc || firstP || h1 || title).slice(0, 180);
    const baseContent  = norm((
      (metaDesc || '') + ' ' + (h1 || '') + ' ' + (firstP || '') + ' ' +
      (getText(doc.querySelector('main')) || getText(doc.body))
    ).slice(0, 1200));

    const entries = [];

    // Page-level entry
    entries.push({
      title,
      url: pageUrl,
      snippet: baseSnippet,
      title_lc,
      tags: Array.from(new Set([
        ...title_lc.split(/\W+/).slice(0, 8),
        ...norm(h1 || '').split(/\W+/).slice(0, 8)
      ].filter(Boolean))),
      content: baseContent
    });

    // Subsection entries: H2–H4
    doc.querySelectorAll('h2, h3, h4').forEach(h => {
      const heading = (h.textContent || '').trim();
      if (!heading || heading.length < 3) return;
      const id = ensureId(h, 'section');
      const snippet = textAfter(h, 200);
      const entryTitle = `${title}: ${heading}`;
      entries.push({
        title: entryTitle,
        url: `${pageUrl}#${id}`,
        snippet,
        title_lc: norm(entryTitle),
        tags: Array.from(new Set([
          ...heading.toLowerCase().split(/\W+/).slice(0,8),
          'section'
        ].filter(Boolean))),
        content: norm(heading + ' ' + snippet)
      });
    });

    // Tab panes / Accordions / Cards / Spotlight containers
    doc.querySelectorAll(
      '.tab-pane, [role="tabpanel"], .accordion-item, .accordion-panel, .card, .panel, .tile,' +
      '#spotlight, section#spotlight, .spotlight, .spotlights, .spotlight-item, .spotlight-card, .spotlight__item'
    ).forEach(block => {
      const head = block.querySelector('h2,h3,h4,h5,summary,.card-title,.accordion-header');
      const heading = head ? head.textContent.trim() : (block.getAttribute('aria-label') || '').trim();
      if (!heading || heading.length < 3) return;
      const id = ensureId(block, 'block');
      const snippet = (block.textContent || '').replace(/\s+/g,' ').trim().slice(0, 200);
      const entryTitle = `${title}: ${heading}`;
      entries.push({
        title: entryTitle,
        url: `${pageUrl}#${id}`,
        snippet,
        title_lc: norm(entryTitle),
        tags: Array.from(new Set([
          ...heading.toLowerCase().split(/\W+/).slice(0,8),
          'block'
        ].filter(Boolean))),
        content: norm(heading + ' ' + snippet)
      });
    });

    // Spotlight figures with figcaption
    doc.querySelectorAll('#spotlight figure, .spotlight figure, .spotlight-item figure, .spotlight__item figure').forEach(fig => {
      const capEl = fig.querySelector('figcaption');
      const cap = capEl ? capEl.textContent : '';
      const heading = (cap || '').trim();
      if (!heading || heading.length < 3) return;
      const id = ensureId(fig, 'spot');
      const entryTitle = `${title}: ${heading}`;
      const snippet = (cap || fig.textContent || '').replace(/\s+/g,' ').trim().slice(0, 200);
      entries.push({
        title: entryTitle,
        url: `${pageUrl}#${id}`,
        snippet,
        title_lc: norm(entryTitle),
        tags: Array.from(new Set(['spotlight', ...heading.toLowerCase().split(/\W+/).slice(0,8)].filter(Boolean))),
        content: norm(heading + ' ' + snippet)
      });
    });

    // Obvious downloads (PDF/DOC)
    doc.querySelectorAll('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"]').forEach(a => {
      const txt = (a.textContent || a.getAttribute('aria-label') || '').trim();
      if (!txt || txt.length < 3) return;
      const id = ensureId(a, 'dl');
      const entryTitle = `${title}: ${txt}`;
      entries.push({
        title: entryTitle,
        url: a.getAttribute('href') || `${pageUrl}#${id}`,
        snippet: 'Download',
        title_lc: norm(entryTitle),
        tags: Array.from(new Set(['download', ...txt.toLowerCase().split(/\W+/).slice(0,8)].filter(Boolean))),
        content: norm(txt)
      });
    });

    // Plain links (useful-links/portals) — create lightweight entries (NEW)
    doc.querySelectorAll('a[href]').forEach(a => {
      const txt = (a.textContent || a.getAttribute('aria-label') || '').trim();
      if (!txt || txt.length < 3) return;

      const href = a.getAttribute('href') || '';
      if (/^mailto:|^tel:/i.test(href)) return;           // skip mail/tel
      if (/\.(pdf|docx?|pptx?)$/i.test(href)) return;     // already covered as downloads

      const entryTitle = `${title}: ${txt}`;
      entries.push({
        title: entryTitle,
        url: href || pageUrl,           // external links are fine; browser will navigate
        snippet: 'Link',
        title_lc: norm(entryTitle),
        tags: Array.from(new Set(['link', ...txt.toLowerCase().split(/\W+/).slice(0, 8)].filter(Boolean))),
        content: norm(txt)
      });
    });

    return entries;
  }

  // People extractor (faculty/staff/students) — BROAD selectors retained (DO NOT REMOVE)
  function extractPeople(doc, pageHref, baseTag, titlePrefix) {
    const pageURL = pageHref.split('#')[0];
    const list = [];

    const pushItem = (name, id, role, areas, extra='') => {
      if (!name || name.length < 3) return;
      const displayTitle = `${titlePrefix}: ${name}`;
      const snippet = (role || areas || extra || `Profile of ${name}.`).slice(0,160);
      const content = norm([role, areas, extra].filter(Boolean).join(' ').slice(0,1200));
      const ntokens = nameTokens(name);
      const atokens = areas ? norm(areas).split(/[,;/]\s*|\s+/) : [];
      list.push({
        title: displayTitle,
        url: `${pageURL}#${id}`,
        snippet,
        title_lc: norm(displayTitle),
        tags: Array.from(new Set([baseTag, ...ntokens, ...atokens].filter(Boolean))),
        content
      });
    };

    // Hidden student dataset (if present)
    doc.querySelectorAll('#studentData [data-name]').forEach(node => {
      const name   = cleanText(node.getAttribute('data-name'));
      if (!name) return;
      const enroll = cleanText(node.getAttribute('data-enroll') || '');
      const id     = node.id || `student-${slug(`${name}-${enroll || ''}`)}`;
      if (!node.id) node.id = id;
      const role   = enroll ? `Enrollment: ${enroll}` : '';
      pushItem(name, id, role, '', '');
    });

    // Cards/blocks — broadened selectors (includes span/div/a/strong/b/td)
    const cardSel = [
      '.faculty-card', '.faculty-member', '.profile-card',
      '.person', '.member', '.card', '.profile', '.fac-card', '.member-card',
      '.staff-card', '.staff-member', '.staff',
      '.student-card', '.student',
      '.people-card', '.people-item', '.team-card', '.team-member', '.bio', '.bio-card'
    ].join(',');

    doc.querySelectorAll(cardSel).forEach(card => {
      const nameEl = card.querySelector(
        'h1,h2,h3,h4,h5,span,div,a,strong,b,td,' +
        '.member-name,.name,.staff-name,.student-name,.faculty-name,.faculty-profile'
      );
      const raw   = nameEl ? nameEl.textContent : card.textContent;
      const name  = cleanText(raw);
      if (!name || !name.length || !isNameish(name, { allowSingle: true })) return;

      const id     = card.id || ('person-' + slug(name));
      if (!card.id) card.id = id;

      const role   = cleanText(card.querySelector('.role,.designation,.title,.position')?.textContent);
      const areas  = cleanText(card.querySelector('.areas,.research,.research-areas,.interests,.keywords')?.textContent);
      const firstP = cleanText(card.querySelector('p')?.textContent);
      pushItem(name, id, role, areas, firstP);
    });

    // Tables — accept first cell as name even if single/lowercase
    doc.querySelectorAll('table tr').forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('th,td')).map(td => cleanText(td.textContent)).filter(Boolean);
      if (!cells.length) return;
      const first = cells[0];
      if (!first || first.length < 3) return;
      const name = first;
      const id   = tr.id || ('person-' + slug(name));
      if (!tr.id) tr.id = id;
      const role = cells.slice(1).find(t => /(prof|assistant|associate|lecturer|scientist|postdoc|staff|student|ph\.?d|ms|mtech|btech)/i.test(t)) || '';
      const areas= cells.slice(1).find(t => /(research|area|interest|topics|group|lab)/i.test(t)) || '';
      const extra= cells.slice(1).join(' ').slice(0,800);
      pushItem(name, id, role, areas, extra);
    });

    // Lists — treat first chunk before separators as name
    doc.querySelectorAll('ul li, ol li').forEach(li => {
      const line = cleanText(li.textContent);
      if (!line || line.length < 3) return;
      const firstChunk = cleanText(line.split(/[–—\-•|:;]\s*/)[0]);
      if (!firstChunk || firstChunk.length < 3) return;
      const name = firstChunk;
      const id   = li.id || ('person-' + slug(name));
      if (!li.id) li.id = id;
      const rest = cleanText(line.slice(firstChunk.length));
      pushItem(name, id, '', '', rest);
    });

    return list;
  }

  // ---------- loaders ----------
  // Dynamic loader: poll until content is ready (handles late-rendered content)
  function loadDynamicPage(url, timeoutMs = 9000, readySelector) {
    const DEFAULT_READY = readySelector || 'main, article, section, .page-container, .container, [role="main"], body > *';
    return new Promise(resolve => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(); // cache-bust

      const start = Date.now();
      function done(result) {
        try { requestAnimationFrame(() => iframe.remove()); } catch(_) {}
        resolve(result);
      }
      function tryResolveWhenReady() {
        try {
          const doc = iframe.contentDocument;
          if (doc && doc.body) {
            const ready = doc.querySelector(DEFAULT_READY);
            if (ready && doc.body.children.length) {
              return done({ url, doc });
            }
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
    const bust = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(); // cache-bust
    const res = await fetch(bust, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return { url, doc };
  }

  // Try dynamic first (all pages). Fallback to static fetch.
  async function loadPageResilient(url, readySelector) {
    const dyn = await loadDynamicPage(url, 9000, readySelector);
    if (dyn) return dyn;
    return await loadStaticPage(url);
  }

  // ---------- Worker wiring & cache ----------
  let worker = null;
  let workerReady = false;
  let pendingSuggestResolver = null;
  let pendingResultsResolver = null;

  function startWorker() {
    try {
      worker = new Worker('js/search.worker.js');
      worker.onmessage = (e) => {
        const { type } = e.data || {};
        if (type === 'PONG') workerReady = true;
        if (type === 'BUILT') { workerReady = true; }
        if (type === 'RESULTS') {
          if (pendingSuggestResolver) { pendingSuggestResolver(e.data.items || []); pendingSuggestResolver = null; }
          else if (pendingResultsResolver) { pendingResultsResolver(e.data.items || []); pendingResultsResolver = null; }
        }
      };
      worker.postMessage({ type: 'PING' });
    } catch (_) { /* ignore */ }
  }
  startWorker();

  function queryWorker(q, { limit=50 } = {}) {
    return new Promise(resolve => {
      if (!worker) { resolve([]); return; }
      pendingSuggestResolver = resolve; // the caller sets which resolver is active
      worker.postMessage({ type:'QUERY', q, limit });
    });
  }

  // ---------- build index (site-wide, always fresh) ----------
  async function loadIndex() {
    if (indexData) return indexData;

    // 1) Start with a small seed set (top-level pages)
    const SEED_PAGES = [
      'index.html','about-glance.html','hod-desk.html',
      'faculty.html','staff.html','students.html','alumni.html',
      'research.html','programs.html','academic_docs.html','academics.html',
      'opportunities.html','links.html','documents.html',
      'gallery.html','committees.html'
    ];

    // 2) Discover the rest (internal links crawl)
    let PAGES = await discoverPages(SEED_PAGES, 300);
    SEED_PAGES.forEach(p => { if (!PAGES.includes(p)) PAGES.unshift(p); });

    const index = [];
    for (const page of PAGES) {
      try {
        const loaded = await loadPageResilient(page /* readySelector optional */);
        if (!loaded) { log('Skip (load failed)', page); continue; }

        const { doc, url } = loaded;
        const lower = url.toLowerCase();

        if (/faculty\.html(\?|$)/.test(lower) || /staff\.html(\?|$)/.test(lower) || /students\.html(\?|$)/.test(lower)) {
          // people pages: rich generic + detailed people items
          index.push(...extractGeneric(doc, url.split('#')[0]));
          let baseTag = 'faculty', titlePrefix = 'Faculty';
          if (/staff\.html/.test(lower))   { baseTag = 'staff';   titlePrefix = 'Staff'; }
          if (/students\.html/.test(lower)){ baseTag = 'student'; titlePrefix = 'Student'; }
          index.push(...extractPeople(doc, url, baseTag, titlePrefix));
        } else if (/index\.html/.test(lower)) {
          // home page: generic + Announcements/Seminars/Publications + Spotlight
          index.push(...extractGeneric(doc, 'index.html'));
          ['announcements','seminars-events','publications','spotlight','spotlights'].forEach(id => {
            const el = doc.getElementById(id);
            if (!el) return;
            const titleMap = {
              'announcements': 'Announcements',
              'seminars-events': 'Seminars & Events',
              'publications': 'Recent Publications',
              'spotlight': 'Spotlight',
              'spotlights': 'Spotlight'
            };
            const t = titleMap[id] || id;
            const text = (el.textContent || '').trim().slice(0, 240);
            index.push({
              title: `${t}`,
              title_lc: norm(t),
              url: `index.html#${id}`,
              tags: ['home', id],
              snippet: text,
              content: norm(text)
            });
          });
        } else {
          // every other page: rich generic extraction
          index.push(...extractGeneric(doc, page));
        }
      } catch (e) {
        log('Skip', page, e && e.message);
      }
    }

    // Manual virtual page
    index.push({
      title: 'Room booking',
      title_lc: 'room booking',
      url: '#',
      tags: ['room','booking','reservation','resources'],
      snippet: 'Reserve seminar rooms and departmental facilities.',
      content: 'room booking portal; reserve rooms; room reservation; departmental facilities booking.'
    });

    indexData = index;

    // Build local Fuse (fallback) and Worker index
    fuse = new FuseCtor(indexData, {
      includeScore: true,
      minMatchCharLength: 2,
      threshold: 0.45,      // relaxed for short names (kept)
      ignoreLocation: true,
      keys: [
        { name: 'title_lc', weight: 0.5 },
        { name: 'content',  weight: 0.35 },
        { name: 'tags',     weight: 0.15 }
      ]
    });

    // Persist to localStorage for warm reloads (BUMP v => reindex)
    try {
      const payload = { v: '1.0.2', ts: Date.now(), index: indexData };
      localStorage.setItem('siteSearchIndex', JSON.stringify(payload));
    } catch (_) {}

    // Build worker index
    try {
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
    } catch (_) {}

    return indexData;
  }

  // ---------- substring fallback ----------
  function fallbackFilter(query) {
    const q = norm(query);
    return (indexData || []).filter(it => {
      const inTitle = (it.title_lc || '').includes(q);
      const inTags  = (it.tags || []).some(t => (t || '').includes(q));
      const inBody  = (it.content || '').includes(q);
      return inTitle || inTags || inBody;
    });
  }

  // ---------- UI ----------
  function renderSuggestion(items) {
    if (!suggest) return;
    if (!items.length) {
      suggest.classList.remove('show');
      suggest.style.display = 'none';
      suggest.innerHTML = '';
      return;
    }
    const q = (input && input.value) || '';
    suggest.innerHTML = items.map(it => {
      const s   = ((it.snippet || it.content || '')).slice(0, 120);
      const url = it.url || '#';
      const { key, label } = getType(it);
      const anchorPill = hasAnchor(url) ? `<span class="srch-pill" title="Jump to section">↪</span>` : '';
      return `
        <a href="${url}" class="srch-suggest-row" style="display:flex;gap:10px;padding:10px;text-decoration:none;color:#222;border-bottom:1px solid #eee;align-items:flex-start">
          <span class="srch-badge srch-badge--${key}" aria-label="${label}">${label}</span>
          <span style="flex:1 1 auto;min-width:0">
            <div style="font-weight:600;margin-bottom:2px">${highlight(it.title, q)}</div>
            <div style="font-size:12px;color:#666">${highlight(s, q)}…</div>
            <div style="font-size:11px;color:#999">${esc(url)} ${anchorPill}</div>
          </span>
        </a>`;
    }).join('');
    suggest.style.display = 'block';
    requestAnimationFrame(() => suggest.classList.add('show')); // animated reveal
  }

  // keyboard nav for suggestions
  let selIdx = -1;
  function moveSel(delta) {
    if (!suggest || !suggest.children.length) return;
    selIdx = (selIdx + delta + suggest.children.length) % suggest.children.length;
    [...suggest.children].forEach((n,i) => {
      n.style.background = i === selIdx ? 'rgba(0,0,0,.05)' : 'transparent';
    });
  }
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
      else if (e.key === 'Enter' && selIdx >= 0 && suggest && suggest.children[selIdx]) {
        e.preventDefault();
        const a = suggest.children[selIdx];
        const href = a.getAttribute('href') || (a.querySelector('a') && a.querySelector('a').getAttribute('href'));
        if (href) window.location.href = href;
      }
    });
  }

  async function runResultsPage() {
    if (!isResultsPage) return;
    await loadIndex();
    const params = new URLSearchParams(location.search);
    const query  = (params.get('q') || '').trim();
    if (qEl) qEl.textContent = query ? `for “${query}”` : '';
    if (!query) { outEl && (outEl.innerHTML = `<p>No query given.</p>`); return; }

    statusEl && (statusEl.textContent = 'Searching…');
    if (outEl) {
      outEl.innerHTML = `
        <div class="skel" style="height:18px;width:40%;margin:8px 0;border-radius:4px;"></div>
        <div class="skel" style="height:12px;width:85%;margin:8px 0;border-radius:4px;"></div>
        <div class="skel" style="height:12px;width:78%;margin:8px 0;border-radius:4px;"></div>
      `;
    }

    // route results to a resolver
    pendingResultsResolver = (items) => {
      if (!items.length) items = fallbackFilter(query);

      // Prefer people for name-like queries
      if (isNameish(query, { allowSingle: true })) {
        items = sortForNameQuery(items, query);
      }

      statusEl && (statusEl.textContent = '');
      if (!items.length) { outEl && (outEl.innerHTML = `<p>No results found.</p>`); return; }

      outEl && (outEl.innerHTML = items.map(item => {
        const s = (item.snippet || item.content || '').slice(0, 180);
        const { key, label } = getType(item);
        const jump = hasAnchor(item.url) ? `<a href="${item.url}" class="srch-pill" style="margin-left:6px" title="Jump to section">Jump ↪</a>` : '';
        return `<article class="search-result" style="padding:12px 0;border-bottom:1px solid #eee">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <span class="srch-badge srch-badge--${key}">${label}</span>
            <div style="flex:1 1 auto;min-width:0">
              <h3 style="margin:0 0 6px 0;font-size:18px"><a href="${item.url}">${highlight(item.title, query)}</a>${jump}</h3>
              <div style="font-size:13px;color:#555">${highlight(s, query)}…</div>
              <div style="font-size:12px;color:#888">${esc(item.url)}</div>
            </div>
          </div>
        </article>`;
      }).join(''));
    };

    if (worker) {
      worker.postMessage({ type: 'QUERY', q: query, limit: 50 });
    } else {
      let results = (fuse && fuse.search ? fuse.search(norm(query), { limit: 50 }) : []).map(r => r.item);
      pendingResultsResolver(results);
    }
  }

  (async function init() {
    try {
      // Warm start from cache (non-blocking) so UI is instant
      (function tryWarmStart() {
        try {
          const raw = localStorage.getItem('siteSearchIndex');
          if (!raw) return;
          const data = JSON.parse(raw);
          if (data && Array.isArray(data.index) && data.index.length) {
            indexData = data.index;
            // build worker index immediately
            if (worker) worker.postMessage({
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
        } catch (_) {}
      })();

      if (form && input) {
        await loadIndex();

        const liveSearch = debounce(() => {
          const q = input.value.trim();
          if (q.length < 2) { renderSuggestion([]); return; }

          const oldPh = input.getAttribute('placeholder') || '';
          input.setAttribute('data-ph', oldPh);
          input.setAttribute('placeholder', 'Searching…');

          if (worker) {
            queryWorker(q, { limit: 10 }).then(items => {
              if (!items.length) items = fallbackFilter(q).slice(0,10);
              // Prefer people in suggestions when name-like
              if (isNameish(input.value, { allowSingle: true })) {
                items = sortForNameQuery(items, input.value);
              }
              renderSuggestion(items);
              input.setAttribute('placeholder', oldPh);
            });
          } else {
            let items = (fuse && fuse.search ? fuse.search(norm(q)) : []).slice(0, 10).map(r => r.item);
            if (!items.length) items = fallbackFilter(q).slice(0, 10);
            if (isNameish(input.value, { allowSingle: true })) {
              items = sortForNameQuery(items, input.value);
            }
            renderSuggestion(items);
            input.setAttribute('placeholder', oldPh);
          }
        }, 150);

        input.addEventListener('input', liveSearch);

        // Enter -> full results page (when no selection)
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && selIdx === -1) {
            const q = input.value.trim();
            if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
          }
        });

        // click-away to close suggestions
        document.addEventListener('click', e => {
          if (!form.contains(e.target)) renderSuggestion([]);
        });
      }

      runResultsPage();
    } catch (e) {
      onError(e);
    }
  })();
})();
