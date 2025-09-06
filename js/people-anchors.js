/* people-anchors.js
 * Deep-link helper for Faculty/Staff/Students.
 * - Supports: #student-<slug>, #staff-<slug>, #faculty-<slug>, #section-<slug>, or #:~:text=<Name>
 * - Students: auto-activates Degree/Year and scrolls to the card
 */
(function () {
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const norm = s => (s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();

  function smoothScrollIntoView(el){
    if (!el) return;
    try { el.scrollIntoView({behavior:"smooth", block:"center"}); }
    catch { el.scrollIntoView(true); }
    el.classList.add("jump-highlight");
    setTimeout(()=> el && el.classList && el.classList.remove("jump-highlight"), 2500);
  }

  // Parse name from URL:
  //   #student-ramesh-kv / #staff-t-chengappa / #section-t-chengappa
  //   #:~:text=T%20Chengappa
  function getTargetNameFromURL(){
    const href = String(window.location.href || "");
    if (href.includes("#:~:text=")) {
      const after = href.split("#:~:text=").pop();
      if (after) {
        try { return decodeURIComponent(after).split("&")[0]; } catch { return after; }
      }
    }
    const h = window.location.hash || "";
    const m = h.match(/^#(student|staff|faculty|section|block|spot)-(.+)$/i);
    if (m) return decodeURIComponent(m[2]).replace(/-/g," ").trim();
    return "";
  }

  // Heuristic degree/year from something like "PH24RESCH01009"
  function inferFromEnroll(enroll){
    const E = (enroll||"").toUpperCase();
    let degree = "";
    if (/RESCH/.test(E)) degree = "PhD";
    else if (/MTECH|M-?TECH/.test(E)) degree = "M.Tech";
    else if (/MSC|M\.?SC/.test(E)) degree = "M.Sc";
    else if (/BTECH|B-?TECH/.test(E)) degree = "B.Tech";

    let year = "";
    const m = E.match(/(\d{2})(?=[A-Z])/);
    if (m) {
      const yy = parseInt(m[1],10);
      year = (yy >= 50 ? 1900+yy : 2000+yy).toString();
    }
    return {degree, year};
  }

  function clickPillByText(label){
    if (!label) return false;
    const want = norm(label);
    const btn = $$("button, a, .pill, .chip, .tab")
      .find(b => norm(b.textContent) === want);
    if (btn) { btn.click(); return true; }
    return false;
  }

  function findRenderedStudentCardByName(name){
    const want = norm(name);
    const scopes = $$("#students, main, .page-container, .container, body");
    for (const scope of scopes) {
      const candidates = $$("[data-name], .student-card, .card, .member, .people-card, .profile-card, .student", scope);
      for (const el of candidates) {
        const txt = norm(el.getAttribute("data-name") || el.textContent);
        if (txt && txt.includes(want)) return el;
      }
    }
    return null;
  }

  async function jumpToStudent(name){
    let degree = "", year = "";
    const nodes = $$("#studentData [data-name]");
    if (nodes.length){
      const want = norm(name);
      const dataNode = nodes.find(n => norm(n.getAttribute("data-name")).includes(want));
      if (dataNode) {
        const enroll = dataNode.getAttribute("data-enroll") || "";
        const hintDeg = dataNode.getAttribute("data-degree") || "";
        const hintYear= dataNode.getAttribute("data-year") || "";
        ({degree, year} = inferFromEnroll(enroll));
        if (hintDeg) degree = hintDeg;
        if (hintYear) year  = hintYear;
      }
    }

    if (degree) clickPillByText(degree);
    await new Promise(r=>setTimeout(r, 60));
    if (year)   clickPillByText(year);

    let tries = 0, card = null;
    while (tries++ < 25) {
      card = findRenderedStudentCardByName(name);
      if (card) break;
      await new Promise(r=>setTimeout(r, 100));
    }
    if (card) smoothScrollIntoView(card);
  }

  function jumpToExistingAnchorByText(name){
    const want = norm(name);
    const candidates = $$("h1,h2,h3,h4,h5,.faculty-card,.staff-card,.profile-card,.member,.person,.card");
    const el = candidates.find(n => norm(n.textContent).includes(want));
    if (el) smoothScrollIntoView(el);
  }

  function handleDeepLink(){
    const targetName = getTargetNameFromURL();
    if (!targetName) return;
    const onStudentsPage = /\/?students\.html(\?|#|$)/i.test(location.pathname);
    if (onStudentsPage) jumpToStudent(targetName);
    else jumpToExistingAnchorByText(targetName);
  }

  document.addEventListener("DOMContentLoaded", function(){
    const css = document.createElement("style");
    css.textContent = `
      .jump-highlight { outline: 3px solid rgba(66,72,144,.45); outline-offset: 3px; border-radius: 10px; transition: outline-color .4s; }
      [id]{ scroll-margin-top:110px; } /* keep anchor below fixed header */
      html:focus-within { scroll-behavior:smooth; }
    `;
    document.head.appendChild(css);
    handleDeepLink();
  });

  // react to hash changes too
  window.addEventListener("hashchange", handleDeepLink);

  // tiny ping for debugging
  window.__peopleAnchorsLoaded = true;
})();
