document.querySelectorAll('.committee-header').forEach(header => {
    header.addEventListener('click', () => {
        const content = header.parentElement.querySelector('.committee-content');
        const isActive = header.classList.contains('active');
        
        // Close all open items
        document.querySelectorAll('.committee-header').forEach(h => h.classList.remove('active'));
        document.querySelectorAll('.committee-content').forEach(c => c.style.maxHeight = null);

        if (!isActive) {
            header.classList.add('active');
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
});
