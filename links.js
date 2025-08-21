document.addEventListener("DOMContentLoaded", function () {
  const headers = document.querySelectorAll(".links-header");

  headers.forEach(hdr => {
    hdr.addEventListener("click", function () {
      const content = hdr.parentElement.querySelector(".links-content");
      const isOpen = hdr.classList.contains("active");

      // Close all others
      document.querySelectorAll(".links-header.active").forEach(openHdr => {
        if (openHdr !== hdr) {
          openHdr.classList.remove("active");
          openHdr.parentElement.querySelector(".links-content").style.maxHeight = null;
        }
      });

      if (isOpen) {
        hdr.classList.remove("active");
        content.style.maxHeight = null;
      } else {
        hdr.classList.add("active");
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });
});
