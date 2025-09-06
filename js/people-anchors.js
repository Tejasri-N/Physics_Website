/* people-anchors.js
 * Deep-link helper for Faculty/Staff/Students.
 * - Adds predictable ids: section-<slug> to person blocks AND H2/H3/H4
 * - Supports text fragments (#:~:text=...)
 * - Students: auto-activates Degree/Year then scrolls to the card
 * - Smooth scroll + offset below fixed header
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

  // get name from URL: #student-ramesh-kv  or #:~:text=Ramesh%20K%20V
  function getTargetNameFromURL(){
    const href = String(window.location.href || "");
    if (href.includes("#:~:text=")) {
      const after = href.split("#:~:text=").pop();
      if (after) {
        try { return decodeURIComponent(after).split("&")[0]; } catch { return after; }
      }
    }
    const h = window.location.hash || "";
    if (h && h.startsWith("#student-")) return h.replace(/^#student-/, "").replace(/-/g, " ");
    return "";
  }

  // ---------- anchor installers ----------
  // 1) Give predictable IDs to headings
  function ensureSectionIdsOnHeadings() {
    $$("h2,h3,h4").forEach(h => {
      if (!h.id) h.id = "section-" + slug(h.textContent || "");
    });
  }

  // 2) Give predictable IDs to person cards/rows based on visible name
  function ensureSectionIdsOnPeople() {
    const selectors = [
      // common “card” wrappers
      ".faculty-card",".faculty-member",".profile-card",".person",".member",".card",
      ".fac-card",".member-card",".staff-card",".staff-member",".staff",
      ".student-card",".student",".people-card",".people-item",".team-card",".team-member",".bio",".bio-card",
      // tables and generic rows
      "table tr",".list li",".grid > *"
    ].join(",");

    const used = new Set($$("[id]").map(n => n.id));
    function uniqId(base) {
      let id = base, i = 2;
      while (used.has(id)) id = base + "-" + i++;
      used.add(id);
      return id;
    }

    $$(selectors).forEach(el => {
      // try to find the best “name” text within the block
      const nameEl =
        el.querySelector(".member-name,.faculty-name,.staff-name,.student-name,.faculty-profile,h1,h2,h3,h4,h5, b, strong, a")
        || el;
      const nameText = (nameEl.textContent || "").trim();
      const candidate = nameText.split(/\n/)[0].trim(); // first line is usually the name
      const s = slug(candidate);
      if (!s || s.length < 3) return;

      const id = "section-" + s;
      if (!el.id) el.id = uniqId(id);
    });
  }

  function scrollToHashIfPossible() {
    const hash = (location.hash || "").replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) smoothScrollIntoView(el);
  }

  // ---------- students helpers ----------
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
    const nodes = $$("#studentData [data-name]");
    if (nodes.length){
      const want = norm(name);
      const dataNode = nodes.find(n => norm(n.getAttribute("data-name")).includes(want));
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

    // 2) scroll to the visible card
    let tries = 0, card = null;
    while (tries++ < 25) {
      card = findRenderedStudentCardByName(name);
      if (card) break;
      await new Promise(r=>setTimeout(r, 100));
    }
    if (card) smoothScrollIntoView(card);
  }

  // generic fallback (faculty/staff)
  function jumpToExistingAnchorByText(name){
    const want = norm(name);
    const candidates = $$("h1,h2,h3,h4,h5,.faculty-card,.staff-card,.profile-card,.member,.person,.card");
    const el = candidates.find(n => norm(n.textContent).includes(want));
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

    // 1) install IDs for both headings and person cards
    ensureSectionIdsOnHeadings();
    ensureSectionIdsOnPeople();

    // 2) honor any current hash (e.g., #section-t-chengappa) now that IDs exist
    scrollToHashIfPossible();

    // 3) if there’s a text fragment or #student-… name, try smarter jumps
    const targetName = getTargetNameFromURL();
    if (targetName) {
      const onStudentsPage = /\/?students\.html(\?|#|$)/i.test(location.pathname);
      if (onStudentsPage) jumpToStudent(targetName);
      else jumpToExistingAnchorByText(targetName);
    }

    // 4) re-honor future hash changes (SPA-ish behavior)
    window.addEventListener("hashchange", () => {
      ensureSectionIdsOnHeadings();
      ensureSectionIdsOnPeople();
      scrollToHashIfPossible();
    });
  });
})();
