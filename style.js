


//* Loop through all dropdown buttons to toggle between hiding and showing its dropdown content - This allows the user to have multiple dropdowns without any conflict */
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("drop_down-btn")) {
    event.target.classList.toggle("active");
    var drop_downContent = event.target.nextElementSibling;
    if (drop_downContent.style.display === "block") {
      drop_downContent.style.display = "none";
    } else {
      drop_downContent.style.display = "block";
    }
  }
});



document.addEventListener("DOMContentLoaded", function () {
  let slideIndex = 0;
  const slides = document.querySelectorAll(".mySlides1");
  const totalSlides = slides.length;
  let slideInterval;

  function showSlides() {
    slides.forEach(slide => {
      slide.style.display = "none";
    });
    slides[slideIndex].style.display = "block";
  }

  function nextSlide() {
    slideIndex = (slideIndex + 1) % totalSlides;
    showSlides();
  }

  function prevSlide() {
    slideIndex = (slideIndex - 1 + totalSlides) % totalSlides;
    showSlides();
  }

  function startSlideshow() {
    slideInterval = setInterval(nextSlide, 7000);
  }

  function stopSlideshow() {
    clearInterval(slideInterval);
  }

  document.querySelector(".prev").addEventListener("click", prevSlide);
  document.querySelector(".next").addEventListener("click", nextSlide);

  const slideshowContainer = document.querySelector(".slideshow-container");

  // Stop the slideshow when hovering
  slideshowContainer.addEventListener("mouseenter", stopSlideshow);
  slideshowContainer.addEventListener("mouseleave", startSlideshow);

  showSlides(); // Initial display
  startSlideshow(); // Start automatic sliding
});







