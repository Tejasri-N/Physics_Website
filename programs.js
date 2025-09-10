document.addEventListener("DOMContentLoaded", () => {
  const programButtons = document.querySelectorAll(".program-btn");
  const detailsSection = document.getElementById("details-section");
  const contentSection = document.getElementById("content-section");

  // Normalize strings to keys (remove all non-alphanumerics)
  const keyify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

  // Program details with courses (logic unchanged; only labels updated earlier)
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

  // Course-specific details (logic unchanged)
  const courseDetails = {
    physics: ["About", "Curriculum", "Academic Options", "Internship", "Placement"],
    medicalphysics: ["About", "Curriculum", "Research Areas + Facilities", "Internship", "Placement"],
    quantumandsolidstatedevices: ["About", "Curriculum", "Academic Options", "Internship", "Placement"],
    ophthalmicengineering: ["About", "Curriculum", "Research Areas + Facilities", "Internship", "Placement"],
  };

  // ------------------ CONTENT ONLY (logic unchanged) ------------------
  const contentDetails = {
    /* =========================
       B.Tech in Engineering Physics
       ========================= */
    aboutbtech:
      `<h4>B.Tech in Engineering Physics</h4>
       <p>
         The B.Tech in Engineering Physics at IIT Hyderabad blends a deep, principle-first study of physics with the
         tools and practices of modern engineering. The program is designed for students who enjoy working at the
         interface of theory, experiment, and computation—where fundamental ideas are translated into technologies
         that power contemporary industry. Across eight semesters you will move from rigorous mathematical
         foundations to advanced laboratories, design projects, and research experiences that cultivate independent
         problem solving and scientific communication.
       </p>
       <p>
         What makes this program distinctive is its balance: you learn classical and quantum mechanics, electromagnetism,
         statistical physics, and solid-state physics <em>alongside</em> electronics, instrumentation, numerical methods,
         and data-driven modeling. You will practice experimental design and uncertainty analysis, build and test circuits
         and devices, simulate complex systems, and present your findings to technical and non-technical audiences.
         With flexible electives, you can explore condensed matter, photonics, quantum technologies, astrophysics, soft
         matter and biophysics, and computational physics. Many students engage in semester or summer research with faculty,
         national labs, or industry partners.
       </p>
       <ul>
         <li><strong>Graduate strengths:</strong> analytical reasoning, experimental rigor, programming/computation, and cross-disciplinary collaboration.</li>
         <li><strong>Career tracks:</strong> semiconductors, photonics, electronics, data/AI, financial analytics, scientific computing, and R&amp;D.</li>
         <li><strong>Further study:</strong> top M.Sc./M.Tech./Ph.D. programs in India and abroad.</li>
       </ul>
       <p>Institute-wide rules and degree templates are documented in the
         <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook (62nd Senate)</a>.
       </p>`,

    curriculumbtech:
      `<h4>Curriculum</h4>
       <p>
         The curriculum combines a rigorous physics core with engineering practice and a strong laboratory spine.
         Early semesters focus on mathematical methods, mechanics, waves and optics, introductory electronics, and
         programming. Middle semesters emphasize electromagnetism, quantum mechanics, statistical mechanics, solid-state
         physics, and advanced laboratories. Upper semesters offer domain-focused electives and project work that help
         you build depth in areas such as materials and devices, photonics and quantum technologies, computational physics,
         and astrophysics. A typical path is summarized below (refer to official documents for exact sequencing).
       </p>
       <table>
         <tr><td><strong>Core Physics</strong></td><td>Classical Mechanics, Electromagnetism, Quantum Mechanics, Statistical Physics, Solid State</td></tr>
         <tr><td><strong>Engineering &amp; Methods</strong></td><td>Electronics, Signals/Instrumentation, Numerical &amp; Computational Methods, Data Analysis</td></tr>
         <tr><td><strong>Laboratories</strong></td><td>Foundational Labs, Advanced Labs, Electronics/Instrumentation Labs, Project Labs</td></tr>
         <tr><td><strong>Electives</strong></td><td>Condensed Matter &amp; Materials, Photonics &amp; Quantum Tech, Astrophysics, Soft Matter/Biophysics, Simulation</td></tr>
       </table>
       <p>
         You will also complete communication and humanities courses that strengthen writing, design thinking, and ethical
         reasoning. Students may choose research projects, independent study, or industry-aligned electives to tailor
         their pathway. Credit requirements, evaluation, and progression are as per Senate rules.
       </p>
       <p><strong>Official documents and detailed syllabi:</strong></p>
       <ul>
         <li><a href="assets/Docs/EP_2024_onwards_06_2025.pdf" target="_blank" rel="noopener">Batch 2024 Onward</a></li>
         <li><a href="assets/Docs/EP22_onwards_senate_verified_web_version.pdf" target="_blank" rel="noopener">Batch 2022 Onward</a></li>
         <li><a href="assets/Docs/EP course content 2025.pdf" target="_blank" rel="noopener">EP Course Content 2025 (at a glance)</a></li>
       </ul>`,

    academicoptionsbtech:
      `<h4>Academic Options</h4>
       <p>
         The program supports <strong>Honors</strong>, <strong>Minors</strong>, and <strong>Double Major</strong>
         options as per Senate guidelines, allowing you to shape a profile for core industry, interdisciplinary research,
         or entrepreneurial pathways. You may register for <em>Independent Study</em>, credit-bearing projects, or
         cross-departmental electives that align with your interests. Refer to Sections 4–5 of the
         <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a>
         for policies on eligibility, credit load, and evaluation.
       </p>
        <p><strong>Official documents</strong></p>
       <ul>
         <li><a href="assets/Docs/EP_honors_minor_major.pdf" target="_blank" rel="noopener">Minor Programme, Double Major and Honors Curriculum.</a></li>
         <li><a href="assets/Docs/annexure_c.pdf" target="_blank" rel="noopener">Minor in Quantum Technology.</a></li>
       </ul>`,

    internshipbtech:
      `<h4>Internship</h4>
       <p>
         Students are encouraged to pursue summer or semester-long internships in research labs, national facilities,
         startups, and established companies. Internships help translate classroom knowledge into practice—through device
         fabrication and testing, data pipelines, simulations, or scientific software. Credit and evaluation follow
         institute policy as outlined in the
         <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a>.
       </p>`,

    placementbtech:
      `<h4>Placements</h4>
       <p>
         Graduates of Engineering Physics are valued for their quantitative mindset and flexibility. Alumni pursue roles
         in semiconductor and electronics design, photonics, quantum technology startups, analytics/AI, scientific
         computing, and finance/consulting. Many continue to M.Sc./M.Tech./Ph.D. worldwide. The curriculum-to-skills
         mapping in <a href="assets/Docs/EP course content 2025.pdf" target="_blank" rel="noopener">EP Course Content 2025</a>
         provides additional guidance.
       </p>`,

    researchareasfacilitiesbtech:
      `<h4>Research Areas &amp; Facilities</h4>
       <ul>
         <li>Condensed Matter &amp; Materials, Nanoscience</li>
         <li>Photonics &amp; Quantum Technologies</li>
         <li>High-Energy Physics &amp; Astrophysics</li>
         <li>Soft Matter &amp; Biophysics</li>
       </ul>
       <p>
         Students gain exposure to advanced laboratories and shared central facilities including SQUID magnetometer,
         X-ray diffraction, NMR/ESR, precision optics benches, and high-performance computing clusters.
         See topical lab syllabi in
         <a href="assets/Docs/EP course content 2025.pdf" target="_blank" rel="noopener">EP Course Content 2025</a>.
       </p>`,

    brochurebtech:
      `<h4>Brochure</h4>
       <p>
         Share the curriculum snapshots and institute-wide academic framework with prospective students and partners:
       </p>
       <ul>
         <li><a href="assets/Docs/Annex.8_BTech Eng Physics Curriculum & course approvals.pdf" target="_blank" rel="noopener">B.Tech Engineering Physics – Curriculum PDF</a></li>
         <li><a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook (62nd Senate)</a></li>
       </ul>`,

    /* =========================
       Ph.D. in Physics
       ========================= */
    aboutphd:
      `<h4>Ph.D. in Physics</h4>
       <p>
         The Ph.D. program is a full-time research degree leading to a dissertation that makes an original contribution
         to the field. Scholars undertake advanced coursework where required, clear comprehensive assessments, and
         develop a research portfolio through seminars, publications, and conference presentations. Doctoral training
         emphasizes independent problem formulation, methodological rigor, and responsible conduct of research.
       </p>
       <p>
         Admission, registration, credit and progression, thesis evaluation, and award of degree are governed by the
         institute regulations. Please consult the
         <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a>
         for detailed rules and milestones.
       </p>`,

    researchareasfacilitiesphd:
      `<h4>Research Areas &amp; Facilities</h4>
       <p>
         Research spans condensed matter and quantum materials, photonics and quantum technologies, high-energy physics
         and astrophysics, soft matter and biophysics, and computational/theoretical fronts that cut across these domains.
         Scholars have access to advanced departmental laboratories and central facilities, as well as opportunities for
         collaboration with national labs and international partners.
       </p>`,

    brochurephd:
      `<h4>Brochure</h4>
       <p>
         Prospective applicants should review the Ph.D. regulations, timelines, and evaluation framework outlined in the
         <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a>.
         Department-specific openings are announced in institute admission calls.
       </p>`,

    /* =========================
       M.Sc. in Physics
       ========================= */
    aboutphysicsmsc:
      `<h4>M.Sc. in Physics</h4>
       <p>
         The M.Sc. in Physics is a two-year program that develops strong conceptual mastery, experimental skill,
         and computational fluency. It is ideal for students aiming for doctoral studies or technical roles in
         research-led industries. You will engage with the pillars of physics—classical and quantum mechanics,
         electrodynamics, statistical mechanics, and solid-state—while learning the modern methods used to solve
         open-ended problems: numerical modeling, data analysis, and scientific communication.
       </p>
       <p>
         A hallmark of the program is its flexibility through elective baskets, seminars, and a dissertation/project
         under faculty supervision. You can specialize in areas such as nanoscience, photonics, quantum technologies,
         and materials, or create an interdisciplinary mix by selecting courses across departments. Throughout, the
         curriculum emphasizes connecting theory with measurement, designing reproducible analyses, and building
         software tools that scale with problem complexity.
       </p>
       <ul>
         <li><strong>Outcomes:</strong> Ph.D. admissions in India/abroad; roles in semiconductors, photonics, modeling/simulation, and scientific computing.</li>
         <li><strong>Strengths:</strong> conceptual rigor, lab experience, coding for physics, and clear technical writing.</li>
       </ul>`,

    curriculumphysicsmsc:
      `<h4>Curriculum</h4>
       <p>
         Year 1 establishes the theoretical core (Classical &amp; Quantum Mechanics, Electrodynamics, Statistical Physics)
         and methodological tools (Mathematical Methods, Computational Physics, and advanced laboratory). Year 2 deepens
         expertise through electives and a substantial project/dissertation. Typical electives include condensed matter,
         nanoscience, photonics/laser physics, quantum information elements, soft matter, and materials characterization.
         Scientific writing and seminars ensure students can communicate complex ideas with clarity.
       </p>
       <table>
         <tr><td><strong>Core</strong></td><td>Classical &amp; Quantum Mechanics, Electrodynamics, Statistical Physics, Solid State</td></tr>
         <tr><td><strong>Methods</strong></td><td>Mathematical &amp; Computational Physics, Advanced Labs, Seminars</td></tr>
         <tr><td><strong>Electives</strong></td><td>Nanoscience, Photonics, Quantum Tech, Materials, Soft Matter</td></tr>
         <tr><td><strong>Project</strong></td><td>Faculty-supervised dissertation or equivalent research project</td></tr>
       </table>
       <p>
         For the official semester-wise plan and detailed syllabi, see
         <a href="assets/Docs/MSc Course curriculum@2025.docx" target="_blank" rel="noopener">M.Sc Physics Curriculum 2025–26 (DOCX)</a>.
         Institute-wide rules on credits, grading, and progression are in the
         <a href="assets/Docs/Academic_Handbook_62nd_Senate.pdf" target="_blank" rel="noopener">Academic Handbook</a>.
       </p>`,

    academicoptionsphysicsmsc:
      `<h4>Academic Options</h4>
       <p>
         Students may pursue interdisciplinary electives, independent study, and a research dissertation under faculty guidance.
         Cross-department offerings allow customization for materials, devices, photonics, or computation-heavy pathways.
         Policies on credit limits and evaluation follow institute regulations in the Academic Handbook.
       </p>`,

    internshipphysicsmsc:
      `<h4>Internship</h4>
       <p>
         Summer research with faculty, national labs, or industry partners is encouraged. Internships refine experimental
         design, coding for analysis, and presentation skills. Crediting and evaluation are as per Senate rules in the
         Academic Handbook.
       </p>`,

    placementphysicsmsc:
      `<h4>Placements</h4>
       <p>
         Graduates continue to Ph.D. programs or join R&amp;D roles in semiconductor/fabrication, photonics,
         modeling/simulation, and data-intensive scientific computing. Alumni also contribute to education,
         analytics, and instrumentation roles requiring strong quantitative reasoning.
       </p>`,

    /* =========================
       M.Sc. in Medical Physics (Interdisciplinary)
       ========================= */
    aboutmedicalphysicsmsc:
      `<h4>M.Sc. in Medical Physics (Interdisciplinary)</h4>
       <p>
         Medical Physics applies the principles of physics to the diagnosis and treatment of disease. This program
         integrates nuclear and radiation physics, radiological mathematics, electrodynamics, quantum mechanics,
         and imaging/instrumentation with rigorous training in radiation protection and safety. Students learn the
         physics behind radiotherapy, diagnostic imaging modalities (such as X-ray/CT, nuclear medicine, ultrasound,
         MRI), dosimetry, and quality assurance. The program prepares graduates for clinical environments as well as
         research and development in medical technology.
       </p>
       <p>
         A clinical mindset is fostered through practical modules, simulation-based activities, and exposure to
         hospital workflows in collaboration with partner centers, where applicable. Ethical practice, documentation
         for regulatory compliance, and communication with multidisciplinary teams are emphasized. The degree is an
         excellent springboard for medical physicist roles, device industry positions, and doctoral research in
         medical/health physics.
       </p>
       <p><strong>Official document:</strong>
         <a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank" rel="noopener">
           M.Sc Medical Physics Course Content (PDF)
         </a>
       </p>`,

    curriculummedicalphysicsmsc:
      `<h4>Curriculum</h4>
       <p>
         The curriculum typically includes Nuclear &amp; Radiation Physics, Electrodynamics, Quantum Mechanics,
         Radiological Mathematics, and specialized modules such as Lasers &amp; Photonics in Medicine, Medical
         Imaging &amp; Instrumentation, and Computational Modeling of Biological Systems. Practical components focus
         on detectors, dosimetry protocols, imaging system characterization, QA procedures, and safety standards.
         Students complete seminars and a project/dissertation aligned with clinical or device-development problems.
       </p>
       <table>
         <tr><td><strong>Foundations</strong></td><td>Nuclear/Radiation Physics, Quantum Mechanics, Electrodynamics</td></tr>
         <tr><td><strong>Applied</strong></td><td>Radiological Math, Lasers &amp; Photonics in Medicine, Imaging &amp; Instrumentation</td></tr>
         <tr><td><strong>Practice</strong></td><td>Dosimetry, QA, Safety, Clinical Exposure/Practical Modules</td></tr>
         <tr><td><strong>Project</strong></td><td>Research or clinically oriented dissertation</td></tr>
       </table>
       <p>Full syllabus and scheduling:
         <a href="assets/Docs/MSc Medical physics course content 2025.pdf" target="_blank" rel="noopener">Medical Physics PDF</a>.
       </p>`,

    researchareasfacilitiesmedicalphysicsmsc:
      `<h4>Research Areas &amp; Facilities</h4>
       <p>
         Students engage with radiation detection and dosimetry, imaging technologies, and computational modeling for
         biological systems. Where applicable, collaborations with hospitals enable exposure to clinical equipment and
         QA routines. Departmental and central facilities support instrumentation, spectroscopy, and numerical simulation
         workflows that underpin modern medical physics practice.
       </p>`,

    internshipmedicalphysicsmsc:
      `<h4>Internship</h4>
       <p>
         The program encourages clinical postings at hospitals, rotations in radiotherapy/diagnostic departments,
         and research internships with labs or medical device companies. Internships are credited and evaluated as per
         Senate rules documented in the Academic Handbook, with a focus on professional practice, documentation, and
         patient-safety-oriented procedures.
       </p>`,

    placementmedicalphysicsmsc:
      `<h4>Placements</h4>
       <p>
         Graduates pursue roles as trainee medical physicists in hospitals and oncology centers, R&amp;D and application
         engineering in imaging and therapy device companies, regulatory/compliance roles, and doctoral studies in
         medical or health physics. The program’s combination of physics depth and clinical exposure enables smooth
         transitions into multi-disciplinary healthcare teams.
       </p>`,

    /* =========================
       M.Tech in Quantum & Solid State Devices (QSSD)
       ========================= */
    aboutquantumandsolidstatedevicesmtech:
      `<h4>M.Tech in Quantum &amp; Solid State Devices (QSSD)</h4>
       <p>
         QSSD is a specialized M.Tech program focused on quantum materials, semiconductor devices, nanoelectronics,
         and photonic/quantum devices. Students gain a working knowledge of device physics from fundamentals to
         fabrication and characterization, learn computational/analytical tools for transport and optical processes,
         and apply these to sensors, optoelectronics, and quantum-enabled components. The program suits those aiming
         at advanced device R&amp;D in industry or doctoral research at the intersection of physics, materials, and EE.
       </p>
       <p>
         The cohort engages with labs, simulation assignments, and a thesis project that may involve device design,
         process development, spectroscopy, or system-level integration. Emphasis is placed on connecting underlying
         physics to measurable performance metrics and manufacturability. Students also build complementary skills:
         experimental planning, data calibration and uncertainty, reproducible computation, and technical writing.
       </p>
       <p><strong>Official curriculum:</strong>
         <a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank" rel="noopener">
           M.Tech QSSD Course Contents 2025 (PDF)
         </a>
       </p>`,

    curriculumquantumandsolidstatedevicesmtech:
      `<h4>Curriculum</h4>
       <p>
         Core courses typically include Quantum Physics for Engineers, Solid-State Devices, Quantum Optical Devices,
         and Mathematical/Computational Methods for Quantum Devices, complemented by laboratory modules (QSD Labs).
         Electives allow focus on device fabrication and characterization, spintronics, optoelectronic devices,
         quantum sensing and transport, and advanced materials. A two-semester thesis develops depth and independence.
       </p>
       <table>
         <tr><td><strong>Core</strong></td><td>Quantum Physics for Engineers, Solid-State Devices, Quantum Optical Devices</td></tr>
         <tr><td><strong>Methods</strong></td><td>Mathematical/Computational Methods for Quantum Devices, QSD Labs</td></tr>
         <tr><td><strong>Electives</strong></td><td>Fabrication &amp; Characterization, Spintronics, Optoelectronics, Quantum Sensing/Transport</td></tr>
         <tr><td><strong>Thesis</strong></td><td>Two-semester research with faculty/industry collaboration</td></tr>
       </table>
       <p>
         Detailed course lists, credit structures, and evaluation policies are provided in the official document:
         <a href="assets/Docs/M. Tech QSSD_Final_Course_Contents 2025.pdf" target="_blank" rel="noopener">QSSD PDF</a>.
       </p>`,

    academicoptionsquantumandsolidstatedevicesmtech:
      `<h4>Academic Options</h4>
       <p>
         Students can tailor a focus (e.g., fabrication-heavy, photonics/optoelectronics, quantum transport/sensing)
         via elective baskets and the thesis project. Interdisciplinary selection across Physics, Materials, and EE is
         encouraged. Institute policies on credit limits, thesis registration, and evaluations apply.
       </p>`,

    internshipquantumandsolidstatedevicesmtech:
      `<h4>Internship</h4>
       <p>
         Internships with semiconductor fabs, photonics companies, or research institutes help convert theoretical
         understanding into device/process know-how. Internships are supported per Senate rules and may feed into the
         thesis, subject to advisor approval and evaluation guidelines.
       </p>`,

    placementquantumandsolidstatedevicesmtech:
      `<h4>Placements</h4>
       <p>
         Graduates are well prepared for roles in semiconductor process/device R&amp;D, optoelectronics and photonics,
         quantum technology startups, and doctoral programs. The program’s combination of physics-driven insight and
         engineering practice is valued across advanced manufacturing and deep-tech ecosystems.
       </p>`,

    /* =========================
       M.Tech in Ophthalmic Engineering (Interdisciplinary)
       ========================= */
    aboutophthalmicengineeringmtech:
      `<h4>M.Tech in Ophthalmic Engineering (Interdisciplinary)</h4>
       <p>
         Ophthalmic Engineering integrates optics, imaging, and biomedical engineering to address challenges in vision
         science and eye-care technology. The program develops capability to design and characterize ophthalmic
         instrumentation, apply image formation and processing techniques, and translate optical/photonic principles
         into clinically meaningful measurements. Students learn to collaborate with clinicians and device engineers,
         balancing system performance with usability, safety, and regulatory considerations.
       </p>`,

    curriculumophthalmicengineeringmtech:
      `<h4>Curriculum</h4>
       <p>
         Typical coverage includes optics and photonics for biomedical systems, ophthalmic instrumentation, medical
         imaging and image processing, and device design with clinical project components. Students engage in hands-on
         labs and team-based problem-solving tied to real clinical use cases, culminating in a research or design thesis.
         Institute rules on credits, electives, and evaluation apply as per the Academic Handbook.
       </p>`,

    researchareasfacilitiesophthalmicengineeringmtech:
      `<h4>Research Areas &amp; Facilities</h4>
       <p>
         Students access departmental photonics/biophotonics laboratories, imaging systems, and computational resources,
         with opportunities for collaboration with partner medical centers. Emphasis is on translational optics and
         imaging—prototyping, validation, QA, and data-driven performance assessment.
       </p>`,

    internshipophthalmicengineeringmtech:
      `<h4>Internship</h4>
       <p>
         Clinical and industry internships are encouraged, enabling exposure to device development pipelines and clinical
         integration. Internships are subject to institute norms regarding credit and evaluation; experiences may inform
         thesis directions.
       </p>`,

    placementophthalmicengineeringmtech:
      `<h4>Placements</h4>
       <p>
         Career paths include biomedical/ophthalmic device R&amp;D, medical imaging companies, hospital technology
         groups, and further research (Ph.D.). Graduates combine optics and imaging fundamentals with an understanding
         of clinical contexts—an attractive profile for translational roles.
       </p>`,
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
