// js/search-ui.js
(function(){
  const input = document.getElementById('search-input');
  const suggest = document.getElementById('search-suggest');
  const container = document.querySelector('.fancy-search') || document.querySelector('.header-search');
  const searchBtn = container ? container.querySelector('.search-btn') : null;
  const voiceBtn = document.getElementById('voice-btn');

  if (!input) return;

  // Ensure typing class is present so your placeholder animation behaves as expected
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

  // Small micro-interactions
  input.addEventListener('focus', () => {
    if (searchBtn) searchBtn.style.transform = 'rotate(-10deg) translateY(-2px)';
  });
  input.addEventListener('blur', () => {
    if (searchBtn) searchBtn.style.transform = '';
  });
  input.addEventListener('input', () => {
    if (searchBtn) {
      try {
        searchBtn.animate(
          [{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }],
          { duration: 220, easing: 'ease-out' }
        );
      } catch (_) {}
    }
  });

  // Keyboard UI: close on Escape
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (suggest) { suggest.classList.remove('show'); input.setAttribute('aria-expanded','false'); }
    }
  });

  // Click on suggestion rows: close suggestions (search.js handles navigation)
  document.addEventListener('click', (ev) => {
    if (!container) return;
    const row = ev.target.closest && ev.target.closest('.srch-suggest-row');
    if (row) {
      if (suggest) { suggest.classList.remove('show'); input.setAttribute('aria-expanded','false'); }
    }
  });

  // Responsive: hide on small screens
  window.addEventListener('resize', () => {
    if (window.matchMedia('(max-width:900px)').matches) {
      if (suggest) { suggest.classList.remove('show'); suggest.style.display = 'none'; }
    }
  });

  // ---------------- Voice search integration ----------------
  if (!voiceBtn) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  if (!SpeechRecognition) {
    // Browser doesn't support Web Speech API
    voiceBtn.addEventListener('click', () => {
      try {
        // visual feedback
        voiceBtn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 350, easing: 'ease-out' });
      } catch (_) {}
      // friendly fallback UX
      if (window.confirm && typeof window.confirm === 'function') {
        // give user a hint without being intrusive
        alert('Voice search is not supported in this browser. Try Chrome or Edge (desktop/mobile) or use the search box.');
      }
    });
    return;
  }

  // Create recognizer instance
  const recognizer = new SpeechRecognition();
  // sensible defaults — change language if you prefer "en-US" or multilingual
  recognizer.lang = 'en-IN';
  recognizer.interimResults = false;    // we use final result only, to keep UI simple
  recognizer.maxAlternatives = 1;
  recognizer.continuous = false;

  // UI state helpers
  let listening = false;
  function setListeningState(on) {
    listening = !!on;
    if (listening) {
      voiceBtn.classList.add('listening');
      voiceBtn.setAttribute('aria-pressed', 'true');
      voiceBtn.title = 'Listening… click to stop';
      // gentle pulse
      try { voiceBtn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 600, iterations: Infinity }).id; } catch (_) {}
    } else {
      voiceBtn.classList.remove('listening');
      voiceBtn.setAttribute('aria-pressed', 'false');
      voiceBtn.title = 'Voice search (demo)';
      // browser will drop animations automatically
    }
  }

  // Start recognition when user clicks
  voiceBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // If already listening, stop
    if (listening) {
      try { recognizer.stop(); } catch (_) {}
      setListeningState(false);
      return;
    }

    // Focus input, update placeholder
    input.focus();
    const oldPlaceholder = input.placeholder || '';
    input.placeholder = 'Listening… Speak now';
    setListeningState(true);

    try {
      recognizer.start();
    } catch (err) {
      // start can throw if called too quickly; handle gracefully
      console && console.warn && console.warn('SpeechRecognition start failed', err);
      input.placeholder = 'Could not start microphone';
      setTimeout(() => { input.placeholder = oldPlaceholder; setListeningState(false); }, 1000);
      return;
    }

    // Safety fallback: if recognition doesn't fire onend within X ms, reset (e.g., permission denied)
    const startTimeout = setTimeout(() => {
      if (listening) {
        try { recognizer.stop(); } catch(_) {}
        setListeningState(false);
        input.placeholder = oldPlaceholder;
      }
    }, 15000); // 15s max listening guard

    // onresult: fill input and trigger live search
    recognizer.onresult = (event) => {
      clearTimeout(startTimeout);
      const transcript = (event && event.results && event.results[0] && event.results[0][0] && event.results[0][0].transcript) ? event.results[0][0].transcript : '';
      if (transcript) {
        input.value = transcript.trim();
        // trigger input event so your search.js picks it up
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      }
      input.placeholder = oldPlaceholder;
      setListeningState(false);
    };

    recognizer.onend = () => {
      clearTimeout(startTimeout);
      // ensure UI resets
      setListeningState(false);
      input.placeholder = oldPlaceholder;
    };

    recognizer.onerror = (err) => {
      clearTimeout(startTimeout);
      console && console.error && console.error('Speech recognition error', err);
      let msg = 'Voice search error';
      if (err && err.error) {
        // map some common errors to friendly messages
        if (err.error === 'not-allowed' || err.error === 'permission-denied') msg = 'Microphone permission denied';
        else if (err.error === 'no-speech') msg = 'No speech detected';
        else if (err.error === 'audio-capture') msg = 'No microphone found';
      }
      input.placeholder = msg + ' — try typing';
      setTimeout(() => { input.placeholder = (input.value ? input.value : 'Search the Physics website…'); }, 1200);
      setListeningState(false);
    };
  });

  // Optional: keyboard shortcut to start voice (Ctrl+Shift+Space)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'Space') {
      e.preventDefault();
      voiceBtn && voiceBtn.click();
    }
  });

})();
