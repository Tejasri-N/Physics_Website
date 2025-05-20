function toggleDropdown(button) {
  // Find the parent faculty-card
  const facultyCard = button.closest(".faculty-card");
  // Find the dropdown-content inside this card
  const dropdown = facultyCard.querySelector(".dropdown-content");
  // Toggle active class
  const isActive = dropdown.classList.toggle("active");
  // Update accessibility attributes
  button.setAttribute("aria-expanded", isActive ? "true" : "false");
  dropdown.setAttribute("aria-hidden", isActive ? "false" : "true");
}
