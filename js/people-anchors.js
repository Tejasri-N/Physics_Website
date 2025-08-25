// js/people-anchors.js
(function () {
  // make an anchor-friendly id from a name
  function slug(s) {
    return (s || '')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9\s-]/gi, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
  }

  // Card-style profiles
  const cardSel = [
    '.faculty-card', '.faculty-member', '.profile-card',
    '.person', '.member', '.card', '.profile', '.fac-card', '.member-card'
  ].join(',');

  document.querySelectorAll(cardSel).forEach(card => {
    const nameEl =
      card.querySelector('h1,h2,h3,h4,h5,.member-name,.name');
    const name = nameEl ? nameEl.textContent.trim() : '';
    if (!name) return;

    if (!card.id) card.id = 'person-' + slug(name);
  });

  // Table-style profiles (name in first cell)
  document.querySelectorAll('table tr').forEach(tr => {
    const first = tr.querySelector('th,td');
    if (!first) return;
    const maybeName = (first.textContent || '').trim();

    // crude “looks like a person name” check
    if (!/^[A-Z][A-Za-z.\-']+(?:\s+[A-Z][A-Za-z.\-']+)+/.test(maybeName)) return;

    if (!tr.id) tr.id = 'person-' + slug(maybeName);
  });
})();
