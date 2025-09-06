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

  // token helpers (so single-word names like “Chengappa” work reliably)
  function nameTokens(s){
    return norm(s).split(/[^a-z0-9]+/).filter(Boolean);
  }

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
    if (h && h.startsWith("#student-")) {
      // Allow slugs like "niladri-karmakar-mp23mscst14005" → "niladri karmakar"
      const raw = h.replace(/^#student-/, "").replace(/-/g, " ");
      // drop trailing tokens that are mostly digits (roll-like)
      const cleaned = raw.split(/\s+/).filter(t => /\d/.test(t) ? false : true).join(" ").trim();
      return cleaned || raw.trim();
    }
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
        el.querySelector(".member-name,.faculty-name,.staff-name,.student-name,.faculty-profile,h1,h2,h3,h4,h5,b,strong,a,[aria-label],[alt],[data-name]")
        || el;
      const src = nameEl.getAttribute?.("data-name") || nameEl.getAttribute?.("aria-label") || nameEl.getAttribute?.("alt") || nameEl.textContent || "";
      const candidate = (src || "").split(/\n/)[0].trim();
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

  function findRenderedStudentNodeByName(name){
    const want = norm(name);
    const wantTokens = nameTokens(name);

    // Table rows
    const table = $("#studentTable");
    if (table && table.style.display !== "none") {
      for (const tr of table.querySelectorAll("tbody tr")) {
        const text = norm(tr.textContent);
        // exact token coverage preferred
        if (wantTokens.every(t => text.includes(t))) return tr;
      }
    }
    // PhD cards
    for (const card of $$(".phd-student-card")) {
      const text = norm(card.textContent);
      if (wantTokens.every(t => text.includes(t))) return card;
    }
    // Generic fallbacks
    for (const el of $$("[data-name], .student-card, .card, .member, .people-card, .profile-card, .student")) {
      const txt = norm(el.getAttribute("data-name") || el.textContent);
      if (wantTokens.every(t => txt.includes(t))) return el;
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
      const pill = $(`.course-pill[data-course="${course}"]`);
      if (pill) pill.click();
      else if (typeof window.showSubcourses === "function") window.showSubcourses(course, pill || {});
      await sleep(130);
    }
    async function showSubcourse(sub){
      if (!sub) return;
      for (let i=0;i<12;i++){
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

  // ---------- robust staff/faculty jump ----------
  function jumpToExistingAnchorByText(name){
    if (!name) return;

    // 1) Prefer direct ID hit: #section-<slug(name)>
    const idHit = document.getElementById("section-" + slug(name));
    if (idHit) { smoothScrollIntoView(idHit); return; }

    const want = norm(name);
    const tokens = nameTokens(name);

    // 2) Search elements by attributes first (data-name / aria-label / alt)
    const attrSel = [
      "[data-name]", "[aria-label]", "img[alt]",
      ".member-name",".faculty-name",".staff-name",".faculty-profile"
    ].join(",");
    const attrCandidates = $$(attrSel);
    // exact text first
    let el = attrCandidates.find(n => {
      const v = (n.getAttribute("data-name")||n.getAttribute("aria-label")||n.getAttribute("alt")||n.textContent||"");
      return norm(v) === want;
    }) || attrCandidates.find(n => {
      const v = (n.getAttribute("data-name")||n.getAttribute("aria-label")||n.getAttribute("alt")||n.textContent||"");
      const t = norm(v);
      return tokens.every(tok => t.includes(tok));
    });
    if (el) { smoothScrollIntoView(el.closest(".faculty-card,.staff-card,.profile-card,.member,.person,.card") || el); return; }

    // 3) Headings / cards (exact → tokenized → partial)
    const cardSel = "h1,h2,h3,h4,h5,.faculty-card,.staff-card,.profile-card,.member,.person,.card";
    const cards = $$(cardSel);

    el = cards.find(n => norm(n.textContent) === want)
      || cards.find(n => {
        const t = norm(n.textContent);
        return tokens.every(tok => t.includes(tok));
      })
      || cards.find(n => norm(n.textContent).includes(want));

    if (el) { smoothScrollIntoView(el); }
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
        await sleep(120);             // let Students UI render subnav/pills
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

    // Minor safety: retry once after images/cards settle
    setTimeout(() => scrollToHashIfPossible(), 600);
  });

  // Optional tiny API
  window.peopleAnchors = {
    jumpToName: async (name) => {
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) return openCohortAndFind(name);
      return jumpToExistingAnchorByText(name);
    }
  };
})();
