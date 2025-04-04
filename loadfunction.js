function loadHeader() {
    fetch("header.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("header-placeholder").innerHTML = data;
    })
    .catch(error => console.error("Error loading header:", error));
  }
  
  
  
  function loadFooter() {
    fetch("footer.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("footer-placeholder").innerHTML = data;
    })
    .catch(error => console.error("Error loading header:", error));
  }
  
  
  
  function loadNav() {
    fetch("nav.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("nav-placeholder").innerHTML = data;
    })
    .catch(error => console.error("Error loading header:", error));
  }


  function loadStaff() {
    fetch("staff.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("staff-placeholder").innerHTML = data;
    })
    .catch(error => console.error("Error loading header:", error));
  }

  function loadFaculty() {
    fetch("faculty.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("faculty-placeholder").innerHTML = data;
    })
    .catch(error => console.error("Error loading header:", error));
  }
  
  
  
  
  // Load the header when the page loads
  window.onload = function() {
    loadHeader();
    loadFooter();
    loadNav();
    loadstaff();
    loadFaculty();
    initializeDropdowns();
  };
  
  