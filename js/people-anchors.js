/* people-anchors.js
 * Complete, robust deep-link helper for People + Students.
 * - Creates predictable ids for headings and people (non-destructive)
 * - Supports #:~:text= fragments and #student-<slug>-<ENROLL>
 * - Students: deterministic path: dataset record -> course/subcourse/year -> find by enrollment/name
 * - Fallback exploratory scan if dataset absent
 * - Smooth scroll with offset + visual highlight
 * - Re-honors hash changes
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

  // Smooth scrolling + highlight (consistent)
  function smoothScrollIntoView(el) {
    if (!el) return;
    try { el.scrollIntoView({ behavior: "smooth", block: "center" }); }
    catch { el.scrollIntoView(true); }
    el.classList.add("jump-highlight");
    setTimeout(() => { try { el.classList.remove("jump-highlight"); } catch {} }, 2200);
  }

  // ---------- parse URL targets ----------
  // returns { name, enroll } where enroll may be empty
  function parseTargetFromURL() {
    try {
      const href = String(window.location.href || "");
      // text fragment
      if (href.includes("#:~:text=")) {
        try {
          const after = decodeURIComponent(href.split("#:~:text=").pop()).split("&")[0];
          return { name: String(after || "").trim(), enroll: "" };
        } catch { /* fallback */ }
      }
      // #student-... pattern: optionally ends with enrollment token
      const hash = (window.location.hash || "").replace(/^#/, "");
      if (hash.startsWith("student-")) {
        const slugged = hash.replace(/^student-/, "");
        const parts = slugged.split("-");
        const last = parts[parts.length - 1] || "";
        // if last token contains digit treat as enroll token
        const enroll = (/\d/.test(last) && last.length >= 4) ? last.toUpperCase() : "";
        const name = (enroll ? parts.slice(0, -1).join(" ") : parts.join(" "));
        return { name: decodeURIComponent(name).replace(/%20/g,' ').trim(), enroll: enroll };
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
      const hash = (location.hash || "").replace(/^#/, "");
      if (!hash) return;
      const el = document.getElementById(hash);
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

  // map known prefixes to subcourses (expandable)
  function mapEnrollToCourseSub(enroll) {
    const E = (String(enroll||"")).toUpperCase();
    if (!E) return {};
    // degree detection
    const inferred = inferFromEnroll(E);
    const degreeKey = (inferred.degree || "").toLowerCase(); // 'phd','b.tech' etc.

    // prefix characters at start before digits (e.g., EP25BTECH...)
    const prefixMatch = E.match(/^([A-Z]{1,4})/);
    const prefix = prefixMatch ? prefixMatch[1] : "";

    // explicit RESCH or PHD -> phd
    if (/RESCH/.test(E) || /^PHRESCH|^PHD/.test(E)) return { course: 'phd', sub: null };

    // specific rules from your examples:
    // EP -> engineering-physics in BTech
    // PH -> physics in MSc, quantum in MTech (you gave PH25MTECH -> quantum)
    // MP -> medical-physics in MSc
    // fallback: use inferred degree and leave sub null
    if (/BTECH|B-?TECH/.test(E) || degreeKey.includes('b.tech')) {
      if (/^EP/.test(E) || prefix === 'EP') return { course: 'btech', sub: 'engineering-physics' };
      return { course: 'btech', sub: null };
    }
    if (/MTECH|M-?TECH/.test(E) || degreeKey.includes('m.tech')) {
      // PH => quantum (example)
      if (/^PH/.test(E) || prefix === 'PH') return { course: 'mtech', sub: 'quantum' };
      // default unknown sub
      return { course: 'mtech', sub: null };
    }
    if (/MSC|M\.?SC/.test(E) || degreeKey.includes('m.sc')) {
      if (/^PH/.test(E) || prefix === 'PH') return { course: 'msc', sub: 'physics' };
      if (/^MP/.test(E) || prefix === 'MP') return { course: 'msc', sub: 'medical-physics' };
      return { course: 'msc', sub: null };
    }
    if (/RESCH|PHD/.test(E) || degreeKey.includes('phd')) return { course: 'phd', sub: null };

    // final fallback
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
  // expects #studentData [data-name][data-enroll][data-course][data-subcourse][data-year]
  function findStudentRecord({ name = "", enroll = "" } = {}) {
    try {
      const nodes = $$("#studentData [data-name]");
      if (!nodes || !nodes.length) return null;
      const wantName = norm(name || "");
      const wantEnroll = (enroll || "").toUpperCase();

      // 1) exact enroll
      if (wantEnroll) {
        const enode = nodes.find(n => ((n.getAttribute('data-enroll')||'').toUpperCase()) === wantEnroll);
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
        const urlDigits = (String(location.href).match(/\d{3,}/g) || []).join('');
        if (urlDigits) {
          const byDigits = candidates.find(n => ((n.getAttribute('data-enroll')||'').replace(/\D/g,'')).includes(urlDigits));
          if (byDigits) { debugLog("record: by url digits tiebreaker"); return byDigits; }
        }

        // tie-breaker B: if hash ended with enroll-like token, prefer that
        const hash = (location.hash || "").replace(/^#/, "");
        if (hash.startsWith("student-")) {
          const parts = hash.replace(/^student-/, "").split("-");
          const last = parts[parts.length - 1] || "";
          if (/\d/.test(last) && last.length >= 4) {
            const byHash = candidates.find(n => ((n.getAttribute('data-enroll')||'').toUpperCase()).includes(last.toUpperCase()));
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
    // fallback to showSubcourses function if present
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
    // wait for year pills
    await waitFor(() => $$("#yearContainer .year-pill").length > 0, 1400, 80);
    const btn = $$("#yearContainer .year-pill").find(b => (b.textContent||"").trim() === String(year));
    if (btn) {
      if (!btn.classList.contains("active")) btn.click();
      // table or phd-wrapper should appear
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
    const wantEnroll = (enroll || "").toUpperCase();

    // table rows first
    const table = $("#studentTable");
    if (table && table.style.display !== "none") {
      for (const tr of table.querySelectorAll("tbody tr")) {
        const rowTxt = tr.textContent || "";
        if (wantEnroll && rowTxt.toUpperCase().includes(wantEnroll)) return tr;
        if (want && norm(rowTxt).includes(want)) return tr;
      }
    }

    // phd / grid / cards
    const cards = $$(".phd-student-card, .student-card, [data-name]");
    for (const el of cards) {
      const dataEnroll = ((el.getAttribute && el.getAttribute("data-enroll")) || "").toUpperCase();
      const t = (el.textContent || "");
      if (wantEnroll && dataEnroll && dataEnroll.includes(wantEnroll)) return el;
      if (want && norm(t).includes(want)) return el;
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
    const enroll = (record.getAttribute('data-enroll') || "").toUpperCase();

    debugLog('openStudentFromRecord', {courseKey, subKey, year, name, enroll});

    if (courseKey) await clickCourse(courseKey);
    if (subKey) await clickSubcourse(subKey);
    if (year) await clickYear(year);

    // After UI set, prefer finding by enrollment
    await waitFor(() => findRenderedStudentElement({ name, enroll }) !== null, 2200, 120);
    let node = findRenderedStudentElement({ name, enroll });
    if (node) { smoothScrollIntoView(node); return true; }

    // If not found, force call showStudents (if available) and retry
    if (typeof window.showStudents === "function") {
      try { window.showStudents(courseKey, subKey || null, year); await sleep(220); } catch {}
      node = findRenderedStudentElement({ name, enroll });
      if (node) { smoothScrollIntoView(node); return true; }
    }

    // give a last-chance short scan of visible cards
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
        // collect years present for this selection
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
    // target may be string (name) or {name,enroll}
    const name = (typeof target === "string" ? target : (target && target.name ? target.name : ""));
    const enroll = (typeof target === "object" ? (target.enroll || "") : "");
    // try dataset record first (most deterministic)
    const record = findStudentRecord({ name, enroll });
    if (record) {
      debugLog("openCohortAndFind: found dataset record");
      const ok = await openStudentFromRecord(record);
      if (ok) return true;
      // else fallback to mapping
    }

    // if enroll known, try mapping -> course/subcourse/year
    if (enroll) {
      const mapped = mapEnrollToCourseSub(enroll);
      const inferred = inferFromEnroll(enroll);
      const degree = (mapped.course || (inferred.degree ? inferred.degree.toLowerCase() : "") ).toLowerCase();
      const sub = mapped.sub || null;
      const year = inferred.year || "";
      // attempt to drive UI using mapping
      if (degree) {
        await clickCourse(degree);
        if (sub) await clickSubcourse(sub);
        if (year) await clickYear(year);
        // try to find by enroll or name
        await waitFor(() => findRenderedStudentElement({ name, enroll }) !== null, 1700, 100);
        const node = findRenderedStudentElement({ name, enroll });
        if (node) { smoothScrollIntoView(node); return true; }
      }
    }

    // final: exhaustive exploratory sweep
    return await exploratoryOpenAndFind(target);
  }

  // ---------- small id helpers (kept public for debugging) ----------
  window.peopleAnchorsDebug = window.peopleAnchorsDebug || false;
  window.peopleAnchors = window.peopleAnchors || {};
  window.peopleAnchors.ensureSectionIdsOnHeadings = ensureSectionIdsOnHeadings;
  window.peopleAnchors.ensureSectionIdsOnPeople = ensureSectionIdsOnPeople;
  window.peopleAnchors.findStudentRecord = findStudentRecord;
  window.peopleAnchors.openStudentFromRecord = openStudentFromRecord;

  // ---------- main init ----------
  async function init() {
    // inject highlight + offset CSS (non-destructive)
    try {
      const css = document.createElement("style");
      css.id = "people-anchors-css";
      css.textContent = `
        .jump-highlight { outline: 3px solid rgba(66,72,144,.45); outline-offset: 3px; border-radius: 10px; transition: outline-color .4s; }
        [id] { scroll-margin-top: 110px; }
      `;
      if (!document.getElementById("people-anchors-css")) document.head.appendChild(css);
    } catch (e) { debugLog("CSS injection failed", e); }

    // install ids safely
    try { ensureSectionIdsOnHeadings(); ensureSectionIdsOnPeople(); } catch (e) { debugLog("ensure ids failed", e); }

    // honor direct id hash
    try {
      const h = (location.hash || "").replace(/^#/, "");
      if (h) {
        const el = document.getElementById(h);
        if (el) smoothScrollIntoView(el);
      }
    } catch {}

    // parse target
    const target = parseTargetFromURL();
    if (!target.name && !target.enroll) return;

    // if not on students page, prefer staff/faculty lookup
    const onStudents = /\/?students\.html(\?|#|$)/i.test(location.pathname);
    if (!onStudents) {
      // If student hash but on other page, try person name fallback
      const personName = (target.name || "").trim();
      if (!jumpToPersonByText(personName)) {
        // retry after load
        setTimeout(() => jumpToPersonByText(personName), 600);
      }
      return;
    }

    // On students page: give UI a short moment to set up
    await sleep(120);

    // If the hash contained both name & enroll, pass both, else pass name
    const input = (target.enroll ? { name: target.name, enroll: target.enroll } : target.name);

    const ok = await openCohortAndFind(input);
    if (!ok) {
      // As a final fallback try staff/faculty style match on page
      await sleep(200);
      if (!jumpToPersonByText(target.name)) {
        debugLog("openCohortAndFind: not found, tried fallback", target);
      }
    }
  }

  // init on ready / DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { init().catch(e => debugLog("init err", e)); });
  } else {
    init().catch(e => debugLog("init err", e));
  }

  // re-honor future hash changes
  window.addEventListener("hashchange", () => {
    try {
      ensureSectionIdsOnHeadings();
      ensureSectionIdsOnPeople();
      scrollToHashIfPossible();
      // re-run init behavior when new student hash arrives
      const target = parseTargetFromURL();
      if (target && (target.name || target.enroll)) {
        // small delay to allow SPA nav to settle
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
