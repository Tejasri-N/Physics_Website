/* people-anchors.js
 * Deep-link helper for Faculty/Staff/Students.
 * - Adds predictable ids: section-<slug> to person blocks AND H2/H3/H4
 * - Supports text fragments (#:~:text=...)
 * - Students: auto-opens Course → Subcourse → Year and scrolls to the card
 * - Smooth scroll + offset below fixed header
 */
(function () {
  // ---------- tiny utils ----------
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const norm = s => (s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const slug = s => norm(s).replace(/&/g," and ").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-");
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function smoothScrollIntoView(el){
    if (!el) return;
    try { el.scrollIntoView({behavior:"smooth", block:"center"}); }
    catch { el.scrollIntoView(true); }
    el.classList.add("jump-highlight");
    setTimeout(()=> el && el.classList && el.classList.remove("jump-highlight"), 2500);
  }

  // #:~:text=<Name>   or   #student-<slug>
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
  function ensureSectionIdsOnHeadings() {
    $$("h2,h3,h4").forEach(h => {
      if (!h.id) h.id = "section-" + slug(h.textContent || "");
    });
  }

  function ensureSectionIdsOnPeople() {
    const selectors = [
      ".faculty-card",".faculty-member",".profile-card",".person",".member",".card",
      ".fac-card",".member-card",".staff-card",".staff-member",".staff",
      ".student-card",".student",".people-card",".people-item",".team-card",".team-member",".bio",".bio-card",
      "table tr",".list li",".grid > *"
    ].join(",");

    const used = new Set($$("[id]").map(n => n.id));
    const uniqId = (base) => { let id = base, i = 2; while (used.has(id)) id = base + "-" + i++; used.add(id); return id; };

    $$(selectors).forEach(el => {
      const nameEl =
        el.querySelector(".member-name,.faculty-name,.staff-name,.student-name,.faculty-profile,h1,h2,h3,h4,h5,b,strong,a")
        || el;
      const nameText = (nameEl.textContent || "").trim();
      const candidate = nameText.split(/\n/)[0].trim();
      const s = slug(candidate);
      if (!s || s.length < 3) return;
      if (!el.id) el.id = uniqId("section-" + s);
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

  // ---------- students helpers ----------
function getHintForStudent(name){
  const want = norm(name);
  const nodes = $$("#studentData [data-name]");
  if (!nodes.length) return null;

  // 1. exact match first
  let node = nodes.find(n => norm(n.getAttribute("data-name")) === want);

  // 2. fallback: substring match
  if (!node) node = nodes.find(n => norm(n.getAttribute("data-name")).includes(want));
  if (!node) return null;

  const enroll = node.getAttribute("data-enroll") || "";
  const hintDeg = node.getAttribute("data-degree") || "";
  const hintYear= node.getAttribute("data-year") || "";
  const {degree, year} = inferFromEnroll(enroll);

  return { degree: (hintDeg || degree || "").toLowerCase(), year: (hintYear || year || "").toString() };
}


  function findRenderedStudentNodeByName(name){
    const want = norm(name);

    // Table rows
    const table = $("#studentTable");
    if (table && table.style.display !== "none") {
      for (const tr of table.querySelectorAll("tbody tr")) {
        if (norm(tr.textContent).includes(want)) return tr;
      }
    }
    // PhD cards
    for (const card of $$(".phd-student-card")) {
      if (norm(card.textContent).includes(want)) return card;
    }
    // Generic fallbacks
    for (const el of $$("[data-name], .student-card, .card, .member, .people-card, .profile-card, .student")) {
      const txt = norm(el.getAttribute("data-name") || el.textContent);
      if (txt && txt.includes(want)) return el;
    }
    return null;
  }

  // Drive your existing UI: course → subcourse → year, then locate student
  async function openCohortAndFind(name){
    // Prefer explicit courses map if present
    const courseKeys = (window.courses && Object.keys(window.courses)) || [];

    // If we can hint degree/year from hidden dataset, use that first
    let hinted = null;
    const nodes = $$("#studentData [data-name]");
    if (nodes.length){
      const want = norm(name);
      const node = nodes.find(n => norm(n.getAttribute("data-name")).includes(want));
      if (node) {
        const enroll = node.getAttribute("data-enroll") || "";
        const hintDeg = node.getAttribute("data-degree") || "";
        const hintYear= node.getAttribute("data-year") || "";
        const {degree, year} = inferFromEnroll(enroll);
        hinted = { degree: hintDeg || degree || "", year: hintYear || year || "" };
      }
    }

    async function showCourse(course){
      // click course pill if exists, otherwise call showSubcourses()
      const pill = $(`.course-pill[data-course="${course}"]`);
      if (pill) pill.click();
      else if (typeof window.showSubcourses === "function") window.showSubcourses(course, pill || {});
      await sleep(130);
    }
    async function showSubcourse(sub){
      if (!sub) return;
      // sub pills are rendered after course click
      for (let i=0;i<12;i++){ // wait up to ~1.2s
        const sp = $(`.subcourse-pill[data-subcourse="${sub}"]`);
        if (sp) { sp.click(); break; }
        await sleep(100);
      }
      await sleep(120);
    }
    async function showYear(course, sub, year){
      if (typeof window.showStudents === "function") window.showStudents(course, sub || null, String(year));
      await sleep(160);
    }

    // Strategy 1: If hinted, try just the hinted cohort (fast path)
    if (hinted && hinted.degree && hinted.year) {
      const degreeKey = (courseKeys.find(k => norm($(`.course-pill[data-course="${k}"]`)?.textContent) === norm(hinted.degree)) || hinted.degree || "").toLowerCase();
      if (degreeKey) {
        await showCourse(degreeKey);
        // try every visible subcourse for that degree (or none)
        const subs = (window.courses?.[degreeKey]?.subcourses) ? Object.keys(window.courses[degreeKey].subcourses) : [null];
        for (const sub of subs) {
          await showSubcourse(sub);
          await showYear(degreeKey, sub, hinted.year);
          const node = findRenderedStudentNodeByName(name);
          if (node) { smoothScrollIntoView(node); return true; }
        }
      }
    }

    // Strategy 2: Explore all cohorts deterministically
    const degrees = courseKeys.length ? courseKeys : ["btech","msc","mtech","phd"];
    for (const degree of degrees) {
      await showCourse(degree);

      const subs = (window.courses?.[degree]?.subcourses) ? Object.keys(window.courses[degree].subcourses) : [null];
      for (const sub of subs) {
        await showSubcourse(sub);

        // Collect years currently available for this selection
        const groups = Array.from(document.querySelectorAll(
          `#studentData > div[data-course="${degree}"]${sub ? `[data-subcourse="${sub}"]` : `:not([data-subcourse])`}`
        ));
        const years = [...new Set(groups.map(g => g.dataset.year))].sort((a,b)=>b-a);

        for (const y of years) {
          await showYear(degree, sub, y);
          const node = findRenderedStudentNodeByName(name);
          if (node) { smoothScrollIntoView(node); return true; }
        }
      }
    }
    return false;
  }

  // generic fallback (faculty/staff pages)
  function jumpToExistingAnchorByText(name){
    const want = norm(name);
    const candidates = $$("h1,h2,h3,h4,h5,.faculty-card,.staff-card,.profile-card,.member,.person,.card");
    const el = candidates.find(n => norm(n.textContent).includes(want));
    if (el) smoothScrollIntoView(el);
  }

  // ---------- main ----------
  document.addEventListener("DOMContentLoaded", async function(){
    // highlight + fixed header offset
    const css = document.createElement("style");
    css.textContent = `
      .jump-highlight { outline: 3px solid rgba(66,72,144,.45); outline-offset: 3px; border-radius: 10px; transition: outline-color .4s; }
      [id]{ scroll-margin-top:110px; }
    `;
    document.head.appendChild(css);

    // install IDs
    ensureSectionIdsOnHeadings();
    ensureSectionIdsOnPeople();

    // honor current hash if it targets our generated IDs
    scrollToHashIfPossible();

    // smarter jumps (search deep links)
    const targetName = getTargetNameFromURL();
    if (targetName) {
      const onStudentsPage = /\/?students\.html(\?|#|$)/i.test(location.pathname);
      if (onStudentsPage) {
        // let Students page wire up first (year pills, etc.)
        await sleep(120);
        await openCohortAndFind(targetName);
      } else {
        jumpToExistingAnchorByText(targetName);
      }
    }

    // re-honor future hash changes
    window.addEventListener("hashchange", () => {
      ensureSectionIdsOnHeadings();
      ensureSectionIdsOnPeople();
      scrollToHashIfPossible();
    });

    // Minor safety: if content populates late (images/cards), retry hash once
    setTimeout(() => scrollToHashIfPossible(), 600);
  });

  // (Optional) expose a tiny API if you ever want to call from elsewhere
  window.peopleAnchors = {
    jumpToName: async (name) => {
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) return openCohortAndFind(name);
      return jumpToExistingAnchorByText(name);
    }
  };
})();
