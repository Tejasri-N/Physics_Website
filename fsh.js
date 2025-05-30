document.addEventListener("DOMContentLoaded", () => {
  // Dropdown Functionality
  document.querySelectorAll(".dropdown-toggle").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = button.closest(".member-card");
      const dropdown = card.querySelector(".dropdown-content");
      const isExpanded = button.getAttribute("aria-expanded") === "true";

      // Close all other dropdowns
      document.querySelectorAll(".dropdown-content").forEach((d) => {
        if (d !== dropdown) {
          d.classList.remove("active");
          d.parentElement
            .querySelector(".dropdown-toggle")
            .setAttribute("aria-expanded", "false");
        }
      });

      // Toggle current dropdown
      button.setAttribute("aria-expanded", !isExpanded);
      dropdown.classList.toggle("active", !isExpanded);
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".member-card")) {
      document.querySelectorAll(".dropdown-content").forEach((d) => {
        d.classList.remove("active");
        d.parentElement
          .querySelector(".dropdown-toggle")
          .setAttribute("aria-expanded", "false");
      });
    }
  });

  // Navigation Active State
  document.querySelectorAll(".nav-menu a").forEach((link) => {
    link.addEventListener("click", function (e) {
      // Remove this e.preventDefault(); for actual navigation
      document
        .querySelectorAll(".nav-menu a")
        .forEach((a) => a.classList.remove("active"));
      this.classList.add("active");
    });
  });
});

// Mobile Submenu Toggle
document.querySelectorAll(".has-submenu > a").forEach((link) => {
  link.addEventListener("click", function (e) {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      const submenu = this.nextElementSibling;
      submenu.classList.toggle("active");
    }
  });
});

// Close submenus when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".has-submenu")) {
    document.querySelectorAll(".submenu").forEach((sub) => {
      sub.classList.remove("active");
    });
  }
});

// Handle year filtering for Alumni
document.querySelectorAll('.submenu a[href*="alumni.html"]').forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const yearRange = new URL(this.href).searchParams.get("year");
    filterAlumniByYear(yearRange);
  });
});

function filterAlumniByYear(yearRange) {
  // Implement your alumni filtering logic here
  console.log("Filtering alumni for:", yearRange);
  // Example: window.location.href = `alumni.html?year=${yearRange}`;
}

// Back to Top Button Functionality
document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("backToTopBtn");

  window.addEventListener("scroll", function () {
    if (window.scrollY > 300) {
      btn.style.display = "block";
    } else {
      btn.style.display = "none";
    }
  });

  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
