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

  // accept: single word ≥ 4 chars, initial + surname, or ≥2 capitalized words
  const NAMEISH = /^(?:[A-Z][A-Za-z.'-]{3,}|[A-Z]\.?[ ]+[A-Z][A-Za-z.'-]{2,}|[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)+)$/;

  const cardSel = [
    '.faculty-card', '.faculty-member', '.profile-card',
    '.person', '.member', '.card', '.profile', '.fac-card', '.member-card',
    '.staff-card', '.staff-member', '.staff'
  ].join(',');

  // Cards
  document.querySelectorAll(cardSel).forEach(card => {
    const nameEl = card.querySelector('h1,h2,h3,h4,h5,.member-name,.name,.staff-name');
    const name = (nameEl ? nameEl.textContent : '').trim();
    if (!name) return;
    if (!card.id) card.id = 'person-' + slug(name);
  });

  // Tables
  document.querySelectorAll('table tr').forEach(tr => {
    const first = tr.querySelector('th,td');
    if (!first) return;
    const text = (first.textContent || '').trim();
    if (!NAMEISH.test(text)) return;
    if (!tr.id) tr.id = 'person-' + slug(text);
  });

  // Lists
  document.querySelectorAll('ul li, ol li').forEach(li => {
    const text = (li.textContent || '').trim();
    const firstChunk = text.split(/[–—\-•|:;]\s*/)[0].trim();
    if (!NAMEISH.test(firstChunk)) return;
    if (!li.id) li.id = 'person-' + slug(firstChunk);
  });
})();


