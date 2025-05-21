// =================== Navbar Dropdowns ===================
function toggleDropdown(event) {
  const dropdownMenu = event.target.nextElementSibling;
  if (dropdownMenu.classList.contains("show")) {
    dropdownMenu.classList.remove("show");
  } else {
    document
      .querySelectorAll(".dropdown-menu.show")
      .forEach((menu) => menu.classList.remove("show"));
    dropdownMenu.classList.add("show");
  }
}
document.querySelectorAll(".nav_menu .dropdown > a").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    toggleDropdown(e);
  });
});
document.querySelectorAll(".dropdown-menu a").forEach((menuItem) => {
  menuItem.addEventListener("click", function () {
    this.parentNode.classList.remove("show");
  });
});
document.addEventListener("click", function (e) {
  if (!e.target.closest(".dropdown")) {
    document
      .querySelectorAll(".dropdown-menu")
      .forEach((menu) => menu.classList.remove("show"));
  }
});

// =================== Sticky Navbar ===================
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

// =================== Mobile Dropdowns ===================
function toggleMobileDropdown(event) {
  const dropdownMenu = event.target.nextElementSibling;
  if (dropdownMenu.classList.contains("show")) {
    dropdownMenu.classList.remove("show");
  } else {
    document
      .querySelectorAll(".mobile-dropdown-menu.show")
      .forEach((menu) => menu.classList.remove("show"));
    dropdownMenu.classList.add("show");
  }
}
document
  .querySelectorAll(".mobile-nav_menu .mobile-dropdown > a")
  .forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      toggleMobileDropdown(e);
      document.querySelector(".hamburger").classList.add("prevent-close");
    });
  });
document
  .querySelectorAll(".mobile-nav_menu .mobile-dropdown-menu a")
  .forEach((menuItem) => {
    menuItem.addEventListener("click", function () {
      document.querySelector(".hamburger").classList.remove("prevent-close");
      this.parentNode.classList.remove("show");
    });
  });

// =================== Mobile Menu Toggle ===================
function toggleMobileMenu(x) {
  x.classList.toggle("change");
  var mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenu.style.display === "block") {
    mobileMenu.style.display = "none";
  } else {
    mobileMenu.style.display = "block";
  }
}

// =================== Dynamic Content Loading ===================
$(document).ready(function () {
  // Default content
  $("#dynamicContent").load("home.html");

  // Standard navigation (non-research)
  $(".nav_menu a").on("click", function (e) {
    e.preventDefault(); // Prevent default link behavior

    // Check if it's a people-nav link
    if ($(this).hasClass("people-nav")) {
      var section = $(this).data("section");
      // Pass the section as a query param to people.html
      $("#dynamicContent").load("people.html?section=" + section, function () {
        // After people.html loads, trigger the correct section
        setTimeout(function () {
          if (window.handleNavigation) {
            handleNavigation(section);
          }
        }, 50);
      });
    } else {
      var url = $(this).attr("href"); // Get the URL from the link
      $("#dynamicContent").load(url); // Load the content dynamically
    }

    // Close dropdowns after clicking
    document.querySelectorAll(".dropdown-menu").forEach(function (menu) {
      menu.classList.remove("show");
    });
  });

  // Research tab (desktop)
  $(".research-nav").on("click", function (e) {
    e.preventDefault();
    const sectionId = $(this).data("section");
    $("#dynamicContent").load(
      "research.html #" + sectionId,
      function (response, status) {
        if (status === "error") {
          $("#dynamicContent").html(
            "<p>Sorry, content could not be loaded.</p>"
          );
        }
        document
          .querySelectorAll(".dropdown-menu")
          .forEach((menu) => menu.classList.remove("show"));
        $("html, body").animate(
          { scrollTop: $("#dynamicContent").offset().top },
          400
        );
      }
    );
  });

  // Research tab (mobile)
  $(".mobile-research-nav").on("click", function (e) {
    e.preventDefault();
    const sectionId = $(this).data("section");
    $("#dynamicContent").load(
      "research.html #" + sectionId,
      function (response, status) {
        if (status === "error") {
          $("#dynamicContent").html(
            "<p>Sorry, content could not be loaded.</p>"
          );
        }
        document.getElementById("mobileMenu").style.display = "none";
        document.querySelector(".hamburger").classList.remove("change");
        $("html, body").animate(
          { scrollTop: $("#dynamicContent").offset().top },
          400
        );
      }
    );
  });
});
