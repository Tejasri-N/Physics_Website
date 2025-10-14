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

      /* =========================================================
   Faculty Alphabetical Filter – IIT Hyderabad Physics Dept
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const alphaBar = document.getElementById("alphaBar");
  const noMatches = document.getElementById("alphaNoMatches");
  if (!alphaBar) return;

  const buttons = alphaBar.querySelectorAll(".alpha-btn");
  const cards = document.querySelectorAll(".member-card");

  function getInitialLetter(card) {
    const name = card.querySelector(".member-name");
    return name ? name.textContent.trim().charAt(0).toUpperCase() : "";
  }

  // Count initials to disable letters with no matches
  const counts = {};
  cards.forEach((card) => {
    const letter = getInitialLetter(card);
    counts[letter] = (counts[letter] || 0) + 1;
  });

  buttons.forEach((btn) => {
    const letter = btn.dataset.letter.toUpperCase();
    if (letter !== "ALL" && !counts[letter]) {
      btn.classList.add("disabled");
      btn.disabled = true;
    }

    btn.addEventListener("click", () => {
      if (btn.classList.contains("disabled")) return;
      buttons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");

      const filter = btn.dataset.letter;
      let visibleCount = 0;

      cards.forEach((card) => {
        const initial = getInitialLetter(card);
        const show = filter === "all" || initial === filter.toUpperCase();
        card.style.display = show ? "" : "none";
        if (show) visibleCount++;
      });

      noMatches.hidden = visibleCount > 0;
      window.scrollTo({ top: alphaBar.offsetTop - 20, behavior: "smooth" });
    });
  });
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
