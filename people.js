document.addEventListener("DOMContentLoaded", function() {
    document.body.classList.add('loaded');
    addFooterHoverEffects();
    addYearToggleFunctionality();
    triggerWelcomeAnimation();
});

function addFooterHoverEffects() {
    const footerItems = document.querySelectorAll(".footer-col h3, .footer-col ul li a");
    
    footerItems.forEach(item => {
        item.addEventListener("mouseenter", function() {
            this.style.transform = "scale(1.1)"; 
            this.style.transition = "transform 0.3s ease";
        });
        item.addEventListener("mouseleave", function() {
            this.style.transform = "scale(1)"; 
        });
    });
}





function addYearToggleFunctionality() {
    const yearToggles = document.querySelectorAll('.year-toggle');
    const membersLists = document.querySelectorAll('.members-list');

    yearToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const year = this.getAttribute('data-year');

            membersLists.forEach(list => {
                if (list.getAttribute('data-year') === year) {
                    if (list.classList.contains('active')) {
                        // If the list is already expanded, collapse it
                        list.style.transition = 'max-height 0.5s ease, opacity 0.5s ease';
                        list.style.maxHeight = '0px';
                        list.style.opacity = 0; 
                        list.classList.remove('active');
                        toggle.classList.remove('active');
                    } else {
                        // If the list is collapsed, expand it
                        list.style.transition = 'max-height 0.5s ease, opacity 0.5s ease';
                        list.style.maxHeight = list.scrollHeight + 'px'; 
                        list.style.opacity = 1; 
                        list.classList.add('active');
                        toggle.classList.add('active');
                    }
                } else {
                    // Collapse other lists that aren't the current one
                    list.style.transition = 'max-height 0.5s ease, opacity 0.5s ease';
                    list.style.maxHeight = '0px'; 
                    list.style.opacity = 0; 
                    list.classList.remove('active');
                }
            });
        });
    });
}







function triggerWelcomeAnimation() {
    const welcomeMessage = document.querySelector('.welcome-message');
    setTimeout(() => {
        welcomeMessage.classList.add('loaded'); 
    }, 200); 
} 
