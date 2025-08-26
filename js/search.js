// /js/search.js
(function () {
  const form    = document.getElementById('site-search');
  const input   = document.getElementById('search-input');
  const suggest = document.getElementById('search-suggest');

  const isResultsPage = /\/?search\.html$/.test(location.pathname);
  const outEl = document.getElementById('srch-out');
  const qEl   = document.getElementById('srch-q');

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

  const isNameish = s => {
    if (/^\s*(prof|professor|dr|mr|mrs|ms|shri|smt|sir|madam)\b/i.test(s)) return true;
    const parts = s.replace(/[(),;:/\-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    return parts.length >= 2 && parts.length <= 4;
  };

  // graceful error display (so the page never stays blank)
  function showError(msg) {
    if (!outEl) return;
    outEl.innerHTML = `<div style="padding:12px;border:1px solid #f0c36d;background:#fff8e1;border-radius:8px">⚠️ ${msg}</div>`;
  }

  if (!window.Fuse) {
    // Fuse failed to load: do not crash – show a helpful message and bail.
    if (isResultsPage) showError('Search library failed to load. Please check that Fuse.js is included before js/search.js.');
    return;
  }

  function extractGeneric(doc, url) {
    const rawTitle = getText(doc.querySelector('title')) || url;
    const title    = rawTitle.replace(/\s*\|\s*.*$/, '');
    const metaDesc = getText(doc.querySelector('meta[name="description"]'));
    const h1       = getText(doc.querySelector('h1'));
    const p        = getText(doc.querySelector('main p, .page-container p, p'));
    const snippet  = (metaDesc || p || h1 || title).slice(0, 180);
    const content  = [metaDesc, h1, p].filter(Boolean).join(' ').slice(0, 900);
    return {
      title,
      url: url.replace(/^\/+/, ''),
      tags: Array.from(new Set([
        ...title.toLowerCase().split(/\W+/).slice(0, 8),
        ...((h1 || '').toLowerCase().split(/\W+/).slice(0, 8))
      ].filter(Boolean))),
      snippet,
      content
    };
  }

  function extractPeople(doc, pageHref, baseTag, titlePrefix) {
    const list = [];
    const pageURL = pageHref.split('#')[0];

    const pushItem = (name, id, role, areas, extra='') => {
      if (!name) return;
      const snippet = (role || areas || extra || `Profile of ${name}.`).slice(0,160);
      const content = [role, areas, extra].filter(Boolean).join(' ').slice(0,900);
      list.push({
        title: `${titlePrefix}: ${name}`,
        url: `${pageURL}#${id}`,
        tags: Array.from(new Set([baseTag, ...name.toLowerCase().split(/\s+/),
          ...(areas ? areas.toLowerCase().split(/[,;/]\s*|\s+/) : [])])),
        snippet, content
      });
    };

    // Students: look for hidden data nodes (data-name + optional data-enroll)
    if (baseTag === 'student') {
      const nodes = doc.querySelectorAll('#studentData [data-name]');
      nodes.forEach(node => {
        const name   = cleanText(node.getAttribute('data-name'));
        const enroll = cleanText(node.getAttribute('data-enroll') || '');
        if (!name) return;
        const id = node.id || `student-${slug(`${name}-${enroll || ''}`)}`;
        if (!node.id) node.id = id;
        const role = enroll ? `Enrollment: ${enroll}` : '';
        pushItem(name, id, role, '', '');
      });
      if (list.length) return list;
    }

    // Cards (faculty/staff)
    const cards = doc.querySelectorAll(
      '.faculty-card, .faculty-member, .profile-card, .person, .member, .card, .profile, .fac-card, .member-card, .staff-card, .staff-member, .staff'
    );
    cards.forEach(card => {
      const nameEl = card.querySelector('h1,h2,h3,h4,h5,.member-name,.name,.staff-name');
      const name   = cleanText(nameEl ? nameEl.textContent : card.textContent);
      if (!name || !isNameish(name)) return;
      const id   = card.id || ('person-' + slug(name));
      const role = cleanText(card.querySelector('.role,.designation,.title')?.textContent);
      const areas= cleanText(card.querySelector('.areas,.research,.research-areas,.interests')?.textContent);
      const firstP = cleanText(card.querySelector('p')?.textContent);
      pushItem(name, id, role, areas, firstP);
    });
    if (list.length) return list;

    // Tables
    const rows = doc.querySelectorAll('table tr');
    rows.forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('th,td')).map(td => cleanText(td.textContent)).filter(Boolean);
      if (!cells.length) return;
      const first = cells[0]; if (!isNameish(first)) return;
      const name = first;
      const id   = tr.id || ('person-' + slug(name));
      const role = cells.slice(1).find(t => /(prof|assistant|associate|lecturer|scientist|postdoc|staff|student)/i.test(t)) || '';
      const areas= cells.slice(1).find(t => /(research|area|interests|topics|group)/i.test(t)) || '';
      const extra= cells.slice(1).join(' ').slice(0,600);
      pushItem(name, id, role, areas, extra);
    });

    // Lists
    const items = doc.querySelectorAll('ul li, ol li');
    items.forEach(li => {
      const line = cleanText(li.textContent);
      if (!line || line.length < 5) return;
      const firstChunk = cleanText(line.split(/[–—\-•|:;]\s*/)[0]);
      if (!isNameish(firstChunk)) return;
      const name = firstChunk;
      const id   = li.id || ('person-' + slug(name));
      const rest = cleanText(line.slice(firstChunk.length));
      pushItem(name, id, '', '', rest);
    });

    return list;
  }

  function loadDynamicPage(url, timeoutMs = 8000) {
    return new Promise(resolve => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
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
    const res = await fetch(url, { cache: 'no-store' });
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
            const titleMap = {
              'announcements': 'Announcements',
              'seminars-events': 'Seminars & Events',
              'publications': 'Recent Publications'
            };
            const t = titleMap[id] || id;
            const text = getText(el).slice(0, 240);
            index.push({ title: t, url: `index.html#${id}`, tags: ['home', id], snippet: text, content: text });
          });
        } else {
          index.push(extractGeneric(doc, page));
        }
      } catch (e) {
        console.warn('Skip', page, e.message);
      }
    }

    indexData = index;
    fuse = new Fuse(indexData, {
      includeScore: true, minMatchCharLength: 2, threshold: 0.5,
      keys: [{ name: 'title', weight: 0.5 }, { name: 'content', weight: 0.35 }, { name: 'tags', weight: 0.15 }]
    });
    return indexData;
  }

  function renderSuggestion(items) {
    if (!suggest) return;
    if (!items.length) { suggest.style.display = 'none'; suggest.innerHTML = ''; return; }
    suggest.innerHTML = items.map(it => {
      const s = (it.snippet || it.content || '').slice(0, 120) + '…';
      return `<a href="${it.url}" style="display:block;padding:10px;text-decoration:none;color:#222">
        <div style="font-weight:600">${it.title}</div>
        <div style="font-size:12px;color:#666">${s}</div>
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

    const matches = fuse.search(query, { limit: 50 });
    if (!matches.length) { outEl.innerHTML = `<p>No results found.</p>`; return; }

    outEl.innerHTML = matches.map(({ item }) => {
      const s = (item.snippet || item.content || '').slice(0, 180) + '…';
      return `<article class="search-result">
        <h3><a href="${item.url}">${item.title}</a></h3>
        <div style="font-size:13px;color:#555">${s}</div>
        <div style="font-size:12px;color:#888">${item.url}</div>
      </article>`;
    }).join('');
  }

  (async function init() {
    if (form && input) {
      await loadIndex();
      input.addEventListener('input', e => {
        const q = e.target.value.trim();
        if (q.length < 2) { suggest.style.display='none'; suggest.innerHTML=''; }
        else {
          const items = fuse.search(q).slice(0, 8).map(r => r.item);
          if (!items.length) { suggest.style.display='none'; suggest.innerHTML=''; }
          else {
            suggest.innerHTML = items.map(it => {
              const s = (it.snippet || it.content || '').slice(0,120) + '…';
              return `<a href="${it.url}" style="display:block;padding:10px;text-decoration:none;color:#222">
                <div style="font-weight:600">${it.title}</div>
                <div style="font-size:12px;color:#666">${s}</div>
              </a>`;
            }).join('');
            suggest.style.display='block';
          }
        }
      });
      document.addEventListener('click', e => {
        if (!form.contains(e.target)) { suggest.style.display='none'; suggest.innerHTML=''; }
      });
    }
    runResultsPage();
  })();
})();
