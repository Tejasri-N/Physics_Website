document.addEventListener("DOMContentLoaded", () => {
  const programButtons = document.querySelectorAll(".program-btn");
  const detailsSection = document.getElementById("details-section");
  const contentSection = document.getElementById("content-section");

  // Program details with courses for M.Sc and M.Tech
  const programDetails = {
    btech: [
      "About",
      "Curriculum",
      "Academic Options",
      "Internship",
      "Placement",
      "Research Areas + Facilities",
      "Brochure",
    ],
    msc: ["Physics", "Quantum Semiconductors"],
    mtech: ["Physics", "Quantum Semiconductors"],
    phd: ["About", "Research Areas + Facilities", "Brochure"],
  };

  // Course-specific details for M.Sc and M.Tech
  const courseDetails = {
    physics: [
      "About",
      "Curriculum",
      "Academic Options",
      "Internship",
      "Placement",
    ],
    quantumsemiconductors: [
      "About",
      "Curriculum",
      "Research Areas + Facilities",
      "Internship",
      "Placement",
    ],
  };

  // Content for all sections (unique keys)
  const contentDetails = {
    // B.Tech
    aboutbtech: "<p>This is the About section for B.Tech.</p>",
    curriculumbtech: "<p>This is the Curriculum section for B.Tech.</p>",
    academicoptionsbtech:
      "<p>This is the Academic Options section for B.Tech.</p>",
    internshipbtech: "<p>This is the Internship section for B.Tech.</p>",
    placementbtech: "<p>This is the Placement section for B.Tech.</p>",
    researchareasfacilitiesbtech:
      "<p>This is the Research Areas + Facilities section for B.Tech.</p>",
    brochurebtech: "<p>This is the Brochure section for B.Tech.</p>",

    // Ph.D.
    aboutphd: "<p>This is the About section for Ph.D.</p>",
    researchareasfacilitiesphd:
      "<p>This is the Research Areas + Facilities section for Ph.D.</p>",
    brochurephd: "<p>This is the Brochure section for Ph.D.</p>",

    // M.Sc. Physics
    aboutphysicsmsc: "<p>About Physics in M.Sc.</p>",
    curriculumphysicsmsc: "<p>Physics Curriculum for M.Sc.</p>",
    academicoptionsphysicsmsc: "<p>Physics Academic Options for M.Sc.</p>",
    internshipphysicsmsc: "<p>Physics Internship Opportunities in M.Sc.</p>",
    placementphysicsmsc: "<p>Physics Placement Opportunities in M.Sc.</p>",

    // M.Sc. Quantum Semiconductors
    aboutquantumsemiconductorsmsc:
      "<p>About Quantum Semiconductors in M.Sc.</p>",
    curriculumquantumsemiconductorsmsc:
      "<p>Quantum Semiconductors Curriculum for M.Sc.</p>",
    researchareasfacilitiesquantumsemiconductorsmsc:
      "<p>Quantum Semiconductors Research Areas + Facilities in M.Sc.</p>",
    internshipquantumsemiconductorsmsc:
      "<p>Quantum Semiconductors Internship Opportunities in M.Sc.</p>",
    placementquantumsemiconductorsmsc:
      "<p>Quantum Semiconductors Placement Opportunities in M.Sc.</p>",

    // M.Tech. Physics
    aboutphysicsmtech: "<p>About Physics in M.Tech.</p>",
    curriculumphysicsmtech: "<p>Physics Curriculum for M.Tech.</p>",
    academicoptionsphysicsmtech: "<p>Physics Academic Options for M.Tech.</p>",
    internshipphysicsmtech:
      "<p>Physics Internship Opportunities in M.Tech.</p>",
    placementphysicsmtech: "<p>Physics Placement Opportunities in M.Tech.</p>",

    // M.Tech. Quantum Semiconductors
    aboutquantumsemiconductorsmtech:
      "<p>About Quantum Semiconductors in M.Tech.</p>",
    curriculumquantumsemiconductorsmtech:
      "<p>Quantum Semiconductors Curriculum for M.Tech.</p>",
    researchareasfacilitiesquantumsemiconductorsmtech:
      "<p>Quantum Semiconductors Research Areas + Facilities in M.Tech.</p>",
    internshipquantumsemiconductorsmtech:
      "<p>Quantum Semiconductors Internship Opportunities in M.Tech.</p>",
    placementquantumsemiconductorsmtech:
      "<p>Quantum Semiconductors Placement Opportunities in M.Tech.</p>",
  };

  // Display default content (B.Tech)
  displayProgramDetails("btech");
  contentSection.innerHTML = `<p>Select a section to view details.</p>`;

  // Handle Program Button Clicks
  programButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const program = button.dataset.program;
      displayProgramDetails(program);
      contentSection.innerHTML = `<p>Select a section to view details.</p>`;
    });
  });

  function displayProgramDetails(program) {
    let html = `<h3>${program.toUpperCase()} Program Details</h3>`;

    if (program === "msc" || program === "mtech") {
      // Show courses
      programDetails[program].forEach((course) => {
        const courseKey = course.toLowerCase().replace(/ /g, "");
        html += `<button class="course-btn btn" data-course="${courseKey}">${course}</button>`;
      });
      detailsSection.innerHTML = html;
      attachCourseListeners(program);
    } else {
      // Show direct details for B.Tech, Ph.D.
      programDetails[program].forEach((detail) => {
        const detailKey = detail.toLowerCase().replace(/ /g, "") + program;
        html += `<button class="detail-btn btn" data-detail="${detailKey}">${detail}</button>`;
      });
      detailsSection.innerHTML = html;
      attachDetailListeners();
    }
  }

  function attachCourseListeners(program) {
    const courseButtons = detailsSection.querySelectorAll(".course-btn");
    courseButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const course = button.dataset.course;
        displayCourseDetails(program, course);
      });
    });
  }

  function displayCourseDetails(program, course) {
    let html = `<h3>${capitalize(
      course
    )} Course Details (${program.toUpperCase()})</h3>`;
    courseDetails[course].forEach((detail) => {
      const detailKey =
        detail.toLowerCase().replace(/ /g, "") + course + program;
      html += `<button class="detail-btn btn" data-detail="${detailKey}">${detail}</button>`;
    });
    html += `<button class="back-btn btn">Back</button>`;
    detailsSection.innerHTML = html;
    attachDetailListeners();
    detailsSection.querySelector(".back-btn").addEventListener("click", () => {
      displayProgramDetails(program);
      contentSection.innerHTML = `<p>Select a section to view details.</p>`;
    });
  }

  function attachDetailListeners() {
    const detailButtons = detailsSection.querySelectorAll(".detail-btn");
    detailButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const detail = button.dataset.detail;
        contentSection.innerHTML =
          contentDetails[detail] ||
          `<p>Content not available for ${detail}.</p>`;
      });
    });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
});
