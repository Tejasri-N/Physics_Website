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
// Voice button with Web Speech API
if (voiceBtn) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognizer = new SpeechRecognition();
    recognizer.lang = 'en-IN'; // Indian English; change if you want
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;

    voiceBtn.addEventListener('click', (e) => {
      e.preventDefault();
      input.focus();
      input.placeholder = 'Listening...';

      recognizer.start();

      recognizer.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        input.value = transcript;
        // Trigger search.js live suggest
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.placeholder = 'Search the Physics website…';
      };

      recognizer.onerror = (err) => {
        console.error('Speech recognition error:', err);
        input.placeholder = 'Could not hear, try again';
        setTimeout(() => { input.placeholder = 'Search the Physics website…'; }, 1200);
      };

      recognizer.onend = () => {
        input.placeholder = 'Search the Physics website…';
      };
    });
  } else {
    // Fallback if not supported
    voiceBtn.addEventListener('click', () => {
      alert("Sorry, voice search is not supported in this browser.");
    });
  }
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
