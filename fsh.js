// fsh.js - fixed alphabetical filter + dropdowns + other behavior
document.addEventListener("DOMContentLoaded", () => {

  /* -------------------------
     Dropdown Toggle (cards)
     ------------------------- */
  document.querySelectorAll(".dropdown-toggle").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = button.closest(".member-card");
      if (!card) return;
      const dropdown = card.querySelector(".dropdown-content");
      const isExpanded = button.getAttribute("aria-expanded") === "true";

      // Close other dropdowns
      document.querySelectorAll(".dropdown-content").forEach((d) => {
        if (d !== dropdown) {
          d.classList.remove("active");
          const otherBtn = d.parentElement.querySelector(".dropdown-toggle");
          if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
        }
      });

      // Toggle current
      button.setAttribute("aria-expanded", (!isExpanded).toString());
      dropdown.classList.toggle("active", !isExpanded);
    });
  });

  // Close dropdowns when clicking outside card area
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".member-card")) {
      document.querySelectorAll(".dropdown-content").forEach((d) => {
        d.classList.remove("active");
        const btn = d.parentElement.querySelector(".dropdown-toggle");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    }
  });


  /* =========================================================
     Alphabetical Filter – initialize once (fix for "not working")
     ========================================================= */
  (function initAlphaFilter() {
    const alphaBar = document.getElementById("alphaBar");
    const noMatches = document.getElementById("alphaNoMatches");
    if (!alphaBar) return;

    const buttons = Array.from(alphaBar.querySelectorAll(".alpha-btn"));
    const cards = Array.from(document.querySelectorAll(".member-card"));

    function getInitialLetter(card) {
      const nameEl = card.querySelector(".member-name");
      const txt = nameEl ? nameEl.textContent.trim() : "";
      return txt ? txt.charAt(0).toUpperCase() : "";
    }

    // Build counts and disable letters without matches
    const counts = {};
    cards.forEach((card) => {
      const letter = getInitialLetter(card);
      if (letter) counts[letter] = (counts[letter] || 0) + 1;
    });

    buttons.forEach((btn) => {
      const letter = (btn.dataset.letter || "").toUpperCase();

      // Normalize 'all' -> ALL
      if (letter !== "ALL" && !counts[letter]) {
        btn.classList.add("disabled");
        btn.disabled = true;
        btn.setAttribute("aria-disabled", "true");
        btn.setAttribute("tabindex", "-1");
      } else {
        btn.classList.remove("disabled");
        btn.disabled = false;
        btn.removeAttribute("aria-disabled");
        btn.removeAttribute("tabindex");
      }

      // Make buttons keyboard accessible (Enter/Space) and clickable
      const activate = () => {
        if (btn.classList.contains("disabled")) return;

        // update pressed state
        buttons.forEach((b) => b.setAttribute("aria-pressed", "false"));
        btn.setAttribute("aria-pressed", "true");

        const filter = (btn.dataset.letter || "").toLowerCase();
        let visibleCount = 0;

        // Show/hide cards
        cards.forEach((card) => {
          const initial = getInitialLetter(card);
          const show = filter === "all" || initial === (filter || "").toUpperCase();
          card.style.display = show ? "" : "none";
          if (show) visibleCount++;
        });

        // Show "no matches" if none visible
        noMatches.hidden = visibleCount > 0;

        // If there are visible cards, scroll to the first one; else scroll to alphaBar
        if (visibleCount > 0) {
          const firstVisible = cards.find((c) => c.style.display !== "none");
          if (firstVisible) {
            // ensure we scroll a bit above the card
            const y = Math.max(0, firstVisible.getBoundingClientRect().top + window.scrollY - 20);
            window.scrollTo({ top: y, behavior: "smooth" });
          }
        } else {
          // fallback scroll to alphaBar
          const y = Math.max(0, alphaBar.getBoundingClientRect().top + window.scrollY - 20);
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      };

      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        activate();
      });

      btn.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          activate();
        }
      });
    });

    // Make sure "All" is pressed by default if present
    const allBtn = buttons.find((b) => (b.dataset.letter || "").toLowerCase() === "all");
    if (allBtn) {
      allBtn.setAttribute("aria-pressed", "true");
    }
  })();


  /* -------------------------
     Navigation Active State (sidebar)
     ------------------------- */
  document.querySelectorAll(".nav-menu a").forEach((link) => {
    link.addEventListener("click", function (e) {
      // keep navigation actual behavior - do not prevent default
      document.querySelectorAll(".nav-menu a").forEach((a) => a.classList.remove("active"));
      this.classList.add("active");
    });
  });


  /* -------------------------
     Mobile submenu toggle for links with .has-submenu
     ------------------------- */
  document.querySelectorAll(".has-submenu > a").forEach((link) => {
    link.addEventListener("click", function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const submenu = this.nextElementSibling;
        if (submenu) submenu.classList.toggle("active");
      }
    });
  });

  // Close submenus when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".has-submenu")) {
      document.querySelectorAll(".submenu").forEach((sub) => sub.classList.remove("active"));
    }
  });


  /* -------------------------
     Back to Top Button
     ------------------------- */
  (function initBackToTop() {
    const btn = document.getElementById("backToTopBtn");
    if (!btn) return;
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        btn.style.display = "block";
      } else {
        btn.style.display = "none";
      }
    });
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  })();


  /* -------------------------
     Stub: alumni/year filter hooks (if used elsewhere)
     ------------------------- */
  document.querySelectorAll('.submenu a[href*="alumni.html"]').forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const yearRange = new URL(this.href, window.location.href).searchParams.get("year");
      filterAlumniByYear(yearRange);
    });
  });

  function filterAlumniByYear(yearRange) {
    // keep console for now - user can customize
    console.log("Filtering alumni for:", yearRange);
  }

}); // DOMContentLoaded end
