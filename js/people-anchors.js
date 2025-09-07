/* people-anchors.js
 * Aggressive, debug-friendly deep-link helper for Faculty/Staff/Students.
 * See conversation for rationale.  Replace your existing people-anchors.js with this file.
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
  function infoLog(...args){ console.info('[peopleAnchors]', ...args); }

  // ---------- UI helpers ----------
  function smoothScrollIntoView(el){
    if (!el) return;
    try { el.scrollIntoView({behavior:"smooth", block:"center"}); } catch { el.scrollIntoView(true); }
    el.classList.add("jump-highlight");
    setTimeout(()=> el && el.classList && el.classList.remove("jump-highlight"), 2500);
  }
  function tryClick(el){
    if (!el) return false;
    try {
      if (typeof el.click === 'function') { el.click(); return true; }
      const ev = new MouseEvent('click',{bubbles:true,cancelable:true,view:window});
      el.dispatchEvent(ev);
      return true;
    } catch(e){ return false; }
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
      for (const tr of tbl.querySelectorAll("tbody tr")) {
        const rowEnrollAttr = normalizeEnroll(tr.getAttribute("data-enroll") || "");
        const txt = tr.textContent || "";
        if (wantEnrollNorm && rowEnrollAttr && rowEnrollAttr === wantEnrollNorm) return tr;
        if (wantEnrollNorm) {
          const textTokens = tokensFromText(txt);
          if (textTokens.includes(wantEnrollNorm)) return tr;
        }
      }
      if (want) {
        for (const tr of tbl.querySelectorAll("tbody tr")) {
          const txt2 = tr.textContent || "";
          if (norm(txt2).includes(want)) return tr;
        }
      }
    }

    // If not in table or table didn't match, check card-like elements
    for (const el of $$(".phd-student-card, .student-card, [data-name]")) {
      const txt = (el.getAttribute("data-name") || el.textContent || "").toString();
      const dEnroll = normalizeEnroll(el.getAttribute("data-enroll") || "");
      if (wantEnrollNorm && dEnroll && dEnroll === wantEnrollNorm) return el;
      if (wantEnrollNorm && !dEnroll) {
        const textTokens = tokensFromText(txt);
        if (textTokens.includes(wantEnrollNorm)) return el;
      }
      if (want && norm(txt).includes(want)) return el;
    }

    return null;
  }

  // ---------- click + wait helpers ----------
  async function clickCourse(courseKey){
    if (!courseKey) return false;
    const pill = $(`.course-pill[data-course="${courseKey}"]`);
    if (!pill) { debugLog('course pill missing', courseKey); return false; }
    if (!pill.classList.contains("active")) { tryClick(pill); debugLog('clicked course', courseKey); } else debugLog('course already active', courseKey);
    await waitFor(()=> $("#subcourseNav") || $("#yearContainer"), 3000, 100);
    await sleep(120);
    return true;
  }
  async function clickSubcourse(subKey){
    if (!subKey) return true;
    const ok = await waitFor(()=> $(`.subcourse-pill[data-subcourse="${subKey}"]`), 2200, 100);
    if (!ok) { debugLog('subcourse pill never appeared for', subKey); return false; }
    const sp = $(`.subcourse-pill[data-subcourse="${subKey}"]`);
    if (!sp) return false;
    if (!sp.classList.contains("active")) { tryClick(sp); debugLog('clicked subcourse', subKey); }
    await sleep(140);
    return true;
  }
  async function clickYear(year){
    const ok = await waitFor(()=> $$("#yearContainer .year-pill").length > 0, 2600, 110);
    if (!ok) { debugLog('year pills missing'); return false; }
    const btn = $$("#yearContainer .year-pill").find(b => (b.textContent||"").trim() === String(year));
    if (!btn) { debugLog('year pill not found for', year); return false; }
    if (!btn.classList.contains("active")) { tryClick(btn); debugLog('clicked year', year); }
    // wait for listing render
    await waitFor(()=> {
      const tc = $("#tableContainer"); const phd = $(".phd-wrapper");
      return (tc && !tc.classList.contains("hidden")) || !!phd || !!$("#studentTable");
    }, 3500, 140);
    await sleep(220);
    return true;
  }
  function visibleYearsFor(course, sub){
    const sel = `#studentData > div[data-course="${course}"]${sub ? `[data-subcourse="${sub}"]` : `:not([data-subcourse])`}`;
    const groups = Array.from(document.querySelectorAll(sel));
    return [...new Set(groups.map(g => g.dataset.year).filter(Boolean))].sort((a,b)=>b-a);
  }

  // ---------- exact dataset-driven path ----------
  function findDataNodeByEnrollOrExactName({name="", enroll=""}){
    const nodes = $$("#studentData [data-name]");
    if (!nodes.length) return null;
    const wantName = norm(name||"");
    const wantEnrollNorm = normalizeEnroll(enroll);
    if (wantEnrollNorm) {
      const n = nodes.find(nd => normalizeEnroll(nd.getAttribute("data-enroll")||"") === wantEnrollNorm);
      if (n) return n;
    }
    if (wantName) {
      const n2 = nodes.find(nd => norm(nd.getAttribute("data-name")||"") === wantName);
      if (n2) return n2;
    }
    if (wantName) {
      const n3 = nodes.find(nd => norm(nd.getAttribute("data-name")||"").includes(wantName));
      if (n3) return n3;
    }
    return null;
  }

  // drive UI from data node
  async function driveFromExactDataNode(node){
    if (!node) return false;
    const course = node.getAttribute("data-course") || "";
    const sub = node.getAttribute("data-subcourse") || "";
    const year = node.getAttribute("data-year") || "";
    debugLog('driveFromExactDataNode', {course, sub, year, enroll: node.getAttribute("data-enroll")});
    if (!course) return false;

    await clickCourse(course);
    if (sub) await clickSubcourse(sub);
    if (year) {
      const ok = await clickYear(year);
      if (!ok) debugLog('clickYear returned false for', year);
    } else {
      if (typeof window.showStudents === "function") {
        try { window.showStudents(course, sub || null); await sleep(200); } catch {}
      }
    }

    const enroll = node.getAttribute("data-enroll") || "";
    const name = node.getAttribute("data-name") || "";
    const found = await (async () => {
      const ok = await waitFor(()=> !!findRenderedStudentNode({name, enroll}), 4500, 150);
      return ok ? findRenderedStudentNode({name, enroll}) : null;
    })();

    if (found) { smoothScrollIntoView(found); return true; }
    await sleep(240);
    const found2 = findRenderedStudentNode({name, enroll});
    if (found2){ smoothScrollIntoView(found2); return true; }
    debugLog('driveFromExactDataNode: element not found after rendering', node);
    return false;
  }

  // ---------- aggressive forced sweep fallback ----------
  async function forceSweepAndFind(name, enroll){
    const wantEnrollNorm = normalizeEnroll(enroll);
    const explicitCourseKeys = (window.courses && Object.keys(window.courses)) || ["btech","msc","mtech","phd"];
    // reorder to prefer inferred degree
    const inferred = inferFromEnroll(enroll);
    let courseKeys = explicitCourseKeys.slice();
    if (inferred && inferred.degree){
      const dk = degreeToKey(inferred.degree);
      if (dk && courseKeys.includes(dk)) courseKeys = [dk, ...courseKeys.filter(c=>c!==dk)];
    }
    debugLog('forceSweepAndFind: courseKeys order', courseKeys);

    for (const deg of courseKeys){
      debugLog('forceSweepAndFind: clicking course', deg);
      await clickCourse(deg);
      const subs = (window.courses?.[deg]?.subcourses) ? Object.keys(window.courses[deg].subcourses) : [null];
      // try prefix sub early
      let orderedSubs = subs.slice();
      const psub2 = enrollPrefixToSubcourse(enroll);
      if (psub2 && orderedSubs.includes(psub2)) orderedSubs = [psub2, ...orderedSubs.filter(s=>s!==psub2)];
      for (const s of orderedSubs){
        if (s) { debugLog('forceSweepAndFind: clicking subcourse', s); await clickSubcourse(s); }
        const years = visibleYearsFor(deg, s);
        debugLog('forceSweepAndFind: years to try', years);
        for (const y of years){
          if (!y) continue;
          debugLog('forceSweepAndFind: clicking year', y);
          await clickYear(y);
          // small passive wait and scan repeatedly for this year
          const passWaits = [80, 140, 260, 480];
          for (let w of passWaits){
            await sleep(w);
            const found = findRenderedStudentNode({name, enroll});
            if (found){
              debugLog('forceSweepAndFind: found after clicking', {deg,s,y,found});
              // if row has link/button inside, click it to open detail
              const anchor = found.querySelector && (found.querySelector('a') || found.querySelector('button'));
              if (anchor){
                debugLog('forceSweepAndFind: clicking internal anchor/button', anchor);
                tryClick(anchor);
              }
              smoothScrollIntoView(found);
              return found;
            }
          }
        }
      }
    }
    debugLog('forceSweepAndFind: nothing found after exhaustive sweep', {name, enroll});
    return null;
  }

  // ---------- main student driver (tries many strategies) ----------
  async function openCohortAndFind(input){
    const name = typeof input === "string" ? input : (input.name||"");
    const enroll = typeof input === "object" ? (input.enroll||"") : "";

    debugLog('openCohortAndFind start', {name, enroll});

    // passive fast-path retries
    if (enroll && enroll.toString().trim()) {
      const retryDelays = [60, 140, 240, 420];
      for (let i=0;i<retryDelays.length;i++){
        await sleep(retryDelays[i]);
        const f = findRenderedStudentNode({name, enroll});
        if (f){ debugLog('openCohortAndFind: fast passive found', f); smoothScrollIntoView(f); return true; }
      }
      // DOM-wide token exact scan
      const wantEnrollNorm = normalizeEnroll(enroll);
      if (wantEnrollNorm){
        const candidate = Array.from(document.querySelectorAll('body *')).find(el => {
          try {
            const t = (el.getAttribute && el.getAttribute('data-enroll')) || el.textContent || '';
            const normalized = (t||'').toString().toUpperCase().replace(/\s+/g,'').replace(/[^A-Z0-9]/g,'');
            return normalized === wantEnrollNorm;
          } catch(e){ return false; }
        });
        if (candidate) { debugLog('openCohortAndFind: DOM-wide text-scan candidate', candidate); smoothScrollIntoView(candidate); return true; }
      }
    }

    // dataset-driven path
    const dataNode = findDataNodeByEnrollOrExactName({name, enroll});
    if (dataNode){
      debugLog('openCohortAndFind: found exact data node', dataNode);
      const ok = await driveFromExactDataNode(dataNode);
      if (ok) return true;
      debugLog('openCohortAndFind: driveFromExactDataNode failed, will try force sweep');
    }

    // regular hint + sweep (existing logic)
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

    if (hinted && hinted.degreeKey){
      debugLog('openCohortAndFind: trying hinted degree first', hinted);
      const deg = hinted.degreeKey;
      await clickCourse(deg);
      const declaredSubs = (window.courses?.[deg]?.subcourses) ? Object.keys(window.courses[deg].subcourses) : [null];
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

    // Exhaustive forced sweep (aggressive)
    debugLog('openCohortAndFind: starting exhaustive forced sweep');
    const forced = await forceSweepAndFind(name, enroll);
    if (forced) { debugLog('openCohortAndFind: forced sweep succeeded'); return true; }

    debugLog('openCohortAndFind: nothing found after all attempts', {name, enroll});
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
