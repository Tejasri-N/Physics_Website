// js/people-anchors.js
(function () {
  const slug = s => (s || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

  // Card-style profiles (add staff-specific classes here)
  const cardSel = [
    '.faculty-card', '.faculty-member', '.profile-card',
    '.person', '.member', '.card', '.profile', '.fac-card', '.member-card',
    '.staff-card', '.staff-member', '.staff'
  ].join(',');

  document.querySelectorAll(cardSel).forEach(card => {
    const nameEl = card.querySelector('h1,h2,h3,h4,h5,.member-name,.name,.staff-name');
    const name = nameEl ? nameEl.textContent.trim() : '';
    if (!name) return;
    if (!card.id) card.id = 'person-' + slug(name);
  });

  // Table-style (name in first cell)
  document.querySelectorAll('table tr').forEach(tr => {
    const first = tr.querySelector('th,td');
    if (!first) return;
    const text = (first.textContent || '').trim();
    // “name-ish”
    if (!/^[A-Z][A-Za-z.\-']+(?:\s+[A-Z][A-Za-z.\-']+)+/.test(text)) return;
    if (!tr.id) tr.id = 'person-' + slug(text);
  });

  // List-style (name at the start of the line)
  document.querySelectorAll('ul li, ol li').forEach(li => {
    const text = (li.textContent || '').trim();
    const firstChunk = text.split(/[–—\-•|:;]\s*/)[0].trim();
    if (!/^[A-Z][A-Za-z.\-']+(?:\s+[A-Z][A-Za-z.\-']+)+/.test(firstChunk)) return;
    if (!li.id) li.id = 'person-' + slug(firstChunk);
  });
})();

