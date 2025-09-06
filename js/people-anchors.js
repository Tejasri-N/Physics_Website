/* people-anchors.js
 * Deep-link helper for Faculty/Staff/Students.
 * - Adds predictable ids: section-<slug> to H2/H3/H4 so #section-... anchors work
 * - Supports text fragments (#:~:text=...)
 * - Students: auto-activates Degree/Year then scrolls to the card
 */
(function () {
  // ---------- tiny utils ----------
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const norm = s => (s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const slug = s => norm(s).replace(/&/g," and ").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-");

  function smoothScrollIntoView(el){
    if (!el) return;
    try { el.scrollIntoView({behavior:"smooth", block:"start"}); }
    catch { el.scrollIntoView(true); }
    el.classList.add("jump-highlight");
    setTimeout(()=> el && el.classList && el.classList.remove("jump-highlight"), 2500);
  }

  // get name from URL: #student-ramesh-kv   or   #:~:text=RAMESH%20K%20V
  function getTargetNameFromURL(){
    const href = String(window.location.href || "");
    const afterFrag = href.split("#:~:text=").pop();
    if (href.includes("#:~:text=") && afterFrag) {
      try { return decodeURIComponent(afterFrag).split("&")[0]; } catch { return afterFrag; }
    }
    const h = window.location.hash || "";
    if (h && h.startsWith("#student-")) {
      return h.replace(/^#student-/, "").replace(/-/g, " ");
    }
    return "";
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

  function clickPillByText(label){
    if (!label) return false;
    const want = norm(label);
    const btn = $$("button, a, .pill, .chip, .tab").find(b => norm(b.textContent) === want);
    if (btn) { btn.click(); return true; }
    return false;
  }

  function findRenderedStudentCardByName(name){
    const want = norm(name);
    const scopes = $$("#students, main, .page-container, .container, body");
    for (const scope of scopes) {
      const candidates = $$("[data-name], .student-card, .card, .member, .people-card, .profile-card, .student", scope);
      for (const el of candidates) {
        const txt = norm(el.getAttribute("data-name") || el.textContent);
        if (!txt) continue;
        if (txt.includes(want)) return el;
      }
    }
    return null;
  }

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

    if (degree) clickPillByText(degree);
    await new Promise(r=>setTimeout(r, 60));
    if (year)   clickPillByText(year);

    let tries = 0, card = null;
    while (tries++ < 25) {
      card = findRenderedStudentCardByName(name);
      if (card) break;
      await new Promise(r=>setTimeout(r, 100));
    }
    if (card) smoothScrollIntoView(card);
  }

  function jumpToExistingAnchorByText(name){
    const want = norm(name);
    const candidates = $$("h1,h2,h3,h4,h5,.faculty-card,.staff-card,.profile-card,.member,.person,.card");
    const el = candidates.find(n => norm(n.textContent).includes(want));
    if (el) smoothScrollIntoView(el);
  }

  // ensure predictable ids on headings: section-<slug>
  function ensureSectionIds() {
    $$("h2,h3,h4").forEach(h => {
      if (!h.id) h.id = "section-" + slug(h.textContent || "");
    });
  }

  function scrollToHashIfPossible() {
    const hash = (location.hash || "").replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) smoothScrollIntoView(el);
  }

  // ---------- main ----------
  document.addEventListener("DOMContentLoaded", function(){
    // highlight + fixed header offset
    const css = document.createElement("style");
    css.textContent = `
      .jump-highlight { outline: 3px solid rgba(66,72,144,.45); outline-offset: 3px; border-radius: 10px; transition: outline-color .4s; }
      [id]{ scroll-margin-top:110px; }
    `;
    document.head.appendChild(css);

    // Add ids then try to honor any hash present (e.g., #section-t-chengappa)
    ensureSectionIds();
    scrollToHashIfPossible();

    // If a text fragment name is present, do the deeper student/fallback logic too
    const targetName = getTargetNameFromURL();
    if (targetName) {
      const onStudentsPage = /\/?students\.html(\?|#|$)/i.test(location.pathname);
      if (onStudentsPage) jumpToStudent(targetName);
      else jumpToExistingAnchorByText(targetName);
    }

    // Re-honor hash if it changes after load (e.g., SPA-ish links)
    window.addEventListener("hashchange", () => {
      ensureSectionIds();
      scrollToHashIfPossible();
    });
  });
})();

