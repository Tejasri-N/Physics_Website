/* people-anchors.js
 * Deep-link helper for Faculty/Staff/Students.
 * - Adds predictable ids: section-<slug> to person blocks AND H2/H3/H4
 * - Supports text fragments (#:~:text=...)
 * - Students: auto-opens Course → Subcourse → Year and scrolls to the card (using name + enrollment)
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

  // Parse student target from URL (#student-name-enroll)
  function getTargetStudentFromURL(){
    const h = window.location.hash || "";
    if (h.startsWith("#student-")) {
      const slugged = h.replace(/^#student-/, "");
      const parts = slugged.split("-");
      const enroll = parts[parts.length-1]; // last part is enrollment
      const name = parts.slice(0,-1).join(" ");
      return { name: decodeURIComponent(name), enroll: enroll.toUpperCase() };
    }
    return null;
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

  // ---------- student helpers ----------
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

  function getHintForStudent(name){
    const want = norm(name);
    const nodes = $$("#studentData [data-name]");
    if (!nodes.length) return null;

    let node = nodes.find(n => norm(n.getAttribute("data-name")) === want);
    if (!node) node = nodes.find(n => norm(n.getAttribute("data-name")).includes(want));
    if (!node) return null;

    const enroll = node.getAttribute("data-enroll") || "";
    const hintDeg = node.getAttribute("data-degree") || "";
    const hintYear= node.getAttribute("data-year") || "";
    const {degree, year} = inferFromEnroll(enroll);

    return { degree: (hintDeg || degree || "").toLowerCase(), year: (hintYear || year || "").toString() };
  }

  function findRenderedStudentNode({name, enroll}){
    const want = norm(name);
    const wantEnroll = (enroll||"").toUpperCase();

    const table = $("#studentTable");
    if (table && table.style.display !== "none") {
      for (const tr of table.querySelectorAll("tbody tr")) {
        if ((want && norm(tr.textContent).includes(want)) || 
            (wantEnroll && tr.textContent.toUpperCase().includes(wantEnroll))) {
          return tr;
        }
      }
    }
    for (const el of $$(".phd-student-card,.student-card,[data-name]")) {
      const txt = norm(el.textContent);
      const dataEnroll = (el.getAttribute("data-enroll")||"").toUpperCase();
      if ((want && txt.includes(want)) || (wantEnroll && dataEnroll.includes(wantEnroll))) {
        return el;
      }
    }
    return null;
  }

  // Drive your existing UI: course → subcourse → year, then locate student
  async function openCohortAndFind({name, enroll}){
    const courseKeys = (window.courses && Object.keys(window.courses)) || [];
    const hinted = getHintForStudent(name);

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

    // Strategy 1: hinted fast path
    if (hinted && hinted.degree && hinted.year) {
      const degreeKey = (courseKeys.find(k => norm($(`.course-pill[data-course="${k}"]`)?.textContent) === norm(hinted.degree)) || hinted.degree || "").toLowerCase();
      if (degreeKey) {
        await showCourse(degreeKey);
        const subs = (window.courses?.[degreeKey]?.subcourses) ? Object.keys(window.courses[degreeKey].subcourses) : [null];
        for (const sub of subs) {
          await showSubcourse(sub);
          await showYear(degreeKey, sub, hinted.year);
          const node = findRenderedStudentNode({name, enroll});
          if (node) { smoothScrollIntoView(node); return true; }
        }
      }
    }

    // Strategy 2: fallback exhaustive search
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
          const node = findRenderedStudentNode({name, enroll});
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
    const css = document.createElement("style");
    css.textContent = `
      .jump-highlight { outline: 3px solid rgba(66,72,144,.45); outline-offset: 3px; border-radius: 10px; transition: outline-color .4s; }
      [id]{ scroll-margin-top:110px; }
    `;
    document.head.appendChild(css);

    ensureSectionIdsOnHeadings();
    ensureSectionIdsOnPeople();
    scrollToHashIfPossible();

    const targetStudent = getTargetStudentFromURL();
    if (targetStudent) {
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) {
        await sleep(120);
        await openCohortAndFind(targetStudent);
      } else {
        jumpToExistingAnchorByText(targetStudent.name);
      }
    }

    window.addEventListener("hashchange", () => {
      ensureSectionIdsOnHeadings();
      ensureSectionIdsOnPeople();
      scrollToHashIfPossible();
    });

    setTimeout(() => scrollToHashIfPossible(), 600);
  });

  window.peopleAnchors = {
    jumpToName: async (name, enroll="") => {
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) return openCohortAndFind({name, enroll});
      return jumpToExistingAnchorByText(name);
    }
  };
})();
