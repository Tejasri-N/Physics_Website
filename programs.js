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
    aboutbtech:
      "<p>The B.Tech in Engineering Physics at IIT Hyderabad provides students with a solid foundation in physics, coupled with applications in modern science and technology. The program integrates theoretical knowledge, laboratory training, and interdisciplinary exposure to prepare graduates for careers in research, industry, and entrepreneurship.</p>",
    curriculumbtech:
      "<p>The curriculum is designed to balance core physics courses, mathematics, and engineering subjects with electives and project-based learning. Students explore areas such as classical and quantum mechanics, electromagnetism, materials science, electronics, and computational methods. Alongside classroom instruction, significant emphasis is placed on laboratory work, hands-on experimentation, and research-driven projects, ensuring a holistic learning experience.</p>",
    academicoptionsbtech:
      "<p>The program offers flexible academic pathways to suit students’ diverse interests. Options include:\n\nMinors in interdisciplinary areas (engineering, sciences, or humanities).\n\nElectives that allow specialization in cutting-edge fields of physics.\n\nHonors and double major options, enabling motivated students to broaden their academic portfolio.\nThese choices empower students to customize their education to align with career goals in research, higher studies, or industry..</p>",
    internshipbtech:
      "<p>Internships form an integral part of the B.Tech journey, giving students real-world exposure to research labs, industrial settings, and technology-driven companies. The department actively facilitates internship opportunities in national research institutes, IITs/IISc, and reputed industries. Students gain practical skills, industry orientation, and collaborative research experience that complement their academic learning.</p>",
    placementbtech:
      "<p>Graduates of the program are highly sought after by industries ranging from technology, semiconductor and materials science, data science, finance, and consulting to research organizations and academia. The department’s strong network with recruiters, combined with IIT Hyderabad’s dedicated Career Services Office, ensures excellent placement support. Alumni have successfully pursued careers in core industries, R&D, startups, and higher education worldwide.</p>",
    researchareasfacilitiesbtech:
      "<p>Students benefit from access to state-of-the-art laboratories and advanced research facilities. Major focus areas include:\n\nCondensed Matter Physics & Materials Science\n\nNanoscience & Nanotechnology\n\nPhotonics & Quantum Technologies\n\nHigh-Energy and Astrophysics\n\nSoft Matter & Biophysics\n\nDedicated facilities such as the SQUID magnetometer, XRD systems, NMR/ESR setups, and advanced computational clusters provide invaluable hands-on training and research opportunities.</p>",
    brochurebtech:
      "<p>The B.Tech Program Brochure offers a comprehensive overview of the course structure, research opportunities, facilities, faculty expertise, and career prospects. It serves as a quick reference for prospective students, parents, and recruiters to understand the unique features and strengths of the program.</p>",

    // Ph.D.
    aboutphd: "<p>This is the About section for Ph.D.</p>",
    researchareasfacilitiesphd:
      "<p>This is the Research Areas + Facilities section for Ph.D.</p>",
    brochurephd: "<p>This is the Brochure section for Ph.D.</p>",

    // M.Sc. Physics
    aboutphysicsmsc:
      "<p>The M.Sc. in Physics at IIT Hyderabad is a rigorous two-year postgraduate program that provides advanced training in core and applied areas of physics. The program is designed to build strong analytical skills, experimental expertise, and research aptitude, preparing students for both academic and industry careers.</p>",
    curriculumphysicsmsc:
      "<p>The curriculum covers a wide spectrum of topics including classical mechanics, quantum mechanics, statistical mechanics, electrodynamics, condensed matter physics, nuclear & particle physics, and computational physics. In addition, elective courses allow students to specialize in emerging areas such as nanoscience, photonics, materials science, and quantum technologies. The program combines classroom teaching with laboratory training, computational projects, and seminars.</p>",
    academicoptionsphysicsmsc:
      "<p>Students have the flexibility to pursue electives and project work in specialized domains of physics. The department encourages interdisciplinary learning through courses offered by other departments such as materials science, electrical engineering, and computational sciences. M.Sc. students also have opportunities to undertake dissertation projects under faculty guidance, often leading to publications or pathways to Ph.D. research.</p>",
    internshipphysicsmsc:
      "<p>The program facilitates internships in national research laboratories, industries, and international universities, giving students real-world exposure to research and applied science. Internships typically occur during summer breaks and provide opportunities for hands-on research, technical training, and industry collaboration, adding significant value to academic learning.</p>",
    placementphysicsmsc:
      "<p>M.Sc. graduates from IIT Hyderabad have excellent career prospects. Many pursue Ph.D. programs in premier institutes in India and abroad, while others find opportunities in R&D labs, technology companies, semiconductor industries, data science, finance, and consulting sectors. The institute’s Career Services Office, along with strong faculty recommendations, ensures robust placement and higher studies support.</p>",

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
    internshipphysicsmtech: "<p>Physics Internship Opportunities in M.Tech.</p>",
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
        const courseKey = keyify(course); // FIX
        html += `<button class="course-btn btn" data-course="${courseKey}">${course}</button>`;
      });
      detailsSection.innerHTML = html;
      attachCourseListeners(program);
    } else {
      // Show direct details for B.Tech, Ph.D.
      programDetails[program].forEach((detail) => {
        const detailKey = keyify(detail) + program; // FIX
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
      const detailKey = keyify(detail) + course + program; // FIX
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
