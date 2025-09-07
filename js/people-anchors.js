<script>
/* people-anchors.js — resilient deep-links for People + Students */
(function () {
  // ===== tiny utils =====
  const $  = (s, r=document) => { try { return r.querySelector(s); } catch { return null; } };
  const $$ = (s, r=document) => { try { return Array.from(r.querySelectorAll(s)); } catch { return []; } };
  const norm = s => (s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  async function waitFor(test, tries=50, step=80){ for(let i=0;i<tries;i++){ try{ if(test())return true; }catch{} await sleep(step);} return false; }
  function smooth(el){ if(!el) return; try{ el.scrollIntoView({behavior:"smooth", block:"center"});}catch{el.scrollIntoView(true);} el.classList.add("jump-highlight"); setTimeout(()=>el&&el.classList&&el.classList.remove("jump-highlight"),1800); }

  // ===== link parsing =====
  function getTargetName(){
    try{
      const href=String(location.href||"");
      if(href.includes("#:~:text=")){ const t=decodeURIComponent(href.split("#:~:text=").pop()).split("&")[0]; return t.trim(); }
      const h=location.hash||"";
      if(/^#student-/.test(h)){ return h.replace(/^#student-/,"").replace(/-/g," ").trim(); }
    }catch{}
    return "";
  }

  // ===== staff/faculty jump =====
  function jumpToPersonByText(name){
    const want = norm(name);
    if(!want) return false;
    const candidates = $$("h1,h2,h3,h4,h5,.faculty-card,.staff-card,.profile-card,.member,.person,.card,.people-card,.team-card,.bio");
    const el = candidates.find(n => norm(n.textContent).includes(want));
    if(el){ smooth(el); return true; }
    return false;
  }

  // ===== students helpers =====
  function hintFromDataset(name){
    const want = norm(name);
    const node = $$("#studentData [data-name]").find(n => norm(n.getAttribute("data-name")).includes(want));
    if(!node) return null;
    const enroll = (node.getAttribute("data-enroll")||"").toUpperCase();
    const hd = (node.getAttribute("data-degree")||"");
    const hy = (node.getAttribute("data-year")||"");
    let deg=""; if(/RESCH/.test(enroll)) deg="phd"; else if(/MTECH/.test(enroll)) deg="mtech"; else if(/MSC/.test(enroll)) deg="msc"; else if(/BTECH/.test(enroll)) deg="btech";
    let year=""; const m=enroll.match(/(\d{2})(?=[A-Z])/); if(m){ const yy=+m[1]; year=(yy>=50?1900+yy:2000+yy)+""; }
    return { degree:(hd||deg||"").toLowerCase(), year:(hy||year||"") };
  }

  async function clickCourse(key){
    const pill = $(`.course-pill[data-course="${key}"]`);
    if(!pill) return false;
    if(!pill.classList.contains("active")) pill.click();
    await sleep(100);
    return true;
  }

  async function clickSubcourse(sub){
    if(!sub) return true;
    await waitFor(()=> $(`.subcourse-pill[data-subcourse="${sub}"]`));
    const sp = $(`.subcourse-pill[data-subcourse="${sub}"]`);
    if(!sp) return false;
    if(!sp.classList.contains("active")) sp.click();
    await sleep(100);
    return true;
  }

  async function clickYear(y){
    await waitFor(()=> $$("#yearContainer .year-pill").length>0);
    const btn = $$("#yearContainer .year-pill").find(b => (b.textContent||"").trim()===String(y));
    if(!btn) return false;
    if(!btn.classList.contains("active")) btn.click();
    await waitFor(()=> !!findRenderedStudentNode(name), 20, 100);
    return true;
  }

  function visibleYears(course, sub){
    const sel = `#studentData > div[data-course="${course}"]` + (sub?`[data-subcourse="${sub}"]`:`:not([data-subcourse])`);
    const ys = $$(sel).map(g=>g.dataset.year).filter(Boolean);
    return [...new Set(ys)].sort((a,b)=>b-a);
  }

  function findRenderedStudentNode(name){
    const want = norm(name);
    const tc = $("#tableContainer"); const tbl=$("#studentTable");
    if(tc && !tc.classList.contains("hidden") && tbl && tbl.style.display!=="none"){
      for(const tr of tbl.querySelectorAll("tbody tr")) if(norm(tr.textContent).includes(want)) return tr;
    }
    for(const el of $$(".phd-student-card,.student-card,.people-card,.profile-card")) if(norm(el.textContent).includes(want)) return el;
    return null;
  }

  async function openAndScrollToStudent(name){
    const ok = await waitFor(()=> !!$("#studentData"), 60, 80);
    if(!ok) return false;

    const courseKeys = (window.courses && Object.keys(window.courses)) || ["btech","msc","mtech","phd"];
    const subsFor = k => (window.courses?.[k]?.subcourses ? Object.keys(window.courses[k].subcourses) : [null]);

    async function tryOne(course, sub, year){
      await clickCourse(course);
      await clickSubcourse(sub);
      const years = year ? [year] : visibleYears(course, sub);
      for(const y of years){
        await clickYear(y);
        const node = findRenderedStudentNode(name);
        if(node){ smooth(node); return true; }
      }
      return false;
    }

    // hinted fast path
    const hint = hintFromDataset(name);
    if(hint && hint.degree){
      for(const sub of subsFor(hint.degree)){ if(await tryOne(hint.degree, sub, hint.year||null)) return true; }
    }
    // full sweep
    for(const deg of courseKeys){ for(const sub of subsFor(deg)){ if(await tryOne(deg, sub, null)) return true; } }
    return false;
  }

  // ===== init =====
  async function init(){
    // highlight style
    const css = document.createElement("style");
    css.textContent = `.jump-highlight{outline:3px solid rgba(66,72,144,.45);outline-offset:3px;border-radius:10px}[id]{scroll-margin-top:110px}`;
    document.head.appendChild(css);

    const name = getTargetName();
    if(!name) return;

    const onStudents = /\/?students\.html(\?|#|$)/i.test(location.pathname);
    if(onStudents){
      await openAndScrollToStudent(name);
    } else {
      jumpToPersonByText(name);
    }
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", ()=>init().catch(()=>{}));
  else init().catch(()=>{});
})();
</script>
