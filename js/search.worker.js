// js/search.worker.js
// Receives: { type: 'BUILD', pages, fuseConfig }, { type: 'QUERY', q, limit }, { type: 'PING' }

let fuse = null;
let indexData = null;

// ---------- helpers ----------
const norm = s => (s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

// tiny Fuse-like fallback (when Fuse isn't present in worker scope)
class MiniFuse {
  constructor(items, { keys }) {
    this.items = items || [];
    this.keys = (keys || []).map(k => k.name || k);
  }
  search(q) {
    const qq = norm(q);
    const out = [];
    for (const it of this.items) {
      const hay = this.keys.map(k => Array.isArray(it[k]) ? it[k].join(' ') : (it[k]||'')).join(' ').toLowerCase();
      if (hay.includes(qq)) out.push({ item: it, score: 0.5 });
    }
    return out;
  }
}

// lightweight synonyms to improve recall
const SYN = {
  hod: ['head of department','chair'],
  ug: ['undergraduate'],
  pg: ['postgraduate','graduate'],
  phd: ['ph.d','doctoral'],
  faculty: ['professor','prof','teaching staff'],
  staff: ['administrative','office staff'],
  spotlight: ['feature','highlight'],
  announcements: ['notice','update','news']
};

function expandQuery(q) {
  const nq = norm(q);
  const parts = nq.split(/\s+/).filter(Boolean);
  const extras = [];
  parts.forEach(p => { if (SYN[p]) extras.push(...SYN[p]); });
  return [nq, ...extras.map(norm)];
}

function rankRefine(items, q) {
  const nq = norm(q);
  const exact = [], starts = [], rest = [];
  for (const it of items) {
    const t = (it.title_lc || '');
    if (t === nq) exact.push(it);
    else if (t.startsWith(nq)) starts.push(it);
    else rest.push(it);
  }
  return [...exact, ...starts, ...rest];
}

// ---------- message handling ----------
onmessage = async (e) => {
  const { type } = e.data || {};

  if (type === 'PING') {
    postMessage({ type:'PONG' });
    return;
  }

  if (type === 'BUILD') {
    const { pages, fuseConfig } = e.data;
    indexData = Array.isArray(pages) ? pages : [];
    // If Fuse is available in worker (not typical), use it; else MiniFuse
    fuse = (typeof Fuse !== 'undefined') ? new Fuse(indexData, fuseConfig) : new MiniFuse(indexData, fuseConfig);
    postMessage({ type:'BUILT', size: indexData.length });
    return;
  }

  if (type === 'QUERY') {
    const { q, limit = 50 } = e.data;
    if (!q || !indexData || !fuse) { postMessage({ type:'RESULTS', items: [] }); return; }

    // primary query
    let items = (fuse.search(norm(q), { limit }) || []).map(r => r.item);

    // fallback: try expanded synonyms if weak result
    if (items.length < 5) {
      const alts = expandQuery(q);
      const seen = new Set(items.map(i => i.url + '|' + i.title_lc));
      for (const alt of alts) {
        const more = (fuse.search(alt, { limit }) || []).map(r => r.item);
        for (const m of more) {
          const k = m.url + '|' + m.title_lc;
          if (!seen.has(k)) { seen.add(k); items.push(m); }
          if (items.length >= limit) break;
        }
        if (items.length >= limit) break;
      }
    }

    // refine by exact/prefix on title
    items = rankRefine(items, q).slice(0, limit);

    postMessage({ type:'RESULTS', items });
  }
};
