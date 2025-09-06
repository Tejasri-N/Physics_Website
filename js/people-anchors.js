/* people-anchors.js
 * Deep-link helper for Faculty/Staff/Students.
 * - Supports anchors created by search: #student-<slug>, #faculty-<slug>, #staff-<slug>, #id or #:~:text=<Name>
 * - Auto-activates Degree/Year on Students page and scrolls to the card
 * - Applies offset for fixed headers and highlights the target
 */

(function () {
  // ---------- tiny utils ----------
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const norm = s => (s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const slug = s => norm(s).replace(/&/g," and ").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-");

  function headerOffsetPx(){
    const topbar = $('.header-topbar');
    const navbar = $('.navbar');
    const h1 = topbar ? topbar.getBoundingClientRect().height : 0;
    const h2 = navbar ? navbar.getBoundingClientRect().height : 0;
    // add a tiny breathing room
    return Math.max(0, Math.round(h1 + h2 + 8));
  }

  function scrollIntoViewWithOffset(el, {behavior='smooth'} = {}){
    if (!el) return;
    const off = headerOffsetPx();
    try {
      // native smooth first
      el.scrollIntoView({behavior, block:'start'});
    } catch {
      el.scrollIntoView(true);
    }
    // then nudge up by header height
    window.scrollBy({top: -off, left: 0, behavior});
    // highlight
    el.classList.add('jump-highlight');
    setTimeout(() => el && el.classList && el.classList.remove('jump-highlight'), 2500);
  }

  // get name from URL: #student-ramesh-kv / #faculty-guhan ... or #:~:text=RAMESH%20K%20V
  function getTargetNameFromURL(){
    const href = String(window.location.href || "");
    if (href.includes("#:~:text=")) {
      const after = href.split("#:~:text=").pop();
      if (after) {
        // stop at '&' or further '#' if present
        const raw = after.split('&')[0].split('#')[0];
        try { return decodeURIComponent(raw); } catch { return raw; }
      }
    }
    const h = window.location.hash || "";
    if (/^#(student|faculty|staff)-/.test(h)) {
      return h.replace(/^#(student|faculty|staff)-/, "").replace(/-/g, " ");
    }
    return "";
  }

  function hashTargetId(){
    const h = window.location.hash || "";
    if (h && /^#[A-Za-z][\w\-:.]*$/.test(h)) return h.slice(1);
    return null;
  }

  // heuristic degree/year from enrollment like "PH24RESCH01009"
  function inferFromEnroll(enroll){
    const E = (enroll||"").toUpperCase();
    let degree = "";
    if (/RESCH/.test(E)) degree = "PhD";
    else if (/MTECH|M-?TECH/.test(E)) degree = "M.Tech";
    else if (/MSC|M\.?SC/.test(E)) degree = "M.Sc";
    else if (/BTECH|B-?TECH/.test(E)) degree = "B.Tech";

    let year = "";
    const m = E.match(/(\d{2})(?=[A-Z])/);
    if (m) {
      const yy = parseInt(m[1],10);
      year = (yy >= 50 ? 1900+yy : 2000+yy).toString();
    }
    return {degree, year};
  }

  // click a button/pill whose text matches label (case-insensitive)
  function clickPillByText(label){
    if (!label) return false;
    const want = norm(label);
    const btn = $$("button, a, .pill, .chip, .tab").find(b => norm(b.textContent) === want);
    if (btn) { btn.click(); return true; }
    return false;
  }

  // find a student card by visible name
  function findRenderedCardByName(name, scopeRoots){
    const want = norm(name);
    const scopes = (scopeRoots && scopeRoots.length ? scopeRoots : [$("main"), $(".page-container"), $(".container"), document.body])
      .filter(Boolean);
    for (const scope of scopes) {
      const candidates = $$("[data-name], .student-card, .faculty-card, .staff-card, .profile-card, .member, .person, .card, .people-card, .team-card", scope);
      for (const el of candidates) {
        const txt = norm(el.getAttribute("data-name") || el.textContent);
        if (txt && txt.includes(want)) return el;
      }
    }
    return null;
  }

  // ---------- students deep-link ----------
  async function jumpToStudent(name){
    // 1) try to use hidden dataset to pick Degree/Year
    let degree = "", year = "";
    let dataNode = null;

    const nodes = $$("#studentData [data-name]");
    if (nodes.length){
      const want = norm(name);
      dataNode = nodes.find(n => norm(n.getAttribute("data-name")).includes(want));
      if (dataNode) {
        const enroll = dataNode.getAttribute("data-enroll") || "";
        const hintDeg = dataNode.getAttribute("data-degree") || "";
        const hintYear= dataNode.getAttribute("data-year") || "";
        ({degree, year} = inferFromEnroll(enroll));
        if (hintDeg) degree = hintDeg;
        if (hintYear) year  = hintYear;
      }
    }

    // 2) Activate Degree and Year pills (best effort)
    if (degree) clickPillByText(degree);
    await new Promise(r=>setTimeout(r, 70)); // allow render
    if (year)   clickPillByText(year);

    // 3) Wait for grid render, then locate/scroll to card
    let tries = 0, card = null;
    while (tries++ < 30) { // up to ~3s
      card = findRenderedCardByName(name, [$("#students"), $("main"), document.body]);
      if (card) break;
      await new Promise(r=>setTimeout(r, 100));
    }
    if (card) scrollIntoViewWithOffset(card);
  }

  // ---------- generic helpers ----------
  function jumpToExistingAnchorByText(name){
    const el = findRenderedCardByName(name, [document.body]);
    if (el) scrollIntoViewWithOffset(el);
  }

  function tryTextFragment(){
    // browsers may already highlight; provide fallback
    const name = getTargetNameFromURL();
    if (!name) return false;
    const el = findRenderedCardByName(name, [document.body]);
    if (el) { scrollIntoViewWithOffset(el); return true; }
    return false;
  }

  function handleDeepLink(){
    // 1) if there is an element id in hash, nudge & highlight
    const id = hashTargetId();
    if (id) {
      const el = document.getElementById(id);
      if (el) { scrollIntoViewWithOffset(el); return; }
    }

    // 2) if #:~:text=..., try to locate by text
    if (window.location.href.includes("#:~:text=")) {
      if (tryTextFragment()) return;
    }

    // 3) name-based deep link
    const targetName = getTargetNameFromURL();
    if (!targetName) return;

    const onStudents = /\/?students\.html(\?|#|$)/i.test(location.pathname);
    if (onStudents) jumpToStudent(targetName);
    else jumpToExistingAnchorByText(targetName);
  }

  // ---------- init ----------
  document.addEventListener("DOMContentLoaded", () => {
    // Add tiny CSS for highlight + better native anchor offset when IDs exist
    const css = document.createElement("style");
    css.textContent = `
      .jump-highlight { outline: 3px solid rgba(66,72,144,.45); outline-offset: 3px; border-radius: 10px; transition: outline-color .4s; }
      [id]{ scroll-margin-top:${Math.max(90, headerOffsetPx())}px; }
    `;
    document.head.appendChild(css);
    handleDeepLink();
  });

  // In case assets change height (fonts/images), do another pass on window load
  window.addEventListener('load', handleDeepLink);
  // And respond to in-page hash changes
  window.addEventListener('hashchange', handleDeepLink);
})();
