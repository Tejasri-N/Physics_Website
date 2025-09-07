// js/search-ui.js (verbose, with getUserMedia preflight)
(function(){
  const log = (...args) => { try { console.log('[search-ui]', ...args); } catch(_) {} };
  const input = document.getElementById('search-input');
  const suggest = document.getElementById('search-suggest');
  const container = document.querySelector('.fancy-search') || document.querySelector('.header-search');
  const searchBtn = container ? container.querySelector('.search-btn') : null;
  const voiceBtn = document.getElementById('voice-btn');

  if (!input) { log('no #search-input found — aborting'); return; }
  log('init');

  try { input.classList.add('typing'); } catch(e){}

  // Observe suggestion changes to toggle show/hide
  if (suggest) {
    const mo = new MutationObserver(() => {
      const html = suggest.innerHTML.trim();
      if (html) { suggest.classList.add('show'); input.setAttribute('aria-expanded','true'); }
      else { suggest.classList.remove('show'); input.setAttribute('aria-expanded','false'); }
    });
    mo.observe(suggest, { childList: true, subtree: true, characterData: true });
  }

  // micro interactions
  input.addEventListener('focus', () => { if (searchBtn) searchBtn.style.transform = 'rotate(-10deg) translateY(-2px)'; });
  input.addEventListener('blur',  () => { if (searchBtn) searchBtn.style.transform = ''; });
  input.addEventListener('input', () => {
    if (searchBtn) {
      try { searchBtn.animate([{transform:'translateY(0)'},{transform:'translateY(-3px)'},{transform:'translateY(0)'}], { duration:200 }); } catch(_) {}
    }
  });
  input.addEventListener('keydown', (e)=> { if (e.key === 'Escape' && suggest) { suggest.classList.remove('show'); input.setAttribute('aria-expanded','false'); }});
  document.addEventListener('click', (ev)=> {
    const row = ev.target.closest && ev.target.closest('.srch-suggest-row');
    if (row && suggest) { suggest.classList.remove('show'); input.setAttribute('aria-expanded','false'); }
  });
  window.addEventListener('resize', ()=> { if (window.matchMedia('(max-width:900px)').matches && suggest) { suggest.classList.remove('show'); suggest.style.display='none'; } });

  // ---------- voice integration with preflight check ----------
  if (!voiceBtn) { log('no #voice-btn — voice unavailable'); return; }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  async function preflightMicrophone() {
    // Try enumerateDevices first to detect available devices (may require permission in some browsers)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        log('navigator.mediaDevices.getUserMedia not supported');
        return { ok:false, reason: 'getUserMedia-not-supported' };
      }
      // Prompt permission with a short getUserMedia call — this surfaces permission & hardware issues early
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        log('preflight: getUserMedia succeeded');
        // enumerate devices
        const devs = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devs.filter(d => d.kind === 'audioinput');
        log('preflight: audioinputs:', audioInputs);
        // stop tracks immediately
        try { stream.getTracks().forEach(t => t.stop()); } catch(_) {}
        if (!audioInputs.length) return { ok:false, reason:'no-audio-input' , devices: audioInputs };
        return { ok:true, devices: audioInputs };
      } catch (err) {
        log('preflight getUserMedia error', err);
        return { ok:false, reason: err && err.name ? err.name : 'getUserMedia-error', err };
      }
    } catch (e) {
      log('preflight exception', e);
      return { ok:false, reason:'preflight-exception', e };
    }
  }

  // UI helpers
  let listening = false;
  function setListeningState(on) {
    listening = !!on;
    if (listening) {
      voiceBtn.classList.add('listening');
      voiceBtn.setAttribute('aria-pressed','true');
      voiceBtn.title = 'Listening… click to stop';
    } else {
      voiceBtn.classList.remove('listening');
      voiceBtn.setAttribute('aria-pressed','false');
      voiceBtn.title = 'Voice search';
    }
  }

  // If SpeechRecognition not available, provide fallback hint
  if (!SpeechRecognition) {
    voiceBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      log('SpeechRecognition not available — trying getUserMedia preflight to surface permission state');
      const r = await preflightMicrophone();
      if (!r.ok) {
        if (r.reason === 'no-audio-input') alert('No microphone devices were found on this computer. Please connect a microphone and try again.');
        else if (r.reason === 'getUserMedia-not-supported') alert('Microphone access not supported in this browser. Try Chrome/Edge or use HTTPS.');
        else if (r.reason === 'NotAllowedError' || r.reason === 'PermissionDeniedError') alert('Microphone permission blocked — allow microphone in the browser address bar and try again.');
        else alert('Voice search is not supported in this browser. Try Chrome/Edge.');
      } else {
        alert('Voice transcription not supported by your browser, but microphone is accessible. Try Chrome/Edge which supports Web Speech API.');
      }
      return;
    });
    log('SpeechRecognition not supported in this browser');
    return;
  }

  // Create a recognizer instance (we will start it only after preflight)
  const recognizer = new SpeechRecognition();
  recognizer.lang = 'en-IN';
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 1;
  recognizer.continuous = false;

  // Connect events with robust logging
  recognizer.onstart = () => log('recognizer: onstart');
  recognizer.onaudiostart = () => log('recognizer: onaudiostart');
  recognizer.onsoundstart = () => log('recognizer: onsoundstart');
  recognizer.onspeechstart = () => log('recognizer: onspeechstart');
  recognizer.onspeechend = () => log('recognizer: onspeechend');
  recognizer.onaudioend = () => log('recognizer: onaudioend');
  recognizer.onend = () => {
    log('recognizer: onend');
    setListeningState(false);
  };
  recognizer.onnomatch = (e) => { log('recognizer: onnomatch', e); };
  recognizer.onerror = (e) => {
    log('recognizer: onerror', e);
    // Provide friendly message
    const reason = (e && e.error) ? e.error : (e && e.type) ? e.type : 'unknown';
    if (reason === 'not-allowed' || reason === 'permission-denied') {
      input.placeholder = 'Microphone permission denied — please allow microphone';
      setTimeout(()=>input.placeholder = 'Search the Physics website…', 1800);
    } else if (reason === 'no-speech' || reason === 'no-input' || reason === 'audio-capture') {
      input.placeholder = 'No speech detected — try again';
      setTimeout(()=>input.placeholder = 'Search the Physics website…', 1200);
    } else {
      input.placeholder = 'Voice error — try again';
      setTimeout(()=>input.placeholder = 'Search the Physics website…', 1000);
    }
    setListeningState(false);
  };
  recognizer.onresult = (event) => {
    log('recognizer: onresult', event);
    const transcript = (event && event.results && event.results[0] && event.results[0][0] && event.results[0][0].transcript) ? event.results[0][0].transcript : '';
    input.value = transcript.trim();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    setListeningState(false);
  };

  // click handler: run preflight then start recognizer
  voiceBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    log('voiceBtn clicked — performing preflight check');
    // If already listening, stop
    if (listening) {
      try { recognizer.stop(); } catch(_) {}
      setListeningState(false);
      return;
    }

    // 1) preflight microphone access
    const pf = await preflightMicrophone();
    if (!pf.ok) {
      log('preflight failed', pf);
      if (pf.reason === 'NotAllowedError' || pf.reason === 'PermissionDeniedError' || pf.reason === 'getUserMedia-error') {
        alert('Microphone permission blocked. Allow microphone access in the browser (click the padlock icon) and try again.');
      } else if (pf.reason === 'no-audio-input') {
        alert('No microphone devices found. Connect a microphone and try again.');
      } else {
        alert('Microphone unavailable: ' + (pf.reason || 'unknown'));
      }
      return;
    }

    // 2) start recognition
    const oldPlaceholder = input.placeholder || '';
    input.placeholder = 'Listening… Speak now';
    setListeningState(true);

    try {
      recognizer.start();
      log('recognizer.start() called');
    } catch (err) {
      log('recognizer.start() threw', err);
      input.placeholder = 'Could not start voice listening';
      setTimeout(()=> input.placeholder = oldPlaceholder, 800);
      setListeningState(false);
    }

    // safety guard: stop after 18s
    const guard = setTimeout(() => { if (listening) { try{ recognizer.stop(); }catch(_){} setListeningState(false); input.placeholder = oldPlaceholder; } }, 18000);
    // clear guard on end
    recognizer.onend = () => { clearTimeout(guard); log('recognizer ended'); setListeningState(false); input.placeholder = oldPlaceholder; };
  });

  // keyboard shortcut to trigger voice: Ctrl+Shift+Space
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'Space') {
      e.preventDefault();
      voiceBtn && voiceBtn.click();
    }
  });

  log('voice integration initialized (SpeechRecognition available)');
})();
