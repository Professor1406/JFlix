// Test script to check if the similar content feature is working
console.log('Test script loaded');

// Function to check if the similar-content-list element exists
function checkSimilarContentElement() {
  const similarContainer = document.getElementById('similar-content-list');
  if (similarContainer) {
    console.log('Similar content container found:', similarContainer);
    return true;
  } else {
    console.error('Similar content container NOT found in the DOM');
    return false;
  }
}

// Function to test the TMDB API
async function testTmdbApi() {
  const API_KEY = '648c004c97b5a1425c702528ab88ddac';
  const BASE_URL = 'https://api.themoviedb.org/3';
  
  try {
    console.log('Testing TMDB API connection...');
    const url = `${BASE_URL}/movie/550/similar?api_key=${API_KEY}`; // Using Fight Club (id: 550) as test
    console.log('Test URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API test successful, received data:', data);
    return true;
  } catch (error) {
    console.error('API test failed:', error);
    return false;
  }
}

// Run tests when a movie/show is clicked
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, setting up test hooks');
  
  // Check if modal exists
  const modal = document.getElementById('modal');
  if (modal) {
    console.log('Modal element found, adding test hook');
    
    // Add a mutation observer to detect when the modal is displayed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'style' && 
            modal.style.display === 'flex') {
          console.log('Modal displayed, running tests...');
          
          // Run tests with a slight delay to ensure content is loaded
          setTimeout(() => {
            checkSimilarContentElement();
            testTmdbApi();
          }, 500);
        }
      });
    });
    
    observer.observe(modal, { attributes: true });
  } else {
    console.error('Modal element not found');
  }
});

// Log any errors that occur
window.addEventListener('error', (event) => {
  console.error('JavaScript error detected:', event.error);
});
