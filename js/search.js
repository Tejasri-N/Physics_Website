// /js/search.js
(function(){
  const form    = document.getElementById('site-search');
  const input   = document.getElementById('search-input');
  const suggest = document.getElementById('search-suggest');

 const isResultsPage = /\/?search\.html$/.test(location.pathname);

  const outEl   = document.getElementById('srch-out');
  const qEl     = document.getElementById('srch-q');

  let fuse = null, indexData = null;

 async function loadIndex(){
  if (indexData) return indexData;

  const CACHE_KEY = 'site-search-index-v1';
  const CACHE_AT  = 'site-search-index-updated-at';
  const MAX_AGE_MS = 24*60*60*1000; // 24h

  // 0) Try cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const at = parseInt(localStorage.getItem(CACHE_AT) || '0', 10);
    if (cached && Date.now() - at < MAX_AGE_MS) {
      indexData = JSON.parse(cached);
      fuse = new Fuse(indexData, {
        includeScore:true, minMatchCharLength:2, threshold:0.35,
        keys:[ {name:'title',weight:0.5}, {name:'content',weight:0.35}, {name:'tags',weight:0.15} ]
      });
      return indexData;
    }
  } catch {}

  // 1) Try prebuilt JSON (fast path if you keep searchIndex.json)
  try {
    const res = await fetch('searchIndex.json', { cache: 'no-store' });
    if (res.ok) {
      indexData = await res.json();
      fuse = new Fuse(indexData, {
        includeScore:true, minMatchCharLength:2, threshold:0.35,
        keys:[ {name:'title',weight:0.5}, {name:'content',weight:0.35}, {name:'tags',weight:0.15} ]
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(indexData));
      localStorage.setItem(CACHE_AT, String(Date.now()));
      return indexData;
    }
  } catch {}

  // 2) AUTO-BUILD: crawl same-origin pages and extract content
  const PAGES = [
    'index.html',
    'about-glance.html',
    'hod-desk.html',
    'faculty.html',
    'staff.html',
    'students.html',
    'alumni.html',
    'research.html?tab=Research__areas',
    'research.html?tab=Research__Labs',
    'research.html?tab=Physics',
    'programs.html',
    'academic_docs.html',
    'opportunities.html',
    'links.html',
    'documents.html',
    'gallery.html',
    'committees.html'
  ];

  const slug = s => s.toLowerCase()
    .replace(/&/g,' and ')
    .replace(/[^a-z0-9\s-]/g,'')
    .trim()
    .replace(/\s+/g,'-')
    .replace(/-+/g,'-');

  const getText = el => el ? el.textContent.replace(/\s+/g,' ').trim() : '';

  const fetchPage = async (url) => {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return { url, doc };
  };

  const extractGeneric = (doc, url) => {
    const rawTitle = getText(doc.querySelector('title')) || url;
    const title = rawTitle.replace(/\s*\|\s*.*$/,''); // strip suffix after |
    const metaDesc = getText(doc.querySelector('meta[name="description"]'));
    const h1 = getText(doc.querySelector('h1'));
    const p  = getText(doc.querySelector('main p, .page-container p, p'));
    const snippet = (metaDesc || p || h1 || title).slice(0, 180);
    const content = [metaDesc, h1, p].filter(Boolean).join(' ').slice(0, 900);
    return {
      title,
      url: url.replace(/^\/+/,''),
      tags: Array.from(new Set([
        ...title.toLowerCase().split(/\W+/).slice(0,8),
        ...((h1||'').toLowerCase().split(/\W+/).slice(0,8))
      ].filter(Boolean))),
      snippet,
      content
    };
  };

   // Helpers (put these above extractPeople)
const cleanText = s => (s || '').replace(/\s+/g,' ').trim();
const isNameish = s => {
  // catches Dr./Prof. or 2–4 capitalized words: "Prem Pal", "Manish K. Niranjan"
  if (/^\s*(prof|professor|dr|sir|madam)\b/i.test(s)) return true;
  const parts = s.replace(/[(),;:/\-]+/g,' ').trim().split(/\s+/).filter(Boolean);
  const caps  = parts.filter(w => /^[A-Z][a-zA-Z.\-']+$/.test(w));
  return caps.length >= 2 && caps.length <= 4;
};
   
 // REPLACE your extractPeople with this:
const extractPeople = (doc, pageHref) => {
  const list = [];
  const pageURL = pageHref.split('#')[0];

  // 1) Card-like containers (fast path)
  const cards = doc.querySelectorAll(
    '.faculty-card, .faculty-member, .profile-card, .person, .member, .card, .profile, .fac-card, .member-card'
  );
  cards.forEach((card, i) => {
    const nameEl = card.querySelector('h1,h2,h3,h4,h5,.member-name,.name');
    const name   = cleanText(nameEl ? nameEl.textContent : card.textContent);
    if (!name || !isNameish(name)) return;

    const role   = cleanText(card.querySelector('.role,.designation,.title')?.textContent);
    const areas  = cleanText(card.querySelector('.areas,.research,.research-areas,.interests')?.textContent);
    const firstP = cleanText(card.querySelector('p')?.textContent);

    const snippet = (role || areas || firstP || `Profile of ${name}.`).slice(0, 160);
    const content = [role, areas, firstP].filter(Boolean).join(' ').slice(0, 900);

    list.push({
      title: `Faculty: ${name}`,
      url: pageURL,              // fragment may not exist; keep it simple & reliable
      tags: Array.from(new Set(['faculty', ...name.toLowerCase().split(/\s+/),
        ...(areas ? areas.toLowerCase().split(/[,;/]\s*|\s+/) : [])])),
      snippet, content
    });
  });

  if (list.length) return list; // we found cards—done.

  // 2) Fallback: scan tables and lists
  //    - Looks for rows/items with a "name-ish" first cell/line
  const rows = doc.querySelectorAll('table tr');
  rows.forEach((tr) => {
    // prefer the first non-empty cell as "name"
    const cells = Array.from(tr.querySelectorAll('th,td')).map(td => cleanText(td.textContent)).filter(Boolean);
    if (!cells.length) return;
    const first = cells[0];
    if (!isNameish(first)) return;

    const name   = first;
    const role   = cells.slice(1).find(t => /(prof|assistant|associate|lecturer|scientist|postdoc|staff)/i.test(t)) || '';
    const areas  = cells.slice(1).find(t => /(research|area|interests|topics|group)/i.test(t)) || '';
    const extra  = cells.slice(1).join(' ').slice(0, 600);

    const snippet = cleanText([role, areas].filter(Boolean).join(' ')).slice(0, 160) || `Profile of ${name}.`;
    const content = cleanText([role, areas, extra].filter(Boolean).join(' ')).slice(0, 900);

    list.push({
      title: `Faculty: ${name}`,
      url: pageURL,
      tags: Array.from(new Set(['faculty', ...name.toLowerCase().split(/\s+/),
        ...(areas ? areas.toLowerCase().split(/[,;/]\s*|\s+/) : [])])),
      snippet, content
    });
  });

  // 3) Also scan bullet lists if present
  const items = doc.querySelectorAll('ul li, ol li');
  items.forEach(li => {
    const line = cleanText(li.textContent);
    if (!line || line.length < 5) return;
    const firstChunk = cleanText(line.split(/[–—\-•|:;]\s*/)[0]); // part before separators
    if (!isNameish(firstChunk)) return;

    const name   = firstChunk;
    const rest   = cleanText(line.slice(firstChunk.length));
    const snippet = rest.slice(0, 160) || `Profile of ${name}.`;
    const content = rest.slice(0, 900);

    list.push({
      title: `Faculty: ${name}`,
      url: pageURL,
      tags: Array.from(new Set(['faculty', ...name.toLowerCase().split(/\s+/)])),
      snippet, content
    });
  });

  return list;
};  


    const list = [];
    cards.forEach(card => {
      const nameEl = card.querySelector('h1,h2,h3,h4,h5');
      if (!nameEl) return;
      const name = getText(nameEl);
      if (!name) return;

      const id   = card.id || nameEl.id || slug(name);
      const role = getText(card.querySelector('.role, .designation, .title'));
      const areas = getText(card.querySelector('.areas, .research, .interests'));
      const firstP = getText(card.querySelector('p'));

      const snippet = (role || areas || firstP || `Profile of ${name}.`).slice(0, 160);
      const content = [role, areas, firstP].filter(Boolean).join(' ').slice(0, 900);

      const tags = Array.from(new Set([
        'faculty',
        ...name.toLowerCase().split(/\s+/),
        ...(areas ? areas.toLowerCase().split(/[,;/]\s*|\s+/) : [])
      ].filter(Boolean)));

      list.push({
        title: `Faculty: ${name}`,
        url: `${pageHref.split('#')[0]}#${id}`,
        tags,
        snippet,
        content
      });
    });
    return list;
  };

  const index = [];
  for (const page of PAGES) {
    try {
      const { doc, url } = await fetchPage(page);
      if (/faculty\.html(\?|$)/i.test(url) || /staff\.html(\?|$)/i.test(url) || /students\.html(\?|$)/i.test(url)) {
        // Add the page record
        index.push(extractGeneric(doc, url.split('#')[0]));
        // Add one record per person (auto)
        index.push(...extractPeople(doc, url));
      } else if (/index\.html/i.test(url)) {
        index.push(extractGeneric(doc, 'index.html'));
        // Optional: home sections
        ['announcements','seminars-events','publications'].forEach(id => {
          const el = doc.getElementById(id);
          if (!el) return;
          const titleMap = {
            'announcements':'Announcements',
            'seminars-events':'Seminars & Events',
            'publications':'Recent Publications'
          };
          const t = titleMap[id] || id;
          const text = getText(el).slice(0, 240);
          index.push({
            title: t,
            url: `index.html#${id}`,
            tags: ['home', id],
            snippet: text,
            content: text
          });
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
    includeScore:true, minMatchCharLength:2, threshold:0.35,
    keys:[ {name:'title',weight:0.5}, {name:'content',weight:0.35}, {name:'tags',weight:0.15} ]
  });

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(indexData));
    localStorage.setItem(CACHE_AT, String(Date.now()));
  } catch {}

  return indexData;
}


  function renderSuggestion(items){
    if (!suggest) return;
    if (!items.length){ suggest.style.display='none'; suggest.innerHTML=''; return; }
    suggest.innerHTML = items.map(it => {
      const s = (it.snippet || it.content || '').slice(0,120) + '…';
      return `<a href="${it.url}" style="display:block;padding:10px;text-decoration:none;color:#222">
        <div style="font-weight:600">${it.title}</div>
        <div style="font-size:12px;color:#666">${s}</div>
      </a>`;
    }).join('');
    suggest.style.display='block';
  }

  async function runResultsPage(){
    if (!isResultsPage) return;
    await loadIndex();
    const params = new URLSearchParams(location.search);
    const query  = (params.get('q')||'').trim();
    if (qEl) qEl.textContent = query ? `for “${query}”` : '';
    if (!query){ outEl.innerHTML = `<p>No query given.</p>`; return; }

    const matches = fuse.search(query,{limit:50});
    if (!matches.length){ outEl.innerHTML = `<p>No results found.</p>`; return; }

    outEl.innerHTML = matches.map(({item}) => {
      const s = (item.snippet||item.content||'').slice(0,180) + '…';
      return `<article class="search-result">
        <h3><a href="${item.url}">${item.title}</a></h3>
        <div style="font-size:13px;color:#555">${s}</div>
        <div style="font-size:12px;color:#888">${item.url}</div>
      </article>`;
    }).join('');
  }

  (async function init(){
    if (form && input){
      await loadIndex();
      input.addEventListener('input', e=>{
        const q = e.target.value.trim();
        if (q.length<2) renderSuggestion([]);
        else renderSuggestion(fuse.search(q).slice(0,8).map(r=>r.item));
      });
      document.addEventListener('click', e=>{
        if (!form.contains(e.target)) renderSuggestion([]);
      });
    }
    runResultsPage();
  })();
})();
