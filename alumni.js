document.addEventListener("DOMContentLoaded", () => {
  const pills = document.querySelectorAll(".course-pill");
  const tableContainer = document.getElementById("tableContainer");
  const tableBody = document.getElementById("tableBody");
  const tableCaption = document.getElementById("tableCaption");
  const alumniData = document.getElementById("alumniData");

  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      // Reset active pill
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");

      const course = pill.getAttribute("data-alumni-course");
      const courseBlock = alumniData.querySelector(
        `[data-alumni-course="${course}"]`
      );

      if (courseBlock) {
        // Clear table
        tableBody.innerHTML = "";

        // Populate rows
        const students = courseBlock.querySelectorAll("div");
        students.forEach((student, index) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.dataset.name.toUpperCase()}</td>
            <td>${student.dataset.enroll.toUpperCase()}</td>
            <td>${student.dataset.status}</td>
          `;
          tableBody.appendChild(row);
        });

        // Caption update
        // tableCaption.textContent = course.toUpperCase() + " Alumni Directory";

        // Show table
        tableContainer.classList.remove("hidden");
      } else {
        tableContainer.classList.add("hidden");
      }
    });
  });
});
