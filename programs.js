document.addEventListener("DOMContentLoaded", () => {
  const programButtons = document.querySelectorAll(".program-btn");
  const detailsSection = document.getElementById("details-section");
  const contentSection = document.getElementById("content-section");

  // Normalize strings to keys (remove all non-alphanumerics)
  const keyify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

  // Program details with courses
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
    msc: ["Physics", "Medical Physics"],
    mtech: ["Quantum and Solid State Devices", "Ophthalmic Engineering"],
    phd: ["About", "Research Areas + Facilities", "Brochure"],
  };

  // Course-specific details
  const courseDetails = {
    physics: ["About", "Curriculum", "Academic Options", "Internship", "Placement"],
    medicalphysics: [
      "About",
      "Curriculum",
      "Research Areas + Facilities",
      "Internship",
      "Placement",
    ],
    quantumandsolidstatedevices: [
      "About",
      "Curriculum",
      "Academic Options",
      "Internship",
      "Placement",
    ],
    ophthalmicengineering: [
      "About",
      "Curriculum",
      "Research Areas + Facilities",
      "Internship",
      "Placement",
    ],
  };

  // ------------------ CONTENT ONLY ------------------
  const contentDetails = {
    /* ------------------ B.Tech in Engineering Physics ------------------ */
    aboutbtech:
      `<h4>B.Tech in Engineering Physics</h4>
       <p>Strong foundation in physics + engineering applications. See <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank">Handbook</a>.</p>`,
    curriculumbtech:
      `<p>Curriculum: <a href="assets/Docs/Annex.8_BTech Eng Physics Curriculum & course approvals.pdf" target="_blank">Download PDF</a></p>`,
    academicoptionsbtech: `<p>Options: Honors, Minors, Double Major. See <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank">Handbook</a>.</p>`,
    internshipbtech: `<p>Internships in labs/industry. See <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank">Handbook</a>.</p>`,
    placementbtech: `<p>Graduates enter semiconductors, photonics, analytics, or higher studies.</p>`,
    researchareasfacilitiesbtech: `<p>Facilities: SQUID, XRD, ESR/NMR, HPC clusters. See <a href="assets/Docs/EP course content 2025.pdf" target="_blank">EP Content</a>.</p>`,
    brochurebtech: `<p><a href="assets/Docs/Annex.8_BTech Eng Physics Curriculum & course approvals.pdf" target="_blank">Download Brochure</a></p>`,

    /* ------------------ Ph.D. ------------------ */
    aboutphd: `<h4>Ph.D. in Physics</h4><p>Full-time research, thesis, coursework. See <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank">Handbook</a>.</p>`,
    researchareasfacilitiesphd: `<p>Research: Condensed Matter, Photonics, Astrophysics, Biophysics.</p>`,
    brochurephd: `<p><a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank">Ph.D. Regulations</a></p>`,

    /* ------------------ M.Sc. Physics ------------------ */
    aboutphysicsmsc: `<h4>M.Sc. in Physics</h4><p>Two-year program with advanced coursework and labs.</p>`,
    curriculumphysicsmsc: `<p><a href="assets/Docs/MSc Course curriculum@2025.docx" target="_blank">M.Sc Physics Curriculum 2025</a></p>`,
    academicoptionsphysicsmsc: `<p>Electives, projects, dissertations. See Handbook.</p>`,
    internshipphysicsmsc: `<p>Summer research projects, internships allowed.</p>`,
    placementphysicsmsc: `<p>Graduates pursue Ph.D. or enter semiconductors, photonics, computing.</p>`,

    /* ------------------ M.Sc. Medical Physics ------------------ */
    aboutmedicalphysicsmsc: `<h4>M.Sc. in Medical Physics</h4><p>Focus: radiation physics, imaging, safety. See <a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank">Course PDF</a>.</p>`,
    curriculummedicalphysicsmsc: `<p><a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank">Full Curriculum</a></p>`,
    researchareasfacilitiesmedicalphysicsmsc: `<p>Facilities: dosimetry labs, imaging systems, clinical tie-ups.</p>`,
    internshipmedicalphysicsmsc: `<p>Internships at hospitals, research labs. Evaluated as per Handbook.</p>`,
    placementmedicalphysicsmsc: `<p>Careers: Medical Physicists in hospitals, device firms, Ph.D.</p>`,

    /* ------------------ M.Tech. Quantum and Solid State Devices ------------------ */
    aboutquantumandsolidstatedevicesmtech: `<h4>M.Tech. in Quantum & Solid State Devices</h4><p>Training in semiconductors, nano/quantum devices. <a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank">Curriculum PDF</a>.</p>`,
    curriculumquantumandsolidstatedevicesmtech: `<p><a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank">Download QSSD Curriculum</a></p>`,
    academicoptionsquantumandsolidstatedevicesmtech: `<p>Electives + thesis with focus on semiconductors/quantum tech.</p>`,
    internshipquantumandsolidstatedevicesmtech: `<p>Internships in semiconductor, photonics, R&D labs.</p>`,
    placementquantumandsolidstatedevicesmtech: `<p>Careers in semiconductors, photonics, quantum startups, or Ph.D.</p>`,

    /* ------------------ M.Tech. Ophthalmic Engineering ------------------ */
    aboutophthalmicengineeringmtech: `<h4>M.Tech. in Ophthalmic Engineering</h4><p>Focus: optics, imaging, biomedical devices for vision science.</p>`,
    curriculumophthalmicengineeringmtech: `<p>Courses: optics, imaging, instrumentation, clinical projects.</p>`,
    researchareasfacilitiesophthalmicengineeringmtech: `<p>Facilities: imaging labs, biophotonics, hospital collaborations.</p>`,
    internshipophthalmicengineeringmtech: `<p>Clinical/industry internships under institute norms.</p>`,
    placementophthalmicengineeringmtech: `<p>Careers: biomedical/ophthalmic device R&D, imaging, Ph.D.</p>`,
  };
  // ---------------- END CONTENT ----------------

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
      programDetails[program].forEach((course) => {
        const courseKey = keyify(course);
        html += `<button class="course-btn btn" data-course="${courseKey}">${course}</button>`;
      });
      detailsSection.innerHTML = html;
      attachCourseListeners(program);
    } else {
      programDetails[program].forEach((detail) => {
        const detailKey = keyify(detail) + program;
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
    let html = `<h3>${capitalize(course)} Course Details (${program.toUpperCase()})</h3>`;
    courseDetails[course].forEach((detail) => {
      const detailKey = keyify(detail) + course + program;
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
