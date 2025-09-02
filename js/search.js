<!-- /js/search.js -->
<script>
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

  const debounce = (fn, ms=150) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  // ---------- extractors ----------
  function extractGeneric(doc, url) {
    const rawTitle = getText(doc.querySelector('title')) || url;
    const title    = rawTitle.replace(/\s*\|\s*.*$/, '');
    const title_lc = norm(title);

    const metaDesc = getText(doc.querySelector('meta[name="description"]'));
    const h1       = getText(doc.querySelector('h1'));
    const p        = getText(doc.querySelector('main p, .page-container p, p'));

    const snippet  = (metaDesc || p || h1 || title).slice(0, 180);
    const content  = norm([metaDesc, h1, p].filter(Boolean).join(' ').slice(0, 1200));

    return {
      // display fields
      title,
      url: url.replace(/^\/+/, ''),
      snippet,
      // search fields
      title_lc,
      tags: Array.from(new Set([
        ...title_lc.split(/\W+/).slice(0, 8),
        ...norm(h1 || '').split(/\W+/).slice(0, 8)
      ].filter(Boolean))),
      content
    };
  }

  function extractPeople(doc, pageHref, baseTag, titlePrefix) {
    const list = [];
    const pageURL = pageHref.split('#')[0];

    const pushItem = (name, id, role, areas, extra='') => {
      if (!name) return;
      const displayTitle = `${titlePrefix}: ${name}`;
      const snippet = (role || areas || extra || `Profile of ${name}.`).slice(0,160);

      const content = norm([role, areas, extra].filter(Boolean).join(' ').slice(0,1200));
      const ntokens = [norm(name)];
      const atokens = areas ? norm(areas).split(/[,;/]\s*|\s+/) : [];

      list.push({
        // display
        title: displayTitle,
        url: `${pageURL}#${id}`,
        snippet,
        // search
        title_lc: norm(displayTitle),
        tags: Array.from(new Set([baseTag, ...ntokens, ...atokens].filter(Boolean))),
        content
      });
    };

    // hidden student data
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

    // Cards (faculty/staff/student cards)
    const cards = doc.querySelectorAll(
      '.faculty-card, .faculty-member, .profile-card, .person, .member, .card, .profile, .fac-card, .member-card, .staff-card, .staff-member, .staff, .student-card, .student'
    );
    cards.forEach(card => {
      const nameEl = card.querySelector(
        'h1,h2,h3,h4,h5,' +
        '.member-name,.name,.staff-name,.student-name,' +
        '.faculty-name,.faculty-profile'
      );
      const raw   = nameEl ? nameEl.textContent : card.textContent;
      const name  = cleanText(raw);
      if (!name) return;

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
      const first = cells[0];
      if (!first) return;
      const name = first;
      const id   = tr.id || ('person-' + slug(name));
      const role = cells.slice(1).find(t => /(prof|assistant|associate|lecturer|scientist|postdoc|staff|student)/i.test(t)) || '';
      const areas= cells.slice(1).find(t => /(research|area|interests|topics|group)/i.test(t)) || '';
      const extra= cells.slice(1).join(' ').slice(0,800);
      pushItem(name, id, role, areas, extra);
    });

    // Lists
    const items = doc.querySelectorAll('ul li, ol li');
    items.forEach(li => {
      const line = cleanText(li.textContent);
      if (!line || line.length < 3) return;
      const firstChunk = cleanText(line.split(/[–—\-•|:;]\s*/)[0]);
      const name = firstChunk;
      const id   = li.id || ('person-' + slug(name));
      const rest = cleanText(line.slice(firstChunk.length));
      pushItem(name, id, '', '', rest);
    });

    return list;
  }

  // ---------- loaders ----------
  async function loadStaticPage(url) {
    const bust = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    const res = await fetch(bust, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return { url, doc };
  }

  async function loadIndex() {
    if (indexData) return indexData;

    const PAGES = [
      'index.html','about-glance.html','hod-desk.html',
      'faculty.html','staff.html','students.html','alumni.html',
      'research.html?tab=Research__areas','research.html?tab=Research__Labs','research.html?tab=Physics',
      'programs.html','academic_docs.html','opportunities.html',
      'links.html','documents.html','gallery.html','committees.html'
    ];

    const index = [];
    for (const page of PAGES) {
      try {
        const loaded = await loadStaticPage(page);
        if (!loaded) continue;

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
        } else {
          index.push(extractGeneric(doc, page));
        }
      } catch (e) {
        console.warn('Skip', page, e.message);
      }
    }

    // Manual entries
    index.push({
      title: 'Room booking',
      title_lc: 'room booking',
      url: '#',
      tags: ['room','booking','reservation','resources'],
      snippet: 'Reserve seminar rooms and departmental facilities.',
      content: 'room booking portal; reserve rooms; room reservation; departmental facilities booking.'
    });

    indexData = index;

    // 🔑 Fuse.js relaxed config
    fuse = new Fuse(indexData, {
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

    return indexData;
  }

  // ---------- fallback search ----------
  function fallbackFilter(query) {
    const q = norm(query);
    return (indexData || []).filter(it => {
      return (
        (it.title_lc || '').includes(q) ||
        (it.content || '').includes(q) ||
        (it.tags || []).some(t => (t || '').includes(q))
      );
    });
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
    await new Promise(r => setTimeout(r, 30));

    let results = fuse.search(norm(query), { limit: 50 }).map(r => r.item);
    if (!results.length) results = fallbackFilter(query);

    if (statusEl) statusEl.textContent = '';
    if (!results.length) { outEl.innerHTML = `<p>No results found.</p>`; return; }

    outEl.innerHTML = results.map(item => {
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
      await loadIndex();

      const liveSearch = debounce(() => {
        const q = input.value.trim();
        if (q.length < 2) { renderSuggestion([]); return; }

        const oldPh = input.getAttribute('placeholder') || '';
        input.setAttribute('data-ph', oldPh);
        input.setAttribute('placeholder', 'Searching…');

        let items = fuse.search(norm(q)).slice(0, 10).map(r => r.item);
        if (!items.length) items = fallbackFilter(q).slice(0, 10);

        renderSuggestion(items);
        input.setAttribute('placeholder', oldPh);
      }, 150);

      input.addEventListener('input', liveSearch);

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = input.value.trim();
          if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
        }
      });

      document.addEventListener('click', e => {
        if (!form.contains(e.target)) renderSuggestion([]);
      });
    }

    runResultsPage();
  })();
})();
</script>

