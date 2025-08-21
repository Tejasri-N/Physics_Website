<script>
document.addEventListener("DOMContentLoaded", function () {
  const headers = document.querySelectorAll(".links-header");
  headers.forEach((hdr) => {
    hdr.addEventListener("click", () => {
      const item = hdr.parentElement;             // .links-item
      const content = item.querySelector(".links-content");
      const isOpen = hdr.classList.contains("active");

      // close any other open items (optional; remove if you want multiple open)
      document.querySelectorAll(".links-header.active").forEach(h => {
        if (h !== hdr) {
          h.classList.remove("active");
          const c = h.parentElement.querySelector(".links-content");
          c.style.maxHeight = 0;
        }
      });

      if (isOpen) {
        hdr.classList.remove("active");
        content.style.maxHeight = 0;
      } else {
        hdr.classList.add("active");
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });

  // Auto-set maxHeight for any section you want open by default:
  document.querySelectorAll(".links-header.default-open").forEach(hdr => {
    hdr.classList.add("active");
    const content = hdr.parentElement.querySelector(".links-content");
    content.style.maxHeight = content.scrollHeight + "px";
  });
});
</script>
