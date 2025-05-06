// Adsterra configuration
const ADSTERRA_ZONE = '4906855'; // Your Adsterra zone ID

// Function to load Adsterra script
function loadAdsterraScript() {
    const script = document.createElement('script');
    script.src = 'https://cdn.adsterra.com/display.js';
    script.async = true;
    document.head.appendChild(script);
}

// Function to create ad container
document.addEventListener('DOMContentLoaded', function() {
    // Load Adsterra script
    loadAdsterraScript();

    // Create multiple ad containers for better monetization
    const adContainer1 = document.createElement('div');
    adContainer1.className = 'adsterra-ad-container adsterra-ad-top';
    adContainer1.innerHTML = `<div class="adsterra-zone" data-zone="${ADSTERRA_ZONE}"></div>`;
    
    const adContainer2 = document.createElement('div');
    adContainer2.className = 'adsterra-ad-container adsterra-ad-middle';
    adContainer2.innerHTML = `<div class="adsterra-zone" data-zone="${ADSTERRA_ZONE}"></div>`;

    const adContainer3 = document.createElement('div');
    adContainer3.className = 'adsterra-ad-container adsterra-ad-bottom';
    adContainer3.innerHTML = `<div class="adsterra-zone" data-zone="${ADSTERRA_ZONE}"></div>`;

    // Add ad containers to specific locations
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        // Add top ad
        mainContent.insertBefore(adContainer1, mainContent.firstChild);
        
        // Add middle ad
        const middlePoint = Math.floor(mainContent.children.length / 2);
        if (middlePoint > 0) {
            mainContent.insertBefore(adContainer2, mainContent.children[middlePoint]);
        }
        
        // Add bottom ad
        mainContent.appendChild(adContainer3);
    }
});
