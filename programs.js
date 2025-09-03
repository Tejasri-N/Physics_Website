document.addEventListener("DOMContentLoaded", () => {
  const programButtons = document.querySelectorAll(".program-btn");
  const detailsSection = document.getElementById("details-section");
  const contentSection = document.getElementById("content-section");

  // Normalize strings to keys (remove all non-alphanumerics)
  const keyify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

  // Program details with courses
  // (labels adjusted; logic unchanged)
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
    mtech: ["Physics", "Ophthalmic Engineering"],
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
    ophthalmicengineering: [
      "About",
      "Curriculum",
      "Research Areas + Facilities",
      "Internship",
      "Placement",
    ],
  };

  // ------------------ CONTENT ONLY (no logic changes) ------------------
  const contentDetails = {
    /* ------------------ B.Tech in Engineering Physics ------------------ */
    aboutbtech:
      `<h4>B.Tech in Engineering Physics</h4>
       <table>
         <tr><td><strong>Duration</strong></td><td>4 years (8 semesters)</td></tr>
         <tr><td><strong>Degree</strong></td><td>B.Tech (Engineering Physics)</td></tr>
         <tr><td><strong>Focus</strong></td><td>Strong physics foundation + engineering, instrumentation, and computation</td></tr>
         <tr><td><strong>Handbook</strong></td><td><a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook (62nd Senate)</a></td></tr>
       </table>
       <ul>
         <li>Deep training in mechanics, electromagnetism, quantum/statistical physics, materials, electronics.</li>
         <li>Balanced mix of theory, laboratories, computation, projects.</li>
         <li>Pathways to R&amp;D, semiconductor/photonics, data/AI roles and higher studies.</li>
       </ul>`,
    curriculumbtech:
      `<p>Semester-wise structure and approved courses:</p>
       <ul>
         <li><a href="assets/Docs/Annex.8_BTech Eng Physics Curriculum & course approvals.pdf" target="_blank" rel="noopener">B.Tech EP Curriculum &amp; Course Approvals (PDF)</a></li>
         <li><a href="assets/Docs/Annex.8_BTech Eng Physics Curriculum & course approvals (1).pdf" target="_blank" rel="noopener">Alternate copy (PDF)</a></li>
         <li><a href="assets/Docs/EP course content 2025.pdf" target="_blank" rel="noopener">EP Course Content 2025</a></li>
       </ul>`,
    academicoptionsbtech:
      `<p>Flexible pathways per Senate norms (see <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook</a>):</p>
       <ul>
         <li>Honors / Minors / Double Major</li>
         <li>Independent Study Projects</li>
         <li>Internships (vacation/semester) with credits</li>
       </ul>`,
    internshipbtech:
      `<p>Internships in national labs, IITs/IISc, and industry partners. See policy in <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook</a>.</p>`,
    placementbtech:
      `<p>Graduates placed in semiconductor, photonics, analytics, consulting, and higher studies worldwide.</p>`,
    researchareasfacilitiesbtech:
      `<p>Facilities: SQUID magnetometer, XRD, NMR/ESR, computational clusters. See <a href="assets/Docs/EP course content 2025.pdf" target="_blank" rel="noopener">EP Course Content</a>.</p>`,
    brochurebtech:
      `<p><a href="assets/Docs/Annex.8_BTech Eng Physics Curriculum & course approvals.pdf" target="_blank" rel="noopener">Download Curriculum PDF</a></p>`,

    /* ------------------ Ph.D. ------------------ */
    aboutphd:
      `<h4>Ph.D. in Physics</h4>
       <p>Full-time research program with coursework, comprehensive exam, and thesis. See <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Ph.D. Handbook</a>.</p>`,
    researchareasfacilitiesphd:
      `<p>Research areas: Condensed Matter, Nanoscience, Photonics, Quantum Tech, Astrophysics, Soft Matter, Biophysics.</p>`,
    brochurephd:
      `<p><a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Ph.D. Regulations</a></p>`,

    /* ------------------ M.Sc. Physics ------------------ */
    aboutphysicsmsc:
      `<h4>M.Sc. in Physics</h4>
       <p>Two-year program with advanced theoretical and experimental training.</p>`,
    curriculumphysicsmsc:
      `<p><a href="assets/Docs/MSc Course curriculum@2025.docx" target="_blank" rel="noopener">M.Sc Physics Curriculum 2025-26</a></p>`,
    academicoptionsphysicsmsc:
      `<p>Electives and dissertation projects. See <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook</a>.</p>`,
    internshipphysicsmsc:
      `<p>Summer projects and lab internships permitted. See <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook</a>.</p>`,
    placementphysicsmsc:
      `<p>Graduates enter Ph.D. or industries in semiconductors, photonics, and scientific computing.</p>`,

    /* ------------------ M.Sc. Medical Physics ------------------ */
    aboutmedicalphysicsmsc:
      `<h4>M.Sc. in Medical Physics (Interdisciplinary)</h4>
       <p>Focus on radiation physics, medical imaging, instrumentation, protection &amp; safety.</p>`,
    curriculummedicalphysicsmsc:
      `<p><a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank" rel="noopener">M.Sc Medical Physics Curriculum 2025</a></p>`,
    researchareasfacilitiesmedicalphysicsmsc:
      `<p>Facilities: radiation detection, imaging labs, computational tools, hospital collaborations.</p>`,
    internshipmedicalphysicsmsc:
      `<p>Clinical and lab internships as per <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook</a>.</p>`,
    placementmedicalphysicsmsc:
      `<p>Careers in hospitals, device companies, regulatory agencies, or Ph.D. in medical/health physics.</p>`,

    /* ------------------ M.Tech. Quantum & Solid State Devices ------------------ */
    aboutphysicsmtech:
      `<h4>M.Tech. in Quantum & Solid State Devices</h4>
       <p>Advanced training in semiconductor and quantum devices. See <a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank" rel="noopener">QSSD Curriculum</a>.</p>`,
    curriculumphysicsmtech:
      `<p>Core: Quantum devices, nanoelectronics, photonics. See <a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank" rel="noopener">Curriculum PDF</a>.</p>`,
    academicoptionsphysicsmtech:
      `<p>Electives + thesis/project with specialization. See <a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank" rel="noopener">Curriculum</a>.</p>`,
    internshipphysicsmtech:
      `<p>Industrial/research internships as per institute norms.</p>`,
    placementphysicsmtech:
      `<p>Careers in semiconductor, photonics, quantum R&D, or doctoral studies.</p>`,

    /* ------------------ M.Tech. Ophthalmic Engineering ------------------ */
    aboutophthalmicengineeringmtech:
      `<h4>M.Tech. in Ophthalmic Engineering (Interdisciplinary)</h4>
       <p>Bridges optics, imaging, and biomedical engineering for vision science applications.</p>`,
    curriculumophthalmicengineeringmtech:
      `<p>Courses: Optics, Imaging, Ophthalmic Instrumentation, Image Processing, Clinical projects.</p>`,
    researchareasfacilitiesophthalmicengineeringmtech:
      `<p>Facilities: biophotonics labs, imaging systems, partner hospitals.</p>`,
    internshipophthalmicengineeringmtech:
      `<p>Clinical/industry internships supported under institute rules.</p>`,
    placementophthalmicengineeringmtech:
      `<p>Careers in biomedical/ophthalmic device R&amp;D, imaging companies, hospital tech centers, or Ph.D. studies.</p>`,
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
      // Show courses
      programDetails[program].forEach((course) => {
        const courseKey = keyify(course);
        html += `<button class="course-btn btn" data-course="${courseKey}">${course}</button>`;
      });
      detailsSection.innerHTML = html;
      attachCourseListeners(program);
    } else {
      // Show direct details for B.Tech, Ph.D.
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
