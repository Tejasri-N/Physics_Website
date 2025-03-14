// Modal functionality for images and videos
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById("modal");
    const modalImg = document.getElementById("modal-img");
    const modalVideo = document.getElementById("modal-video");
    const captionText = document.getElementById("caption");
    const closeBtn = document.getElementById("close");
    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");

    // Get all gallery items (images and videos)
    const galleryItems = document.querySelectorAll('.gallery-item img, .gallery-item video');
    let currentIndex = -1; // Initialize current index to -1 to indicate no item is open

    // Open modal on item click
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', function () {
            currentIndex = index; // Set current index
            openModal(item);
        });
    });

    // Open modal and display content (image or video)
    function openModal(item) {
        modal.style.display = "flex"; // Show modal

        if (item.tagName === "IMG") {
            modalImg.src = item.src;
            modalImg.style.display = "block";
            modalVideo.style.display = "none";
        } else if (item.tagName === "VIDEO") {
            modalVideo.src = item.querySelector('source').src;
            modalVideo.style.display = "block";
            modalImg.style.display = "none";
            modalVideo.play(); // Play video only when modal opens
        }

        // Retrieve description text from the parent `.gallery-item` div
        const parentItem = item.closest('.gallery-item');
        const descriptionDiv = parentItem.querySelector('.description');
        captionText.textContent = descriptionDiv ? descriptionDiv.textContent : "No description available"; 
        captionText.style.display = captionText.textContent ? "block" : "none"; // Hide caption if no text
    }

    // Close modal when clicking the close button
    closeBtn.addEventListener('click', function () {
        closeModal();
    });

    // Close modal when clicking outside content
    modal.addEventListener('click', function (event) {
        if (event.target !== modalImg && event.target !== modalVideo && event.target !== prevBtn && event.target !== nextBtn) {
            closeModal();
        }
    });

    // Close modal function
    function closeModal() {
        modal.style.display = "none"; // Hide the modal
        modalImg.src = ""; // Clear image source
        modalVideo.pause(); // Pause the video playback
        modalVideo.src = ""; // Clear video source to stop playback completely
        currentIndex = -1; // Reset current index
        captionText.textContent = ""; // Clear caption text
        captionText.style.display = "none"; // Hide caption
    }

    // Show previous item
    prevBtn.addEventListener('click', function () {
        if (currentIndex > 0) {
            currentIndex--;
            resetModalVideo(); // Reset video before switching content
            openModal(galleryItems[currentIndex]);
        }
    });

    // Show next item
    nextBtn.addEventListener('click', function () {
        if (currentIndex < galleryItems.length - 1) {
            currentIndex++;
            resetModalVideo(); // Reset video before switching content
            openModal(galleryItems[currentIndex]);
        }
    });

    // Helper function to reset video playback before switching items
    function resetModalVideo() {
        if (modalVideo) {
            modalVideo.pause(); // Pause the video if it's playing
            modalVideo.src = ""; // Clear the video source
        }
    }
});
