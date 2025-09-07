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

  // ---------- parse URL targets ----------
  // Support text fragment #:~:text=<Name> and #student-<slug-or-roll-or-name>
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

  // If URL hash encodes both name and enrollment like: #student-tejasri-EP20BTECH0001
  function getTargetStudentFromURL(){
    const h = window.location.hash || "";
    if (!h.startsWith("#student-")) return null;
    const slugged = h.replace(/^#student-/, "");
    const parts = slugged.split("-");
    // heuristic: last part that looks like enroll (digits + letters) -> treat as enroll
    const last = parts[parts.length-1] || "";
    if (/[A-Za-z0-9]{6,}/.test(last)) {
      const enroll = last;
      const name = parts.slice(0, -1).join(" ");
      return { name: decodeURIComponent(name), enroll: enroll.toUpperCase() };
    }
    // fallback: treat whole fragment as name
    return { name: decodeURIComponent(slugged), enroll: "" };
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
    if (/RESCH/.test(E) || /^PHD|^PHD|^PH/.test(E)) degree = "PhD";
    else if (/MTECH|M-?TECH/.test(E)) degree = "M.Tech";
    else if (/MSC|M\.?SC/.test(E)) degree = "M.Sc";
    else if (/BTECH|B-?TECH/.test(E)) degree = "B.Tech";

    let year = "";
    const m = E.match(/(\d{2})(?=[A-Z0-9])/);
    if (m) {
      const yy = parseInt(m[1],10);
      year = (yy >= 50 ? 1900+yy : 2000+yy).toString();
    }
    return {degree, year};
  }

  // Small roll-to-subcourse map — extend as needed
  const ROLL_MAP = {
    // Example: prefix -> { courseKey (btech|msc|mtech|phd), subcourseKey }
    EP: { course: 'btech', sub: 'engineering-physics' },    // EP => Engineering Physics (BTech)
    ME: { course: 'mtech', sub: 'mechanical' },              // example
    QS: { course: 'msc',  sub: 'quantum-science' },         // example
    RESCH: { course: 'phd' },                               // research/PhD marker
    PH: { course: 'phd' }                                   // other possible markers
    // Add more prefixes here as your roll formats grow
  };

  function mapEnrollToCourseSub(enroll){
    const E = (enroll||"").toUpperCase();
    if (!E) return {};
    if (/RESCH/.test(E)) return { course: 'phd', sub: null };
    // find a textual prefix like EP, ME, QS at start
    const m = E.match(/^([A-Z]{1,4})/);
    if (m) {
      const prefix = m[1];
      if (ROLL_MAP[prefix]) return ROLL_MAP[prefix];
    }
    // fallback: if BTECH found, map to btech; MTECH->mtech, MSC->msc
    if (/BTECH|B-?TECH/.test(E)) return { course: 'btech', sub: null };
    if (/MTECH|M-?TECH/.test(E)) return { course: 'mtech', sub: null };
    if (/MSC|M\.?SC/.test(E)) return { course: 'msc', sub: null };
    // unknown
    return {};
  }

  function getHintForStudent(nameOrEnroll) {
    // Accept either a name string or an object {name, enroll}
    let name = "", enroll = "";
    if (!nameOrEnroll) return null;
    if (typeof nameOrEnroll === 'string') {
      name = nameOrEnroll;
    } else if (typeof nameOrEnroll === 'object') {
      name = nameOrEnroll.name || "";
      enroll = nameOrEnroll.enroll || "";
    }
    const want = norm(name);
    const nodes = $$("#studentData [data-name]");
    if (!nodes.length) {
      // if nodes not present, but enroll exists, still try to map from enroll
      if (enroll) {
        const mapped = mapEnrollToCourseSub(enroll);
        const inferred = inferFromEnroll(enroll);
        return { degree: (mapped.course || inferred.degree || "").toLowerCase(), sub: mapped.sub || null, year: inferred.year || "" };
      }
      return null;
    }

    // 1. try exact match on name
    let node = nodes.find(n => norm(n.getAttribute("data-name")) === want);

    // 2. substring match
    if (!node && want) node = nodes.find(n => norm(n.getAttribute("data-name")).includes(want));

    // 3. if enroll provided, try match by enroll
    if (!node && enroll) node = nodes.find(n => (n.getAttribute("data-enroll")||"").toUpperCase() === enroll.toUpperCase());

    if (!node) {
      // fallback: map from explicit enroll if given (even if no dataset)
      if (enroll) {
        const mapped = mapEnrollToCourseSub(enroll);
        const inferred = inferFromEnroll(enroll);
        return { degree: (mapped.course || inferred.degree || "").toLowerCase(), sub: mapped.sub || null, year: inferred.year || "" };
      }
      return null;
    }

    const enrollAttr = node.getAttribute("data-enroll") || "";
    const hintDeg = node.getAttribute("data-degree") || "";
    const hintYear = node.getAttribute("data-year") || "";
    const mapped = mapEnrollToCourseSub(enrollAttr);
    const inferred = inferFromEnroll(enrollAttr);

    return {
      degree: (hintDeg || mapped.course || inferred.degree || "").toLowerCase(),
      sub: (mapped.sub || node.getAttribute("data-subcourse") || null),
      year: (hintYear || inferred.year || "")
    };
  }

  function findRenderedStudentNodeByName(nameOrObj){
    // Accept either a string name or {name, enroll}
    let name = "", enroll = "";
    if (!nameOrObj) return null;
    if (typeof nameOrObj === 'string') name = nameOrObj;
    else if (typeof nameOrObj === 'object') { name = nameOrObj.name || ""; enroll = nameOrObj.enroll || ""; }
    const want = norm(name);
    const wantEnroll = (enroll||"").toUpperCase();

    // Table rows (if table visible)
    const table = $("#studentTable");
    if (table && table.style.display !== "none") {
      for (const tr of table.querySelectorAll("tbody tr")) {
        const txt = tr.textContent || "";
        if ((want && norm(txt).includes(want)) || (wantEnroll && txt.toUpperCase().includes(wantEnroll))) return tr;
      }
    }
    // PhD cards / grid cards / data-name attributes
    for (const el of $$(".phd-student-card,.student-card,[data-name]")) {
      const txt = (el.textContent || "").toLowerCase();
      const dataEnroll = (el.getAttribute && (el.getAttribute("data-enroll")||"")).toUpperCase();
      if ((want && txt.includes(want)) || (wantEnroll && dataEnroll.includes(wantEnroll))) return el;
    }
    return null;
  }

  // Drive your existing UI: course → subcourse → year, then locate student
  async function openCohortAndFind(target){
    // target can be string name OR object {name, enroll}
    const name = (typeof target === 'string') ? target : (target && target.name ? target.name : "");
    const enroll = (typeof target === 'object' ? (target.enroll||"") : "");
    const courseKeys = (window.courses && Object.keys(window.courses)) || [];

    // Hint from dataset or enroll mapping
    let hinted = getHintForStudent(typeof target === 'object' ? target : name);

    // If enroll explicitly provided in param and hinted misses, map it
    if (!hinted && enroll) {
      const mapped = mapEnrollToCourseSub(enroll);
      const inferred = inferFromEnroll(enroll);
      hinted = { degree: (mapped.course || inferred.degree || "").toLowerCase(), sub: mapped.sub || null, year: inferred.year || "" };
    }

    // Helper UI drivers (use your existing page functions if present)
    async function showCourse(course){
      if (!course) return;
      const pill = $(`.course-pill[data-course="${course}"]`);
      if (pill && !pill.classList.contains("active")) pill.click();
      else if (!pill && typeof window.showSubcourses === "function") window.showSubcourses(course, {});
      await sleep(140);
    }
    async function showSubcourse(sub){
      if (!sub) return;
      // sub pills might appear after course click — wait a little
      for (let i=0;i<12;i++){
        const sp = $(`.subcourse-pill[data-subcourse="${sub}"]`);
        if (sp) { if(!sp.classList.contains("active")) sp.click(); break; }
        await sleep(100);
      }
      await sleep(120);
    }
    async function showYear(course, sub, year){
      if (!year) return;
      if (typeof window.showStudents === "function") window.showStudents(course, sub || null, String(year));
      await sleep(160);
    }

    // Try fast path if hinted degree & year available
    if (hinted && hinted.degree) {
      const degreeKey = (courseKeys.find(k => norm($(`.course-pill[data-course="${k}"]`)?.textContent) === norm(hinted.degree)) || hinted.degree || "").toLowerCase();
      if (degreeKey) {
        await showCourse(degreeKey);
        // attempt subcourse if hinted.sub exists
        if (hinted.sub) await showSubcourse(hinted.sub);
        // try hinted year first
        if (hinted.year) {
          await showYear(degreeKey, hinted.sub || null, hinted.year);
          let node = findRenderedStudentNodeByName(typeof target === 'object' ? target : name);
          if (node) { smoothScrollIntoView(node); return true; }
        }
        // fallback: scan all subcourses/years for that degree
        const subs = (window.courses?.[degreeKey]?.subcourses) ? Object.keys(window.courses[degreeKey].subcourses) : [null];
        for (const sub of subs) {
          await showSubcourse(sub);
          // compute years for this selection
          const groups = Array.from(document.querySelectorAll(
            `#studentData > div[data-course="${degreeKey}"]${sub ? `[data-subcourse="${sub}"]` : `:not([data-subcourse])`}`
          ));
          const years = [...new Set(groups.map(g => g.dataset.year))].sort((a,b)=>b-a);
          for (const y of years) {
            await showYear(degreeKey, sub, y);
            let node = findRenderedStudentNodeByName(typeof target === 'object' ? target : name);
            if (node) { smoothScrollIntoView(node); return true; }
          }
        }
      }
    }

    // Exhaustive search across degrees if nothing found yet
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
          let node = findRenderedStudentNodeByName(typeof target === 'object' ? target : name);
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
    const targetStudent = getTargetStudentFromURL();
    if (targetStudent) {
      // open UI and search by name+enroll
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) {
        await sleep(120); // allow page JS to set up
        await openCohortAndFind(targetStudent);
      } else {
        jumpToExistingAnchorByText(targetStudent.name);
      }
    } else if (targetName) {
      // support plain text fragment (name)
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) {
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
    },
    jumpToStudent: async (obj) => { // obj: {name, enroll}
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) return openCohortAndFind(obj);
      return jumpToExistingAnchorByText(obj.name || obj);
    }
  };
})();
