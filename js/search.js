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
    // js/search.js
const res = await fetch('searchIndex.json', { cache: 'no-store' });

    indexData = await res.json();
    fuse = new Fuse(indexData, {
      includeScore:true,
      minMatchCharLength:2,
      threshold:0.35,
      keys:[
        { name:'title', weight:0.5 },
        { name:'content', weight:0.35 },
        { name:'tags', weight:0.15 }
      ]
    });
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
