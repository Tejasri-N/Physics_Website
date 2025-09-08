// js/search-ui.js (mic removed) - lightweight UI helpers only
(function(){
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
})();
