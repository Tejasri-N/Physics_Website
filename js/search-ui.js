// search-ui.js
// Lightweight UI helpers (keeps original behaviour) + robust search-jump + mutation observer.
// Based on original search-ui micro helpers. (preserves behaviour). See original for reference. :contentReference[oaicite:1]{index=1}

(function(){

  /***************************************************************************
   * PART 1 — original micro-interactions for the search input and suggestions
   * (unchanged behaviour from your file)
   ***************************************************************************/
  const input = document.getElementById('search-input');
  const suggest = document.getElementById('search-suggest');
  const container = document.querySelector('.fancy-search') || document.querySelector('.header-search');
  const searchBtn = container ? container.querySelector('.search-btn') : null;

  if (!input) return;

  // Keep typing placeholder animation in search.js working
  try { input.classList.add('typing'); } catch(e){}

  // Observe suggestion area and toggle visible UI class when content changes
  if (suggest) {
    const mo = new MutationObserver((mut) => {
      const html = suggest.innerHTML.trim();
      if (html) {
        suggest.classList.add('show');
        input.setAttribute('aria-expanded','true');
      } else {
        suggest.classList.remove('show');
        input.setAttribute('aria-expanded','false');
      }
    });
    mo.observe(suggest, { childList: true, subtree: true, characterData: true });
  }

  // Tiny micro-interactions: rotate icon on focus and small bounce on input
  input.addEventListener('focus', () => {
    if (searchBtn) searchBtn.style.transform = 'rotate(-10deg) translateY(-2px)';
  });
  input.addEventListener('blur', () => {
    if (searchBtn) searchBtn.style.transform = '';
  });
  input.addEventListener('input', () => {
    if (searchBtn) {
      try {
        searchBtn.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 220, easing: 'ease-out' });
      } catch (_) {}
    }
  });

  // Keyboard shortcuts & closing
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (suggest) { suggest.classList.remove('show'); input.setAttribute('aria-expanded','false'); }
    }
  });

  // Close suggestions on click-outside or click on a suggestion row
  document.addEventListener('click', (ev) => {
    if (!container) return;
    const row = ev.target.closest && ev.target.closest('.srch-suggest-row');
    if (row) {
      if (suggest) { suggest.classList.remove('show'); input.setAttribute('aria-expanded','false'); }
    } else if (!container.contains(ev.target)) {
      if (suggest) { suggest.classList.remove('show'); input.setAttribute('aria-expanded','false'); }
    }
  });

  // Hide suggestions on small screens (defensive)
  window.addEventListener('resize', () => {
    if (window.matchMedia('(max-width:900px)').matches) {
      if (suggest) { suggest.classList.remove('show'); suggest.style.display = 'none'; }
    }
  });


  /***************************************************************************
   * PART 2 — robust search-result jump handler
   * - waits for #section-* element to appear (handles alphabetical filter race)
   * - scrolls into view, flashes highlight, and calls showSpotlightSlide if available
   ***************************************************************************/

  // small helper: wait for element by id with timeout
  function waitForElementById(id, timeout = 3500, interval = 50) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      (function check() {
        const el = document.getElementById(id);
        if (el) return resolve(el);
        if (Date.now() - start > timeout) return reject(new Error('timeout'));
        setTimeout(check, interval);
      })();
    });
  }

  // flash highlight + scroll helper
  function scrollAndFlash(el){
    try { el.scrollIntoView({behavior:'smooth', block:'center'}); } catch(e){}
    try { el.classList.add('jump-highlight-temp'); setTimeout(()=> el.classList.remove('jump-highlight-temp'), 1700); } catch(e){}
  }

  // ensure highlight style exists
  if (!document.getElementById('jump-highlight-style')) {
    const style = document.createElement('style');
    style.id = 'jump-highlight-style';
    style.textContent = `.jump-highlight-temp { outline: 4px solid rgba(255,165,0,0.85); transition: outline 150ms ease; }`;
    document.head.appendChild(style);
  }

  // root to attach delegated click handler for search results:
  // choose the most specific selector present; fallback to document.body
  const searchRoot = document.querySelector('#search-results, .search-results, .search-list, .search-ui-results') || document.body;

  // delegated click handler: intercept search result anchors and ensure reliable jump
  searchRoot.addEventListener('click', function(e){
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    let id = null;
    if (href.startsWith('#')) id = href.slice(1);
    else if (a.hash) id = a.hash.slice(1);
    else if (a.href && a.href.includes('#')) id = a.href.split('#').pop();
    if (!id) return;

    // allow other scripts to run first (e.g., alphabet filter) then wait for element
    setTimeout(() => {
      waitForElementById(id, 4000, 60)
        .then(el => {
          scrollAndFlash(el);
          try { window.showSpotlightSlide && window.showSpotlightSlide('#' + id); } catch(e){}
        })
        .catch(() => {
          console.warn('[search-click handler] element not found for', id);
        });
    }, 90);
  }, true);

  // also handle hashchange (user pasting a link or browser back/forward)
  window.addEventListener('hashchange', function(){
    const id = location.hash ? location.hash.slice(1) : null;
    if (!id) return;
    setTimeout(() => {
      waitForElementById(id, 4000, 60)
        .then(el => { scrollAndFlash(el); try { window.showSpotlightSlide && window.showSpotlightSlide('#' + id); } catch(e){}; })
        .catch(()=>{ console.warn('[hashchange handler] element not found for', id); });
    }, 120);
  });


  /***************************************************************************
   * PART 3 — MutationObserver: when people DOM changes, re-run ensureSectionIdsOnPeople()
   * This ensures section-* ids exist after alphabetical filtering re-renders cards.
   ***************************************************************************/
  (function installPeopleMutationObserver() {
    const peopleWrap = document.querySelector('#people-list, .people-list, .people-container, #people') || document.body;
    if (!peopleWrap) return;

    const mo = new MutationObserver((mutations) => {
      if (mo._t) clearTimeout(mo._t);
      mo._t = setTimeout(()=> {
        try {
          if (window.ensureSectionIdsOnPeople) window.ensureSectionIdsOnPeople();
        } catch(e){
          console.warn('ensureSectionIdsOnPeople failed', e);
        }
      }, 40); // debounce a little to avoid thrash
    });

    mo.observe(peopleWrap, { childList: true, subtree: true });
    // optional console log for debugging — remove in production if you prefer
    console.log('[search-ui] people MutationObserver installed');
  })();


  /***************************************************************************
   * PART 4 — optional helper (run once) to clear cached search index in localStorage
   * Keep commented out; run manually in console after deploy if you want to force rebuild.
   * localStorage.removeItem('siteSearchIndex'); // uncomment when needed
   ***************************************************************************/

})(); // end module


