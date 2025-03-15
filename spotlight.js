// -------------------------- Spotlight carousel --------------------------
let spotlightSlideIndex = 1;

// Next/previous controls
function spotlightPlusSlides(n) {
  showSpotlightSlides((spotlightSlideIndex += n));
}

// Thumbnail image controls
function spotlightCurrentSlide(n) {
  showSpotlightSlides((spotlightSlideIndex = n));
}

function showSpotlightSlides(n) {
  let i;
  let spotlightSlides = document.getElementsByClassName(
    "spotlight-carousel-item"
  );
  let spotlightDots = document.getElementsByClassName("spotlight-dot");
  if (n > spotlightSlides.length) {
    spotlightSlideIndex = 1;
  }
  if (n < 1) {
    spotlightSlideIndex = spotlightSlides.length;
  }
  for (i = 0; i < spotlightSlides.length; i++) {
    spotlightSlides[i].className = spotlightSlides[i].className.replace(
      " active",
      ""
    );
  }
  for (i = 0; i < spotlightDots.length; i++) {
    spotlightDots[i].className = spotlightDots[i].className.replace(
      " active",
      ""
    );
  }
  spotlightSlides[spotlightSlideIndex - 1].className += " active";
  spotlightDots[spotlightSlideIndex - 1].className += " active";
}

function spotlightPrevSlide() {
  spotlightPlusSlides(-1);
}

function spotlightNextSlide() {
  spotlightPlusSlides(1);
}

// Automatic slideshow
setInterval(function () {
  spotlightPlusSlides(1);
}, 3000); // Change image every 3 seconds

showSpotlightSlides(spotlightSlideIndex);
