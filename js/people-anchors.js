/* people-anchors.js
 * Robust deep-link helper for Faculty/Staff/Students.
 * - Predictable ids: section-<slug> for headings & people blocks
 * - Supports text fragments (#:~:text=...) and #student-<name>-<ENROLL>
 * - Students: auto-open Course -> Subcourse -> Year and scroll to the student
 * - Smooth scroll + offset below fixed header
 *
 * Improvements:
 * - Stronger waiting logic between UI steps (click course -> wait for subcourse/year controls)
 * - Roll-prefix mapping to subcourse (extendable)
 * - Debug logging via window.peopleAnchors.debug = true
 */
(function () {
  // ---------- tiny utils ----------
  const $  = (sel, root=document) => { try { return root.querySelector(sel); } catch { return null; } };
  const $$ = (sel, root=document) => { try { return Array.from((root||document).querySelectorAll(sel)); } catch { return []; } };
  const norm = s => (s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const slug = s => norm(s).replace(/&/g," and ").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-");
  const sleep = ms => new Promise(r => setTimeout(r,ms));
  async function waitFor(condFn, timeout=2000, interval=80){
    const start = Date.now();
    while (Date.now() - start < timeout){
      try { if (condFn()) return true; } catch {}
      await sleep(interval);
    }
    return false;
  }
  function debugLog(...args){
    if (window.peopleAnchors && window.peopleAnchors.debug) console.debug('[peopleAnchors]', ...args);
  }

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

  // ---------- infer degree/year from enroll ----------
  function inferFromEnroll(enroll){
    const E = (enroll||"").toUpperCase();
    let degree = "";
    if (/RESCH/.test(E) || /\bPHD\b/.test(E) || /\bPH\.?D\b/.test(E)) degree = "PhD";
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

  // canonical degree -> page key
  function degreeToKey(degStr){
    if (!degStr) return "";
    const d = (degStr||"").toString().toLowerCase();
    if (d.includes("resch") || d.includes("phd") || d.includes("ph.")) return "phd";
    if (d.includes("m.tech") || d.includes("mtech") || d.includes("m-tech")) return "mtech";
    if (d.includes("m.sc") || d.includes("msc") || d.includes("m-sc")) return "msc";
    if (d.includes("b.tech") || d.includes("btech") || d.includes("b-tech")) return "btech";
    if (d.includes("ph")) return "phd";
    if (d.includes("m") && d.includes("tech")) return "mtech";
    if (d.includes("msc")) return "msc";
    if (d.includes("b") && d.includes("tech")) return "btech";
    return "";
  }

  // ---------- roll-prefix -> subcourse mapping (extendable) ----------
  // e.g. EP -> engineering-physics, MP -> medical-physics, PH -> physics (for MSc)
  const ROLL_PREFIX_MAP = {
    ep: "engineering-physics",
    mp: "medical-physics",
    ph: "physics",           // use carefully; we also rely on degree to decide
    qc: "quantum"            // example / placeholder
  };

  function enrollPrefixToSubcourse(enroll){
    if (!enroll) return null;
    const E = enroll.toLowerCase();
    // try first two letters
    const p2 = E.slice(0,2);
    if (ROLL_PREFIX_MAP[p2]) return ROLL_PREFIX_MAP[p2];
    // try first three letters
    const p3 = E.slice(0,3);
    if (ROLL_PREFIX_MAP[p3]) return ROLL_PREFIX_MAP[p3];
    return null;
  }

  // ---------- find rendered student node ----------
  function findRenderedStudentNode({name="", enroll=""}){
    const want = norm(name||"");
    const wantEnroll = (enroll||"").toUpperCase();

    // If table visible, search rows
    const tbl = $("#studentTable");
    if (tbl && tbl.style.display !== "none") {
      for (const tr of tbl.querySelectorAll("tbody tr")) {
        const txt = tr.textContent || "";
        if ((want && norm(txt).includes(want)) || (wantEnroll && txt.toUpperCase().includes(wantEnroll))) {
          debugLog('found in table row:', tr);
          return tr;
        }
      }
    }

    // Check phd-wrapper cards / phd-student-card
    for (const el of $$(".phd-student-card, .student-card, [data-name]")) {
      const txt = (el.getAttribute("data-name") || el.textContent || "").toString();
      const dEnroll = (el.getAttribute("data-enroll") || "").toUpperCase();
      if ((want && norm(txt).includes(want)) || (wantEnroll && dEnroll.includes(wantEnroll))) {
        debugLog('found in card:', el);
        return el;
      }
    }
    return null;
  }

  // ---------- UI drive functions (click + wait) ----------
  async function clickCourse(courseKey){
    if (!courseKey) return false;
    const pill = $(`.course-pill[data-course="${courseKey}"]`);
    if (!pill) {
      debugLog('course pill not found for', courseKey);
      return false;
    }
    if (!pill.classList.contains("active")) {
      pill.click();
      debugLog('clicked course', courseKey);
    } else debugLog('course already active', courseKey);

    // wait for either subcourseNav OR yearContainer to appear
    const ok = await waitFor(() => $("#subcourseNav") || $("#yearContainer"), 2000, 80);
    await sleep(80);
    return ok;
  }

  async function clickSubcourse(subKey){
    if (!subKey) return true; // nothing to do
    // Wait for subcourse pills
    const ok = await waitFor(() => $(`.subcourse-pill[data-subcourse="${subKey}"]`), 2000, 80);
    if (!ok) { debugLog('subcourse pill never showed for', subKey); return false; }
    const sp = $(`.subcourse-pill[data-subcourse="${subKey}"]`);
    if (!sp) return false;
    if (!sp.classList.contains("active")) { sp.click(); debugLog('clicked subcourse', subKey); }
    await sleep(80);
    return true;
  }

  async function clickYear(year){
    // wait for year pills
    const ok = await waitFor(()=> $$("#yearContainer .year-pill").length > 0, 2000, 80);
    if (!ok) { debugLog('year pills never appeared'); return false; }
    const btn = $$("#yearContainer .year-pill").find(b => (b.textContent||"").trim() === String(year));
    if (!btn) { debugLog('year pill not found for', year); return false; }
    if (!btn.classList.contains("active")) { btn.click(); debugLog('clicked year', year); }
    // wait until student listing renders (table or phd wrapper)
    const ok2 = await waitFor(()=> {
      const tc = $("#tableContainer"); const phd = $(".phd-wrapper");
      return (tc && !tc.classList.contains("hidden")) || !!phd || !!$("#studentTable");
    }, 2000, 80);
    await sleep(120);
    return ok2;
  }

  // collect visible years for a (course,sub)
  function visibleYearsFor(course, sub){
    const sel = `#studentData > div[data-course="${course}"]${sub ? `[data-subcourse="${sub}"]` : `:not([data-subcourse])`}`;
    const groups = Array.from(document.querySelectorAll(sel));
    const years = [...new Set(groups.map(g => g.dataset.year).filter(Boolean))].sort((a,b)=>b-a);
    return years;
  }

  // ---------- main driver for students ----------
  async function openCohortAndFind(input){ 
    // input can be string name or object {name, enroll}
    const name = typeof input === "string" ? input : (input.name||"");
    const explicitEnroll = typeof input === "object" ? (input.enroll||"") : "";

    const courseKeys = (window.courses && Object.keys(window.courses)) || ["btech","msc","mtech","phd"];

    // get hint from hidden dataset if present
    const nodes = $$("#studentData [data-name]");
    let hinted = null;
    if (nodes.length){
      const want = norm(name);
      const node = nodes.find(n => norm(n.getAttribute("data-name")).includes(want));
      if (node){
        const enroll = node.getAttribute("data-enroll")||"";
        const hintDeg = node.getAttribute("data-degree")||"";
        const hintYear = node.getAttribute("data-year")||"";
        const inferred = inferFromEnroll(enroll);
        hinted = {
          degreeKey: degreeToKey(hintDeg || inferred.degree),
          year: hintYear || inferred.year,
          enroll: enroll || ""
        };
      }
    }

    // if explicitEnroll present (from hash), make a hint from it too (override)
    if (explicitEnroll) {
      const inf = inferFromEnroll(explicitEnroll);
      hinted = hinted || {};
      hinted.degreeKey = degreeToKey(inf.degree) || hinted.degreeKey;
      hinted.year = hinted.year || inf.year;
      hinted.enroll = explicitEnroll;
    }

    debugLog('openCohortAndFind: name=', name, 'hinted=', hinted);

    // derive possible subcourse from roll prefix
    const prefixSub = (hinted && hinted.enroll) ? enrollPrefixToSubcourse(hinted.enroll) : null;
    if (prefixSub) debugLog('prefix-derived subcourse:', prefixSub);

    // fast path: try hinted degree/sub/year if available
    if (hinted && hinted.degreeKey){
      const deg = hinted.degreeKey;
      await clickCourse(deg);
      // try prefix subcourse first
      const subsToTry = [];
      if (prefixSub) subsToTry.push(prefixSub);
      // then all declared subcourses for the degree
      const declaredSubs = (window.courses?.[deg]?.subcourses) ? Object.keys(window.courses[deg].subcourses) : [null];
      for (const s of declaredSubs) if (!subsToTry.includes(s)) subsToTry.push(s);
      // try each sub & year
      for (const sub of subsToTry){
        if (sub) await clickSubcourse(sub);
        const years = hinted.year ? [hinted.year] : visibleYearsFor(deg, sub);
        for (const y of years){
          if (!y) continue;
          await clickYear(y);
          const found = findRenderedStudentNode({name, enroll: hinted.enroll || explicitEnroll});
          if (found) { smoothScrollIntoView(found); return true; }
        }
      }
    }

    // fallback: sweep all degrees/subs/years deterministically
    for (const deg of courseKeys){
      await clickCourse(deg);
      const subs = (window.courses?.[deg]?.subcourses) ? Object.keys(window.courses[deg].subcourses) : [null];
      // ensure prefix sub tried early if matches this degree
      let orderedSubs = subs.slice();
      if (explicitEnroll){
        const psub = enrollPrefixToSubcourse(explicitEnroll);
        if (psub && orderedSubs.includes(psub)){
          orderedSubs = [psub, ...orderedSubs.filter(s=>s!==psub)];
        }
      }
      for (const sub of orderedSubs){
        if (sub) await clickSubcourse(sub);
        const years = visibleYearsFor(deg, sub);
        for (const y of years){
          if (!y) continue;
          await clickYear(y);
          const found = findRenderedStudentNode({name, enroll: explicitEnroll});
          if (found) { smoothScrollIntoView(found); return true; }
        }
      }
    }

    // nothing found
    debugLog('openCohortAndFind: not found for', name);
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
    // small highlight + header offset
    const css = document.createElement("style");
    css.textContent = `
      .jump-highlight { outline: 3px solid rgba(66,72,144,.45); outline-offset: 3px; border-radius: 10px; }
      [id]{ scroll-margin-top:110px; }
    `;
    document.head.appendChild(css);

    // install ids
    ensureSectionIdsOnHeadings();
    ensureSectionIdsOnPeople();

    // if direct #id exists, scroll there first
    if (scrollToHashIfPossible()) return;

    // check parsed student hash (name+enroll)
    const parsed = parseStudentHash();
    if (parsed && (parsed.name || parsed.enroll)){
      debugLog('parsed student hash', parsed);
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)){
        await sleep(120);
        await openCohortAndFind(parsed);
        return;
      } else {
        // if not on students page, still try staff/faculty fallback
        jumpToPersonByText(parsed.name);
        return;
      }
    }

    // else try text-fragment or #student-name
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

    // re-honor hash changes later
    window.addEventListener("hashchange", () => {
      ensureSectionIdsOnHeadings();
      ensureSectionIdsOnPeople();
      scrollToHashIfPossible();
    });

    // safety retry for late-rendering content
    setTimeout(()=> scrollToHashIfPossible(), 600);
  });

  // small API + debug toggle
  window.peopleAnchors = {
    debug: false,
    jumpToName: async (v) => {
      if (/\/?students\.html(\?|#|$)/i.test(location.pathname)) return openCohortAndFind(v);
      return jumpToPersonByText(v);
    },
    // allow customizing prefix map at runtime
    setPrefixMap: (m) => { Object.assign(ROLL_PREFIX_MAP, m || {}); }
  };

})(); 
