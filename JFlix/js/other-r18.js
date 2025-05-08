const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
const API_KEY = '648c004c97b5a1425c702528ab88ddac';

// State variables
let currentItem = null;
let currentPage = 1;
let totalPages = 1;
let currentGenre = '';
let currentSort = 'popularity.desc';
let currentType = 'movie'; // Always set to movie
let ageVerified = false; // Track if user's age has been verified

// Age verification functionality
function initAgeVerification() {
  // Check if age has been verified in this session
  if (sessionStorage.getItem('r18_age_verified') === 'true') {
    hideAgeVerification();
    ageVerified = true;
    return;
  }
  
  const ageVerification = document.getElementById('age-verification');
  const verifyButton = document.getElementById('verify-age');
  const exitButton = document.getElementById('exit-button');
  const birthMonth = document.getElementById('birth-month');
  const birthDay = document.getElementById('birth-day');
  const birthYear = document.getElementById('birth-year');
  const errorMessage = document.getElementById('age-error');
  
  // Populate days dropdown
  populateDays();
  
  // Populate years dropdown (100 years back from current year)
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 100; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    birthYear.appendChild(option);
  }
  
  // Update days when month changes
  birthMonth.addEventListener('change', populateDays);
  
  // Enable/disable verify button based on selection
  function checkFormCompletion() {
    verifyButton.disabled = !birthMonth.value || !birthDay.value || !birthYear.value;
  }
  
  birthMonth.addEventListener('change', checkFormCompletion);
  birthDay.addEventListener('change', checkFormCompletion);
  birthYear.addEventListener('change', checkFormCompletion);
  
  // Handle verification
  verifyButton.addEventListener('click', function() {
    const month = parseInt(birthMonth.value) - 1; // JavaScript months are 0-indexed
    const day = parseInt(birthDay.value);
    const year = parseInt(birthYear.value);
    
    const birthDate = new Date(year, month, day);
    const today = new Date();
    
    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Check if user is at least 18
    if (age >= 18) {
      // Store verification in session storage
      sessionStorage.setItem('r18_age_verified', 'true');
      ageVerified = true;
      hideAgeVerification();
      // Initialize content after age verification
      loadOtherR18Content();
    } else {
      errorMessage.textContent = 'You must be at least 18 years old to access this content.';
    }
  });
  
  // Handle exit button
  exitButton.addEventListener('click', function() {
    // Redirect to homepage
    window.location.href = 'index.html';
  });
  
  // Populate days based on selected month
  function populateDays() {
    const month = parseInt(birthMonth.value);
    const year = parseInt(birthYear.value) || new Date().getFullYear();
    
    // Clear existing options except the placeholder
    while (birthDay.options.length > 1) {
      birthDay.remove(1);
    }
    
    if (!month) return;
    
    // Get number of days in the selected month
    let daysInMonth;
    if (month === 2) { // February
      // Check for leap year
      daysInMonth = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 29 : 28;
    } else if ([4, 6, 9, 11].includes(month)) { // April, June, September, November
      daysInMonth = 30;
    } else {
      daysInMonth = 31;
    }
    
    // Add day options
    for (let i = 1; i <= daysInMonth; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      birthDay.appendChild(option);
    }
    
    checkFormCompletion();
  }
}

// Hide age verification overlay
function hideAgeVerification() {
  const ageVerification = document.getElementById('age-verification');
  ageVerification.style.display = 'none';
}

// Genre mapping for R-18 movies
const GENRE_MAP = {
  // Common genres
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Initialize age verification first
  initAgeVerification();
  
  // Only load content if age is already verified (from session storage)
  if (sessionStorage.getItem('r18_age_verified') === 'true') {
    loadOtherR18Content();
  }
  
  // Add event listeners for search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchOtherR18Content();
      }
    });
  }
});

async function fetchOtherR18Content(page = 1, genre = '', sort = 'popularity.desc', type = 'movie') {
  try {
    // Make sure we have a valid API key
    if (!API_KEY) {
      console.error('API key is missing');
      return [];
    }
    
    let combinedResults = [];
    
    // STEP 1: Get all explicitly marked adult content from TMDB
    let adultUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=${sort}&page=${page}&include_adult=true`;
    if (genre) {
      adultUrl += `&with_genres=${genre}`;
    }
    
    const adultRes = await fetch(adultUrl);
    if (adultRes.ok) {
      const adultData = await adultRes.json();
      
      // Filter for movies that have the adult flag set to true
      const adultMovies = adultData.results.filter(movie => {
        // Must have a poster image and be marked as adult
        return movie.adult === true && !!movie.poster_path;
      });
      
      // Add adult movies to results
      adultMovies.forEach(movie => {
        // Only add if not already in results
        if (!combinedResults.some(item => item.id === movie.id)) {
          // Add a type property to identify as movie
          movie.media_type = 'movie';
          // Normalize property names
          movie.name = movie.title;
          movie.first_air_date = movie.release_date;
          // Mark as adult content
          movie.is_adult = true;
          // Add R-18 tag for display
          movie.is_r18 = true;
          combinedResults.push(movie);
        }
      });
      
      // Update total pages
      totalPages = Math.max(totalPages, adultData.total_pages || 1);
    }
    
    // STEP 2: Search for R-18 and adult content keywords
    const adultKeywords = [
      'R-18', 'R18', 'Adult', 'Mature', 'X-Rated', 'XXX', 'NSFW',
      'Adult film', 'Adult movie', 'Erotic', 'Sensual'
    ];
    
    // Search for each keyword and collect results
    for (const keyword of adultKeywords) {
      const searchUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${keyword}&page=${page}&include_adult=true`;
      const searchRes = await fetch(searchUrl);
      
      if (!searchRes.ok) {
        console.error(`Search API for ${keyword} responded with status: ${searchRes.status}`);
        continue;
      }
      
      const searchData = await searchRes.json();
      
      // Process search results
      if (searchData.results && searchData.results.length > 0) {
        // Filter for likely R-18/adult content
        const filteredResults = searchData.results.filter(movie => {
          // Must have a poster image
          if (!movie.poster_path) return false;
          
          // Always include explicitly marked adult content
          if (movie.adult === true) return true;
          
          // Check for R-18 indicators in title or overview
          const hasR18Keywords = 
            (movie.title && (/r-18|r18|adult|mature|x-rated|xxx|nsfw|18\+/i.test(movie.title))) ||
            (movie.overview && (/r-18|r18|adult|mature|x-rated|xxx|nsfw|18\+/i.test(movie.overview)));
          
          // Check if it's NOT Filipino content
          const isNotFilipino = 
            movie.original_language !== 'tl' && 
            movie.original_language !== 'fil' && 
            !(movie.origin_country && movie.origin_country.includes('PH')) &&
            !(movie.title && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(movie.title))) &&
            !(movie.overview && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(movie.overview)));
          
          // Check for adult themes in title or overview
          const hasAdultThemes = 
            (movie.title && (/sexy|bold|desire|passion|forbidden|affair|temptation|erotic|sensual|intimate/i.test(movie.title))) ||
            (movie.overview && (/sexy|bold|desire|passion|forbidden|affair|temptation|erotic|sensual|intimate/i.test(movie.overview)));
          
          return hasR18Keywords && isNotFilipino && hasAdultThemes;
        });
        
        filteredResults.forEach(movie => {
          // Only add if not already in results
          if (!combinedResults.some(item => item.id === movie.id)) {
            // Add a type property to identify as movie
            movie.media_type = 'movie';
            // Normalize property names
            movie.name = movie.title;
            movie.first_air_date = movie.release_date;
            // Mark as adult content
            movie.is_adult = true;
            // Add R-18 tag for display if it has R-18 keywords
            movie.is_r18 = 
              (movie.title && (/r-18|r18|adult|mature|x-rated|xxx|nsfw|18\+/i.test(movie.title))) ||
              (movie.overview && (/r-18|r18|adult|mature|x-rated|xxx|nsfw|18\+/i.test(movie.overview)));
            
            combinedResults.push(movie);
          }
        });
      }
      
      // Update total pages
      totalPages = Math.max(totalPages, searchData.total_pages || 1);
    }
    
    // STEP 3: If still not enough results, try with additional search terms
    if (combinedResults.length < 20) {
      const searchTerms = ['Adult drama', 'Mature content', 'Erotic film', 'Sensual cinema'];
      for (const term of searchTerms) {
        const searchUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${term}&page=1`;
        const searchRes = await fetch(searchUrl);
        
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const validResults = searchData.results.filter(item => {
            // Must have a poster image
            if (!item.poster_path) return false;
            
            // Check if it's NOT Filipino content
            const isNotFilipino = 
              item.original_language !== 'tl' && 
              item.original_language !== 'fil' && 
              !(item.origin_country && item.origin_country.includes('PH')) &&
              !(item.title && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(item.title))) &&
              !(item.overview && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(item.overview)));
            
            return isNotFilipino;
          });
          
          validResults.forEach(item => {
            // Only add if not already in results
            if (!combinedResults.some(existingItem => existingItem.id === item.id)) {
              // Add a type property to identify as movie
              item.media_type = 'movie';
              // Normalize property names
              item.name = item.title;
              item.first_air_date = item.release_date;
              // Mark as adult content
              item.is_adult = true;
              // Add R-18 tag for display
              item.is_r18 = true;
              combinedResults.push(item);
            }
          });
        }
      }
      
      // Remove duplicates
      combinedResults = Array.from(new Map(combinedResults.map(item => [item.id, item])).values());
    }
    
    // Update total pages
    if (combinedResults.length > 0) {
      totalPages = Math.max(totalPages, 5);
    }
    
    // Apply genre filter if specified
    if (genre) {
      combinedResults = combinedResults.filter(item => 
        item.genre_ids && item.genre_ids.includes(parseInt(genre))
      );
    }
    
    // Sort by popularity and return
    return combinedResults
      .sort((a, b) => {
        if (sort === 'popularity.desc') {
          return b.popularity - a.popularity;
        } else if (sort === 'vote_average.desc') {
          return b.vote_average - a.vote_average;
        } else if (sort === 'first_air_date.desc') {
          return new Date(b.first_air_date || '1900') - new Date(a.first_air_date || '1900');
        }
        return 0;
      })
      .slice(0, 25);
  } catch (error) {
    console.error('Error fetching Other R-18 content:', error);
    return [];
  }
}

// Function to load Other R-18 content with current filters
async function loadOtherR18Content() {
  if (!ageVerified && sessionStorage.getItem('r18_age_verified') !== 'true') {
    return; // Don't load content if age not verified
  }
  
  try {
    // Show loading state
    const contentList = document.getElementById('other-r18-list');
    if (contentList) {
      contentList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading content...</div>';
    }
    
    // Fetch content with current filters
    const content = await fetchOtherR18Content(currentPage, currentGenre, currentSort);
    
    // Display the content
    displayOtherR18Content(content);
    
    // Update pagination buttons
    updatePaginationButtons();
  } catch (error) {
    console.error('Error loading Other R-18 content:', error);
    const contentList = document.getElementById('other-r18-list');
    if (contentList) {
      contentList.innerHTML = '<div class="error"><i class="fas fa-exclamation-circle"></i> Error loading content. Please try again later.</div>';
    }
  }
}

// Function to filter Other R-18 content
function filterOtherR18Content() {
  // Get filter values
  const genreFilter = document.getElementById('genre-filter');
  const sortFilter = document.getElementById('sort-filter');
  
  if (genreFilter && sortFilter) {
    currentGenre = genreFilter.value;
    currentSort = sortFilter.value;
    currentPage = 1; // Reset to first page when filters change
    
    // Load content with new filters
    loadOtherR18Content();
  }
}

// Function to display Other R-18 content
function displayOtherR18Content(content) {
  const contentList = document.getElementById('other-r18-list');
  if (!contentList) return;
  
  // Clear previous content
  contentList.innerHTML = '';
  
  // Check if we have content to display
  if (!content || content.length === 0) {
    contentList.innerHTML = '<div class="no-results"><i class="fas fa-search"></i> No R-18 movies found matching your criteria.</div>';
    return;
  }
  
  // Create movie cards for each item
  content.forEach(item => {
    // Create card element
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-id', item.id);
    card.setAttribute('data-type', item.media_type);
    
    // Create image container
    const imgContainer = document.createElement('div');
    imgContainer.className = 'card-img-container';
    
    // Create image element
    const img = document.createElement('img');
    img.src = item.poster_path ? `${IMG_URL}${item.poster_path}` : 'images/no-poster.jpg';
    img.alt = item.name || 'Movie poster';
    img.loading = 'lazy';
    
    // Create content type badge
    const badge = document.createElement('div');
    badge.className = 'content-type-badge';
    badge.innerHTML = `<i class="fas fa-exclamation-circle"></i> R-18`;
    
    // Create info container
    const info = document.createElement('div');
    info.className = 'card-info';
    
    // Create title element
    const title = document.createElement('h3');
    title.textContent = item.name || 'Unknown Title';
    
    // Create meta info element
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    
    // Add rating if available
    if (item.vote_average) {
      const rating = document.createElement('span');
      rating.className = 'rating';
      rating.innerHTML = `<i class="fas fa-star"></i> ${item.vote_average.toFixed(1)}`;
      meta.appendChild(rating);
    }
    
    // Add year if available
    if (item.first_air_date) {
      const year = document.createElement('span');
      year.className = 'year';
      year.textContent = new Date(item.first_air_date).getFullYear();
      meta.appendChild(year);
    }
    
    // Add genres if available
    if (item.genre_ids && item.genre_ids.length > 0) {
      const genres = document.createElement('div');
      genres.className = 'card-genres';
      
      // Get first 2 genres
      const genreNames = item.genre_ids
        .slice(0, 2)
        .map(id => GENRE_MAP[id] || '')
        .filter(name => name);
      
      if (genreNames.length > 0) {
        genreNames.forEach(name => {
          const genre = document.createElement('span');
          genre.textContent = name;
          genres.appendChild(genre);
        });
        info.appendChild(genres);
      }
    }
    
    // Assemble the card
    imgContainer.appendChild(img);
    imgContainer.appendChild(badge);
    info.appendChild(title);
    info.appendChild(meta);
    
    card.appendChild(imgContainer);
    card.appendChild(info);
    
    // Add click event to show details
    card.addEventListener('click', () => {
      showDetails(item);
    });
    
    // Add card to the content list
    contentList.appendChild(card);
  });
  
  // Update current page display
  const currentPageElement = document.getElementById('current-page');
  if (currentPageElement) {
    currentPageElement.textContent = currentPage;
  }
}

// Function to show details for a selected item
function showDetails(item) {
  if (!item) return;
  
  // Store current item for reference
  currentItem = item;
  
  // Get modal elements
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalRating = document.getElementById('modal-rating');
  const modalYear = document.getElementById('modal-year');
  const modalContentType = document.getElementById('modal-content-type');
  const modalDescription = document.getElementById('modal-description');
  const modalImage = document.getElementById('modal-image');
  const modalGenres = document.getElementById('modal-genres');
  const modalWarning = document.getElementById('modal-warning');
  
  // Set modal content
  modalTitle.textContent = item.name || 'Unknown Title';
  modalRating.textContent = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
  
  // Set year if available
  if (item.first_air_date) {
    const year = new Date(item.first_air_date).getFullYear();
    modalYear.textContent = year;
  } else {
    modalYear.textContent = 'N/A';
  }
  
  // Set content type badge
  modalContentType.innerHTML = `<i class="fas fa-exclamation-circle"></i> R-18`;
  
  // Set description
  modalDescription.textContent = item.overview || 'No description available.';
  
  // Set image
  modalImage.src = item.poster_path ? `${IMG_URL}${item.poster_path}` : 'images/no-poster.jpg';
  modalImage.alt = item.name || 'Movie poster';
  
  // Set genres
  modalGenres.innerHTML = '';
  if (item.genre_ids && item.genre_ids.length > 0) {
    item.genre_ids.forEach(id => {
      if (GENRE_MAP[id]) {
        const genre = document.createElement('span');
        genre.textContent = GENRE_MAP[id];
        modalGenres.appendChild(genre);
      }
    });
  } else {
    modalGenres.innerHTML = '<span>Genres not available</span>';
  }
  
  // Set content warning
  modalWarning.innerHTML = '<div class="content-warning"><i class="fas fa-exclamation-triangle"></i> This content contains adult themes and is intended for mature audiences only.</div>';
  
  // Set up video player with default server
  changeServer();
  
  // Fetch and display similar content
  fetchSimilarContent(item);
  
  // Show the modal
  modal.style.display = 'flex';
  
  // Add event listener to close modal when clicking outside
  window.onclick = function(event) {
    if (event.target === modal) {
      closeModal();
    }
  };
  
  // Add event listener to close modal with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
}

// Function to close the modal
function closeModal() {
  const modal = document.getElementById('modal');
  const modalVideo = document.getElementById('modal-video');
  
  // Stop video playback
  if (modalVideo) {
    modalVideo.src = '';
  }
  
  // Hide modal
  modal.style.display = 'none';
}

// Function to fetch similar content based on the selected item
async function fetchSimilarContent(item) {
  if (!item || !item.id) {
    console.error('Invalid item for fetching similar content');
    return;
  }
  
  try {
    // Show loading state
    const similarContentList = document.getElementById('similar-content-list');
    if (similarContentList) {
      similarContentList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading recommendations...</div>';
    }
    
    // Fetch similar movies from TMDB
    const url = `${BASE_URL}/movie/${item.id}/similar?api_key=${API_KEY}&language=en-US&page=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter results to only include movies with posters
    let results = data.results.filter(movie => movie.poster_path);
    
    // Filter out Filipino content to match the page purpose
    results = results.filter(movie => {
      // Check if it's NOT Filipino content
      const isNotFilipino = 
        movie.original_language !== 'tl' && 
        movie.original_language !== 'fil' && 
        !(movie.origin_country && movie.origin_country.includes('PH')) &&
        !(movie.title && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(movie.title))) &&
        !(movie.overview && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(movie.overview)));
      
      return isNotFilipino;
    });
    
    // Normalize data format
    const normalizedResults = results.map(movie => {
      return {
        ...movie,
        media_type: 'movie',
        name: movie.title,
        first_air_date: movie.release_date,
        is_adult: movie.adult || true,
        is_r18: true
      };
    });
    
    // Display similar content
    displaySimilarContent(normalizedResults.slice(0, 6));
  } catch (error) {
    console.error('Error fetching similar content:', error);
    const similarContentList = document.getElementById('similar-content-list');
    if (similarContentList) {
      similarContentList.innerHTML = '<div class="error"><i class="fas fa-exclamation-circle"></i> Unable to load recommendations.</div>';
    }
  }
}

// Function to display similar content
function displaySimilarContent(shows) {
  const similarContentList = document.getElementById('similar-content-list');
  if (!similarContentList) return;
  
  // Clear previous content
  similarContentList.innerHTML = '';
  
  // Check if we have content to display
  if (!shows || shows.length === 0) {
    similarContentList.innerHTML = '<div class="no-results">No similar content found.</div>';
    return;
  }
  
  // Create cards for each similar item
  shows.forEach(show => {
    // Create card element
    const card = document.createElement('div');
    card.className = 'similar-card';
    card.setAttribute('data-id', show.id);
    card.setAttribute('data-type', show.media_type);
    
    // Create image container
    const imgContainer = document.createElement('div');
    imgContainer.className = 'similar-img-container';
    
    // Create image element
    const img = document.createElement('img');
    img.src = show.poster_path ? `${IMG_URL}${show.poster_path}` : 'images/no-poster.jpg';
    img.alt = show.name || 'Movie poster';
    img.loading = 'lazy';
    
    // Create badge for R-18 content
    const badge = document.createElement('div');
    badge.className = 'similar-badge content-type-badge';
    badge.innerHTML = `<i class="fas fa-exclamation-circle"></i> R-18`;
    
    // Create title element
    const title = document.createElement('h4');
    title.textContent = show.name || 'Unknown Title';
    
    // Assemble the card
    imgContainer.appendChild(img);
    imgContainer.appendChild(badge);
    card.appendChild(imgContainer);
    card.appendChild(title);
    
    // Add click event to show details
    card.addEventListener('click', () => {
      showDetails(show);
    });
    
    // Add card to the similar content list
    similarContentList.appendChild(card);
  });
}

// Function to change server
function changeServer() {
  if (!currentItem) return;
  
  const server = document.getElementById('server').value;
  const modalVideo = document.getElementById('modal-video');
  const movieId = currentItem.id;
  
  let embedUrl = '';
  
  switch (server) {
    case 'vidsrcme':
      embedUrl = `https://vidsrc.me/embed/movie?tmdb=${movieId}`;
      break;
    case '2embed':
      embedUrl = `https://www.2embed.cc/embed/${movieId}`;
      break;
    case 'superembed':
      embedUrl = `https://multiembed.mov/directstream.php?video_id=${movieId}&tmdb=1`;
      break;
    case 'vidsrc':
      embedUrl = `https://vidsrc.xyz/embed/movie/${movieId}`;
      break;
    case 'vidsrcpro':
      embedUrl = `https://vidsrc.pro/embed/movie/${movieId}`;
      break;
    case 'vidsrcto':
      embedUrl = `https://vidsrc.to/embed/movie/${movieId}`;
      break;
    case 'vidsrcstream':
      embedUrl = `https://vidsrc.stream/embed/movie/${movieId}`;
      break;
    default:
      embedUrl = `https://vidsrc.me/embed/movie?tmdb=${movieId}`;
  }
  
  // Update iframe source
  if (modalVideo) {
    modalVideo.src = embedUrl;
  }
}

// Function to change quality
function changeQuality() {
  // Quality selection is handled by the embedded player
  // This function is kept for consistency with the UI
  console.log('Quality change requested');
}

// Pagination functions
function nextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    loadOtherR18Content();
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    loadOtherR18Content();
  }
}

function updatePaginationButtons() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  
  if (prevButton) {
    prevButton.disabled = currentPage <= 1;
  }
  
  if (nextButton) {
    nextButton.disabled = currentPage >= totalPages;
  }
}

// Search functions
function openSearchModal() {
  const searchModal = document.getElementById('search-modal');
  const searchInput = document.getElementById('search-input');
  
  if (searchModal) {
    searchModal.style.display = 'flex';
    if (searchInput) {
      searchInput.focus();
    }
  }
}

function closeSearchModal() {
  const searchModal = document.getElementById('search-modal');
  if (searchModal) {
    searchModal.style.display = 'none';
  }
}

async function searchOtherR18Content() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  if (!searchInput || !searchResults) return;
  
  const query = searchInput.value.trim();
  
  if (!query) {
    searchResults.innerHTML = '<div class="search-message">Please enter a search term.</div>';
    return;
  }
  
  try {
    // Show loading state
    searchResults.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
    
    // Search movies from TMDB
    const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=true&page=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter results to only include movies with posters
    let results = data.results.filter(movie => movie.poster_path);
    
    // Filter out Filipino content to match the page purpose
    results = results.filter(movie => {
      // Check if it's NOT Filipino content
      const isNotFilipino = 
        movie.original_language !== 'tl' && 
        movie.original_language !== 'fil' && 
        !(movie.origin_country && movie.origin_country.includes('PH')) &&
        !(movie.title && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(movie.title))) &&
        !(movie.overview && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(movie.overview)));
      
      return isNotFilipino;
    });
    
    // Check if we have results
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="no-results">No movies found matching your search.</div>';
      return;
    }
    
    // Clear previous results
    searchResults.innerHTML = '';
    
    // Create search result items
    results.slice(0, 20).forEach(movie => {
      // Create result item
      const resultItem = document.createElement('div');
      resultItem.className = 'search-result-item';
      resultItem.setAttribute('data-id', movie.id);
      
      // Create image container
      const imgContainer = document.createElement('div');
      imgContainer.className = 'search-img-container';
      
      // Create image element
      const img = document.createElement('img');
      img.src = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : 'images/no-poster.jpg';
      img.alt = movie.title || 'Movie poster';
      img.loading = 'lazy';
      
      // Create badge for R-18 content
      const badge = document.createElement('div');
      badge.className = 'search-badge content-type-badge';
      badge.innerHTML = `<i class="fas fa-exclamation-circle"></i> R-18`;
      
      // Create info container
      const info = document.createElement('div');
      info.className = 'search-info';
      
      // Create title element
      const title = document.createElement('h3');
      title.textContent = movie.title || 'Unknown Title';
      
      // Create meta info
      const meta = document.createElement('div');
      meta.className = 'search-meta';
      
      // Add year if available
      if (movie.release_date) {
        const year = document.createElement('span');
        year.className = 'year';
        year.textContent = new Date(movie.release_date).getFullYear();
        meta.appendChild(year);
      }
      
      // Add rating if available
      if (movie.vote_average) {
        const rating = document.createElement('span');
        rating.className = 'rating';
        rating.innerHTML = `<i class="fas fa-star"></i> ${movie.vote_average.toFixed(1)}`;
        meta.appendChild(rating);
      }
      
      // Add overview if available
      if (movie.overview) {
        const overview = document.createElement('p');
        overview.className = 'search-overview';
        overview.textContent = movie.overview.length > 100 ? 
          movie.overview.substring(0, 100) + '...' : movie.overview;
        info.appendChild(overview);
      }
      
      // Assemble the search result item
      imgContainer.appendChild(img);
      imgContainer.appendChild(badge);
      info.appendChild(title);
      info.appendChild(meta);
      
      resultItem.appendChild(imgContainer);
      resultItem.appendChild(info);
      
      // Add click event to show details
      resultItem.addEventListener('click', () => {
        // Normalize movie object to match our format
        const normalizedMovie = {
          ...movie,
          media_type: 'movie',
          name: movie.title,
          first_air_date: movie.release_date,
          is_adult: true,
          is_r18: true
        };
        
        showDetails(normalizedMovie);
        closeSearchModal();
      });
      
      // Add result item to search results
      searchResults.appendChild(resultItem);
    });
  } catch (error) {
    console.error('Error searching content:', error);
    searchResults.innerHTML = '<div class="error"><i class="fas fa-exclamation-circle"></i> Error searching content. Please try again later.</div>';
  }
}

// Toggle menu for mobile
function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.classList.toggle('active');
  }
}

// Donation popup functions
function openDonationPopup() {
  const donationPopup = document.getElementById('donation-popup');
  if (donationPopup) {
    donationPopup.style.display = 'flex';
  }
}

function closeDonationPopup() {
  const donationPopup = document.getElementById('donation-popup');
  if (donationPopup) {
    donationPopup.style.display = 'none';
  }
}

// Initialize
loadOtherR18Content();
