// // Handle Dropdowns
// document.querySelectorAll(".dropdown").forEach(function (dropdown) {
//   dropdown.addEventListener("click", function (event) {
//     if (
//       event.target.tagName === "A" &&
//       event.target.parentNode.classList.contains("nav_menu")
//     ) {
//       // If the click is on a dropdown link, toggle the dropdown
//       this.querySelector(".dropdown-menu").classList.toggle("show");
//     }
//   });
// });

// Handle dropdowns in navbar
document
  .querySelectorAll(".nav_menu .dropdown > a")
  .forEach(function (dropdownLink) {
    dropdownLink.addEventListener("click", function (e) {
      e.preventDefault(); // Prevent default link behavior
      var dropdownMenu = this.nextElementSibling;
      dropdownMenu.classList.toggle("show"); // Toggle dropdown
    });
  });

// Close dropdown when a menu item is clicked
document.querySelectorAll(".dropdown-menu a").forEach(function (menuItem) {
  menuItem.addEventListener("click", function () {
    var dropdownMenu = this.parentNode;
    dropdownMenu.classList.remove("show");
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

// // Close dropdown when a menu item is clicked
// document.querySelectorAll(".dropdown-menu a").forEach(function (menuItem) {
//   menuItem.addEventListener("click", function () {
//     var dropdownMenu = this.parentNode;
//     dropdownMenu.classList.remove("show");
//   });
// });

// // Add show class to dropdown-menu when visible
// document.querySelectorAll(".dropdown-menu").forEach(function (menu) {
//   menu.classList.add("hide");
// });

// document.querySelectorAll(".dropdown").forEach(function (dropdown) {
//   dropdown.addEventListener("click", function () {
//     var menu = this.querySelector(".dropdown-menu");
//     menu.classList.toggle("show");
//     menu.classList.toggle("hide");
//   });
// });

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

function toggleMobileMenu(x) {
  x.classList.toggle("change");
  var mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenu.style.display === "block") {
    mobileMenu.style.display = "none";
  } else {
    mobileMenu.style.display = "block";
  }
}

// Handle dropdowns in mobile menu
document
  .querySelectorAll(".mobile-nav_menu .mobile-dropdown > a")
  .forEach(function (dropdownLink) {
    dropdownLink.addEventListener("click", function (e) {
      e.preventDefault(); // Prevent default link behavior
      var dropdownMenu = this.nextElementSibling;
      dropdownMenu.classList.toggle("show"); // Toggle dropdown
      // Prevent hamburger from closing when dropdown is opened
      document.querySelector(".hamburger").classList.add("prevent-close");
    });
  });

// Remove prevent-close class when dropdown item is clicked
document
  .querySelectorAll(".mobile-nav_menu .mobile-dropdown-menu a")
  .forEach(function (menuItem) {
    menuItem.addEventListener("click", function () {
      document.querySelector(".hamburger").classList.remove("prevent-close");
      // Close dropdown when item is clicked
      var dropdownMenu = this.parentNode;
      dropdownMenu.classList.remove("show");
    });
  });

// Close mobile menu when a link is clicked
document.querySelectorAll(".mobile-nav_menu a").forEach(function (menuItem) {
  if (!menuItem.parentNode.classList.contains("dropdown-menu")) {
    menuItem.addEventListener("click", function (e) {
      e.preventDefault(); // Prevent default link behavior
      if (
        !document
          .querySelector(".hamburger")
          .classList.contains("prevent-close")
      ) {
        var url = menuItem.href; // Get the URL from the link
        document.getElementById("dynamicContent").innerHTML = ""; // Clear existing content
        fetch(url)
          .then((response) => response.text())
          .then((data) => {
            document.getElementById("dynamicContent").innerHTML = data; // Load new content
          });
        document.getElementById("mobileMenu").style.display = "none";
        document.querySelector(".hamburger").classList.remove("change");
      }
    });
  } else {
    menuItem.addEventListener("click", function (e) {
      e.preventDefault(); // Prevent default link behavior
      var url = menuItem.href; // Get the URL from the link
      document.getElementById("dynamicContent").innerHTML = ""; // Clear existing content
      fetch(url)
        .then((response) => response.text())
        .then((data) => {
          document.getElementById("dynamicContent").innerHTML = data; // Load new content
        });
      document.getElementById("mobileMenu").style.display = "none";
      document.querySelector(".hamburger").classList.remove("change");
      var dropdownMenu = menuItem.parentNode;
      dropdownMenu.classList.remove("show");
      document.querySelector(".hamburger").classList.remove("prevent-close");
    });
  }
});

// Dynamic Content Loading
$(document).ready(function () {
  $("#dynamicContent").load("home.html"); // Load home.html content by default

  $(".nav_menu a").on("click", function (e) {
    e.preventDefault(); // Prevent default link behavior
    var url = $(this).attr("href"); // Get the URL from the link
    $("#dynamicContent").load(url); // Load the content dynamically
    // Close dropdowns after clicking
    document.querySelectorAll(".dropdown-menu").forEach(function (menu) {
      menu.classList.remove("show");
    });
  });
});
