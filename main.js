// ---- REPLACE the existing loadHTML + DOMContentLoaded block with this ----
// disable automatic scroll-by-default; only enable for explicit actions (search/hash)
window.__allowSpotlightAutoScroll = false;

function loadHTML(selector, url) {
  // return the promise so caller can chain and run code after insertion
  return fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.text();
    })
    .then((data) => {
      const container = document.querySelector(selector);
      if (!container) throw new Error('Selector not found: ' + selector);
      container.innerHTML = data;
      return data;
    })
    .catch((error) => {
      console.error("Error loading HTML:", error);
      throw error;
    });
}

// Load header and footer after DOM is loaded, and inject sidebar override AFTER header is inserted
document.addEventListener("DOMContentLoaded", function () {
  // Load header first, then inject the override so it sits after any header-injected styles
  loadHTML(".header", "header.html")
    .then(() => {
      // CSS that enforces consistent sidebar link appearance (keeps border-width stable to avoid flicker)
      const css = `
/* Sidebar override injected after header to prevent header-inserted styles from overriding */
.side-nav .nav-menu li a,
.side-nav .nav-menu li a:link,
.side-nav .nav-menu li a:visited,
.side-nav .nav-menu li a:active,
.side-nav .nav-menu li a:hover,
.side-nav .nav-menu li a:focus {
  display: block;
  box-sizing: border-box;
  padding: 12px;
  font-size: 1.05rem;
  font-weight: 600;
  color: #0a1a44;
  background: #ffffff;
  border: 2px solid #b9d1ec;
  border-radius: 8px;
  text-align: center;
  text-decoration: none;
  transition: background-color .22s ease, color .22s ease, box-shadow .22s ease;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}
.side-nav .nav-menu li a:hover {
  background: #1f4e79;
  color: #ffffff;
  border-color: #1f4e79;
  font-weight: 700;
  box-shadow: 0 3px 8px rgba(31,78,121,0.22);
}
.side-nav .nav-menu li a.active,
.side-nav .nav-menu li a[aria-current="page"] {
  background: #ff7b00;
  color: #ffffff;
  border-color: #ff7b00;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(255,123,0,0.22);
}
@media (max-width: 768px) {
  .side-nav .nav-menu li a { border-width: 2px; }
}
      `;
      const style = document.createElement("style");
      style.setAttribute("data-injected", "sidebar-override");
      style.appendChild(document.createTextNode(css));
      document.head.appendChild(style);
    })
    .catch((err) => {
      // header load failed — still attempt to load footer
      console.error("Header load failed:", err);
    })
    .finally(() => {
      // Always attempt to load footer afterwards
      loadHTML(".footer", "footer.html").catch((err) => {
        console.error("Footer load failed:", err);
      });
    });
});


// Dropdown toggle for desktop and mobile
function toggleDropdown(event, dropdownId) {
  event.stopPropagation();
  // Close other dropdowns
  document.querySelectorAll(".nav-dropdown-content").forEach(function (el) {
    if (el.id !== dropdownId) el.classList.remove("show");
  });
  // Toggle current dropdown
  var dropdown = document.getElementById(dropdownId);
  dropdown.classList.toggle("show");

  // For mobile: toggle parent .nav-dropdown 'open' class
  var parentDropdown = dropdown.closest(".nav-dropdown");
  parentDropdown.classList.toggle("open");
}

// Close dropdowns when clicking outside
window.onclick = function (event) {
  if (!event.target.matches(".dropbtn")) {
    document.querySelectorAll(".nav-dropdown-content").forEach(function (el) {
      el.classList.remove("show");
      el.closest(".nav-dropdown").classList.remove("open");
    });
  }
};

// ------------------------------------- Sticky Navbar ------------------------------------- //
// ------------------------------------- Sticky Navbar (SAFE) ------------------------------------- //
(function () {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return; // ⛔ navbar not on this page

  const sticky = navbar.offsetTop;

  function stickyNavbar() {
    if (window.pageYOffset > sticky) {
      navbar.classList.add("sticky");
    } else {
      navbar.classList.remove("sticky");
    }
  }

  window.addEventListener("scroll", stickyNavbar);
})();


// Hamburger menu for mobile
function toggleResponsiveNav() {
  var nav = document.getElementById("navbarContainer");
  nav.classList.toggle("responsive");
  // Toggle hamburger active state for color change on click
  document.getElementById("mobileHamburger").classList.toggle("active");
  // Optionally close all dropdowns
  document.querySelectorAll(".nav-dropdown-content").forEach(function (el) {
    el.classList.remove("show");
    el.closest(".nav-dropdown").classList.remove("open");
  });
}

// ------------------------------------- Home js ------------------------------------- //

// ------------------------------------- Main Carousel ------------------------------------- //


function initMainCarousel() {
  const carousel = document.querySelector(".carousel");
  const carouselItems = document.querySelectorAll(".carousel-item");
  const dots = document.querySelectorAll(".dot");

  if (!carousel || !carouselItems.length) return;
  if (carousel.dataset.initialized) return;

  carousel.setAttribute("data-initialized", "true");

  let currentIndex = 0; // ✅ This is critical
  let carouselTimer;

  function updateCarousel(index) {
    currentIndex = (index + carouselItems.length) % carouselItems.length;

    carouselItems.forEach((item, i) => {
      item.classList.toggle("active", i === currentIndex);
      dots[i]?.classList.toggle("active", i === currentIndex);
    });
  }

  function nextSlide() {
    updateCarousel(currentIndex + 1);
  }

  function prevSlide() {
    updateCarousel(currentIndex - 1);
  }

  function resetCarouselTimer() {
    clearInterval(carouselTimer);
    carouselTimer = setInterval(nextSlide, 4000);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      updateCarousel(index);
      resetCarouselTimer();
    });
  });

  document.querySelector(".prev-button")?.addEventListener("click", () => {
    prevSlide();
    resetCarouselTimer();
  });

  document.querySelector(".next-button")?.addEventListener("click", () => {
    nextSlide();
    resetCarouselTimer();
  });

  updateCarousel(currentIndex);
  carouselTimer = setInterval(nextSlide, 4000);
}




// ✅ Properly initialize only after page is fully loaded
window.addEventListener("load", initMainCarousel);


// --------------------------- Spotlight Carousel --------------------------- //
let spotlightIndex = 0;
let spotlightTimer = null;

function showSpotlightSlide(index) {
  const items = document.querySelectorAll(".spotlight-carousel-item");
  const dots  = document.querySelectorAll(".spotlight-dot");
  if (!items.length) return;

  spotlightIndex = (index + items.length) % items.length;

  items.forEach((item, i) =>
    item.classList.toggle("active", i === spotlightIndex)
  );
  dots.forEach((dot, i) =>
    dot.classList.toggle("active", i === spotlightIndex)
  );
}

function spotlightNextSlide() {
  showSpotlightSlide(spotlightIndex + 1);
}

function spotlightPrevSlide() {
  showSpotlightSlide(spotlightIndex - 1);
}

function startSpotlightAuto() {
  stopSpotlightAuto();
  spotlightTimer = setInterval(spotlightNextSlide, 4000);
}

function stopSpotlightAuto() {
  if (spotlightTimer) {
    clearInterval(spotlightTimer);
    spotlightTimer = null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  showSpotlightSlide(0);
  startSpotlightAuto();

  document
    .getElementById("spotlight-next")
    ?.addEventListener("click", () => {
      spotlightNextSlide();
      startSpotlightAuto();
    });

  document
    .getElementById("spotlight-prev")
    ?.addEventListener("click", () => {
      spotlightPrevSlide();
      startSpotlightAuto();
    });
});



/* ---------- appended: safe spotlight + hash/anchor helpers (paste to EOF of main.js) ---------- */
(function(){
  'use strict';

  // Keep a reference to any original implementations so we don't lose features
  const _origShowSpotlight = typeof window.showSpotlightSlide === 'function' ? window.showSpotlightSlide : null;
  const _origResetSpotlightTimer = typeof window.resetSpotlightTimer === 'function' ? window.resetSpotlightTimer : null;

  // Global state (will not overwrite existing numeric index if present)
  window.spotlightIndex = typeof window.spotlightIndex === 'number' ? window.spotlightIndex : 0;
  window.spotlightTimer = window.spotlightTimer || null;

  // Defensive helper: find slides using common selectors (adjust if your markup differs)
  function _getSpotlightItems() {
    return document.querySelectorAll('.spotlight .slide, .carousel .slide, .spotlight-slide, .spotlight-carousel-item');
  }
  function _getSpotlightDots() {
    return document.querySelectorAll('.spotlight-nav button, .spotlight-bullets button, .spotlight-dot');
  }

  // Safe showSpotlightSlide: accepts numeric index, '#id' string, selector, or DOM element.
  window.showSpotlightSlide = function(arg) {
    try {
      const slides = _getSpotlightItems();
      if (!slides || slides.length === 0) {
        // if original existed, call it as a best-effort so we don't lose other features
        if (_origShowSpotlight) {
          try { _origShowSpotlight(arg); } catch(e){/* ignore */ }
        }
        return;
      }

      // resolve arg to index
      let resolvedIndex = null;
      const numeric = Number(arg);
      if (!Number.isNaN(numeric)) resolvedIndex = Math.floor(numeric);

      // if arg is string - could be '#id' or id or selector
      if (resolvedIndex === null && typeof arg === 'string' && arg.trim().length) {
        let q = arg.trim();
        if (q.startsWith('#')) q = q.slice(1);
        // try id lookup first
        let el = document.getElementById(q);
        if (!el) {
          try { el = document.querySelector(arg); } catch(e){ el = null; }
        }
        if (el) {
          for (let i = 0; i < slides.length; i++) {
            if (slides[i] === el || slides[i].contains(el)) { resolvedIndex = i; break; }
          }
        }
      }

      // if arg is a DOM element
      if (resolvedIndex === null && arg && arg.nodeType === 1) {
        for (let i = 0; i < slides.length; i++) {
          if (slides[i] === arg || slides[i].contains(arg)) { resolvedIndex = i; break; }
        }
      }

      // fallback to current spotlightIndex
      if (resolvedIndex === null) resolvedIndex = (typeof window.spotlightIndex === 'number') ? window.spotlightIndex : 0;

      // clamp and normalize
      if (resolvedIndex >= slides.length) resolvedIndex = 0;
      if (resolvedIndex < 0) resolvedIndex = slides.length - 1;

      window.spotlightIndex = resolvedIndex;

      // toggle active class safely
      Array.prototype.forEach.call(slides, function(s, i){
        if (s && s.classList) s.classList.toggle('active', i === window.spotlightIndex);
      });

      // update nav/dots if present
      const dots = _getSpotlightDots();
      if (dots && dots.length) {
        Array.prototype.forEach.call(dots, function(d, i){
          if (d && d.classList) d.classList.toggle('active', i === window.spotlightIndex);
        });
      }

      // ensure visible (best-effort)
    try {
  if (window.__allowSpotlightAutoScroll) {
    slides[window.spotlightIndex] && slides[window.spotlightIndex].scrollIntoView({ block: 'center' });
  }
} catch(e){}


      // also attempt to call original implementation (non-destructive):
      if (_origShowSpotlight) {
        try { _origShowSpotlight(window.spotlightIndex); } catch(e) { /* ignore errors from original */ }
      }
    } catch(err) {
      // never let this bubble — log for debugging
      // eslint-disable-next-line no-console
      console.warn('safe showSpotlightSlide error:', err);
    }
  };

  // Safe timer reset implementation — will not create multiple intervals
  window.resetSpotlightTimer = function() {
    try {
      if (window.spotlightTimer) {
        clearInterval(window.spotlightTimer);
        window.spotlightTimer = null;
      }
      const items = _getSpotlightItems();
      if (items && items.length) {
        window.spotlightTimer = setInterval(function(){ window.spotlightNextSlide(); }, 4000);
      } else {
        window.spotlightTimer = null;
      }
      // preserve original behaviour by calling original reset if present
      if (_origResetSpotlightTimer) {
        try { _origResetSpotlightTimer(); } catch(e) {}
      }
    } catch(e) {
      // eslint-disable-next-line no-console
      console.warn('resetSpotlightTimer error:', e);
    }
  };

  // Next / Prev wrappers
  window.spotlightNextSlide = function() {
    try {
      window.spotlightIndex = (typeof window.spotlightIndex === 'number') ? window.spotlightIndex + 1 : 0;
      window.showSpotlightSlide(window.spotlightIndex);
      window.resetSpotlightTimer();
    } catch(e) { console.warn('spotlightNextSlide error', e); }
  };
  window.spotlightPrevSlide = function() {
    try {
      window.spotlightIndex = (typeof window.spotlightIndex === 'number') ? window.spotlightIndex - 1 : 0;
      window.showSpotlightSlide(window.spotlightIndex);
      window.resetSpotlightTimer();
    } catch(e) { console.warn('spotlightPrevSlide error', e); }
  };

  // If there are manual controls with IDs (#spotlight-prev/#spotlight-next), attach safely
  try {
    const prev = document.getElementById('spotlight-prev');
    const next = document.getElementById('spotlight-next');
    if (prev) {
      try { prev.removeEventListener && prev.removeEventListener('click', window.spotlightPrevSlide); } catch(e){}
      prev.addEventListener && prev.addEventListener('click', window.spotlightPrevSlide);
    }
    if (next) {
      try { next.removeEventListener && next.removeEventListener('click', window.spotlightNextSlide); } catch(e){}
      next.addEventListener && next.addEventListener('click', window.spotlightNextSlide);
    }
  } catch(e){ /* ignore attach errors */ }

  // Start timer on load if slides exist (do this once)
  document.addEventListener('DOMContentLoaded', function() {
    try {
      const items = _getSpotlightItems();
      if (items && items.length) {
        // initialize showing current index safely
        window.showSpotlightSlide(window.spotlightIndex || 0);
        window.resetSpotlightTimer();
      } else {
        // if none present, still call original to preserve behavior
        if (_origShowSpotlight) {
          try { _origShowSpotlight(window.spotlightIndex || 0); } catch(e) {}
        }
      }
    } catch(e) { console.warn('spotlight init error', e); }
  });

  // Small helper to try to resolve a hash -> element and force scroll if element appears.
  // This helps when alphabetical filter replaces DOM and the hash change fires before the element exists.
  function _waitForElementThenShow(id, timeoutMs, onFound) {
    const start = Date.now();
    const intv = 70;
    (function tick() {
      const el = document.getElementById(id);
      if (el) {
        try { onFound(el); } catch(e){}
        return;
      }
      if (Date.now() - start > (timeoutMs || 3000)) {
        // timeout
        return;
      }
      setTimeout(tick, intv);
    })();
  }

  // Hashchange handler: after a small delay attempt to scroll/show the element
  window.addEventListener('hashchange', function() {
    try {
      const id = location.hash ? location.hash.slice(1) : null;
      if (!id) return;
      // small delay to let filters/DOM changes run, then wait for element to exist
      setTimeout(function(){
        _waitForElementThenShow(id, 3500, function(el){
          try { el.scrollIntoView && el.scrollIntoView({ block: 'center' }); } catch(e){}
          try { el.classList && el.classList.add('jump-highlight-temp'); setTimeout(()=> el.classList && el.classList.remove('jump-highlight-temp'), 1600); } catch(e){}
          try { window.showSpotlightSlide && window.showSpotlightSlide('#' + id); } catch(e){}
        });
      }, 80);
    } catch(e) { console.warn('hashchange helper error', e); }
  });

  // Small highlight style (only inserted if not present) - non-intrusive
  if (!document.getElementById('spotlight-append-style')) {
    try {
      const st = document.createElement('style');
      st.id = 'spotlight-append-style';
      st.textContent = `.jump-highlight-temp { outline: 4px solid rgba(255,165,0,0.85); transition: outline 120ms ease; }`;
      document.head.appendChild(st);
    } catch(e){}
  }

  // Debug log to show appended code loaded
  // eslint-disable-next-line no-console
  console.log('[main.js appended] safe spotlight & hash helpers installed');

})();

