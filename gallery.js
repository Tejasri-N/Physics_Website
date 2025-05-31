document.addEventListener("DOMContentLoaded", function () {
  // ... (existing code)

  // Store the currently filtered gallery items for modal navigation
  let filteredGalleryItems = [];
  let currentIndex = -1;
  let currentCategory = "all";

  // Update filteredGalleryItems whenever category changes
  function updateFilteredGalleryItems() {
    const allGalleryItems = Array.from(
      document.querySelectorAll(".gallery-item")
    );
    if (currentCategory === "all") {
      filteredGalleryItems = allGalleryItems;
    } else {
      filteredGalleryItems = allGalleryItems.filter((item) =>
        item.getAttribute("data-category").split(" ").includes(currentCategory)
      );
    }
  }

  // Category filtering logic
  const categoryItems = document.querySelectorAll(".category-item");
  categoryItems.forEach((item) => {
    item.addEventListener("click", function () {
      categoryItems.forEach((ci) => ci.classList.remove("active"));
      this.classList.add("active");
      currentCategory = this.getAttribute("data-category");
      const allGalleryItems = document.querySelectorAll(".gallery-item");
      allGalleryItems.forEach((galleryItem) => {
        const itemCategories = galleryItem
          .getAttribute("data-category")
          .split(" ");
        if (
          currentCategory === "all" ||
          itemCategories.includes(currentCategory)
        ) {
          galleryItem.style.display = "";
        } else {
          galleryItem.style.display = "none";
        }
      });
      updateFilteredGalleryItems();
    });
  });

  // Initial update for filtered items
  updateFilteredGalleryItems();

  // Modal logic
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  const modalVideo = document.getElementById("modal-video");
  const captionText = document.getElementById("caption");
  const closeBtn = document.getElementById("close");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");

  // Open modal on gallery item click
  function getAllMediaElements() {
    // Only visible items in filteredGalleryItems
    return filteredGalleryItems.map((item) => item.querySelector("img, video"));
  }

  document.querySelectorAll(".gallery-item").forEach((item) => {
    item.querySelector("img, video").addEventListener("click", function (e) {
      e.stopPropagation();
      updateFilteredGalleryItems();
      const mediaElements = getAllMediaElements();
      currentIndex = mediaElements.indexOf(this);
      openModal(this);
    });
  });

  function openModal(item) {
    modal.style.display = "flex";
    if (item.tagName === "IMG") {
      modalImg.src = item.src;
      modalImg.style.display = "block";
      modalVideo.style.display = "none";
    } else if (item.tagName === "VIDEO") {
      modalVideo.src =
        item.currentSrc ||
        item.src ||
        (item.querySelector("source") ? item.querySelector("source").src : "");
      modalVideo.style.display = "block";
      modalImg.style.display = "none";
      modalVideo.play();
    }
    // Set description
    const parentItem = item.closest(".gallery-item");
    const descriptionDiv = parentItem.querySelector(".description");
    captionText.textContent = descriptionDiv ? descriptionDiv.textContent : "";
    captionText.style.display = captionText.textContent ? "block" : "none";
  }

  closeBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    closeModal();
  });

  prevBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    showPrev();
  });
  nextBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    showNext();
  });

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  function closeModal() {
    modal.style.display = "none";
    modalImg.src = "";
    modalVideo.pause();
    modalVideo.src = "";
    currentIndex = -1;
    captionText.textContent = "";
    captionText.style.display = "none";
  }

  function showPrev() {
    const mediaElements = getAllMediaElements();
    if (currentIndex > 0) {
      resetModalVideo();
      currentIndex--;
      openModal(mediaElements[currentIndex]);
    }
  }
  function showNext() {
    const mediaElements = getAllMediaElements();
    if (currentIndex < mediaElements.length - 1) {
      resetModalVideo();
      currentIndex++;
      openModal(mediaElements[currentIndex]);
    }
  }
  function resetModalVideo() {
    if (modalVideo) {
      modalVideo.pause();
      modalVideo.src = "";
    }
  }
  document.addEventListener("keydown", function (e) {
    if (modal.style.display === "flex") {
      if (e.key === "Escape") {
        closeModal();
      }
      if (e.key === "ArrowLeft") {
        showPrev();
      }
      if (e.key === "ArrowRight") {
        showNext();
      }
    }
  });

  // On initial load, update filteredGalleryItems
  updateFilteredGalleryItems();
});
