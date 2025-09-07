// js/search-ui.js
(function(){
  const input = document.getElementById('search-input');
  const suggest = document.getElementById('search-suggest');
  const container = document.querySelector('.fancy-search');
  const searchBtn = container ? container.querySelector('.search-btn') : null;
  const voiceBtn = document.getElementById('voice-btn');

  if (!input) return;

  // Keep placeholder typewriter in search.js working; ensure 'typing' class is present
  // search.js adds/removes typing already — but ensure initial state
  try { input.classList.add('typing'); } catch(e){}

  // Open dropdown when it receives content (mutation observer)
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

  // Tiny micro-interaction: rotate icon on focus, small bounce on input
  input.addEventListener('focus', () => {
    if (searchBtn) searchBtn.style.transform = 'rotate(-10deg) translateY(-2px)';
  });
  input.addEventListener('blur', () => {
    if (searchBtn) searchBtn.style.transform = '';
  });
  input.addEventListener('input', () => {
    if (searchBtn) {
      searchBtn.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 220, easing: 'ease-out' });
    }
  });

  // Keyboard navigation hints: close on Escape (UI only)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (suggest) { suggest.classList.remove('show'); input.setAttribute('aria-expanded','false'); }
    }
  });

  // Voice button demo (non-functional fallback)
  if (voiceBtn) {
    voiceBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Demo behavior: focus + brief pulse
      input.focus();
      voiceBtn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'ease-out' });
      // temporary playful placeholder
      const old = input.placeholder;
      input.placeholder = 'Listening... (demo)';
      setTimeout(() => { input.placeholder = old; }, 900);
    });
  }

  // Click on suggestion rows: ensure aria-expanded updates (in case search.js simply uses anchors)
  document.addEventListener('click', (ev) => {
    if (!container) return;
    const row = ev.target.closest && ev.target.closest('.srch-suggest-row');
    if (row) {
      // allow default navigation by search.js; but close UI
      if (suggest) { suggest.classList.remove('show'); input.setAttribute('aria-expanded','false'); }
    }
  });

  // On page resize, hide suggestions on small screens
  window.addEventListener('resize', () => {
    if (window.matchMedia('(max-width:900px)').matches) {
      if (suggest) { suggest.classList.remove('show'); suggest.style.display = 'none'; }
    }
  });
})();
