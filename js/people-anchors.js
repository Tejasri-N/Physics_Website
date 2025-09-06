<script>
/* people-anchors.js (robust clicks version)
 * - Staff/Faculty: predictable ids (section-<slug>) and smooth scroll
 * - Students: clicks Course → (Subcourse) → Year using real DOM pills
 * - Resilient waits so it never stalls at “Students Directory”
 */
(function () {
  // ---------- tiny utils ----------
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const norm = s => (s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const slug = s => norm(s).replace(/&/g," and ").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-");
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  async function waitFor(testFn, { tries=40, step=100 }={}) {
    for (let i=0;i<tries;i++){ if (testFn()) return true; await sleep(step); }
    return false;
  }

  function smoothScrollIntoView(el){
    if (!el) return;
    try { el.scrollIntoView({behavior:"smooth", block:"center"}); }
    catch { el.scrollIntoView(true); }
    el.classList.add("jump-highlight");
    setTimeout(()=> el && el.classList && el.classList.remove("jump-highlight"), 2500);
  }

  // #:~:text=<Name>   or   #student-<slug-and-more>
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
      // keep only name-ish part (strip trailing ids if present)
      const raw = h.replace(/^#student-/, "").replace(/-/g, " ");
      const m = raw.match(/^[a-z.\-'\s]+/i);
      return (m ? m[0] : raw).trim();
    }
    return "";
  }

  // ---------- anchor installers (staff/faculty & headings) ----------
  function ensureSectionIdsOnHeadings() {
    $$("h2,h3,h4").forEach(h => { if (!h.id) h.id = "section-" + slug(h.textContent || ""); });
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
      const nameEl = el.querySelector(".member-name,.faculty-name,.staff-name,.student-name,.faculty-profile,h1,h2,h3,h4,h5,b,strong,a") || el;
      const nameText = (nameEl.textContent || "").trim().split(/\n/)[0].trim();
      const s = slug(nameText);
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

  // ---------- students: click-through helpers ----------
  // Find any visible student node (table row, PhD card, card grid)
  function findRenderedStudentNodeByName(name){
    const want = norm(name);
    // table rows
    const table = $("#studentTable");
    const tc = $("#tableContainer");
    if (tc && !tc.classList.contains("hidden") && table && table.style.display !== "none") {
      for (const tr of table.querySelectorAll("tbody tr")) {
        if (norm(tr.textContent).includes(want)) return tr;
      }
    }
    // phd/cards grid
    for (const card of $$(".phd-student-card, .student-card, .people-card, .profile-card")) {
      if (norm(card.textContent).includes(want)) return card;
    }
    return null;
  }

  // Extract hint degree/year from hidden dataset (if available)
  function hintFromDataset(name){
    const want = norm(name);
    const node = $$("#studentData [data-name]").find(n => norm(n.getAttribute("data-name")).includes(want));
    if (!node) return null;
    const enroll = (node.getAttribute("data-enroll") || "").toUpperCase();
    const hintDeg = (node.getAttribute("data-degree") || "");
    const hintYear= (node.getAttribute("data-year") || "");
    // infer degree from enroll if not provided
    let deg = ""; if (/RESCH/.test(enroll)) deg = "PhD";
    else if (/MTECH|M-?TECH/.test(enroll)) deg = "M.Tech";
    else if (/MSC|M\.?SC/.test(enroll)) deg = "M.Sc";
    else if (/BTECH|B-?TECH/.test(enroll)) deg = "B.Tech";
    // infer year from enroll “23” → 2023
    let year = ""; const m = enroll.match(/(\d{2})(?=[A-Z])/); if (m) { const yy = +m[1]; year = (yy >= 50 ? 1900+yy : 2000+yy).toString(); }
    return { degree:(hintDeg||deg||"").toLowerCase(), year:(hintYear||year||"") };
  }

  async function clickCourse(courseKey){
    const pill = $(`.course-pill[data-course="${courseKey}"]`);
    if (!pill) return false;
    if (!pill.classList.contains("active")) pill.click();
    // wait for *either* subcourse row or year row to exist (PhD has no subcourses)
    await waitFor(() => $("#subcourseNav") || $("#yearScrollWrapper"));
    // small settle
    await sleep(120);
    return true;
  }

  async function clickSubcourseIfAny(subKey){
    if (!subKey) return true; // nothing to click
    // wait till pills rendered
    await waitFor(() => !!$(`.subcourse-pill[data-subcourse="${subKey}"]`));
    const sp = $(`.subcourse-pill[data-subcourse="${subKey}"]`);
    if (!sp) return false;
    if (!sp.classList.contains("active")) sp.click();
    await sleep(120);
    return true;
  }

  async function clickYearPill(yearText){
    await waitFor(() => $$("#yearContainer .year-pill").length > 0);
    const btn = $$("#yearContainer .year-pill").find(b => (b.textContent||"").trim() === String(yearText));
    if (!btn) return false;
    if (!btn.classList.contains("active")) btn.click();
    // wait for table/cards to appear
    await waitFor(() => {
      const tc = $("#tableContainer");
      const phdWrap = $(".phd-wrapper");
      return (tc && !tc.classList.contains("hidden")) || !!phdWrap;
    });
    await sleep(120);
    return true;
  }

  // Discover available years for current course/subcourse from hidden dataset
  function availableYears(courseKey, subKey){
    const groups = Array.from(document.querySelectorAll(
      `#studentData > div[data-course="${courseKey}"]${subKey ? `[data-subcourse="${subKey}"]` : `:not([data-subcourse])`}`
    ));
    return [...new Set(groups.map(g => g.dataset.year))].sort((a,b)=>b-a);
  }

  async function openCohortAndFind(name){
    const courseKeys = (window.courses && Object.keys(window.courses)) || ["btech","msc","mtech","phd"];
    const subsFor = (k) => (window.courses?.[k]?.subcourses ? Object.keys(window.courses[k].subcourses) : [null]);

    // try hinted degree/year first
    const hinted = hintFromDataset(name);

    async function tryOne(courseKey, subKey, year){
      if (!await clickCourse(courseKey)) return false;
      if (!await clickSubcourseIfAny(subKey)) return false;
      const okYear = year ? await clickYearPill(year) : false;
      // If no year provided / year not clicked, iterate all visible years
      const years = okYear ? [year] : availableYears(courseKey, subKey);
      for (const y of years) {
        await clickYearPill(y);
        // give the grid/table time to paint then search for the student
        if (await waitFor(() => !!findRenderedStudentNodeByName(name), { tries: 20, step: 100 })) {
          const node = findRenderedStudentNodeByName(name);
          if (node) { smoothScrollIntoView(node); return true; }
        }
      }
      return false;
    }

    // 1) hinted fast path
    if (hinted && hinted.degree) {
      const deg = hinted.degree;
      // try each subcourse (or none)
      for (const sub of subsFor(deg)) {
        if (await tryOne(deg, sub, hinted.year || null)) return true;
      }
    }

    // 2) exhaustive, deterministic sweep
    for (const deg of courseKeys) {
      for (const sub of subsFor(deg)) {
        if (await tryOne(deg, sub, null)) return true;
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
  async function init(){
    // highlight + fixed header offset
    const css = document.createElement("style");
    css.textContent = `
      .jump-highlight { outline: 3px solid rgba(66,72,144,.45); outline-offset: 3px; border-radius: 10px; transition: outline-color .4s; }
      [id]{ scroll-margin-top:110px; }
    `;
    document.head.appendChild(css);

    ensureSectionIdsOnHeadings();
    ensureSectionIdsOnPeople();
    scrollToHashIfPossible();

    const targetName = getTargetNameFromURL();
    if (targetName) {
      const onStudentsPage = /\/?students\.html(\?|#|$)/i.test(location.pathname);
      if (onStudentsPage) {
        // wait until the students shell exists
        await waitFor(() => !!document.getElementById("studentData"));
        await sleep(150);
        await openCohortAndFind(targetName);
      } else {
        jumpToExistingAnchorByText(targetName);
      }
    }

    // honor future hash changes
    window.addEventListener("hashchange", () => {
      ensureSectionIdsOnHeadings();
      ensureSectionIdsOnPeople();
      scrollToHashIfPossible();
    });

    // late content retry
    setTimeout(() => scrollToHashIfPossible(), 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // script may load after DOMContentLoaded; run immediately
    init();
  }
})();
</script>
