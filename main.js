// Function to toggle dropdowns
function toggleDropdown(event) {
  // Get the dropdown menu
  const dropdownMenu = event.target.nextElementSibling;

  // Check if the dropdown is already open
  if (dropdownMenu.classList.contains("show")) {
    // Close the dropdown
    dropdownMenu.classList.remove("show");
  } else {
    // Close all other open dropdowns
    const openDropdowns = document.querySelectorAll(".dropdown-menu.show");
    openDropdowns.forEach((openDropdown) => {
      openDropdown.classList.remove("show");
    });

    // Open the clicked dropdown
    dropdownMenu.classList.add("show");
  }
}

// Handle dropdowns in navbar
document
  .querySelectorAll(".nav_menu .dropdown > a")
  .forEach(function (dropdownLink) {
    dropdownLink.addEventListener("click", function (e) {
      e.preventDefault(); // Prevent default link behavior
      toggleDropdown(e);
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
  // Get the dropdown menu
  const dropdownMenu = event.target.nextElementSibling;

  // Check if the dropdown is already open
  if (dropdownMenu.classList.contains("show")) {
    // Close the dropdown
    dropdownMenu.classList.remove("show");
  } else {
    // Close all other open dropdowns
    const openDropdowns = document.querySelectorAll(
      ".mobile-dropdown-menu.show"
    );
    openDropdowns.forEach((openDropdown) => {
      openDropdown.classList.remove("show");
    });

    // Open the clicked dropdown
    dropdownMenu.classList.add("show");
  }
}

// Handle dropdowns in mobile menu
document
  .querySelectorAll(".mobile-nav_menu .mobile-dropdown > a")
  .forEach(function (dropdownLink) {
    dropdownLink.addEventListener("click", function (e) {
      e.preventDefault(); // Prevent default link behavior
      toggleMobileDropdown(e);
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
    if (menuItem.href !== "") {
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
      // If the link doesn't have a URL, it might be a dropdown toggle
      // This part is already handled by the dropdown toggle logic
    }
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

// Toggle mobile menu
function toggleMobileMenu(hamburger) {
  hamburger.classList.toggle("change");
  document.getElementById("mobileMenu").classList.toggle("show");
}

// ----------------------------------- People section ----------------------------------- //
// document.querySelectorAll(".load-people").forEach((link) => {
//   link.addEventListener("click", function (e) {
//     e.preventDefault();
//     const section = this.dataset.section;

//     // Load people.html with section parameter
//     fetch("people.html")
//       .then((response) => response.text())
//       .then((html) => {
//         document.getElementById("dynamicContent").innerHTML = html;
//         // Trigger section load after slight delay
//         setTimeout(() => loadPeopleSection(section), 50);
//       });
//   });
// });

// function loadPeopleSection(section) {
//   // Highlight active section
//   const activeLink = document.querySelector(
//     `.people-nav[data-section="${section}"]`
//   );
//   if (activeLink) {
//     document
//       .querySelectorAll(".people-nav")
//       .forEach((link) => link.classList.remove("active"));
//     activeLink.classList.add("active");

//     // Load corresponding content
//     const contentUrl = `${section}.html`;
//     fetch(contentUrl)
//       .then((response) => response.text())
//       .then((data) => {
//         document.getElementById("peopleContent").innerHTML = data;
//       });
//   }
// }

// ----------------------------------- Dynamic Content Loading ----------------------------------- //
$(document).ready(function () {
  $("#dynamicContent").load("home.html"); // Load home.html content by default

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
});

function toggleMobileMenu(x) {
  x.classList.toggle("change");
  var mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenu.style.display === "block") {
    mobileMenu.style.display = "none";
  } else {
    mobileMenu.style.display = "block";
  }
}
