/* people-anchors.js
 * Deep-link helper for Faculty/Staff/Students.
 * - Uses #student-<name>-<ENROLL> or #:~:text=... fragments
 * - For students: first tries to find exact data node in #studentData by data-enroll or exact name
 *   and uses that node's data-course/data-subcourse/data-year to drive the UI (reliable).
 * - Falls back to hinting and deterministic sweep if exact node not found.
 * - Keeps staff/faculty text-match fallback intact.
 * - Exposes debug toggle + prefix map setter.
 */
(function () {
  // ---------- tiny utils ----------
  const $  = (sel, root=document) => { try { return root.querySelector(sel); } catch { return null; } };
  const $$ = (sel, root=document) => { try { return Array.from((root||document).querySelectorAll(sel)); } catch { return []; } };
  const norm = s => (s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const slug = s => norm(s).replace(/&/g," and ").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-");
  const sleep = ms => new Promise(r => setTimeout(r,ms));
  async function waitFor(condFn, timeout=2500, interval=80){
    const start = Date.now();
    while (Date.now() - start < timeout){
      try { if (condFn()) return true; } catch {}
      await sleep(interval);
    }
    return false;
  }
  function debugLog(...args){ if (window.peopleAnchors && window.peopleAnchors.debug) console.debug('[peopleAnchors]', ...args); }

  // ---------- UI helpers ----------
  function smoothScrollIntoView(el){
    if (!el) return;
    try { el.scrollIntoView({behavior:"smooth", block:"center"}); } catch { el.scrollIntoView(true); }
    el.classList.add("jump-highlight");
    setTimeout(()=> el && el.classList && el.classList.remove("jump-highlight"), 2500);
  }

  // ---------- parse hash / text-fragment ----------
  function parseStudentHash(){
    const h = window.location.hash || "";
    if (!h.startsWith("#student-")) return null;
    const slugged = h.replace(/^#student-/,"");
    const parts = slugged.split("-");
    if (parts.length >= 2){
      const enroll = parts[parts.length-1];
      const name = parts.slice(0,-1).join(" ");
      return { name: decodeURIComponent(name), enroll: (enroll||"").toUpperCase() };
    } else {
      return { name: decodeURIComponent(slugged.replace(/-/g, " ")), enroll: "" };
    }
  }
  function getTargetNameFromURL(){
    const href = String(window.location.href || "");
    if (href.includes("#:~:text=")) {
      const after = href.split("#:~:text=").pop();
      if (after) {
        try { return decodeURIComponent(after).split("&")[0]; } catch { return after; }
      }
    }
    const ph = parseStudentHash();
    if (ph) return ph.name || "";
    const h = window.location.hash || "";
    if (h && h.startsWith("#student-")) return h.replace(/^#student-/,"").replace(/-/g," ");
    return "";
  }

  // ---------- install predictable IDs ----------
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
      const nameText = (nameEl.textContent || "").trim();
      const candidate = nameText.split(/\n/)[0].trim();
      const s = slug(candidate);
      if (!s || s.length < 3) return;
      if (!el.id) el.id = uniqId("section-" + s);
    });
  }

  function scrollToHashIfPossible() {
    const hash = (location.hash || "").replace(/^#/,"");
    if (!hash) return false;
    const el = document.getElementById(hash);
    if (el) { smoothScrollIntoView(el); return true; }
    return false;
  }

  // ---------- enroll inference ----------
  function inferFromEnroll(enroll){
    const E = (enroll||"").toUpperCase();
    let degree = "";
    if (/RESCH/.test(E) || /\bPHD\b/.test(E)) degree = "PhD";
    else if (/MTECH|M-?TECH/.test(E)) degree = "M.Tech";
    else if (/MSC|M\.?SC/.test(E)) degree = "M.Sc";
    else if (/BTECH|B-?TECH/.test(E)) degree = "B.Tech";

    let year = "";
    const m = E.match(/(\d{2})(?=[A-Z])/);
    if (m) {
      const yy = parseInt(m[1],10);
      year = (yy >= 50 ? 1900+yy : 2000+yy).toString();
    }
    return { degree, year };
  }

  function degreeToKey(degStr){
    if (!degStr) return "";
    const d = (degStr||"").toString().toLowerCase();
    if (d.includes("resch") || d.includes("phd") || d.includes("ph.")) return "phd";
    if (d.includes("m.tech") || d.includes("mtech") || d.includes("m-tech")) return "mtech";
    if (d.includes("m.sc") || d.includes("msc") || d.includes("m-sc")) return "msc";
    if (d.includes("b.tech") || d.includes("btech") || d.includes("b-tech")) return "btech";
    return "";
  }

  // ---------- roll-prefix map ----------
  const ROLL_PREFIX_MAP = {
    ep: "engineering-physics",
    mp: "medical-physics",
    ph: "physics",
    qc: "quantum"
  };
  function enrollPrefixToSubcourse(enroll){
    if (!enroll) return null;
    const E = enroll.toLowerCase();
    const p2 = E.slice(0,2);
    if (ROLL_PREFIX_MAP[p2]) return ROLL_PREFIX_MAP[p2];
    const p3 = E.slice(0,3);
    if (ROLL_PREFIX_MAP[p3]) return ROLL_PREFIX_MAP[p3];
    return null;
  }

  // ---------- helpers to canonicalize enroll tokens ----------
  function normalizeEnroll(e){
    return (e||"").toString().toUpperCase().replace(/\s+/g,"").replace(/[^A-Z0-9]/g,"");
  }
  function tokensFromText(txt){
    return (txt||"").toUpperCase().split(/\s|[,\u00A0|\/\-]+/).map(t => t.replace(/[^A-Z0-9]/g,"")).filter(Boolean);
  }

  // ---------- find rendered student node ----------
  function findRenderedStudentNode({name="", enroll=""}){
    const want = norm(name||"");
    const wantEnrollNorm = normalizeEnroll(enroll);

    // If the page uses a table view, prefer exact-enroll matches in rows
    const tbl = $("#studentTable");
    if (tbl && tbl.style.display !== "none") {
      // 1) prefer exact data-enroll attribute matches in rows (canonicalized)
      for (const tr of tbl.querySelectorAll("tbody tr")) {
        const rowEnrollAttr = normalizeEnroll(tr.getAttribute("data-enroll") || "");
        const txt = tr.textContent || "";
        if (wantEnrollNorm && rowEnrollAttr && rowEnrollAttr === wantEnrollNorm) return tr;

        // 2) fallback: try to find the enroll token in row text but match canonicalized tokens
        if (wantEnrollNorm) {
          const textTokens = tokensFromText(txt);
          if (textTokens.includes(wantEnrollNorm)) return tr;
        }
      }

      // 3) no enroll match found in table: fallback to name substring match (first hit)
      if (want) {
        for (const tr of tbl.querySelectorAll("tbody tr")) {
          const txt2 = tr.textContent || "";
          if (norm(txt2).includes(want)) return tr;
        }
      }
    }

    // If not in table or table didn't match, check card-like elements (phd-student-card, student-card or elements with data-name)
    for (const el of $$(".phd-student-card, .student-card, [data-name]")) {
      const txt = (el.getAttribute("data-name") || el.textContent || "").toString();
      const dEnroll = normalizeEnroll(el.getAttribute("data-enroll") || "");
      // Prefer explicit enrollment match (canonicalized)
      if (wantEnrollNorm && dEnroll && dEnroll === wantEnrollNorm) return el;

      // If element lacks data-enroll attribute, still check textual enrollment presence in canonical tokens
      if (wantEnrollNorm && !dEnroll) {
        const textTokens = tokensFromText(txt);
        if (textTokens.includes(wantEnrollNorm)) return el;
      }

      // Fallback to name match
      if (want && norm(txt).includes(want)) return el;
    }

    return null;
  }

  // ---------- click + wait helpers ----------
  async function clickCourse(courseKey){
    if (!courseKey) return false;
    const pill = $(`.course-pill[data-course="${courseKey}"]`);
    if (!pill) { debugLog('course pill missing', courseKey); return false; }
    if (!pill.classList.contains("active")) { pill.click(); debugLog('clicked course', courseKey); } else debugLog('course already active', courseKey);
    await waitFor(()=> $("#subcourseNav") || $("#yearContainer"), 2000, 80);
    await sleep(90);
    return true;
  }
  async function clickSubcourse(subKey){
    if (!subKey) return true;
    const ok = await waitFor(()=> $(`.subcourse-pill[data-subcourse="${subKey}"]`), 1600, 80);
    if (!ok) { debugLog('subcourse pill never appeared for', subKey); return false; }
    const sp = $(`.subcourse-pill[data-subcourse="${subKey}"]`);
    if (!sp) return false;
    if (!sp.classList.contains("active")) { sp.click(); debugLog('clicked subcourse', subKey); }
    await sleep(90);
    return true;
  }
  async function clickYear(year){
    const ok = await waitFor(()=> $$("#yearContainer .year-pill").length > 0, 1600, 80);
    if (!ok) { debugLog('year pills missing'); return false; }
    const btn = $$("#yearContainer .year-pill").find(b => (b.textContent||"").trim() === String(year));
    if (!btn) { debugLog('year pill not found for', year); return false; }
    if (!btn.classList.contains("active")) { btn.click(); debugLog('clicked year', year); }
    // wait for listing render
    await waitFor(()=> {
      const tc = $("#tableContainer"); const phd = $(".phd-wrapper");
      return (tc && !tc.classList.contains("hidden")) || !!phd || !!$("#studentTable");
    }, 2200, 100);
    await sleep(140);
    return true;
  }
  function visibleYearsFor(course, sub){
    const sel = `#studentData > div[data-course="${course}"]${sub ? `[data-subcourse="${sub}"]` : `:not([data-subcourse])`}`;
    const groups = Array.from(document.querySelectorAll(sel));
    return [...new Set(groups.map(g => g.dataset.year).filter(Boolean))].sort((a,b)=>b-a);
  }

  // ---------- NEW: exact dataset-driven path ----------
  // Try to find an exact entry in #studentData by data-enroll or exact data-name
  function findDataNodeByEnrollOrExactName({name="", enroll=""}){ 
    const nodes = $$("#studentData [data-name]");
    if (!nodes.length) return null;
    const wantName = norm(name||"");
    const wantEnrollNorm = normalizeEnroll(enroll);

    // try exact enroll match first
    if (wantEnrollNorm) {
      const n = nodes.find(nd => normalizeEnroll(nd.getAttribute("data-enroll")||"") === wantEnrollNorm);
      if (n) return n;
    }
    // try exact name match (data-name)
    if (wantName) {
      const n2 = nodes.find(nd => norm(nd.getAttribute("data-name")||"") === wantName);
      if (n2) return n2;
    }
    // fallback substring (first occurrence)
    if (wantName) {
      const n3 = nodes.find(nd => norm(nd.getAttribute("data-name")||"").includes(wantName));
      if (n3) return n3;
    }
    return null;
  }

  // Use the exact node's attributes to drive the UI (most reliable)
  async function driveFromExactDataNode(node){
    if (!node) return false;
    const course = node.getAttribute("data-course") || "";
    const sub = node.getAttribute("data-subcourse") || "";
    const year = node.getAttribute("data-year") || "";
    debugLog('driveFromExactDataNode', {course, sub, year, enroll: node.getAttribute("data-enroll")});
    if (!course) return false;

    // click course -> click sub if present -> click year
    await clickCourse(course);
    if (sub) await clickSubcourse(sub);
    if (year) {
      const ok = await clickYear(year);
      if (!ok) debugLog('clickYear returned false for', year);
    } else {
      // if no year attribute, try to open students for the course/sub via site-provided func
      if (typeof window.showStudents === "function") {
        try { window.showStudents(course, sub || null); await sleep(140); } catch {}
      }
    }

    // Now wait and find the rendered node by enroll or name (longer wait allowed)
    const enroll = node.getAttribute("data-enroll") || "";
    const name = node.getAttribute("data-name") || "";
    const found = await (async () => {
      const ok = await waitFor(()=> !!findRenderedStudentNode({name, enroll}), 3500, 120);
      return ok ? findRenderedStudentNode({name, enroll}) : null;
    })();

    if (found) { smoothScrollIntoView(found); return true; }
    debugLog('driveFromExactDataNode: element not found after rendering', node);
    return false;
  }

  // ---------- main student driver (tries dataset exact-match first) ----------
  async function openCohortAndFind(input){
    // input: string name OR object {name, enroll}
    const name = typeof input === "string" ? input : (input.name||"");
    const enroll = typeof input === "object" ? (input.enroll||"") : "";

    debugLog('openCohortAndFind start', {name, enroll});

    // ----- FAST-PATH: if enroll present, try passive global rendered search first -----
    if (enroll && enroll.toString().trim()) {
      await sleep(90); // let late-rendering complete shortly
      const foundGlobal = findRenderedStudentNode({name, enroll});
      if (foundGlobal) {
        debugLog('openCohortAndFind: global enroll found (fast-path)', enroll, foundGlobal);
        smoothScrollIntoView(foundGlobal);
        return true;
      }
      // as an extra fallback, do a text-scan over DOM tokens (canonicalized)
      const wantEnrollNorm = normalizeEnroll(enroll);
      if (wantEnrollNorm) {
        const candidate = Array.from(document.querySelectorAll('body *')).find(el => {
          try {
            const t = (el.getAttribute && el.getAttribute('data-enroll')) || el.textContent || '';
            const normalized = (t||'').toString().toUpperCase().replace(/\s+/g,'').replace(/[^A-Z0-9]/g,'');
            return normalized === wantEnrollNorm;
          } catch(e) { return false; }
        });
        if (candidate) {
          debugLog('openCohortAndFind: global enroll found by text-scan', enroll, candidate);
          smoothScrollIntoView(candidate);
          return true;
        }
      }
    }

    // try exact dataset node first
    const dataNode = findDataNodeByEnrollOrExactName({name, enroll});
    if (dataNode) {
      debugLog('found exact data node', dataNode);
      const ok = await driveFromExactDataNode(dataNode);
      if (ok) return true;
      // if exact node path unexpectedly fails, fall through to hinted/sweep
      debugLog('exact data node path failed, falling back to hinted/sweep');
    }

    // If no exact node, try hinting by enroll/name and then sweep (existing logic)
    // Build hint
    let hinted = null;
    const nodes = $$("#studentData [data-name]");
    if (nodes.length){
      const want = norm(name);
      const node = nodes.find(n => norm(n.getAttribute("data-name")).includes(want));
      if (node) {
        const enrollN = node.getAttribute("data-enroll")||"";
        const hintDeg = node.getAttribute("data-degree")||"";
        const hintYear = node.getAttribute("data-year")||"";
        const inferred = inferFromEnroll(enrollN||enroll);
        hinted = {
          degreeKey: degreeToKey(hintDeg || inferred.degree),
          year: hintYear || inferred.year,
          enroll: enrollN || enroll
        };
      }
    }

    // fallback sweep: attempt hinted degree first then all degrees
    const courseKeys = (window.courses && Object.keys(window.courses)) || ["btech","msc","mtech","phd"];
    if (hinted && hinted.degreeKey){
      const deg = hinted.degreeKey;
      await clickCourse(deg);
      const declaredSubs = (window.courses?.[deg]?.subcourses) ? Object.keys(window.courses[deg].subcourses) : [null];
      // prefer sub derived from enroll prefix
      const psub = enrollPrefixToSubcourse(hinted.enroll || enroll);
      const subsToTry = psub ? [psub, ...declaredSubs.filter(s=>s!==psub)] : declaredSubs;
      for (const s of subsToTry){
        if (s) await clickSubcourse(s);
        const years = hinted.year ? [hinted.year] : visibleYearsFor(deg, s);
        for (const y of years){
          if (!y) continue;
          await clickYear(y);
          const found = findRenderedStudentNode({name, enroll: hinted.enroll || enroll});
          if (found) { smoothScrollIntoView(found); return true; }
        }
      }
    }

    // full sweep
    for (const deg of courseKeys){
      await clickCourse(deg);
      const subs = (window.courses?.[deg]?.subcourses) ? Object.keys(window.courses[deg].subcourses) : [null];
      // try prefix sub early if enroll present
      let orderedSubs = subs.slice();
      const psub2 = enrollPrefixToSubcourse(enroll);
      if (psub2 && orderedSubs.includes(psub2)) orderedSubs = [psub2, ...orderedSubs.filter(s=>s!==psub2)];
      for (const s of orderedSubs){
        if (s) await clickSubcourse(s);
        const years = visibleYearsFor(deg, s);
        for (const y of years){
          if (!y) continue;
          await clickYear(y);
          const found = findRenderedStudentNode({name, enroll});
          if (found) { smoothScrollIntoView(found); return true; }
        }
      }
    }
    debugLog('openCohortAndFind: nothing found for', {name, enroll});
    return false;
  }

  // ---------- faculty/staff fallback ----------
  function jumpToPersonByText(name){
    const want = norm(name||"");
    if (!want) return false;
    const candidates = $$("h1,h2,h3,h4,h5,.faculty-card,.staff-card,.profile-card,.member,.person,.card,.people-card");
    const el = candidates.find(n => norm(n.textContent).includes(want));
    if (el) { smoothScrollIntoView(el); return true; }
    return false;
  }

  // ---------- main ----------
  document.addEventListener("DOMContentLoaded", async function(){
    // highlight + header offset
    const css = document.createElement("style");
    css.textContent = `
      .jump-highlight { outline: 3px solid rgba(66,72,144,.45); outline-offset: 3px; border-radius: 10px; }
      [id]{ scroll-margin-top:110px; }
    `;
    document.head.appendChild(css);

    // install ids
    ensureSectionIdsOnHeadings();
    ensureSectionIdsOnPeople();

    // honor direct #id first
    if (scrollToHashIfPossible()) return;

    // parsed student hash with enroll
    const parsed = parseStudentHash();
    if (parsed && (parsed.name || parsed.enroll)){
      debugLog('parsed student hash', parsed);
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)){
        await sleep(120);
        await openCohortAndFind(parsed);
        return;
      } else {
        jumpToPersonByText(parsed.name);
        return;
      }
    }

    // else text-fragment or #student-name
    const targetName = getTargetNameFromURL();
    if (targetName){
      debugLog('targetName from URL', targetName);
      const onStudents = /\/?students\.html(\?|#|$)/i.test(location.pathname);
      if (onStudents){
        await sleep(120);
        await openCohortAndFind(targetName);
      } else {
        jumpToPersonByText(targetName);
      }
    }

    // re-honor hash changes
    window.addEventListener("hashchange", () => {
      ensureSectionIdsOnHeadings();
      ensureSectionIdsOnPeople();
      scrollToHashIfPossible();
    });

    // safety retry for late-rendering content
    setTimeout(()=> scrollToHashIfPossible(), 600);
  });

  // API + debug + prefix map setter
  window.peopleAnchors = {
    debug: false,
    jumpToName: async (v) => {
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) return openCohortAndFind(v);
      return jumpToPersonByText(v);
    },
    setPrefixMap: (m) => { Object.assign(ROLL_PREFIX_MAP, m || {}); }
  };

})();
