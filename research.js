// Open tab and set sessionStorage
function openTab(tabId) {
  sessionStorage.setItem("lastResearchTab", tabId);

  // Get all content divs (main tabs and sub-tabs)
  const mainContents = document.querySelectorAll(".research__content");
  const subContents = document.querySelectorAll(".Research_areas_tabs");

  // List of sub-tab IDs
  const subTabIds = [
    "Astrophysics_and_cosmology",
    "Theoretical_condensed_matter_physics",
    "Experimental_condensed_matter_physics",
    "High_energy_physics",
    "Optics_spectroscopy_laser",
    "Quantum_information_technology",
  ];

  // Hide all main content divs, except Research__areas if a sub-tab is selected
  mainContents.forEach((content) => {
    if (content.id === "Research__areas" && subTabIds.includes(tabId)) {
      content.style.display = "block";
    } else {
      content.style.display = "none";
    }
  });

  // Hide all sub-content divs
  subContents.forEach((content) => {
    content.style.display = "none";
  });

  // Show the selected content div
  const selectedContent = document.getElementById(tabId);
  if (selectedContent) {
    selectedContent.style.display = "block";
  }

  // Update active class on main navigators
  const navigators = document.querySelectorAll(".research__navigator");
  navigators.forEach((nav) => {
    nav.classList.remove("active");
  });

  // Add active class to the clicked main navigator
  const clickedNavigator = Array.from(navigators).find(
    (nav) => nav.getAttribute("onclick") === `openTab('${tabId}')`
  );
  if (clickedNavigator) {
    clickedNavigator.classList.add("active");
  } else {
    // If a sub-tab is clicked, activate the "Research Areas" main tab
    const researchAreasNavigator = Array.from(navigators).find(
      (nav) => nav.getAttribute("onclick") === `openTab('Research__areas')`
    );
    if (researchAreasNavigator) {
      researchAreasNavigator.classList.add("active");
    }
  }

  // Update active class on sub-tab buttons (Research Areas links)
  const subTabButtons = document.querySelectorAll(
    ".Research__areas__links__notes"
  );
  subTabButtons.forEach((button) => {
    button.classList.remove("active");
  });

  // Add active class to the clicked sub-tab button
  const clickedSubTab = Array.from(subTabButtons).find(
    (button) => button.getAttribute("onclick") === `openTab('${tabId}')`
  );
  if (clickedSubTab) {
    clickedSubTab.classList.add("active");
  }
}

// Function to open external link in a new tab
function openExternalLink(url) {
  window.open(url, "_blank");
}

// Show the tab clicked when the page loads
document.addEventListener("DOMContentLoaded", () => {
  let tabId = null;

  // 1. Check if a tab is set in sessionStorage (from previous navigation or reload)
  tabId = sessionStorage.getItem("lastResearchTab");

  // 2. If not, check if a tab is specified in the URL (from header.html dropdown)
  if (!tabId) {
    const urlParams = new URLSearchParams(window.location.search);
    tabId = urlParams.get("tab");
    if (tabId) {
      sessionStorage.setItem("lastResearchTab", tabId);
    }
  }

  // 3. If still not set, check the hash (optional, for deep linking)
  if (!tabId && window.location.hash) {
    tabId = window.location.hash.substring(1);
    if (tabId) {
      sessionStorage.setItem("lastResearchTab", tabId);
    }
  }

  // 4. Default to "Admission" if nothing else
  if (!tabId) {
    tabId = "Admission";
    sessionStorage.setItem("lastResearchTab", tabId);
  }

  openTab(tabId);
});

// Clear sessionStorage when leaving the page (except on refresh)
window.addEventListener("beforeunload", function (e) {
  // Use PerformanceNavigationTiming to detect navigation type
  let navType = performance.getEntriesByType("navigation")[0]?.type;
  if (navType !== "reload") {
    sessionStorage.removeItem("lastResearchTab");
  }
});
