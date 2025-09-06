<script>
/* Deep-link nudge: scroll to #id or #:~:text=<...>, with header offset + highlight */
(function () {
  const HEADER_SELECTOR = '.header-topbar';
  const NAV_SELECTOR    = '.navbar';
  const SCAN_SELECTOR   = 'h1,h2,h3,h4,h5,[id],.faculty-card,.staff-card,.student-card,.profile-card,.people-card,.team-card,li,p,section,article';

  function headerOffsetPx() {
    const h = document.querySelector(HEADER_SELECTOR);
    const n = document.querySelector(NAV_SELECTOR);
    const hH = h ? h.offsetHeight : 0;
    const nH = n ? n.offsetHeight : 0;
    // A small cushion so the target sits nicely below the bar
    return Math.max(0, hH + nH + 8);
  }

  function scrollIntoViewWithOffset(el) {
    if (!el) return false;
    const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffsetPx();
    window.scrollTo({ top, behavior: 'smooth' });
    flash(el);
    return true;
  }

  function flash(el) {
    try {
      el.classList.add('deeplink-flash');
      setTimeout(() => el.classList.remove('deeplink-flash'), 1400);
    } catch (_) {}
  }

  function tryHash() {
    const hash = decodeURIComponent(location.hash || '').replace(/^#/, '');
    if (!hash || hash.startsWith(':~:text=')) return false;
    // Prefer an element with matching ID
    const byId = document.getElementById(hash);
    if (byId) return scrollIntoViewWithOffset(byId);
    return false;
  }

  function getTextFragment() {
    const m = location.href.match(/#:~:text=([^&]+)/);
    return m ? decodeURIComponent(m[1]).trim() : '';
  }

  function tryTextFragment() {
    const frag = getTextFragment();
    if (!frag) return false;

    // Look for an element whose text contains the fragment (case-insensitive)
    const needle = frag.toLowerCase();
    const nodes = document.querySelectorAll(SCAN_SELECTOR);
    let best = null, bestLen = Infinity;

    nodes.forEach(n => {
      const txt = (n.textContent || '').trim();
      if (!txt) return;
      const idx = txt.toLowerCase().indexOf(needle);
      if (idx !== -1 && txt.length < bestLen) { // prefer shorter blocks (typically headings/cards)
        best = n;
        bestLen = txt.length;
      }
    });

    if (best) return scrollIntoViewWithOffset(best);
    return false;
  }

  function go() {
    // Try #id first (native browser jump sometimes happens before layout settles)
    let ok = tryHash();

    // Fallback to text fragment
    if (!ok) ok = tryTextFragment();

    // If neither worked (images/fonts still loading), try once more after a tick
    if (!ok) setTimeout(() => { tryHash() || tryTextFragment(); }, 250);
  }

  document.addEventListener('DOMContentLoaded', go);
  window.addEventListener('load', () => setTimeout(go, 0));
  window.addEventListener('hashchange', () => setTimeout(go, 0));
})();
</script>
