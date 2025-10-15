// ---- REPLACE the existing loadHTML + DOMContentLoaded block with this ----

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
window.onscroll = function () {
  stickyNavbar();
};
function stickyNavbar() {
  var navbar = document.querySelector(".navbar");
  var sticky = navbar.offsetTop;
  if (window.pageYOffset > sticky) {
    navbar.classList.add("sticky");
  } else {
    navbar.classList.remove("sticky");
  }
}

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


// --------------------------- Spotlight Carousel (SAFE) --------------------------- //
let spotlightIndex = 0;
let spotlightTimer = null;

function showSpotlightSlide(index) {
  try {
    const spotlightItems = document.querySelectorAll(".spotlight-carousel-item");
    const spotlightDots = document.querySelectorAll(".spotlight-dot");

    if (!spotlightItems || spotlightItems.length === 0) {
      // nothing to do
      return;
    }

    // resolve index argument to an integer index
    let resolvedIndex = null;

    if (typeof index === 'number' && !Number.isNaN(index)) {
      resolvedIndex = Math.floor(index);
    } else if (typeof index === 'string') {
      // try to find element by id or selector
      let el = null;
      try {
        el = index.startsWith('#') ? document.getElementById(index.slice(1)) : document.querySelector(index) || document.getElementById(index);
      } catch (e) { el = null; }
      if (el) {
        for (let i = 0; i < spotlightItems.length; i++) {
          if (spotlightItems[i] === el || spotlightItems[i].contains(el)) {
            resolvedIndex = i;
            break;
          }
        }
      }
    } else if (index && index.nodeType === 1) {
      for (let i = 0; i < spotlightItems.length; i++) {
        if (spotlightItems[i] === index || spotlightItems[i].contains(index)) {
          resolvedIndex = i;
          break;
        }
      }
    }

    // fallback to current spotlightIndex when nothing resolved
    if (resolvedIndex === null) resolvedIndex = spotlightIndex || 0;

    // clamp index
    if (resolvedIndex >= spotlightItems.length) resolvedIndex = 0;
    if (resolvedIndex < 0) resolvedIndex = spotlightItems.length - 1;

    spotlightIndex = resolvedIndex;

    // apply classes safely
    spotlightItems.forEach((item, i) => {
      if (item && item.classList) item.classList.toggle('active', i === spotlightIndex);
    });

    if (spotlightDots && spotlightDots.length) {
      spotlightDots.forEach((dot, i) => {
        if (dot && dot.classList) dot.classList.toggle('active', i === spotlightIndex);
      });
    }

    // make sure the active slide is visible
    try { spotlightItems[spotlightIndex].scrollIntoView({ block: 'center' }); } catch (e) {}
  } catch (e) {
    // never let spotlight throw uncaught errors
    console.warn('showSpotlightSlide error:', e);
  }
}

function resetSpotlightTimer() {
  try {
    if (spotlightTimer) clearInterval(spotlightTimer);
    const items = document.querySelectorAll(".spotlight-carousel-item");
    if (items && items.length) {
      spotlightTimer = setInterval(() => {
        spotlightNextSlide();
      }, 4000);
    } else {
      spotlightTimer = null;
    }
  } catch (e) {
    console.warn('resetSpotlightTimer error:', e);
  }
}

function spotlightNextSlide() {
  spotlightIndex++;
  showSpotlightSlide(spotlightIndex);
  resetSpotlightTimer();
}

function spotlightPrevSlide() {
  spotlightIndex--;
  showSpotlightSlide(spotlightIndex);
  resetSpotlightTimer();
}

// init when DOM content loaded (safe attaches)
document.addEventListener("DOMContentLoaded", function () {
  // attach listeners only if controls exist
  const prev = document.getElementById("spotlight-prev");
  const next = document.getElementById("spotlight-next");
  if (prev) prev.addEventListener("click", spotlightPrevSlide);
  if (next) next.addEventListener("click", spotlightNextSlide);

  // start only if there are slides
  const items = document.querySelectorAll(".spotlight-carousel-item");
  if (items && items.length) {
    showSpotlightSlide(spotlightIndex);
    resetSpotlightTimer();
  }
});
