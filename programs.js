document.addEventListener("DOMContentLoaded", () => {
  const programButtons = document.querySelectorAll(".program-btn");
  const detailsSection = document.getElementById("details-section");
  const contentSection = document.getElementById("content-section");

  // 🔧 Normalize strings to keys (remove all non-alphanumerics)
  const keyify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

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
    msc: ["Physics", "Quantum Semiconductors"], // label kept as-is
    mtech: ["Physics", "Quantum Semiconductors"], // label kept as-is
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
    // ------------------ B.Tech in Engineering Physics ------------------
    aboutbtech:
      `<p>The B.Tech in <strong>Engineering Physics</strong> at IIT Hyderabad integrates core physics with modern engineering, instrumentation, and computation. Students build rigorous analytical skills through theory, laboratories, and projects, preparing for advanced R&amp;D and higher studies. Institute-wide rules and degree templates are in the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook (62nd Senate)</a>.</p>`,
    curriculumbtech:
      `<p>The curriculum spans mechanics, electromagnetism, quantum &amp; statistical physics, materials, electronics, and computational methods with a strong lab backbone. Semester-wise structure and approved courses:<br>
      • <a href="assets/Docs/Annex.8_BTech Eng Physics Curriculum & course approvals.pdf" target="_blank" rel="noopener">B.Tech EP Curriculum &amp; Course Approvals (PDF)</a><br>
      • <a href="assets/Docs/Annex.8_BTech Eng Physics Curriculum & course approvals (1).pdf" target="_blank" rel="noopener">Alternate copy (PDF)</a><br>
      • <a href="assets/Docs/EP course content 2025.pdf" target="_blank" rel="noopener">EP Course Content 2025 (at a glance)</a></p>`,
    academicoptionsbtech:
      `<p>Students can pursue <em>Honors, Minors, Double Major, Free Electives,</em> and project options as per Senate norms. See <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook – Sections 4 &amp; 5</a> for B.Tech options, internship modalities, and graduation requirements.</p>`,
    internshipbtech:
      `<p>Vacation/semester-long research and industrial internships are encouraged and creditable per institute policy. Refer to the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a>. Department labs and project lines are outlined in <a href="assets/Docs/EP course content 2025.pdf" target="_blank" rel="noopener">EP Course Content 2025</a>.</p>`,
    placementbtech:
      `<p>Graduates take roles in <em>semiconductor, photonics, electronics, data science/analytics, finance</em> and research, or pursue M.Sc./M.Tech./Ph.D. The curriculum and labs (see <a href="assets/Docs/EP course content 2025.pdf" target="_blank" rel="noopener">EP Course Content 2025</a>) align with core &amp; emerging industries.</p>`,
    researchareasfacilitiesbtech:
      `<p>Thrusts include condensed matter &amp; materials, nanoscience, photonics/quantum, astrophysics, and soft matter/biophysics. Major facilities: SQUID magnetometer, XRD, NMR/ESR, advanced computation. See topical lab syllabi in <a href="assets/Docs/EP course content 2025.pdf" target="_blank" rel="noopener">EP Course Content 2025</a>.</p>`,
    brochurebtech:
      `<p>For quick reference, share: <a href="assets/Docs/Annex.8_BTech Eng Physics Curriculum & course approvals.pdf" target="_blank" rel="noopener">B.Tech EP Curriculum (PDF)</a> and the institute <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a>.</p>`,

    // ------------------ Ph.D. in Physics ------------------
    aboutphd:
      `<p>The Ph.D. program is research-intensive with coursework tailored to background, comprehensive evaluation, and dissertation. Admission, scholar progression, and degree templates follow the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook (Ph.D. section)</a>.</p>`,
    researchareasfacilitiesphd:
      `<p>Active areas: condensed matter &amp; quantum materials, nanoscience, photonics &amp; quantum technologies, high-energy/astrophysics, soft matter/biophysics, and interdisciplinary themes. Scholars access central/departmental facilities referenced in <a href="assets/Docs/EP course content 2025.pdf" target="_blank" rel="noopener">EP Course Content 2025</a>.</p>`,
    brochurephd:
      `<p>Prospective candidates should review <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Ph.D. regulations &amp; timelines</a>. Department-specific openings are notified in admission calls.</p>`,

    // ------------------ M.Sc. Physics ------------------
    aboutphysicsmsc:
      `<p>The two-year <strong>M.Sc. in Physics</strong> offers advanced training in theory, experiment, and computation, building a strong foundation for doctoral research and technology-driven careers.</p>`,
    curriculumphysicsmsc:
      `<p>Core coverage includes Classical &amp; Quantum Mechanics, Electrodynamics, Statistical Physics, Solid State, Optics/Photonics, and Computational Physics with advanced electives. Full semester-wise plan: <a href="assets/Docs/MSc Course curriculum@2025.docx" target="_blank" rel="noopener">M.Sc Physics Curriculum 2025-26 (DOCX)</a>.</p>`,
    academicoptionsphysicsmsc:
      `<p>Students may opt for dissertation/project, elective baskets, and interdisciplinary modules as per Senate norms—see <a href="assets/Docs/MSc Course curriculum@2025.docx" target="_blank" rel="noopener">M.Sc Physics Curriculum 2025-26</a> and the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a>.</p>`,
    internshipphysicsmsc:
      `<p>Summer research/industry projects are encouraged and can be credited subject to rules in the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a>.</p>`,
    placementphysicsmsc:
      `<p>Graduates pursue Ph.D. in India/abroad or roles in semiconductors, photonics, scientific computing, and analytics. Details of course/elective pathways: <a href="assets/Docs/MSc Course curriculum@2025.docx" target="_blank" rel="noopener">M.Sc Physics Curriculum 2025-26</a>.</p>`,

    // ------------------ M.Sc. Medical Physics ------------------
    aboutquantumsemiconductorsmsc:
      `<p><strong>M.Sc. in Medical Physics (Interdisciplinary)</strong> bridges physics with healthcare, covering radiation physics, medical imaging, instrumentation, and radiation safety. Official course content: <a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank" rel="noopener">M.Sc Medical Physics Course Content (PDF)</a>.</p>`,
    curriculumquantumsemiconductorsmsc:
      `<p>Representative modules: Nuclear &amp; Radiation Physics, Electrodynamics, Mathematical Physics, Quantum Mechanics, Radiological Mathematics, Lasers &amp; Photonics in Medicine, Computational Modelling of Biological Systems. Full listing: <a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank" rel="noopener">Medical Physics PDF</a>.</p>`,
    researchareasfacilitiesquantumsemiconductorsmsc:
      `<p>Training covers radiation detection/dosimetry, imaging technologies, and computational tools, with access to departmental and partner clinical facilities. See details in <a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank" rel="noopener">Medical Physics document</a>.</p>`,
    internshipquantumsemiconductorsmsc:
      `<p>Clinical/research internships are integral and follow institute guidelines (crediting/evaluation in the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a>). Practical/clinical components are described in the <a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank" rel="noopener">Medical Physics PDF</a>.</p>`,
    placementquantumsemiconductorsmsc:
      `<p>Outcomes: hospitals/radiotherapy centers, medical device companies, regulatory/compliance roles, and doctoral research in medical/health physics. See modules in <a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank" rel="noopener">Medical Physics Course Content</a>.</p>`,

    // ------------------ M.Tech in Quantum & Solid State Devices ------------------
    aboutphysicsmtech:
      `<p><strong>M.Tech in Quantum &amp; Solid State Devices (QSSD)</strong> trains students in quantum materials, nano/quantum devices, photonics, and measurement/sensing. Official curriculum: <a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank" rel="noopener">M.Tech QSSD Course Contents 2025 (PDF)</a>.</p>`,
    curriculumphysicsmtech:
      `<p>Core courses include Quantum Physics for Engineers, Mathematical/Computational Methods for Quantum Devices, Quantum Optical Devices, Solid-State Devices, and QSD Labs; with electives such as Fabrication &amp; Characterization, Spintronics, Optoelectronic Devices, Quantum Sensing/Transport. Full list: <a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank" rel="noopener">QSSD PDF</a>.</p>`,
    academicoptionsphysicsmtech:
      `<p>Wide elective baskets + a two-semester project enable specialization toward semiconductors, photonics, quantum technologies, or advanced materials—see <a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank" rel="noopener">curriculum document</a>.</p>`,
    internshipphysicsmtech:
      `<p>Industrial/research internships are supported per Senate rules; for modalities and credits see the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a>.</p>`,
    placementphysicsmtech:
      `<p>Typical outcomes: semiconductor &amp; photonics R&amp;D, nanoelectronics, quantum technology startups, and doctoral programs. Course–skills mapping in <a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank" rel="noopener">QSSD PDF</a>.</p>`,

    // ------------------ M.Tech in Ophthalmic Engineering ------------------
    aboutquantumsemiconductorsmtech:
      `<p><strong>M.Tech in Ophthalmic Engineering (Interdisciplinary)</strong> integrates optics, imaging, and biomedical engineering for vision science applications. This program is listed under interdisciplinary M.Tech offerings; refer to the institute-wide provisions in the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a>. (A department syllabus/brochure link can be added here when finalized.)</p>`,
    curriculumquantumsemiconductorsmtech:
      `<p>Representative coverage: optics &amp; photonics, ophthalmic instrumentation, medical imaging, and device design, with project-based learning in collaboration with clinicians/industry. Until a dedicated syllabus is published, follow Senate rules in the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook</a>.</p>`,
    researchareasfacilitiesquantumsemiconductorsmtech:
      `<p>Focus on translational optics/biophotonics and imaging systems. Students can access departmental photonics facilities and partner medical centers. Detailed lab links can be added once finalized; meanwhile, see institute-level provisions in the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook</a>.</p>`,
    internshipquantumsemiconductorsmtech:
      `<p>Clinical/industry internships are encouraged within program rules. Internship modalities/crediting: <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a>.</p>`,
    placementquantumsemiconductorsmtech:
      `<p>Outcomes include biomedical/ophthalmic device R&amp;D, imaging companies, hospital technology centers, and higher studies. A program-specific brochure can be linked here once released.</p>`,
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
