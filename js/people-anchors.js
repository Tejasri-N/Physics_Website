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

  // If URL hash encodes both name and enrollment like: #student-tejasri-EP25BTECH11001
  function getTargetStudentFromURL(){
    const h = window.location.hash || "";
    if (!h.startsWith("#student-")) return null;
    const slugged = h.replace(/^#student-/, "");
    const parts = slugged.split("-");
    const last = parts[parts.length-1] || "";
    // if last token looks like an enrollment (contains digits and letters)
    if (/[A-Za-z0-9]{6,}/.test(last) && /\d/.test(last)) {
      const enroll = last.toUpperCase();
      const name = parts.slice(0, -1).join(" ");
      return { name: decodeURIComponent(name), enroll };
    }
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
    if (/RESCH/.test(E) || /^PHD|^PH/.test(E)) degree = "PhD";
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

  // Map enroll -> course + optional subcourse (use examples you supplied)
  function mapEnrollToCourseSub(enroll){
    const E = (enroll||"").toUpperCase();
    if (!E) return {};

    // degree-detection via explicit markers
    const degreeDetected = inferFromEnroll(E).degree || "";
    // leading alpha prefix (like EP, PH, MP, ...)
    const prefixMatch = E.match(/^([A-Z]{1,4})/);
    const prefix = prefixMatch ? prefixMatch[1] : "";

    // Rule-based mapping (use degree marker first, then prefix)
    // Your examples:
    // EP25BTECH11001 -> BTech -> engineering-physics
    // PH25MSCST11001 -> M.Sc -> physics
    // MP25MSCST14001 -> M.Sc -> medical-physics
    // PH25MTECH11001 -> M.Tech -> quantum
    if (/RESCH/.test(E)) return { course: 'phd', sub: null };

    // If degree marker present use it
    if (/BTECH|B-?TECH/.test(E)) {
      // BTech: EP => engineering-physics
      if (/^EP/.test(E) || prefix === 'EP') return { course: 'btech', sub: 'engineering-physics' };
      return { course: 'btech', sub: null };
    }
    if (/MTECH|M-?TECH/.test(E)) {
      // M.Tech: PH -> quantum (example mapping you gave)
      if (/^PH/.test(E) || prefix === 'PH') return { course: 'mtech', sub: 'quantum' };
      return { course: 'mtech', sub: null };
    }
    if (/MSC|M\.?SC/.test(E)) {
      // M.Sc: PH -> physics, MP -> medical-physics
      if (/^PH/.test(E) || prefix === 'PH') return { course: 'msc', sub: 'physics' };
      if (/^MP/.test(E) || prefix === 'MP') return { course: 'msc', sub: 'medical-physics' };
      return { course: 'msc', sub: null };
    }

    // fallback to inferred degree (if inferFromEnroll gave something)
    if (degreeDetected) {
      const degKey = degreeDetected.toLowerCase();
      // some reasonable sub-mapping by prefix
      if (degKey === 'b.tech' || degKey === 'b.tech' || degKey === 'b.tech') {
        if (prefix === 'EP') return { course: 'btech', sub: 'engineering-physics' };
        return { course: 'btech', sub: null };
      }
      if (degKey.includes('m.tech')) {
        if (prefix === 'PH') return { course: 'mtech', sub: 'quantum' };
        return { course: 'mtech', sub: null };
      }
      if (degKey.includes('m.sc')) {
        if (prefix === 'MP') return { course: 'msc', sub: 'medical-physics' };
        if (prefix === 'PH') return { course: 'msc', sub: 'physics' };
        return { course: 'msc', sub: null };
      }
      if (degKey.includes('phd')) return { course: 'phd', sub: null };
    }

    // nothing matched — return empty object
    return {};
  }

  // Find dataset hint and explicit attributes
  function getHintForStudent(nameOrObj) {
    let name = "", enroll = "";
    if (!nameOrObj) return null;
    if (typeof nameOrObj === 'string') name = nameOrObj;
    else if (typeof nameOrObj === 'object') { name = nameOrObj.name || ""; enroll = nameOrObj.enroll || ""; }

    const want = norm(name);
    const nodes = $$("#studentData [data-name]");
    if (!nodes.length && enroll) {
      // fallback to enroll mapping even if dataset not present
      const mapped = mapEnrollToCourseSub(enroll);
      const inferred = inferFromEnroll(enroll);
      return { degree: (mapped.course || (inferred.degree || "")).toLowerCase(), sub: mapped.sub || null, year: inferred.year || "" };
    }
    if (!nodes.length) return null;

    // exact name first
    let node = nodes.find(n => norm(n.getAttribute("data-name")) === want);
    // substring next
    if (!node && want) node = nodes.find(n => norm(n.getAttribute("data-name")).includes(want));
    // match by enroll attribute if provided
    if (!node && enroll) node = nodes.find(n => (n.getAttribute("data-enroll")||"").toUpperCase() === enroll.toUpperCase());

    if (!node) {
      if (enroll) {
        const mapped = mapEnrollToCourseSub(enroll);
        const inferred = inferFromEnroll(enroll);
        return { degree: (mapped.course || (inferred.degree || "")).toLowerCase(), sub: mapped.sub || null, year: inferred.year || "" };
      }
      return null;
    }

    const enrollAttr = node.getAttribute("data-enroll") || "";
    const hintDeg = node.getAttribute("data-degree") || "";
    const hintYear = node.getAttribute("data-year") || "";
    const mapped = mapEnrollToCourseSub(enrollAttr);
    const inferred = inferFromEnroll(enrollAttr);

    return {
      degree: (hintDeg || mapped.course || (inferred.degree || "")).toLowerCase(),
      sub: (mapped.sub || node.getAttribute("data-subcourse") || null),
      year: (hintYear || inferred.year || "")
    };
  }

  function findRenderedStudentNodeByName(nameOrObj){
    let name = "", enroll = "";
    if (!nameOrObj) return null;
    if (typeof nameOrObj === 'string') name = nameOrObj;
    else if (typeof nameOrObj === 'object') { name = nameOrObj.name || ""; enroll = nameOrObj.enroll || ""; }
    const want = norm(name);
    const wantEnroll = (enroll||"").toUpperCase();

    // Table rows
    const table = $("#studentTable");
    if (table && table.style.display !== "none") {
      for (const tr of table.querySelectorAll("tbody tr")) {
        const txt = tr.textContent || "";
        if ((want && norm(txt).includes(want)) || (wantEnroll && txt.toUpperCase().includes(wantEnroll))) return tr;
      }
    }

    // Cards (PhD / grid)
    for (const el of $$(".phd-student-card,.student-card,[data-name]")) {
      const txt = (el.textContent || "").toLowerCase();
      const dataEnroll = (el.getAttribute && (el.getAttribute("data-enroll")||"")).toUpperCase();
      if ((want && txt.includes(want)) || (wantEnroll && dataEnroll.includes(wantEnroll))) return el;
    }

    return null;
  }

  // Drive your existing UI: course → subcourse → year, then locate student
  async function openCohortAndFind(target){
    // target may be string or {name,enroll}
    const name = (typeof target === 'string') ? target : (target && target.name ? target.name : "");
    const enroll = (typeof target === 'object' ? (target.enroll||"") : "");
    const courseKeys = (window.courses && Object.keys(window.courses)) || [];

    // get hint from dataset or enroll mapping
    let hinted = getHintForStudent(typeof target === 'object' ? target : name);
    if (!hinted && enroll) {
      const mapped = mapEnrollToCourseSub(enroll);
      const inferred = inferFromEnroll(enroll);
      hinted = { degree: (mapped.course || inferred.degree || "").toLowerCase(), sub: mapped.sub || null, year: inferred.year || "" };
    }

    async function showCourse(course){
      if (!course) return;
      const pill = $(`.course-pill[data-course="${course}"]`);
      if (pill && !pill.classList.contains("active")) pill.click();
      else if (!pill && typeof window.showSubcourses === "function") window.showSubcourses(course, {});
      await sleep(140);
    }
    async function showSubcourse(sub){
      if (!sub) return;
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

    // Fast path: hinted degree -> try that degree first
    if (hinted && hinted.degree) {
      const degreeKey = (courseKeys.find(k => norm($(`.course-pill[data-course="${k}"]`)?.textContent) === norm(hinted.degree)) || hinted.degree || "").toLowerCase();
      if (degreeKey) {
        await showCourse(degreeKey);
        if (hinted.sub) await showSubcourse(hinted.sub);
        if (hinted.year) {
          await showYear(degreeKey, hinted.sub || null, hinted.year);
          const node = findRenderedStudentNodeByName(target);
          if (node) { smoothScrollIntoView(node); return true; }
        }
        // fallback to scanning subcourses+years within this degree
        const subs = (window.courses?.[degreeKey]?.subcourses) ? Object.keys(window.courses[degreeKey].subcourses) : [null];
        for (const sub of subs) {
          await showSubcourse(sub);
          const groups = Array.from(document.querySelectorAll(
            `#studentData > div[data-course="${degreeKey}"]${sub ? `[data-subcourse="${sub}"]` : `:not([data-subcourse])`}`
          ));
          const years = [...new Set(groups.map(g => g.dataset.year))].sort((a,b)=>b-a);
          for (const y of years) {
            await showYear(degreeKey, sub, y);
            const node = findRenderedStudentNodeByName(target);
            if (node) { smoothScrollIntoView(node); return true; }
          }
        }
      }
    }

    // Exhaustive search
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
          const node = findRenderedStudentNodeByName(target);
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
    const targetStudent = getTargetStudentFromURL();
    const targetName = getTargetNameFromURL();

    if (targetStudent) {
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) {
        await sleep(120);
        await openCohortAndFind(targetStudent);
      } else {
        jumpToExistingAnchorByText(targetStudent.name);
      }
    } else if (targetName) {
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

  // Small public API
  window.peopleAnchors = {
    jumpToName: async (name) => {
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) return openCohortAndFind(name);
      return jumpToExistingAnchorByText(name);
    },
    jumpToStudent: async (obj) => {
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) return openCohortAndFind(obj);
      return jumpToExistingAnchorByText(obj.name || obj);
    }
  };
})();
