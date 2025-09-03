document.addEventListener("DOMContentLoaded", () => {
  const programButtons = document.querySelectorAll(".program-btn");
  const detailsSection = document.getElementById("details-section");
  const contentSection = document.getElementById("content-section");

  // 🔧 Normalize strings to keys (remove all non-alphanumerics)
  const keyify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

  // Program details with courses for M.Sc and M.Tech
  // (Labels kept as-is; M.Sc "Quantum Semiconductors" shows Medical Physics content;
  //  M.Tech "Quantum Semiconductors" shows Ophthalmic Engineering content.)
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
    physics: ["About", "Curriculum", "Academic Options", "Internship", "Placement"],
    quantumsemiconductors: [
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
         <li>Deep training in <em>mechanics, E&amp;M, quantum/statistical physics, materials, electronics</em>.</li>
         <li>Balanced mix of <strong>theory, laboratories, computation, projects</strong>.</li>
         <li>Pathways to <strong>R&amp;D, semiconductor/photonics, data/AI</strong> roles and higher studies.</li>
       </ul>`,
    curriculumbtech:
      `<p>Semester-wise structure and approved courses:</p>
       <ul>
         <li><a href="assets/Docs/Annex.8_BTech Eng Physics Curriculum & course approvals.pdf" target="_blank" rel="noopener">B.Tech EP Curriculum &amp; Course Approvals (PDF)</a></li>
         <li><a href="assets/Docs/Annex.8_BTech Eng Physics Curriculum & course approvals (1).pdf" target="_blank" rel="noopener">Alternate copy (PDF)</a></li>
         <li><a href="assets/Docs/EP course content 2025.pdf" target="_blank" rel="noopener">EP Course Content 2025 (at a glance)</a></li>
       </ul>
       <table>
         <tr><td><strong>Core</strong></td><td>Mechanics, E&amp;M, Quantum, Statistical Physics, Math Methods</td></tr>
         <tr><td><strong>Engineering</strong></td><td>Electronics, Devices, Signals/Instrumentation, Computing</td></tr>
         <tr><td><strong>Labs</strong></td><td>Foundational + Advanced labs; project courses</td></tr>
         <tr><td><strong>Electives</strong></td><td>Condensed Matter, Photonics, Quantum Tech, Simulation, etc.</td></tr>
       </table>`,
    academicoptionsbtech:
      `<p>Flexible pathways per Senate norms (see <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook – Sec. 4–5</a>):</p>
       <ul>
         <li><strong>Honors / Minors / Double Major</strong> with curated elective baskets.</li>
         <li><strong>Projects &amp; Independent Study</strong> with faculty supervision.</li>
         <li><strong>Internship</strong> options (vacation/semester) with credits as applicable.</li>
       </ul>`,
    internshipbtech:
      `<p>Students undertake research/industrial internships following institute policy (<a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook</a>).</p>
       <ul>
         <li>Hosts: IIT/IISc/National Labs, semiconductor/photonics firms, deep-tech startups.</li>
         <li>Skills: lab methods, device/testing workflows, modeling &amp; computation, teamwork.</li>
       </ul>`,
    placementbtech:
      `<p>Typical outcomes:</p>
       <ul>
         <li><strong>Industry</strong>: semiconductor &amp; electronics, photonics, analytics/AI, consulting.</li>
         <li><strong>Higher studies</strong>: M.Sc./M.Tech./Ph.D. in India &amp; abroad.</li>
       </ul>
       <p>See the lab &amp; course mapping in <a href="assets/Docs/EP course content 2025.pdf" target="_blank" rel="noopener">EP Course Content 2025</a>.</p>`,
    researchareasfacilitiesbtech:
      `<ul>
         <li>Condensed Matter &amp; Materials, Nanoscience, Photonics &amp; Quantum Tech, Astrophysics, Soft Matter/Biophysics.</li>
         <li>Major facilities: SQUID magnetometer, XRD, NMR/ESR, advanced computation clusters.</li>
       </ul>
       <p>Course-linked facility exposure: <a href="assets/Docs/EP course content 2025.pdf" target="_blank" rel="noopener">EP Course Content 2025</a>.</p>`,
    brochurebtech:
      `<p>Quick reference for prospective students:</p>
       <ul>
         <li><a href="assets/Docs/Annex.8_BTech Eng Physics Curriculum & course approvals.pdf" target="_blank" rel="noopener">B.Tech EP Curriculum (PDF)</a></li>
         <li><a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a></li>
       </ul>`,

    /* ------------------ Ph.D. in Physics ------------------ */
    aboutphd:
      `<h4>Ph.D. in Physics</h4>
       <table>
         <tr><td><strong>Nature</strong></td><td>Full-time research with tailored coursework, comprehensive exam, dissertation</td></tr>
         <tr><td><strong>Rules</strong></td><td><a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook – Ph.D.</a></td></tr>
       </table>
       <p>Students work closely with faculty on frontier problems in theory/experiment/interdisciplinary physics.</p>`,
    researchareasfacilitiesphd:
      `<p>Active areas:</p>
       <ul>
         <li>Quantum/Condensed Matter &amp; Materials, Nanoscience</li>
         <li>Photonics &amp; Quantum Technologies</li>
         <li>High-Energy Physics &amp; Astrophysics</li>
         <li>Soft Matter &amp; Biophysics</li>
       </ul>
       <p>Access to central/departmental facilities referenced in <a href="assets/Docs/EP course content 2025.pdf" target="_blank" rel="noopener">EP Course Content 2025</a>.</p>`,
    brochurephd:
      `<p>Before applying, review <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Ph.D. regulations &amp; timelines</a>. Department openings are announced in official calls.</p>`,

    /* ------------------ M.Sc. Physics ------------------ */
    aboutphysicsmsc:
      `<h4>M.Sc. in Physics</h4>
       <table>
         <tr><td><strong>Duration</strong></td><td>2 years (4 semesters)</td></tr>
         <tr><td><strong>Orientation</strong></td><td>Advanced theory, laboratory, and computation leading to research/industry</td></tr>
       </table>`,
    curriculumphysicsmsc:
      `<p>Full structure: <a href="assets/Docs/MSc Course curriculum@2025.docx" target="_blank" rel="noopener">M.Sc Physics Curriculum 2025-26 (DOCX)</a></p>
       <ul>
         <li><strong>Core</strong>: Classical &amp; Quantum Mechanics, Electrodynamics, Statistical Physics, Solid State.</li>
         <li><strong>Methodologies</strong>: Mathematical/Computational Physics, Advanced Labs &amp; Seminars.</li>
         <li><strong>Electives</strong>: Nanoscience, Photonics, Quantum Tech, Materials, etc.</li>
       </ul>`,
    academicoptionsphysicsmsc:
      `<p>Per Senate norms (see <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook</a>):</p>
       <ul>
         <li>Dissertation/Project with faculty supervision.</li>
         <li>Interdisciplinary electives across departments.</li>
       </ul>`,
    internshipphysicsmsc:
      `<p>Summer projects/internships in research labs or industry may be credited as per the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook</a>.</p>`,
    placementphysicsmsc:
      `<p>Graduates pursue Ph.D. positions or roles in semiconductors, photonics, scientific computing, analytics. See elective mapping in <a href="assets/Docs/MSc Course curriculum@2025.docx" target="_blank" rel="noopener">M.Sc Physics Curriculum 2025-26</a>.</p>`,

    /* ------------------ M.Sc. Medical Physics (Interdisciplinary)
       (Rendered under the "Quantum Semiconductors" tab in current UI) ------------------ */
    aboutquantumsemiconductorsmsc:
      `<h4>M.Sc. in Medical Physics (Interdisciplinary)</h4>
       <table>
         <tr><td><strong>Essence</strong></td><td>Physics applied to healthcare: radiation physics, imaging, instrumentation, safety</td></tr>
         <tr><td><strong>Document</strong></td><td><a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank" rel="noopener">Course Content (PDF)</a></td></tr>
       </table>`,
    curriculumquantumsemiconductorsmsc:
      `<ul>
         <li>Nuclear &amp; Radiation Physics, Quantum Mechanics, Electrodynamics</li>
         <li>Radiological Mathematics, Lasers &amp; Photonics in Medicine</li>
         <li>Computational Modelling of Biological Systems; Practical/Clinical Components</li>
       </ul>
       <p>Full syllabus &amp; schedule: <a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank" rel="noopener">Medical Physics PDF</a>.</p>`,
    researchareasfacilitiesquantumsemiconductorsmsc:
      `<p>Hands-on training in radiation detection/dosimetry, imaging technologies, and computational tools with access to departmental and partner clinical facilities (<a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank" rel="noopener">details</a>).</p>`,
    internshipquantumsemiconductorsmsc:
      `<p>Clinical/research internships follow institute rules (crediting/evaluation in the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook</a>); modality specifics appear in the <a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank" rel="noopener">program document</a>.</p>`,
    placementquantumsemiconductorsmsc:
      `<p>Career tracks: hospitals/radiotherapy centers, medical device firms, regulatory/compliance, and Ph.D. in medical/health physics. See modules in the <a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank" rel="noopener">Medical Physics PDF</a>.</p>`,

    /* ------------------ M.Tech in Quantum & Solid State Devices ------------------ */
    aboutphysicsmtech:
      `<h4>M.Tech in Quantum &amp; Solid State Devices (QSSD)</h4>
       <table>
         <tr><td><strong>Focus</strong></td><td>Quantum materials, nano/quantum devices, photonics, sensing &amp; metrology</td></tr>
         <tr><td><strong>Curriculum</strong></td><td><a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank" rel="noopener">QSSD Course Contents 2025 (PDF)</a></td></tr>
       </table>`,
    curriculumphysicsmtech:
      `<ul>
         <li>Quantum Physics for Engineers; Solid-State Devices; Quantum Optical Devices</li>
         <li>Mathematical/Computational Methods for Quantum Devices; QSD Labs</li>
         <li>Electives: Fabrication &amp; Characterization, Spintronics, Optoelectronics, Quantum Sensing/Transport</li>
       </ul>
       <p>Complete list &amp; sequencing: <a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank" rel="noopener">QSSD PDF</a>.</p>`,
    academicoptionsphysicsmtech:
      `<p>Customize via broad elective baskets and a two-semester thesis/project aimed at semiconductors, photonics, quantum tech, or advanced materials (<a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank" rel="noopener">curriculum</a>).</p>`,
    internshipphysicsmtech:
      `<p>Research/industrial internships supported per Senate rules—see the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a>.</p>`,
    placementphysicsmtech:
      `<p>Outcomes: semiconductor &amp; photonics R&amp;D, nanoelectronics, quantum technology startups, doctoral programs. Evidence of skills alignment in the <a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank" rel="noopener">QSSD PDF</a>.</p>`,

    /* ------------------ M.Tech in Ophthalmic Engineering (Interdisciplinary)
       (Rendered under the "Quantum Semiconductors" tab in current UI) ------------------ */
    aboutquantumsemiconductorsmtech:
      `<h4>M.Tech in Ophthalmic Engineering (Interdisciplinary)</h4>
       <table>
         <tr><td><strong>Essence</strong></td><td>Optics, imaging &amp; biomedical engineering for vision science applications</td></tr>
         <tr><td><strong>Reference</strong></td><td>Institute provisions in the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a></td></tr>
       </table>
       <p>(Department syllabus/brochure link can be added when released.)</p>`,
    curriculumquantumsemiconductorsmtech:
      `<ul>
         <li>Optics &amp; Photonics; Ophthalmic Instrumentation</li>
         <li>Medical Imaging; Image Processing &amp; Device Design</li>
         <li>Clinically aligned projects with partners</li>
       </ul>
       <p>Until the dedicated syllabus is published, follow the institute rules in the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook</a>.</p>`,
    researchareasfacilitiesquantumsemiconductorsmtech:
      `<p>Access to departmental photonics/biophotonics facilities and partner medical centers for translational work. Institute-level provisions: <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook</a>.</p>`,
    internshipquantumsemiconductorsmtech:
      `<p>Clinical/industry internships supported within program rules; crediting modalities per the <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Handbook</a>.</p>`,
    placementquantumsemiconductorsmtech:
      `<p>Careers in biomedical/ophthalmic device R&amp;D, imaging companies, hospital technology centers, or higher studies. A program-specific brochure can be linked here when available.</p>`
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
