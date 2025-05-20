// Function to toggle dropdowns
function toggleDropdown(event) {
  const dropdownMenu = event.target.nextElementSibling;

  if (dropdownMenu.classList.contains("show")) {
    dropdownMenu.classList.remove("show");
  } else {
    document.querySelectorAll(".dropdown-menu.show").forEach((openDropdown) => {
      openDropdown.classList.remove("show");
    });
    dropdownMenu.classList.add("show");
  }
}

// Handle dropdowns in navbar
document.querySelectorAll(".nav_menu .dropdown > a").forEach(function (dropdownLink) {
  dropdownLink.addEventListener("click", function (e) {
    e.preventDefault();
    toggleDropdown(e);
  });
});

// Close dropdown when a menu item is clicked (but allow navigation)
document.querySelectorAll(".dropdown-menu a").forEach(function (menuItem) {
  menuItem.addEventListener("click", function () {
    var dropdownMenu = this.closest(".dropdown-menu");
    dropdownMenu.classList.remove("show");
    // Navigation happens normally via href for "People" dropdown, dynamically for others
  });
});

// Close dropdown when clicking anywhere else on the screen
document.addEventListener("click", function (e) {
  if (!e.target.closest(".dropdown")) {
    document.querySelectorAll(".dropdown-menu").forEach(function (menu) {
      menu.classList.remove("show");
    });
  }
});

// Sticky Navbar with Border
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

// Function to toggle mobile dropdowns
function toggleMobileDropdown(event) {
  const dropdownMenu = event.target.nextElementSibling;

  if (dropdownMenu.classList.contains("show")) {
    dropdownMenu.classList.remove("show");
  } else {
    document.querySelectorAll(".mobile-dropdown-menu.show").forEach((openDropdown) => {
      openDropdown.classList.remove("show");
    });
    dropdownMenu.classList.add("show");
  }
}

// Handle dropdowns in mobile menu
document.querySelectorAll(".mobile-nav_menu .mobile-dropdown > a").forEach(function (dropdownLink) {
  dropdownLink.addEventListener("click", function (e) {
    e.preventDefault();
    toggleMobileDropdown(e);
    document.querySelector(".hamburger").classList.add("prevent-close");
  });
});

// Handle mobile dropdown item clicks
document.querySelectorAll(".mobile-nav_menu .mobile-dropdown-menu a").forEach(function (menuItem) {
  menuItem.addEventListener("click", function () {
    document.querySelector(".hamburger").classList.remove("prevent-close");
    var dropdownMenu = this.closest(".mobile-dropdown-menu");
    dropdownMenu.classList.remove("show");
    document.getElementById("mobileMenu").style.display = "none";
    document.querySelector(".hamburger").classList.remove("change");
    // Navigation happens normally via href for "People" dropdown, dynamically for others
  });
});

// Dynamic Content Loading for desktop and mobile
$(document).ready(function () {
  $("#dynamicContent").load("home.html"); // Load home.html content by default

  // List of pages that should load dynamically
  const dynamicPages = [
    "home.html",
    "about-glance.html",
    "new_programs.html",
    "gallery.html"
    // Add other pages that should load into #dynamicContent
  ];

  // Handle all navbar and mobile menu links
  $(".nav_menu a, .mobile-nav_menu a").on("click", function (e) {
    const url = $(this).attr("href");
    const isPeopleLink = $(this).closest(".dropdown-menu, .mobile-dropdown-menu")
      .find("a[href='faculty.html']").length > 0; // Check if link is in "People" dropdown

    if (isPeopleLink) {
      // Allow normal navigation for "People" dropdown links (e.g., faculty.html)
      window.location.href = url;
    } else if (dynamicPages.includes(url)) {
      // Load dynamically for specified pages
      e.preventDefault();
      $("#dynamicContent").load(url);
      // Close dropdowns and mobile menu
      document.querySelectorAll(".dropdown-menu, .mobile-dropdown-menu").forEach(function (menu) {
        menu.classList.remove("show");
      });
      document.getElementById("mobileMenu").style.display = "none";
      document.querySelector(".hamburger").classList.remove("change");
    }
    // Other links (e.g., external or undefined) navigate normally
  });
});

// Toggle mobile menu
function toggleMobileMenu(x) {
  x.classList.toggle("change");
  var mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenu.style.display === "block") {
    mobileMenu.style.display = "none";
  } else {
    mobileMenu.style.display = "block";
  }
}