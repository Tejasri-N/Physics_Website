(function () {
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
  const slug = s => (s || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/gi, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .toLowerCase();

  // allowSingle: true lets single capitalized names (≥4 chars) pass (for students/staff)
  function isNameish(s, { allowSingle = false } = {}) {
    if (!s) return false;
    const parts = s.replace(/[(),;:/\-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    const caps  = parts.filter(w => /^[A-Z][A-Za-z.\-']+$/.test(w));
    if (caps.length >= 2 && caps.length <= 4) return true; // "A B", "A B C"
    if (allowSingle && caps.length === 1 && /^[A-Z][A-Za-z.\-']{3,}$/.test(parts[0])) return true; // "Chengappa"
    return false;
  }

  const debounce = (fn, ms=150) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  // ---------- extractors ----------
  function extractGeneric(doc, url) {
    const rawTitle = getText(doc.querySelector('title')) || url;
    const title    = rawTitle.replace(/\s*\|\s*.*$/, '');
    const title_lc = title.toLowerCase();

    const metaDesc = getText(doc.querySelector('meta[name="description"]'));
    const h1       = getText(doc.querySelector('h1'));
    const p        = getText(doc.querySelector('main p, .page-container p, p'));

    const snippet  = (metaDesc || p || h1 || title).slice(0, 180);
    const content  = [metaDesc, h1, p].filter(Boolean).join(' ').slice(0, 1200).toLowerCase();

    return {
      title,
      url: url.replace(/^\/+/, ''),
      snippet,
      title_lc,
      tags: Array.from(new Set([
        ...title_lc.split(/\W+/).slice(0, 8),
        ...((h1 || '').toLowerCase().split(/\W+/).slice(0, 8))
      ].filter(Boolean))),
      content
    };
  }

  function extractPeople(doc, pageHref, baseTag, titlePrefix) {
    const list = [];
    const pageURL = pageHref.split('#')[0];
    const okName = (name) => isNameish(name, { allowSingle: baseTag !== 'faculty' });

    const pushItem = (name, id, role, areas, extra='') => {
      if (!name) return;
      const displayTitle = `${titlePrefix}: ${name}`;
      const snippet = (role || areas || extra || `Profile of ${name}.`).slice(0,160);
      const content = [role, areas, extra].filter(Boolean).join(' ').slice(0,1200).toLowerCase();

      list.push({
        title: displayTitle,
        url: `${pageURL}#${id}`,
        snippet,
        title_lc: displayTitle.toLowerCase(),
        tags: Array.from(new Set([
          baseTag,
          ...name.toLowerCase().split(/\s+/),
          ...(areas ? areas.toLowerCase().split(/[,;/]\s*|\s+/) : [])
        ])),
        content
      });
    };

    // Optional hidden student data nodes
    const nodes = doc.querySelectorAll('#studentData [data-name]');
    nodes.forEach(node => {
      const name   = cleanText(node.getAttribute('data-name'));
      if (!name) return;
      const enroll = cleanText(node.getAttribute('data-enroll') || '');
      const id     = node.id || `student-${slug(`${name}-${enroll || ''}`)}`;
      if (!node.id) node.id = id;
      const role   = enroll ? `Enrollment: ${enroll}` : '';
      pushItem(name, id, role, '', '');
    });

    // Card-like profiles
    const cards = doc.querySelectorAll(
      '.faculty-card, .faculty-member, .profile-card, .person, .member, .card, .profile, .fac-card, .member-card, .staff-card, .staff-member, .staff, .student-card, .student'
    );
    cards.forEach(card => {
      const nameEl = card.querySelector('h1,h2,h3,h4,h5,.member-name,.name,.staff-name,.student-name');
      const name   = cleanText(nameEl ? nameEl.textContent : card.textContent);
      if (!name || !okName(name)) return;
      const id     = card.id || ('person-' + slug(name));
      const role   = cleanText(card.querySelector('.role,.designation,.title')?.textContent);
      const areas  = cleanText(card.querySelector('.areas,.research,.research-areas,.interests')?.textContent);
      const firstP = cleanText(card.querySelector('p')?.textContent);
      pushItem(name, id, role, areas, firstP);
    });

    // Tables
    const rows = doc.querySelectorAll('table tr');
    rows.forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('th,td')).map(td => cleanText(td.textContent)).filter(Boolean);
      if (!cells.length) return;
      const first = cells[0]; if (!okName(first)) return;
      const name = first;
      const id   = tr.id || ('person-' + slug(name));
      const role = cells.slice(1).find(t => /(prof|assistant|associate|lecturer|scientist|postdoc|staff|student)/i.test(t)) || '';
      const areas= cells.slice(1).find(t => /(research|area|interests|topics|group)/i.test(t)) || '';
      const extra= cells.slice(1).join(' ').slice(0,800);
      pushItem(name, id, role, areas, extra);
    });

    // Bulleted lists
    const items = doc.querySelectorAll('ul li, ol li');
    items.forEach(li => {
      const line = cleanText(li.textContent);
      if (!line || line.length < 5) return;
      const firstChunk = cleanText(line.split(/[–—\-•|:;]\s*/)[0]);
      if (!okName(firstChunk)) return;
      const name = firstChunk;
      const id   = li.id || ('person-' + slug(name));
      const rest = cleanText(line.slice(firstChunk.length));
      pushItem(name, id, '', '', rest);
    });

    return list;
  }

  // ---------- loaders ----------
  function loadDynamicPage(url, timeoutMs = 8000) {
    return new Promise(resolve => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      // cache-bust to avoid stale DOM
      iframe.src = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
      const finish = () => {
        try {
          const doc = iframe.contentDocument;
          resolve(doc ? { url, doc } : null);
        } catch { resolve(null); }
        requestAnimationFrame(() => iframe.remove());
      };
      iframe.onload = finish;
      setTimeout(finish, timeoutMs);
      document.body.appendChild(iframe);
    });
  }

  async function loadStaticPage(url) {
    // cache-bust to avoid stale HTML
    const bust = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    const res = await fetch(bust, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return { url, doc };
  }

  // ---------- build index (always fresh) ----------
  async function loadIndex() {
    if (indexData) return indexData;

    const PAGES = [
      'index.html','about-glance.html','hod-desk.html',
      'faculty.html','staff.html','students.html','alumni.html',
      'research.html?tab=Research__areas','research.html?tab=Research__Labs','research.html?tab=Physics',
      'programs.html','academic_docs.html','opportunities.html',
      'links.html','documents.html','gallery.html','committees.html'
    ];
    const DYNAMIC_PAGES = ['faculty.html','staff.html','students.html'];

    const index = [];
    for (const page of PAGES) {
      try {
        const useIframe = DYNAMIC_PAGES.some(p => page.startsWith(p));
        const loaded = await (useIframe ? loadDynamicPage(page) : loadStaticPage(page));
        if (!loaded) { console.warn('Skip (load failed)', page); continue; }
        const { doc, url } = loaded;

        const lower = url.toLowerCase();
        if (/faculty\.html(\?|$)/.test(lower) || /staff\.html(\?|$)/.test(lower) || /students\.html(\?|$)/.test(lower)) {
          index.push(extractGeneric(doc, url.split('#')[0]));
          let baseTag = 'faculty', titlePrefix = 'Faculty';
          if (/staff\.html/.test(lower))   { baseTag = 'staff';   titlePrefix = 'Staff'; }
          if (/students\.html/.test(lower)){ baseTag = 'student'; titlePrefix = 'Student'; }
          index.push(...extractPeople(doc, url, baseTag, titlePrefix));
        } else if (/index\.html/.test(lower)) {
          index.push(extractGeneric(doc, 'index.html'));
          ['announcements','seminars-events','publications'].forEach(id => {
            const el = doc.getElementById(id);
            if (!el) return;
            const titleMap = { 'announcements': 'Announcements', 'seminars-events': 'Seminars & Events', 'publications': 'Recent Publications' };
            const t = titleMap[id] || id;
            const text = getText(el).slice(0, 240);
            index.push({
              title: t,
              title_lc: (t || '').toLowerCase(),
              url: `index.html#${id}`,
              tags: ['home', id],
              snippet: text,
              content: (text || '').toLowerCase()
            });
          });
        } else {
          index.push(extractGeneric(doc, page));
        }
      } catch (e) {
        console.warn('Skip', page, e.message);
      }
    }

    // Manual entries (virtual pages)
    index.push({
      title: 'Room booking',
      title_lc: 'room booking',
      url: '#',
      tags: ['room','booking','reservation','resources'],
      snippet: 'Reserve seminar rooms and departmental facilities.',
      content: 'room booking portal; reserve rooms; room reservation; departmental facilities booking.'
    });

    indexData = index;

    fuse = new Fuse(indexData, {
      includeScore: true,
      minMatchCharLength: 2,
      threshold: 0.35,
      ignoreLocation: true,
      keys: [
        { name: 'title_lc', weight: 0.5 },
        { name: 'content',  weight: 0.35 },
        { name: 'tags',     weight: 0.15 }
      ]
    });

    return indexData;
  }

  // ---------- UI ----------
  function renderSuggestion(items) {
    if (!suggest) return;
    if (!items.length) { suggest.style.display = 'none'; suggest.innerHTML = ''; return; }
    suggest.innerHTML = items.map(it => {
      const s = (it.snippet || it.content || '').slice(0, 120) + '…';
      const url = it.url || '#';
      return `<a href="${url}" style="display:block;padding:10px;text-decoration:none;color:#222;border-bottom:1px solid #eee">
        <div style="font-weight:600">${it.title}</div>
        <div style="font-size:12px;color:#666">${s}</div>
        <div style="font-size:11px;color:#999">${url}</div>
      </a>`;
    }).join('');
    suggest.style.display = 'block';
  }

  async function runResultsPage() {
    if (!isResultsPage) return;
    await loadIndex();
    const params = new URLSearchParams(location.search);
    const query  = (params.get('q') || '').trim();
    if (qEl) qEl.textContent = query ? `for “${query}”` : '';
    if (!query) { outEl.innerHTML = `<p>No query given.</p>`; return; }

    if (statusEl) statusEl.textContent = 'Searching…';
    await new Promise(r => setTimeout(r, 30)); // let UI paint

    const matches = fuse.search(query.toLowerCase(), { limit: 50 });
    if (statusEl) statusEl.textContent = '';
    if (!matches.length) { outEl.innerHTML = `<p>No results found.</p>`; return; }

    outEl.innerHTML = matches.map(({ item }) => {
      const s = (item.snippet || item.content || '').slice(0, 180) + '…';
      return `<article class="search-result" style="padding:10px 0;border-bottom:1px solid #eee">
        <h3 style="margin:0 0 6px 0"><a href="${item.url}">${item.title}</a></h3>
        <div style="font-size:13px;color:#555">${s}</div>
        <div style="font-size:12px;color:#888">${item.url}</div>
      </article>`;
    }).join('');
  }

  (async function init() {
    if (form && input) {
      await loadIndex(); // ensure fuse ready

      const liveSearch = debounce(() => {
        const q = input.value.trim();
        if (q.length < 2) { renderSuggestion([]); return; }

        // light feedback via placeholder
        const oldPh = input.getAttribute('placeholder') || '';
        input.setAttribute('data-ph', oldPh);
        input.setAttribute('placeholder', 'Searching…');

        const items = fuse.search(q.toLowerCase()).slice(0, 10).map(r => r.item);
        renderSuggestion(items);

        input.setAttribute('placeholder', oldPh);
      }, 150);

      input.addEventListener('input', liveSearch);

      // Enter -> go to full results page
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
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
  })();
})();
