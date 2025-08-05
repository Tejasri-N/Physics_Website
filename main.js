function loadHTML(selector, url) {
  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.text();
    })
    .then((data) => {
      document.querySelector(selector).innerHTML = data;
    })
    .catch((error) => {
      console.error("Error loading HTML:", error);
    });
}

// Load header and footer after DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  loadHTML(".header", "header.html");
  loadHTML(".footer", "footer.html");
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
let currentIndex = 0;
const carouselItems = document.querySelectorAll(".carousel-item");
const dots = document.querySelectorAll(".dot");
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
  setTimeout(() => {
    carouselTimer = setInterval(nextSlide, 4000);
  }, 500); // ⏱ Delay gives time for click to complete before auto triggers
}


function initMainCarousel() {
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      updateCarousel(index);
      resetCarouselTimer(); // 👈 reset timer on dot click
    });
  });

  document.querySelector(".prev-button")?.addEventListener("click", () => {
    prevSlide();
    resetCarouselTimer(); // 👈 reset timer on arrow click
  });

  document.querySelector(".next-button")?.addEventListener("click", () => {
    nextSlide();
    resetCarouselTimer(); // 👈 reset timer on arrow click
  });

  updateCarousel(currentIndex); // initial display
  carouselTimer = setInterval(nextSlide, 4000); // auto-slide
}

document.addEventListener("DOMContentLoaded", initMainCarousel);


// --------------------------- Spotlight Carousel --------------------------- //
let spotlightIndex = 0;

function showSpotlightSlide(index) {
  const spotlightItems = document.querySelectorAll(".spotlight-carousel-item");
  const spotlightDots = document.querySelectorAll(".spotlight-dot");

  if (index >= spotlightItems.length) spotlightIndex = 0;
  if (index < 0) spotlightIndex = spotlightItems.length - 1;

  spotlightItems.forEach((item, i) => {
    item.classList.remove("active");
    spotlightDots[i]?.classList.remove("active");
  });

  spotlightItems[spotlightIndex].classList.add("active");
  spotlightDots[spotlightIndex]?.classList.add("active");
}

function resetSpotlightTimer() {
  clearInterval(spotlightTimer);
  spotlightTimer = setInterval(() => {
    spotlightNextSlide();
  }, 4000); // same as your auto-slide interval
}

function spotlightNextSlide() {
  spotlightIndex++;
  showSpotlightSlide(spotlightIndex);
  resetSpotlightTimer(); // resets auto-timer on click
}

function spotlightPrevSlide() {
  spotlightIndex--;
  showSpotlightSlide(spotlightIndex);
  resetSpotlightTimer(); // resets auto-timer on click
}


let spotlightTimer = setInterval(() => {
  spotlightNextSlide();
}, 4000); // auto-slide every 4 seconds


// Initialize spotlight carousel
document.addEventListener("DOMContentLoaded", function () {
  showSpotlightSlide(spotlightIndex);
   document.getElementById("spotlight-prev").addEventListener("click", spotlightPrevSlide);
  document.getElementById("spotlight-next").addEventListener("click", spotlightNextSlide);
});

