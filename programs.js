document.addEventListener("DOMContentLoaded", () => {
  const programButtons = document.querySelectorAll(".program-btn");
  const detailsSection = document.getElementById("details-section");
  const contentSection = document.getElementById("content-section");

  // 🔧 Normalize strings to keys
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
    // ------------------ B.Tech ------------------
    aboutbtech:
      "<p>The B.Tech in Engineering Physics at IIT Hyderabad is designed to build a strong foundation in physics while connecting it with real-world engineering and technology applications. The program blends theory, experiments, and computational methods to nurture analytical thinking, innovation, and problem-solving skills.</p>",
    curriculumbtech:
      "<p>The B.Tech curriculum balances fundamental physics, mathematics, and engineering courses with electives and project-based learning. Core areas include mechanics, electromagnetism, quantum physics, materials science, and electronics. A strong laboratory component and computational training ensure holistic development.</p>",
    academicoptionsbtech:
      "<p>Students can tailor their learning with flexible academic options. These include minors in interdisciplinary fields, a variety of electives in advanced physics, and honors/double major choices. Such opportunities allow students to pursue higher studies, research, or careers in technology-driven industries.</p>",
    internshipbtech:
      "<p>Internships offer valuable exposure to research laboratories, industries, and startups. Students often work at IITs, IISc, national research institutes, and companies, gaining practical skills and collaborative research experience. This prepares them for academic and professional challenges ahead.</p>",
    placementbtech:
      "<p>B.Tech graduates from the department are well-placed in industries such as semiconductors, data science, finance, R&D, and consulting. Many alumni pursue higher education in India and abroad. The institute’s Career Services Office and faculty mentorship provide strong support for placements.</p>",
    researchareasfacilitiesbtech:
      "<p>Students have access to advanced laboratories and facilities. Key research areas include condensed matter physics, nanotechnology, photonics, quantum technologies, astrophysics, and biophysics. Facilities such as SQUID magnetometers, XRD systems, NMR/ESR spectrometers, and computational clusters support training and research.</p>",
    brochurebtech:
      "<p>The B.Tech brochure highlights the program structure, facilities, faculty expertise, and career opportunities. It provides prospective students and recruiters with an overview of the unique strengths of the department and its academic culture.</p>",

    // ------------------ Ph.D. ------------------
    aboutphd:
      "<p>The Ph.D. program in Physics at IIT Hyderabad is a research-intensive program aimed at preparing students for advanced scientific research and academic careers. Students work closely with faculty on cutting-edge problems in both theoretical and experimental physics.</p>",
    researchareasfacilitiesphd:
      "<p>Research spans condensed matter physics, nanoscience, photonics, quantum technologies, high-energy physics, astrophysics, and soft matter. Scholars benefit from world-class facilities, advanced laboratories, and interdisciplinary collaborations across IIT Hyderabad and partner institutes.</p>",
    brochurephd:
      "<p>The Ph.D. brochure details admission guidelines, faculty research areas, laboratory facilities, and career outcomes. It provides applicants with information on research opportunities, coursework requirements, and the vibrant research culture at IIT Hyderabad.</p>",

    // ------------------ M.Sc. Physics ------------------
    aboutphysicsmsc:
      "<p>The M.Sc. in Physics is a two-year postgraduate program offering advanced training in both core and applied areas of physics. It equips students with strong analytical skills, research exposure, and a solid foundation for doctoral studies or industry roles.</p>",
    curriculumphysicsmsc:
      "<p>The curriculum covers classical mechanics, quantum mechanics, electrodynamics, statistical physics, condensed matter, and nuclear & particle physics. Electives in areas such as nanoscience, photonics, and quantum technologies allow students to pursue their interests. Labs and seminars strengthen practical learning.</p>",
    academicoptionsphysicsmsc:
      "<p>M.Sc. students can explore electives, interdisciplinary courses, and dissertation projects under faculty mentorship. The program provides opportunities for research publications and builds pathways toward Ph.D. programs or specialized industry careers.</p>",
    internshipphysicsmsc:
      "<p>Internships at research labs, industries, and universities provide hands-on experience in physics applications. Summer internships often expose students to cutting-edge experiments, simulations, and collaborative projects, bridging classroom learning with real-world science.</p>",
    placementphysicsmsc:
      "<p>M.Sc. graduates pursue Ph.D. positions in India and abroad, or careers in industries such as semiconductors, technology, analytics, and consulting. The program develops a strong foundation for research and professional growth.</p>",

    // ------------------ M.Sc. Quantum Semiconductors ------------------
    aboutquantumsemiconductorsmsc:
      "<p>The M.Sc. specialization in Quantum Semiconductors focuses on the physics and applications of semiconductor materials and devices at the nanoscale. It blends quantum physics with materials engineering to prepare students for high-tech careers.</p>",
    curriculumquantumsemiconductorsmsc:
      "<p>The curriculum includes quantum mechanics, semiconductor device physics, optoelectronics, nanomaterials, and fabrication techniques. Laboratory modules emphasize semiconductor characterization, nanodevice design, and computational simulations.</p>",
    researchareasfacilitiesquantumsemiconductorsmsc:
      "<p>Research facilities include advanced spectroscopy, nanofabrication labs, cleanroom facilities, and computational clusters. Focus areas are quantum dots, 2D materials, photonic devices, and nanoelectronics.</p>",
    internshipquantumsemiconductorsmsc:
      "<p>Students undertake internships in semiconductor industries, R&D labs, and academic research centers. These experiences provide exposure to fabrication processes, quantum materials, and device innovation.</p>",
    placementquantumsemiconductorsmsc:
      "<p>Graduates can pursue doctoral studies or careers in semiconductor industries, nanotechnology startups, photonics companies, and research institutes working in advanced materials and devices.</p>",

    // ------------------ M.Tech. Physics ------------------
    aboutphysicsmtech:
      "<p>The M.Tech in Physics provides specialized training for engineers and physicists interested in applied physics and emerging technologies. It bridges fundamental science with real-world applications.</p>",
    curriculumphysicsmtech:
      "<p>The program includes advanced courses in quantum mechanics, condensed matter physics, nanotechnology, photonics, and computational physics. A strong emphasis is placed on project work and applied research.</p>",
    academicoptionsphysicsmtech:
      "<p>M.Tech students can opt for electives across disciplines and pursue research-oriented projects. Collaboration with other departments and industry projects are encouraged to broaden career options.</p>",
    internshipphysicsmtech:
      "<p>Internships in industries, R&D labs, and research centers provide exposure to applied physics problems and technology development. These internships strengthen the link between academic learning and industrial needs.</p>",
    placementphysicsmtech:
      "<p>M.Tech graduates are placed in semiconductor industries, photonics companies, R&D organizations, and also pursue doctoral programs worldwide. The program provides excellent opportunities for careers in both research and industry.</p>",

    // ------------------ M.Tech. Quantum Semiconductors ------------------
    aboutquantumsemiconductorsmtech:
      "<p>The M.Tech in Quantum Semiconductors is designed for students aiming to specialize in semiconductor technology, quantum devices, and nanomaterials. It prepares graduates for advanced R&D and high-technology sectors.</p>",
    curriculumquantumsemiconductorsmtech:
      "<p>The curriculum covers advanced quantum mechanics, semiconductor device physics, optoelectronics, nanofabrication, and device modeling. Students gain expertise in simulation, fabrication, and testing of semiconductor devices.</p>",
    researchareasfacilitiesquantumsemiconductorsmtech:
      "<p>Research areas include quantum dots, spintronics, 2D materials, optoelectronics, and nanoscale devices. Facilities such as cleanrooms, advanced characterization labs, and computational tools support cutting-edge projects.</p>",
    internshipquantumsemiconductorsmtech:
      "<p>Internships are encouraged with semiconductor industries, chip-design companies, and national/international labs. They provide industry-ready experience in device fabrication and quantum semiconductor research.</p>",
    placementquantumsemiconductorsmtech:
      "<p>Graduates find opportunities in semiconductor companies, nanotechnology startups, electronics R&D, and doctoral programs. The program builds strong links to both academia and industry.</p>",
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
