document.addEventListener("DOMContentLoaded", () => {
  const programButtons = document.querySelectorAll(".program-btn");
  const detailsSection = document.getElementById("details-section");
  const contentSection = document.getElementById("content-section");

  let currentProgram = null;

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

  const contentDetails = {
    about: "<p>This is the About section for B.Tech.</p>",
    curriculum: "<p>This is the Curriculum section for B.Tech.</p>",
    academicoptions: "<p>This is the Academic Options section for B.Tech.</p>",
    internship: "<p>This is the Internship section for B.Tech.</p>",
    placement: "<p>This is the Placement section for B.Tech.</p>",
    researchareasfacilities:
      "<p>This is the Research Areas + Facilities section for B.Tech.</p>",
    brochure: "<p>This is the Brochure section for B.Tech.</p>",

    aboutphysicsmsc: "<p>About Physics in M.Sc.</p>",
    curriculumphysicsmsc: "<p>Physics Curriculum for M.Sc.</p>",
    academicoptionsphysicsmsc: "<p>Physics Academic Options for M.Sc.</p>",
    internshipphysicsmsc: "<p>Physics Internship Opportunities in M.Sc.</p>",
    placementphysicsmsc: "<p>Physics Placement Opportunities in M.Sc.</p>",

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
  };

  displayProgramDetails("btech");

  programButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const program = button.dataset.program;
      currentProgram = program;
      displayProgramDetails(program);
    });
  });

  function displayProgramDetails(program) {
    detailsSection.innerHTML = `<h3>${program.toUpperCase()} Program Details</h3>`;

    if (program === "msc" || program === "mtech") {
      programDetails[program].forEach((course) => {
        const courseKey = course.toLowerCase().replace(/ /g, "");
        detailsSection.innerHTML += `<button class="course-btn programs-btn" data-course="${courseKey}">${course}</button>`;
      });
      attachCourseListeners(program);
    } else {
      programDetails[program].forEach((detail) => {
        const detailKey = detail.toLowerCase().replace(/ /g, "");
        detailsSection.innerHTML += `<button class="detail-btn programs-btn" data-detail="${detailKey}">${detail}</button>`;
      });

      attachDetailListeners();
    }
  }

  function attachCourseListeners(program) {
    const courseButtons = document.querySelectorAll(".course-btn");

    courseButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const course = button.dataset.course;

        detailsSection.innerHTML = `
                    <h3>${course.toUpperCase()} Course Details (${program.toUpperCase()})</h3>
                `;

        courseDetails[course].forEach((detail) => {
          const detailKey = `${detail
            .toLowerCase()
            .replace(/ /g, "")}${course}${program}`;
          detailsSection.innerHTML += `<button class="detail-btn programs-btn" data-detail="${detailKey}">${detail}</button>`;
        });

        attachDetailListeners();

        detailsSection.innerHTML += `<button class="back-btn programs-btn">Back</button>`;
        document.querySelector(".back-btn").addEventListener("click", () => {
          displayProgramDetails(program);
        });
      });
    });
  }

  function attachDetailListeners() {
    const detailButtons = document.querySelectorAll(".detail-btn");

    detailButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const detail = button.dataset.detail;
        contentSection.innerHTML =
          contentDetails[detail] ||
          `<p>Content not available for ${detail}.</p>`;
      });
    });
  }
});
