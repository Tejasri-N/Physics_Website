/* people-anchors.js
 * Deep-link helper for Faculty/Staff/Students.
 * - Adds predictable ids: section-<slug> to person blocks AND H2/H3/H4
 * - Supports text fragments (#:~:text=...)
 * - Students: auto-opens Course → Year and scrolls to the card
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

  // ---------- URL helpers ----------
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
    if (/RESCH|PHD/.test(E)) degree = "phd";
    else if (/MTECH|M-?TECH/.test(E)) degree = "mtech";
    else if (/MSC|M\.?SC/.test(E)) degree = "msc";
    else if (/BTECH|B-?TECH/.test(E)) degree = "btech";

    let year = "";
    const m = E.match(/(\d{2})(?=[A-Z])/);
    if (m) {
      const yy = parseInt(m[1],10);
      year = (yy >= 50 ? 1900+yy : 2000+yy).toString();
    }
    return {degree, year};
  }

  function findRenderedStudentNode({name, enroll}){
    const want = norm(name);
    const wantEnroll = (enroll||"").toUpperCase();

    // Table rows
    const table = $("#studentTable");
    if (table && table.style.display !== "none") {
      for (const tr of table.querySelectorAll("tbody tr")) {
        if ((want && norm(tr.textContent).includes(want)) ||
            (wantEnroll && tr.textContent.toUpperCase().includes(wantEnroll))) {
          return tr;
        }
      }
    }
    // Cards (PhD / grid)
    for (const el of $$(".phd-student-card,.student-card,[data-name]")) {
      const txt = norm(el.textContent);
      const dataEnroll = (el.getAttribute("data-enroll")||"").toUpperCase();
      if ((want && txt.includes(want)) || (wantEnroll && dataEnroll.includes(wantEnroll))) {
        return el;
      }
    }
    return null;
  }

  async function openCohortAndFind(target){
    if (!target) return false;

    const {degree, year} = inferFromEnroll(target.enroll);
    const courseKeys = (window.courses && Object.keys(window.courses)) || ["btech","msc","mtech","phd"];

    async function showCourse(course){
      const pill = $(`.course-pill[data-course="${course}"]`);
      if (pill && !pill.classList.contains("active")) pill.click();
      await sleep(200);
    }

    async function showYear(course, sub, year){
      if (typeof window.showStudents === "function") {
        window.showStudents(course, sub || null, String(year));
      }
      await sleep(300);
    }

    // Fast path if degree+year known
    if (degree && year) {
      await showCourse(degree);
      await showYear(degree, null, year);
      const node = findRenderedStudentNode(target);
      if (node) { smoothScrollIntoView(node); return true; }
    }

    // Fallback: search all
    for (const deg of courseKeys) {
      await showCourse(deg);
      const groups = Array.from(document.querySelectorAll(
        `#studentData > div[data-course="${deg}"]`
      ));
      const years = [...new Set(groups.map(g => g.dataset.year))].sort((a,b)=>b-a);
      for (const y of years) {
        await showYear(deg, null, y);
        const node = findRenderedStudentNode(target);
        if (node) { smoothScrollIntoView(node); return true; }
      }
    }
    return false;
  }

  // ---------- generic fallback (faculty/staff) ----------
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

    ensureSectionIdsOnHeadings();
    ensureSectionIdsOnPeople();
    scrollToHashIfPossible();

    const targetStudent = getTargetStudentFromURL();
    const targetName    = getTargetNameFromURL();

    if (targetStudent) {
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) {
        await sleep(400); // wait for pills
        await openCohortAndFind(targetStudent);
      } else {
        jumpToExistingAnchorByText(targetStudent.name);
      }
    } else if (targetName) {
      jumpToExistingAnchorByText(targetName);
    }

    window.addEventListener("hashchange", () => {
      ensureSectionIdsOnHeadings();
      ensureSectionIdsOnPeople();
      scrollToHashIfPossible();
    });

    setTimeout(() => scrollToHashIfPossible(), 600);
  });

  // API
  window.peopleAnchors = {
    jumpToName: async (name) => {
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) 
        return openCohortAndFind({name,enroll:""});
      return jumpToExistingAnchorByText(name);
    }
  };
})();
