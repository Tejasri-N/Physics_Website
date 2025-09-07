/* people-anchors.js
 * Deep-link helper for Faculty/Staff/Students.
 * - Adds predictable ids: section-<slug> to person blocks AND H2/H3/H4
 * - Supports text fragments (#:~:text=...)
 * - Students: auto-opens Course → Subcourse → Year and scrolls to the card
 * - Smooth scroll + offset below fixed header
 *
 * Fixes: robust degree-key resolution (RESCH -> phd, etc.) to avoid wrong cohort routing.
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
    // Returns { degree: 'PhD'|'M.Tech'|'M.Sc'|'B.Tech'|'', year: '2025'|'' }
    const E = (enroll||"").toUpperCase();
    let degree = "";
    if (/RESCH/.test(E) || /\bPHD\b/.test(E) || /\bPH\.?D\b/.test(E)) degree = "PhD";
    else if (/MTECH|M-?TECH/.test(E)) degree = "M.Tech";
    else if (/MSC|M\.?SC/.test(E)) degree = "M.Sc";
    else if (/BTECH|B-?TECH/.test(E)) degree = "B.Tech";

    let year = "";
    const m = E.match(/(\d{2})(?=[A-Z])/); // first 2 digits before letter sequence
    if (m) {
      const yy = parseInt(m[1],10);
      year = (yy >= 50 ? 1900+yy : 2000+yy).toString();
    }
    return {degree, year};
  }

  // canonical degree key resolver: maps various strings to our course keys
  function degreeToKey(degStr){
    if(!degStr) return "";
    const d = (degStr||"").toString().toLowerCase();
    // Direct common forms
    if (d.includes("resch") || d.includes("phd") || d.includes("ph.d") || d.includes("phd")) return "phd";
    if (d.includes("m.tech") || d.includes("mtech") || d.includes("m-tech")) return "mtech";
    if (d.includes("m.sc") || d.includes("msc") || d.includes("m-sc")) return "msc";
    if (d.includes("b.tech") || d.includes("btech") || d.includes("b-tech")) return "btech";
    // fallback tries: check words
    if (d.includes("ph")) return "phd";
    if (d.includes("m") && d.includes("tech")) return "mtech";
    if (d.includes("msc") || d.includes("m.sc")) return "msc";
    if (d.includes("b") && d.includes("tech")) return "btech";
    return "";
  }

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

    // prefer explicit hintDeg if present, else use inferred
    const resolvedDegree = (hintDeg || degree || "").toString();
    return { degree: degreeToKey(resolvedDegree), year: (hintYear || year || "").toString(), enroll: enroll || "" };
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

  // more robust search that also checks enroll string if present in hash
  function findRenderedStudentNode({ name, enroll }){
    const want = norm(name || "");
    const wantEnroll = (enroll||"").toUpperCase();

    // Table rows
    const table = $("#studentTable");
    if (table && table.style.display !== "none") {
      for (const tr of table.querySelectorAll("tbody tr")) {
        const txt = tr.textContent || "";
        if ((want && norm(txt).includes(want)) || (wantEnroll && txt.toUpperCase().includes(wantEnroll))) return tr;
      }
    }

    // Cards and generic nodes
    const candidates = $$(".phd-student-card, .student-card, [data-name], .profile-card, .people-card");
    for (const el of candidates) {
      const txt = (el.getAttribute("data-name") || el.textContent || "").toString();
      const dEnroll = (el.getAttribute("data-enroll") || "").toString().toUpperCase();
      if ((want && norm(txt).includes(want)) || (wantEnroll && dEnroll.includes(wantEnroll))) return el;
    }
    return null;
  }

  // Drive your existing UI: course → subcourse → year, then locate student
  async function openCohortAndFind(nameOrObj){
    // nameOrObj can be a string (name) or object {name, enroll}
    const name = typeof nameOrObj === "string" ? nameOrObj : (nameOrObj.name || "");
    const explicitEnroll = typeof nameOrObj === "object" ? (nameOrObj.enroll || "") : "";

    // Prefer explicit courses map if present
    const courseKeys = (window.courses && Object.keys(window.courses)) || [];

    // If we can hint degree/year from hidden dataset OR from explicit enroll in hash, use that first
    let hinted = getHintForStudent(name) || null;
    if (explicitEnroll) {
      // If an enroll code was supplied (via #student-... including enroll), infer from it and override
      const { degree, year } = inferFromEnroll(explicitEnroll);
      const degKey = degreeToKey(degree);
      hinted = hinted || {};
      hinted.degree = degKey || hinted.degree;
      hinted.year = hinted.year || year || hinted.year;
      hinted.enroll = explicitEnroll;
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
    if (hinted && hinted.degree) {
      const degreeKey = hinted.degree || "";
      // if degreeKey exists among page course pills, try it
      const availableDegreeKey = courseKeys.find(k => k === degreeKey) || degreeKey;
      if (availableDegreeKey) {
        await showCourse(availableDegreeKey);
        // try every visible subcourse for that degree (or none)
        const subs = (window.courses?.[availableDegreeKey]?.subcourses) ? Object.keys(window.courses[availableDegreeKey].subcourses) : [null];
        for (const sub of subs) {
          await showSubcourse(sub);
          // if we have year hint, try it, else try all years under this sub
          if (hinted.year) {
            await showYear(availableDegreeKey, sub, hinted.year);
            const node = findRenderedStudentNode({name, enroll: hinted.enroll || explicitEnroll});
            if (node) { smoothScrollIntoView(node); return true; }
          } else {
            // iterate visible years
            const groups = Array.from(document.querySelectorAll(
              `#studentData > div[data-course="${availableDegreeKey}"]${sub ? `[data-subcourse="${sub}"]` : `:not([data-subcourse])`}`
            ));
            const years = [...new Set(groups.map(g => g.dataset.year))].sort((a,b)=>b-a);
            for (const y of years) {
              await showYear(availableDegreeKey, sub, y);
              const node = findRenderedStudentNode({name, enroll: hinted.enroll || explicitEnroll});
              if (node) { smoothScrollIntoView(node); return true; }
            }
          }
        }
      }
    }

    // Strategy 2: Explore all cohorts deterministically (fallback sweep)
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
          const node = findRenderedStudentNode({name, enroll: explicitEnroll});
          if (node) { smoothScrollIntoView(node); return true; }
        }
      }
    }
    return false;
  }

  // generic fallback (faculty/staff pages)
  function jumpToExistingAnchorByText(name){
    const want = norm(name);
    const candidates = $$("h1,h2,h3,h4,h5,.faculty-card,.staff-card,.profile-card,.member,.person,.card,.people-card");
    const el = candidates.find(n => norm(n.textContent).includes(want));
    if (el) smoothScrollIntoView(el);
  }

  // helper: parse special student hash of form #student-<name>-<enroll>
  function parseStudentHash(){
    const h = window.location.hash || "";
    if (!h.startsWith("#student-")) return null;
    const slugged = h.replace(/^#student-/, "");
    const parts = slugged.split("-");
    if (parts.length < 2) return { name: decodeURIComponent(parts.join(" ")), enroll: "" };
    const enroll = parts[parts.length-1];
    const name = parts.slice(0,-1).join(" ");
    return { name: decodeURIComponent(name), enroll: enroll.toUpperCase() };
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
    const parsed = parseStudentHash();
    if (parsed && (parsed.name || parsed.enroll)) {
      // student hash with optional enroll -> use enroll preference
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) {
        await sleep(120);
        await openCohortAndFind(parsed);
      } else {
        jumpToExistingAnchorByText(parsed.name);
      }
    } else {
      // text-fragment or #student-name-without-enroll
      const targetName = getTargetNameFromURL();
      if (targetName) {
        const onStudentsPage = /\/?students\.html(\?|#|$)/i.test(location.pathname);
        if (onStudentsPage) {
          await sleep(120);
          await openCohortAndFind(targetName);
        } else {
          jumpToExistingAnchorByText(targetName);
        }
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
