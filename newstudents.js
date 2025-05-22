// Subcourses structure
const courses = {
    'btech': {
        subcourses: {
            'engineering-physics': 'Engineering Physics'
        }
    },
    'msc': { 
        subcourses: {
            'physics': 'Physics',
            'medical-physics': 'Medical Physics'
        }
    },
    'mtech': {
        subcourses: {
            'quantum': 'Quantum Engineering',
            'semiconductor': 'Semiconductor Technology'
        }
    },
    'phd': {
        subcourses: {
            'research': 'Research',
            'jrf': 'JRF',
            'srf': 'SRF'
        }
    }
};

document.querySelectorAll('.course-pill').forEach(pill => {
    pill.addEventListener('click', function() {
        showSubcourses(this.dataset.course, this);
    });
});

function showSubcourses(course, element) {
    document.querySelectorAll('.course-pill').forEach(p => p.classList.remove('active'));
    element.classList.add('active');
    
    const subnav = document.getElementById('subcourseNav');
    subnav.innerHTML = '';
    
    if(courses[course].subcourses) {
        subnav.classList.remove('hidden');
        Object.entries(courses[course].subcourses).forEach(([key, name]) => {
            const subPill = document.createElement('div');
            subPill.className = 'subcourse-pill';
            subPill.textContent = name;
            subPill.dataset.subcourse = key;
            subPill.addEventListener('click', function() {
                document.querySelectorAll('.subcourse-pill').forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                showYears(course, key);
            });
            subnav.appendChild(subPill);
        });
    } else {
        subnav.classList.add('hidden');
        showYears(course, null);
    }
    // Hide years and table initially
    document.getElementById('yearScrollWrapper').style.display = 'none';
    document.getElementById('tableContainer').classList.add('hidden');
}

function showYears(course, subcourse = null) {
    const years = [...new Set(
        Array.from(document.querySelectorAll(`#studentData > div[data-course="${course}"]${subcourse ? `[data-subcourse="${subcourse}"]` : ':not([data-subcourse])'}`))
            .map(el => el.dataset.year)
    )].sort((a,b) => b - a);

    const container = document.getElementById('yearContainer');
    container.innerHTML = '';
    years.forEach(year => {
        const yearPill = document.createElement('div');
        yearPill.className = 'year-pill';
        yearPill.textContent = year;
        yearPill.addEventListener('click', () => showStudents(course, subcourse, year));
        container.appendChild(yearPill);
    });

    // Show the year scroll wrapper if years exist, else hide
    const wrapper = document.getElementById('yearScrollWrapper');
    if (years.length > 0) {
        wrapper.style.display = 'flex';
        setTimeout(() => {
            updateArrowFade();
        }, 10);
    } else {
        wrapper.style.display = 'none';
    }

    document.getElementById('tableContainer').classList.add('hidden');
}

function showStudents(course, subcourse, year) {
    const container = document.getElementById('yearContainer');
    document.querySelectorAll('.year-pill').forEach(b => {
        if (b.textContent === year) b.classList.add('active');
        else b.classList.remove('active');
    });
    setTimeout(centerActiveYear, 10);

    setActiveCourse(document.querySelector(`.course-pill[data-course="${course}"]`));
    if (subcourse) {
        const subcoursePill = document.querySelector(`.subcourse-pill[data-subcourse="${subcourse}"]`);
        if (subcoursePill) {
            document.querySelectorAll('.subcourse-pill').forEach(p => p.classList.remove('active'));
            subcoursePill.classList.add('active');
        }
    }

    const tableContainer = document.getElementById('tableContainer');
    const tableBody = document.getElementById('tableBody');
    const tableCaption = document.getElementById('tableCaption');
    tableBody.innerHTML = '';
    const courseName = document.querySelector(`.course-pill[data-course="${course}"]`).textContent;
    const subcourseName = subcourse ? courses[course].subcourses[subcourse] : '';
    tableCaption.textContent = `${courseName}${subcourseName ? ` - ${subcourseName}` : ''} - ${year} Students`;
    const group = document.querySelector(`#studentData > div[data-course="${course}"]${subcourse ? `[data-subcourse="${subcourse}"]` : ':not([data-subcourse])'}[data-year="${year}"]`);
    if (!group) {
        tableContainer.classList.add('hidden');
        return;
    }
    const students = Array.from(group.children);
    students.forEach((studentDiv, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${idx + 1}</td>
            <td>${studentDiv.getAttribute('data-name')}</td>
            <td>${studentDiv.getAttribute('data-enroll')}</td>
        `;
        tableBody.appendChild(row);
    });
    tableContainer.classList.remove('hidden');
    updateArrowFade();
}

function setActiveCourse(courseDiv) {
    document.querySelectorAll('.course-pill').forEach(b => b.classList.remove('active'));
    if (courseDiv) courseDiv.classList.add('active');
}

// Center the active year pill in the scroll container
function centerActiveYear() {
    const container = document.getElementById('yearContainer');
    const activeYear = container.querySelector('.year-pill.active');
    if (!activeYear) return;
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeYear.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const offset = activeRect.left - containerRect.left;
    const scrollTo = scrollLeft + offset - (containerRect.width / 2) + (activeRect.width / 2);
    container.scrollTo({ left: scrollTo, behavior: 'smooth' });
}

// Scroll years row
function scrollYears(direction) {
    const container = document.getElementById('yearContainer');
    const pill = container.querySelector('.year-pill');
    if (!pill) return;
    const pillWidth = pill.offsetWidth + 8; // 8px gap
    container.scrollBy({
        left: direction * pillWidth * 2.5,
        behavior: 'smooth'
    });
    setTimeout(updateArrowFade, 400);
}

// Fade arrows if not scrollable
function updateArrowFade() {
    const container = document.getElementById('yearContainer');
    const leftArrow = document.getElementById('yearLeftArrow');
    const rightArrow = document.getElementById('yearRightArrow');
    if (!container || !leftArrow || !rightArrow) return;
    const scrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    if (scrollLeft <= 0) {
        leftArrow.style.opacity = '0.3';
    } else {
        leftArrow.style.opacity = '1';
    }
    if (scrollLeft >= maxScrollLeft - 1) {
        rightArrow.style.opacity = '0.3';
    } else {
        rightArrow.style.opacity = '1';
    }
}

// Update fade on scroll and window resize
document.getElementById('yearContainer').addEventListener('scroll', updateArrowFade);
window.addEventListener('resize', updateArrowFade);

// On load, hide years and table
document.getElementById('yearScrollWrapper').style.display = 'none';
document.getElementById('tableContainer').classList.add('hidden');

// Navigation Active State for Sidebar
document.querySelectorAll('.nav-menu a').forEach(link => {
  link.addEventListener('click', function(e) {
    // Remove this e.preventDefault(); for actual navigation
    document.querySelectorAll('.nav-menu a').forEach(a =>
      a.classList.remove('active'));
    this.classList.add('active');
  });
});
