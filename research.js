function openTab(tabId) {
    const mainContents = document.querySelectorAll('.research__content');
    const subContents = document.querySelectorAll('.Research_areas_tabs');
    
    const subTabIds = [
        'Astrophysics_and_cosmology',
        'Theoretical_condensed_matter_physics',
        'Experimental_condensed_matter_physics',
        'High_energy_physics',
        'Optics_spectroscopy_laser',
        'Quantum_information_technology'
    ];
    
    const facilitiesSubTabIds = [
        'Physics',
        'Central_Facilities'
    ];
    
    mainContents.forEach(content => {
        if (content.id === 'Research__areas' && subTabIds.includes(tabId)) {
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
        }
    });
    
    subContents.forEach(content => {
        content.style.display = 'none';
    });
    
    const selectedContent = document.getElementById(tabId);
    if (selectedContent) {
        selectedContent.style.display = 'block';
    } else {
        console.warn(`Tab with ID ${tabId} not found. Falling back to Research__areas.`);
        const defaultContent = document.getElementById('Research__areas');
        if (defaultContent) {
            defaultContent.style.display = 'block';
        }
    }
    
    const navigators = document.querySelectorAll('.research__navigator');
    navigators.forEach(nav => {
        nav.classList.remove('active');
    });
    
    const clickedNavigator = Array.from(navigators).find(nav => 
        nav.getAttribute('onclick') === `openTab('${tabId}')`
    );
    if (clickedNavigator) {
        clickedNavigator.classList.add('active');
    } else {
        if (subTabIds.includes(tabId)) {
            const researchAreasNavigator = Array.from(navigators).find(nav => 
                nav.getAttribute('onclick') === `openTab('Research__areas')`
            );
            if (researchAreasNavigator) {
                researchAreasNavigator.classList.add('active');
            }
        } else if (facilitiesSubTabIds.includes(tabId)) {
            const facilitiesNavigator = Array.from(navigators).find(nav => 
                nav.getAttribute('onclick') === `toggleDropdown('facilities-dropdown')`
            );
            if (facilitiesNavigator) {
                facilitiesNavigator.classList.add('active');
            }
        }
    }
    
    const subTabButtons = document.querySelectorAll('.Research__areas__links__notes');
    subTabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    const clickedSubTab = Array.from(subTabButtons).find(button => 
        button.getAttribute('onclick') === `openTab('${tabId}')`
    );
    if (clickedSubTab) {
        clickedSubTab.classList.add('active');
    }
    
    const dropdownItems = document.querySelectorAll('.research__dropdown__item');
    dropdownItems.forEach(item => {
        item.classList.remove('active');
    });
    
    const clickedDropdownItem = Array.from(dropdownItems).find(item => 
        item.getAttribute('onclick') === `openTab('${tabId}')`
    );
    if (clickedDropdownItem) {
        clickedDropdownItem.classList.add('active');
    }
}

function openExternalLink(url) {
    window.open(url, '_blank');
}

function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    openTab('Research__areas');
});