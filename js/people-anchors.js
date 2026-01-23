/* people-anchors.js
 * Complete, robust deep-link helper for People + Students.
 * - Creates predictable ids for headings and people (non-destructive)
 * - Supports #:~:text= fragments and #student-<slug>-<ENROLL>
 * - Students: deterministic path: dataset record -> course/subcourse/year -> find by enrollment/name
 * - Fallback exploratory scan if dataset absent
 * - Smooth scroll with offset + visual highlight
 * - Re-honors hash changes
 *
 * Changes: canonicalize enrollment tokens for reliable matching (normalizeEnroll + tokensFromText).
 */
(function () {
  "use strict";

  // ---------- small utilities ----------
  const $  = (sel, root=document) => { try { return root.querySelector(sel); } catch { return null; } };
  const $$ = (sel, root=document) => { try { return Array.from(root.querySelectorAll(sel)); } catch { return []; } };
  const norm = s => {
    try {
      return (s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
    } catch {
      return String(s||"").toLowerCase().trim();
    }
  };
  const slug = s => (norm(s) || "").replace(/&/g, " and ").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-");
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const debugLog = (...args) => { if (window.peopleAnchorsDebug) console.log("[peopleAnchors]", ...args); };

  async function waitFor(checkFn, timeout = 2000, interval = 80) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      try { if (checkFn()) return true; } catch (e) { /* ignore */ }
      await sleep(interval);
    }
    return false;
  }

  // ---------- enrollment canonicalization helpers ----------
  function normalizeEnroll(e){
    // uppercase, remove whitespace and non-alphanumeric characters
    try {
      return String(e||"").toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9]/g, "");
    } catch {
      return String(e||"").toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9]/g, "");
    }
  }
  function tokensFromText(txt){
    // return list of uppercase alpha-numeric tokens found in text
    if (!txt) return [];
    return String(txt || "")
      .toUpperCase()
      .split(/\s|[,\u00A0|\/\-\(\)\[\]:]+/)
      .map(t => t.replace(/[^A-Z0-9]/g,""))
      .filter(Boolean);
  }

  // Smooth scrolling + highlight (consistent)
  function smoothScrollIntoView(el) {
    if (!el) return;
    try { el.scrollIntoView({ behavior: "smooth", block: "center" }); }
    catch { el.scrollIntoView(true); }
    el.classList.add("jump-highlight");
    setTimeout(() => { try { el.classList.remove("jump-highlight"); } catch {} }, 2200);
  }

  // ---------- parse URL targets ----------
  function parseTargetFromURL() {
    try {
      const href = String(window.location.href || "");
      if (href.includes("#:~:text=")) {
        try {
          const after = decodeURIComponent(href.split("#:~:text=").pop()).split("&")[0];
          return { name: String(after || "").trim(), enroll: "" };
        } catch { /* fallback */ }
      }
     const urlHash = (window.location.hash || "").replace(/^#/, "");

      if (urlHash.startsWith("student-")) {
        const slugged = hash.replace(/^student-/, "");
        const parts = slugged.split("-");
        const last = parts[parts.length - 1] || "";
        const enrollCandidate = (/\d/.test(last) && last.length >= 4) ? normalizeEnroll(last) : "";
        const nameParts = enrollCandidate ? parts.slice(0, -1) : parts;
        const name = decodeURIComponent(nameParts.join(" ")).replace(/%20/g,' ').trim();
        return { name: name, enroll: enrollCandidate };
      }
    } catch (e) {
      debugLog("parseTargetFromURL failed", e);
    }
    return { name: "", enroll: "" };
  }

  // ---------- install non-destructive ids ----------
  function ensureSectionIdsOnHeadings() {
    $$("h2,h3,h4").forEach(h => {
      try {
        if (!h.id) {
          const id = "section-" + slug(h.textContent || "");
          if (id && id.length > 3) h.id = id;
        }
      } catch {}
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
    function uniqId(base) {
      let id = base, i = 2;
      while (used.has(id)) id = base + "-" + (i++);
      used.add(id);
      return id;
    }
    $$(selectors).forEach(el => {
      try {
        if (el.id) return;
        const nameEl = el.querySelector(".member-name,.faculty-name,.staff-name,.student-name,.faculty-profile,h1,h2,h3,h4,h5,b,strong,a") || el;
        const text = (nameEl && nameEl.textContent || "").trim().split(/\n/)[0].trim();
        const s = slug(text);
        if (!s || s.length < 3) return;
        el.id = uniqId("section-" + s);
      } catch {}
    });
  }

  // ---------- scroll to direct hash id if present ----------
  function scrollToHashIfPossible() {
    try {
    var scrollHash = window.location.hash;


     if (!scrollHash) return;
const el = document.getElementById(scrollHash.replace(/^#/, ""));

      if (el) smoothScrollIntoView(el);
    } catch {}
  }

  // ---------- enroll -> inference & mapping ----------
  function inferFromEnroll(enroll) {
    const E = (String(enroll||"")).toUpperCase();
    let degree = "";
    if (/RESCH/.test(E) || /^PHD\b/.test(E) || /^PH\d/.test(E)) degree = "PhD";
    else if (/MTECH|M-?TECH/.test(E)) degree = "M.Tech";
    else if (/MSC|M\.?SC/.test(E)) degree = "M.Sc";
    else if (/BTECH|B-?TECH/.test(E)) degree = "B.Tech";

    let year = "";
    const m = E.match(/(\d{2})(?=[A-Z0-9])/);
    if (m) {
      const yy = parseInt(m[1], 10);
      year = (yy >= 50 ? 1900 + yy : 2000 + yy).toString();
    }
    return { degree, year };
  }

  function mapEnrollToCourseSub(enroll) {
    const E = (String(enroll||"")).toUpperCase();
    if (!E) return {};
    const inferred = inferFromEnroll(E);

    if (/RESCH/.test(E) || /^PHRESCH|^PHD/.test(E)) return { course: 'phd', sub: null };
    if (/BTECH|B-?TECH/.test(E) || (inferred.degree && inferred.degree.toLowerCase().includes('b.tech'))) {
      if (/^EP/.test(E)) return { course: 'btech', sub: 'engineering-physics' };
      return { course: 'btech', sub: null };
    }
    if (/MTECH|M-?TECH/.test(E) || (inferred.degree && inferred.degree.toLowerCase().includes('m.tech'))) {
      if (/^PH/.test(E)) return { course: 'mtech', sub: 'quantum' };
      return { course: 'mtech', sub: null };
    }
    if (/MSC|M\.?SC/.test(E) || (inferred.degree && inferred.degree.toLowerCase().includes('m.sc'))) {
      if (/^PH/.test(E)) return { course: 'msc', sub: 'physics' };
      if (/^MP/.test(E)) return { course: 'msc', sub: 'medical-physics' };
      return { course: 'msc', sub: null };
    }
    if (/RESCH|PHD/.test(E) || (inferred.degree && inferred.degree.toLowerCase().includes('phd'))) return { course: 'phd', sub: null };
    if (inferred.degree) {
      const dk = inferred.degree.toLowerCase();
      if (dk.includes('b.tech')) return { course: 'btech', sub: null };
      if (dk.includes('m.tech')) return { course: 'mtech', sub: null };
      if (dk.includes('m.sc')) return { course: 'msc', sub: null };
      if (dk.includes('phd')) return { course: 'phd', sub: null };
    }
    return {};
  }

  // ---------- dataset lookup (best-effort, deterministic) ----------
  function findStudentRecord({ name = "", enroll = "" } = {}) {
    try {
      const nodes = $$("#studentData [data-name]");
      if (!nodes || !nodes.length) return null;
      const wantName = norm(name || "");
      const wantEnrollNorm = normalizeEnroll(enroll || "");

      // 1) exact enroll (canonicalized)
      if (wantEnrollNorm) {
        const enode = nodes.find(n => normalizeEnroll(n.getAttribute('data-enroll')||'') === wantEnrollNorm);
        if (enode) { debugLog("record: exact enroll"); return enode; }
      }

      // 2) exact name
      if (wantName) {
        const nnode = nodes.find(n => norm(n.getAttribute('data-name')||'') === wantName);
        if (nnode) { debugLog("record: exact name"); return nnode; }
      }

      // 3) substring matches
      if (wantName) {
        const candidates = nodes.filter(n => norm(n.getAttribute('data-name')||'').includes(wantName));
        if (candidates.length === 1) { debugLog("record: single substring"); return candidates[0]; }
        if (!candidates.length) return null;

        debugLog("record: multiple substring candidates", candidates.length);

        // tie-breaker A: enroll fragment present in URL or hash (digits)
       // tie-breaker A: enroll fragment present in hash (preferred) or URL digit groups (safer)
let enrollHint = "";

// 1) Prefer explicit enroll-like tail in the student-... hash (e.g. #student-name-PH25RESCH04001)
const studentHash = (location.hash || "").replace(/^#/, "");

if (studentHash.startsWith("student-")) {
  const parts = hash.replace(/^student-/, "").split("-");
  const last = parts[parts.length - 1] || "";
  if (/\d/.test(last) && last.length >= 4) {
    enrollHint = normalizeEnroll(last);
  }
}

// 2) Fallback: extract contiguous digit groups from URL and pick the longest (most specific) group
if (!enrollHint) {
  const groups = (String(location.href).match(/\d{3,}/g) || []);
  if (groups.length) {
    // prefer the longest group (less likely to be accidental small numbers), tie-breaker: last
    groups.sort((a,b) => b.length - a.length);
    enrollHint = groups[0];
  }
}

// 3) Use enrollHint to find a candidate (use normalized enroll values)
if (enrollHint) {
  const byDigits = candidates.find(n => {
    const recEnroll = normalizeEnroll(n.getAttribute('data-enroll') || '');
    return recEnroll && recEnroll.includes(enrollHint);
  });
  if (byDigits) {
    debugLog("record: by enrollHint tiebreaker", enrollHint, byDigits.getAttribute('data-enroll'));
    return byDigits;
  }
}


        // tie-breaker B: hash tail enroll
        const hash = (location.hash || "").replace(/^#/, "");
        if (hash.startsWith("student-")) {
          const parts = hash.replace(/^student-/, "").split("-");
          const last = parts[parts.length - 1] || "";
          const lastNorm = normalizeEnroll(last);
          if (lastNorm) {
            const byHash = candidates.find(n => normalizeEnroll(n.getAttribute('data-enroll')||'').includes(lastNorm));
            if (byHash) { debugLog("record: by hash enroll tail"); return byHash; }
          }
        }

        // tie-breaker C: active year pill
        const activeYear = ($(".year-pill.active")?.textContent || "").trim();
        if (activeYear) {
          const byActive = candidates.find(n => (n.getAttribute('data-year')||'') === activeYear);
          if (byActive) { debugLog("record: by active year"); return byActive; }
        }

        // tie-breaker D: prefer most recent year
        const parseYear = y => { const v = parseInt(y,10); return isNaN(v) ? 0 : v; };
        candidates.sort((a,b) => parseYear(b.getAttribute('data-year')) - parseYear(a.getAttribute('data-year')));
        debugLog("record: choose most recent year", candidates[0].getAttribute('data-year'));
        return candidates[0];
      }

      return null;
    } catch (e) {
      debugLog("findStudentRecord error", e);
      return null;
    }
  }

  // ---------- UI drivers: click course/subcourse/year with retries ----------
  async function clickCourse(courseKey) {
    if (!courseKey) return false;
    const pill = $(`.course-pill[data-course="${courseKey}"]`);
    if (pill) {
      if (!pill.classList.contains("active")) pill.click();
      await waitFor(() => !!$('#subcourseNav') || !!$('#yearContainer'), 1200, 80);
      await sleep(90);
      return true;
    }
    if (typeof window.showSubcourses === "function") {
      try { window.showSubcourses(courseKey, {}); await sleep(120); return true; } catch {}
    }
    return false;
  }

  async function clickSubcourse(subKey) {
    if (!subKey) return true;
    for (let i = 0; i < 15; i++) {
      const sp = $(`.subcourse-pill[data-subcourse="${subKey}"]`);
      if (sp) {
        if (!sp.classList.contains("active")) sp.click();
        await sleep(80);
        return true;
      }
      await sleep(100);
    }
    return false;
  }

  async function clickYear(year) {
    if (!year) return false;
    await waitFor(() => $$("#yearContainer .year-pill").length > 0, 1400, 80);
    const btn = $$("#yearContainer .year-pill").find(b => (b.textContent||"").trim() === String(year));
    if (btn) {
      if (!btn.classList.contains("active")) btn.click();
      await waitFor(() => {
        const tc = $("#tableContainer");
        const phd = $(".phd-wrapper");
        return (tc && !tc.classList.contains("hidden")) || !!phd;
      }, 1800, 100);
      await sleep(120);
      return true;
    }
    return false;
  }

  // ---------- find rendered student element (prefer enroll) ----------
  function findRenderedStudentElement({ name = "", enroll = "" } = {}) {
    const want = norm(name || "");
    const wantEnrollNorm = normalizeEnroll(enroll || "");

    // table rows first (prefer canonical enroll token in data attr or in text tokens)
    const table = $("#studentTable");
    if (table && table.style.display !== "none") {
      for (const tr of table.querySelectorAll("tbody tr")) {
        const rowEnrollAttr = normalizeEnroll(tr.getAttribute("data-enroll") || "");
        const rowText = tr.textContent || "";
        const rowTokens = tokensFromText(rowText);

        if (wantEnrollNorm && rowEnrollAttr && rowEnrollAttr === wantEnrollNorm) return tr;
        if (wantEnrollNorm && rowTokens.includes(wantEnrollNorm)) return tr;

        if (want && norm(rowText).includes(want)) return tr;
      }
    }

    // cards / phd grid / other elements
    const cards = $$(".phd-student-card, .student-card, [data-name]");
    for (const el of cards) {
      const dataEnrollRaw = (el.getAttribute && el.getAttribute("data-enroll")) || "";
      const dataEnroll = normalizeEnroll(dataEnrollRaw);
      const text = (el.textContent || "");
      const tokens = tokensFromText(text);

      if (wantEnrollNorm && dataEnroll && dataEnroll === wantEnrollNorm) return el;
      if (wantEnrollNorm && !dataEnroll && tokens.includes(wantEnrollNorm)) return el;
      if (want && norm(text).includes(want)) return el;
    }
    return null;
  }

  // ---------- open student from dataset record ----------
  async function openStudentFromRecord(record) {
    if (!record) return false;
    const courseKey = (record.getAttribute('data-course') || "").trim();
    const subKey = (record.getAttribute('data-subcourse') || "").trim() || null;
    const year = (record.getAttribute('data-year') || "").trim() || "";
    const name = record.getAttribute('data-name') || "";
    const enroll = normalizeEnroll(record.getAttribute('data-enroll') || "");

    debugLog('openStudentFromRecord', {courseKey, subKey, year, name, enroll});

    if (courseKey) await clickCourse(courseKey);
    if (subKey) await clickSubcourse(subKey);
    if (year) await clickYear(year);

    // After UI set, prefer finding by canonical enrollment
    await waitFor(() => findRenderedStudentElement({ name, enroll }) !== null, 2200, 120);
    let node = findRenderedStudentElement({ name, enroll });
    if (node) { smoothScrollIntoView(node); return true; }

    // attempt to call site helper and retry
    if (typeof window.showStudents === "function") {
      try { window.showStudents(courseKey, subKey || null, year); await sleep(220); } catch {}
      node = findRenderedStudentElement({ name, enroll });
      if (node) { smoothScrollIntoView(node); return true; }
    }

    // last-chance short scan
    await sleep(160);
    node = findRenderedStudentElement({ name, enroll });
    if (node) { smoothScrollIntoView(node); return true; }

    debugLog("openStudentFromRecord: couldn't locate node after driving UI", record);
    return false;
  }

  // ---------- exploratory sweep (if dataset missing) ----------
  async function exploratoryOpenAndFind(target) {
    const name = (typeof target === "string" ? target : (target && target.name ? target.name : ""));
    const enroll = (typeof target === "object" ? (target.enroll || "") : "");
    const courseKeys = (window.courses && Object.keys(window.courses)) || ["btech", "msc", "mtech", "phd"];

    for (const degree of courseKeys) {
      await clickCourse(degree);
      const subs = (window.courses?.[degree]?.subcourses) ? Object.keys(window.courses[degree].subcourses) : [ null ];
      for (const sub of subs) {
        if (sub) await clickSubcourse(sub);
        const groups = Array.from(document.querySelectorAll(
          `#studentData > div[data-course="${degree}"]${sub ? `[data-subcourse="${sub}"]` : `:not([data-subcourse])`}`
        ));
        const years = [...new Set(groups.map(g => g.dataset.year))].sort((a,b) => b - a);
        for (const y of years) {
          await clickYear(y);
          await sleep(150);
          const node = findRenderedStudentElement({ name, enroll });
          if (node) { smoothScrollIntoView(node); return true; }
        }
      }
    }
    return false;
  }

  // ---------- staff / faculty fallback ----------
  function jumpToPersonByText(name) {
    const want = norm(name || "");
    if (!want) return false;
    const selectors = "h1,h2,h3,h4,h5,.faculty-card,.staff-card,.profile-card,.member,.person,.card,.people-card,.team-card,.bio";
    const candidates = $$(selectors);
    const el = candidates.find(n => norm(n.textContent || "").includes(want));
    if (el) { smoothScrollIntoView(el); return true; }
    return false;
  }

  // ---------- top-level student open flow ----------
  async function openCohortAndFind(target) {
    const name = (typeof target === "string" ? target : (target && target.name ? target.name : ""));
    const enrollRaw = (typeof target === "object" ? (target.enroll || "") : "");
    const enroll = normalizeEnroll(enrollRaw);

    // 1) dataset record
    const record = findStudentRecord({ name, enroll });
    if (record) {
      debugLog("openCohortAndFind: found dataset record");
      const ok = await openStudentFromRecord(record);
      if (ok) return true;
    }

    // 2) mapping from enroll to course/sub/year and drive
    if (enroll) {
      const mapped = mapEnrollToCourseSub(enroll);
      const inferred = inferFromEnroll(enroll);
      const degreeKey = (mapped.course || (inferred.degree ? inferred.degree.toLowerCase() : "") ).toLowerCase();
      const sub = mapped.sub || null;
      const year = inferred.year || "";
      if (degreeKey) {
        await clickCourse(degreeKey);
        if (sub) await clickSubcourse(sub);
        if (year) await clickYear(year);
        await waitFor(() => findRenderedStudentElement({ name, enroll }) !== null, 1700, 100);
        const node = findRenderedStudentElement({ name, enroll });
        if (node) { smoothScrollIntoView(node); return true; }
      }
    }

    // 3) exhaustive exploratory sweep
    return await exploratoryOpenAndFind({ name, enroll: enrollRaw });
  }

  // ---------- small id helpers (public for debugging) ----------
  window.peopleAnchorsDebug = window.peopleAnchorsDebug || false;
  window.peopleAnchors = window.peopleAnchors || {};
  window.peopleAnchors.ensureSectionIdsOnHeadings = ensureSectionIdsOnHeadings;
  window.peopleAnchors.ensureSectionIdsOnPeople = ensureSectionIdsOnPeople;
  window.peopleAnchors.findStudentRecord = findStudentRecord;
  window.peopleAnchors.openStudentFromRecord = openStudentFromRecord;

  // ---------- main init ----------
  async function init() {
    try {
      const css = document.createElement("style");
      css.id = "people-anchors-css";
      css.textContent = `
        .jump-highlight { outline: 3px solid rgba(66,72,144,.45); outline-offset: 3px; border-radius: 10px; transition: outline-color .4s; }
        [id] { scroll-margin-top: 110px; }
      `;
      if (!document.getElementById("people-anchors-css")) document.head.appendChild(css);
    } catch (e) { debugLog("CSS injection failed", e); }

    try { ensureSectionIdsOnHeadings(); ensureSectionIdsOnPeople(); } catch (e) { debugLog("ensure ids failed", e); }

    try {
      const h = (location.hash || "").replace(/^#/, "");
      if (h) {
        const el = document.getElementById(h);
        if (el) smoothScrollIntoView(el);
      }
    } catch {}

    const target = parseTargetFromURL();
    if (!target.name && !target.enroll) return;

    const onStudents = /\/?students\.html(\?|#|$)/i.test(location.pathname);
    if (!onStudents) {
      const personName = (target.name || "").trim();
      if (!jumpToPersonByText(personName)) setTimeout(() => jumpToPersonByText(personName), 600);
      return;
    }

    await sleep(120);
    const input = (target.enroll ? { name: target.name, enroll: target.enroll } : target.name);
    const ok = await openCohortAndFind(input);
    if (!ok) {
      await sleep(200);
      if (!jumpToPersonByText(target.name)) {
        debugLog("openCohortAndFind: not found, tried fallback", target);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { init().catch(e => debugLog("init err", e)); });
  } else {
    init().catch(e => debugLog("init err", e));
  }

  window.addEventListener("hashchange", () => {
    try {
      ensureSectionIdsOnHeadings();
      ensureSectionIdsOnPeople();
      scrollToHashIfPossible();
      const target = parseTargetFromURL();
      if (target && (target.name || target.enroll)) {
        setTimeout(() => {
          if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) {
            openCohortAndFind(target).catch(e => debugLog("hashchange openCohort error", e));
          } else {
            jumpToPersonByText(target.name);
          }
        }, 140);
      }
    } catch (e) { debugLog("hashchange handler failed", e); }
  });

  // public API
  window.peopleAnchors.jumpToName = async (name) => {
    if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) return openCohortAndFind(name);
    return jumpToPersonByText(name);
  };
  window.peopleAnchors.jumpToStudent = async (obj) => {
    if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) return openCohortAndFind(obj);
    return jumpToPersonByText(obj && obj.name ? obj.name : obj);
  };

})();

