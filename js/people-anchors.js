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

  // Card-style profiles
  const cardSel = [
    '.faculty-card', '.faculty-member', '.profile-card',
    '.person', '.member', '.card', '.profile', '.fac-card', '.member-card'
  ].join(',');

  document.querySelectorAll(cardSel).forEach(card => {
    const nameEl = card.querySelector('h1,h2,h3,h4,h5,.member-name,.name');
    const name = nameEl ? nameEl.textContent.trim() : '';
    if (!name) return;
    if (!card.id) card.id = 'person-' + slug(name);
  });

  // Table-style (name in first cell)
  document.querySelectorAll('table tr').forEach(tr => {
    const first = tr.querySelector('th,td');
    if (!first) return;
    const text = (first.textContent || '').trim();
    if (!/^[A-Z][A-Za-z.\-']+(?:\s+[A-Z][A-Za-z.\-']+)+/.test(text)) return; // name-ish
    if (!tr.id) tr.id = 'person-' + slug(text);
  });
})();
