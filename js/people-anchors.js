/* people-anchors.js
 * Deep-link helper for Faculty/Staff/Students.
 * - Supports anchors created by search: #student-<slug> or #:~:text=<Name>
 * - Auto-activates Degree/Year on Students page and scrolls to the card
 */

(function () {
  // ---------- tiny utils ----------
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const norm = s => (s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const slug = s => norm(s).replace(/&/g," and ").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-");

  function smoothScrollIntoView(el){
    if (!el) return;
    try { el.scrollIntoView({behavior:"smooth", block:"center"}); }
    catch { el.scrollIntoView(true); }
    el.classList.add("jump-highlight");
    setTimeout(()=> el && el.classList && el.classList.remove("jump-highlight"), 2500);
  }

  // get name from URL: #student-ramesh-kv   or   #:~:text=RAMESH%20K%20V
  function getTargetNameFromURL(){
    const href = String(window.location.href || "");
    const afterFrag = href.split("#:~:text=").pop();
    if (href.includes("#:~:text=") && afterFrag) {
      try { return decodeURIComponent(afterFrag).split("&")[0]; } catch { return afterFrag; }
    }
    const h = window.location.hash || "";
    if (h && h.startsWith("#student-")) {
      return h.replace(/^#student-/, "").replace(/-/g, " ");
    }
    return "";
  }

  // heuristic degree/year from enrollment like "PH24RESCH01009"
  function inferFromEnroll(enroll){
    const E = (enroll||"").toUpperCase();
    let degree = "";
    if (/RESCH/.test(E)) degree = "PhD";
    else if (/MTECH|M-?TECH/.test(E)) degree = "M.Tech";
    else if (/MSC|M\.?SC/.test(E)) degree = "M.Sc";
    else if (/BTECH|B-?TECH/.test(E)) degree = "B.Tech";

    let year = "";
    const m = E.match(/(\d{2})(?=[A-Z])/); // first 2 digits before next letters
    if (m) {
      const yy = parseInt(m[1],10); // 23 -> 2023
      year = (yy >= 50 ? 1900+yy : 2000+yy).toString();
    }
    return {degree, year};
  }

  // click a button/pill whose text matches label (case-insensitive)
  function clickPillByText(label){
    if (!label) return false;
    const want = norm(label);
    const btn = $$("button, a, .pill, .chip, .tab").find(b => norm(b.textContent) === want);
    if (btn) { btn.click(); return true; }
    return false;
  }

  // find a student card by visible name
  function findRenderedStudentCardByName(name){
    const want = norm(name);
    // search common card containers first
    const scopes = $$("#students, main, .page-container, .container, body");
    for (const scope of scopes) {
      const candidates = $$("[data-name], .student-card, .card, .member, .people-card, .profile-card, .student", scope);
      for (const el of candidates) {
        const txt = norm(el.getAttribute("data-name") || el.textContent);
        if (!txt) continue;
        if (txt.includes(want)) return el;
      }
    }
    return null;
  }

  // ---------- students deep-link ----------
  async function jumpToStudent(name){
    // 1) try to use hidden dataset to pick Degree/Year
    let degree = "", year = "";
    let dataNode = null;

    // Your site keeps a hidden dataset like: #studentData [data-name][data-enroll]...
    const nodes = $$("#studentData [data-name]");
    if (nodes.length){
      // best-effort fuzzy match on data-name
      const want = norm(name);
      dataNode = nodes.find(n => norm(n.getAttribute("data-name")).includes(want));
      if (dataNode) {
        const enroll = dataNode.getAttribute("data-enroll") || "";
        const hintDeg = dataNode.getAttribute("data-degree") || "";
        const hintYear= dataNode.getAttribute("data-year") || "";
        ({degree, year} = inferFromEnroll(enroll));
        if (hintDeg) degree = hintDeg;
        if (hintYear) year  = hintYear;
      }
    }

    // 2) Activate Degree and Year pills (try best available info)
    if (degree) clickPillByText(degree);
    // small delay to allow degree change to render year pills
    await new Promise(r=>setTimeout(r, 60));
    if (year)   clickPillByText(year);

    // 3) Wait for grid render, then locate/scroll to card
    let tries = 0, card = null;
    while (tries++ < 25) { // up to ~2.5s
      card = findRenderedStudentCardByName(name);
      if (card) break;
      await new Promise(r=>setTimeout(r, 100));
    }
    if (card) smoothScrollIntoView(card);
  }

  // ---------- faculty/staff direct anchors (already present on page) ----------
  function jumpToExistingAnchorByText(name){
    const want = norm(name);
    const candidates = $$("h1,h2,h3,h4,h5,.faculty-card,.staff-card,.profile-card,.member,.person,.card");
    const el = candidates.find(n => norm(n.textContent).includes(want));
    if (el) smoothScrollIntoView(el);
  }

  // ---------- main ----------
  document.addEventListener("DOMContentLoaded", function(){
    // Add a tiny CSS for highlighting (scoped)
    const css = document.createElement("style");
    css.textContent = `
      .jump-highlight { outline: 3px solid rgba(66,72,144,.45); outline-offset: 3px; border-radius: 10px; transition: outline-color .4s; }
      [id]{ scroll-margin-top:110px; } /* keep anchor below fixed header */
    `;
    document.head.appendChild(css);

    const targetName = getTargetNameFromURL();
    if (!targetName) return;

    // If we're on students page, perform deep link logic; otherwise try generic scroll
    const onStudentsPage = /\/?students\.html(\?|#|$)/i.test(location.pathname);
    if (onStudentsPage) {
      jumpToStudent(targetName);
    } else {
      jumpToExistingAnchorByText(targetName);
    }
  });
})();

