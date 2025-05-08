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
  if (sessionStorage.getItem('vivamax_age_verified') === 'true') {
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
      sessionStorage.setItem('vivamax_age_verified', 'true');
      ageVerified = true;
      hideAgeVerification();
      // Initialize content after age verification
      loadVivamaxContent();
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

// Genre mapping for Vivamax movies
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
  if (sessionStorage.getItem('vivamax_age_verified') === 'true') {
    loadVivamaxContent();
  }
  
  // Add event listeners for search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchVivamaxContent();
      }
    });
  }
});

async function fetchVivamaxContent(page = 1, genre = '', sort = 'popularity.desc', type = 'movie') {
  try {
    // Make sure we have a valid API key
    if (!API_KEY) {
      console.error('API key is missing');
      return [];
    }
    
    let combinedResults = [];
    
    // STEP 1: Get all explicitly marked adult content from TMDB that is Filipino
    let adultUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=${sort}&page=${page}&include_adult=true&with_original_language=tl`;
    if (genre) {
      adultUrl += `&with_genres=${genre}`;
    }
    
    const adultRes = await fetch(adultUrl);
    if (adultRes.ok) {
      const adultData = await adultRes.json();
      
      // Filter for movies that have the adult flag set to true and are Filipino
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
          // Add Vivamax tag for Filipino content
          movie.is_vivamax = true;
          combinedResults.push(movie);
        }
      });
      
      // Update total pages
      totalPages = Math.max(totalPages, adultData.total_pages || 1);
    }
    
    // STEP 2: Search for Vivamax and Filipino adult content keywords
    const filipinoAdultKeywords = [
      'Vivamax', 'Pinoy adult', 'Filipino adult', 'Tagalog mature', 
      'Pinoy sexy', 'Pilipino bold', 'Pinoy R-18', 'Tagalog R-18'
    ];
    
    // Search for each keyword and collect results
    for (const keyword of filipinoAdultKeywords) {
      const searchUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${keyword}&page=${page}&include_adult=true`;
      const searchRes = await fetch(searchUrl);
      
      if (!searchRes.ok) {
        console.error(`Search API for ${keyword} responded with status: ${searchRes.status}`);
        continue;
      }
      
      const searchData = await searchRes.json();
      
      // Process search results
      if (searchData.results && searchData.results.length > 0) {
        // Filter for likely Filipino R-18/adult content
        const filteredResults = searchData.results.filter(movie => {
          // Must have a poster image
          if (!movie.poster_path) return false;
          
          // Check for Filipino indicators
          const isFilipino = 
            movie.original_language === 'tl' || 
            movie.original_language === 'fil' || 
            (movie.origin_country && movie.origin_country.includes('PH')) ||
            (movie.title && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(movie.title))) ||
            (movie.overview && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(movie.overview)));
          
          // Only include Filipino content
          if (!isFilipino) return false;
          
          // Always include explicitly marked adult content
          if (movie.adult === true) return true;
          
          // Check for R-18 indicators in title or overview
          const hasR18Keywords = 
            (movie.title && (/r-18|r18|adult|mature|x-rated|xxx|nsfw|18\+/i.test(movie.title))) ||
            (movie.overview && (/r-18|r18|adult|mature|x-rated|xxx|nsfw|18\+/i.test(movie.overview)));
          
          // Check for Vivamax content
          const isVivamax = 
            (movie.title && (/vivamax/i.test(movie.title))) ||
            (movie.overview && (/vivamax/i.test(movie.overview)));
          
          // Check for adult themes in title or overview
          const hasAdultThemes = 
            (movie.title && (/sexy|bold|desire|passion|forbidden|affair|temptation|erotic|sensual|intimate/i.test(movie.title))) ||
            (movie.overview && (/sexy|bold|desire|passion|forbidden|affair|temptation|erotic|sensual|intimate/i.test(movie.overview)));
          
          return isVivamax || hasR18Keywords || hasAdultThemes;
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
            // Add Vivamax tag for display if it's from Vivamax
            movie.is_vivamax = 
              (movie.title && (/vivamax/i.test(movie.title))) ||
              (movie.overview && (/vivamax/i.test(movie.overview))) || true; // Mark all as Vivamax since they're Filipino
            
            combinedResults.push(movie);
          }
        });
      }
      
      // Update total pages
      totalPages = Math.max(totalPages, searchData.total_pages || 1);
    }
    
    // STEP 3: Try with Filipino language filter specifically for adult content
    if (combinedResults.length < 20) {
      // Try with Filipino language filter (tl - Tagalog)
      let movieUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=${sort}&page=${page}&with_original_language=tl&include_adult=true`;
      if (genre) {
        movieUrl += `&with_genres=${genre}`;
      }
      
      const movieRes = await fetch(movieUrl);
      if (movieRes.ok) {
        const movieData = await movieRes.json();
        
        // Filter for adult themes
        const filteredResults = movieData.results.filter(movie => {
          // Must have a poster image
          if (!movie.poster_path) return false;
          
          // Always include explicitly marked adult content
          if (movie.adult === true) return true;
          
          // Check for adult themes in title or overview
          const hasAdultThemes = 
            (movie.title && (/adult|mature|sexy|bold|desire|passion|forbidden|affair|temptation|erotic|sensual|intimate/i.test(movie.title))) ||
            (movie.overview && (/adult|mature|sexy|bold|desire|passion|forbidden|affair|temptation|erotic|sensual|intimate/i.test(movie.overview)));
          
          // Check for R-18 indicators
          const hasR18Keywords = 
            (movie.title && (/r-18|r18|adult|mature|x-rated|xxx|nsfw|18\+/i.test(movie.title))) ||
            (movie.overview && (/r-18|r18|adult|mature|x-rated|xxx|nsfw|18\+/i.test(movie.overview)));
          
          return hasAdultThemes || hasR18Keywords;
        });
        
        // Add movies
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
            // Add R-18 tag if it has R-18 keywords
            movie.is_r18 = 
              (movie.title && (/r-18|r18|adult|mature|x-rated|xxx|nsfw|18\+/i.test(movie.title))) ||
              (movie.overview && (/r-18|r18|adult|mature|x-rated|xxx|nsfw|18\+/i.test(movie.overview)));
            // Add Vivamax tag for Filipino adult content
            movie.is_vivamax = true;
            combinedResults.push(movie);
          }
        });
      }
    }
    
    // Update total pages
    if (combinedResults.length > 0) {
      totalPages = Math.max(totalPages, 5);
    }
    
    // If still no results, try with additional Filipino search terms
    if (combinedResults.length === 0) {
      const searchTerms = ['Filipino adult', 'Pinoy mature', 'Tagalog romance', 'Philippines drama'];
      for (const term of searchTerms) {
        const searchUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${term}&page=1`;
        const searchRes = await fetch(searchUrl);
        
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const validResults = searchData.results.filter(item => item.poster_path);
          
          validResults.forEach(item => {
            // Only add if not already in results
            if (!combinedResults.some(existingItem => existingItem.id === item.id)) {
              // Add a type property to identify as movie
              item.media_type = 'movie';
              // Normalize property names
              item.name = item.title;
              item.first_air_date = item.release_date;
              // Add Vivamax tag for display
              item.is_vivamax = true;
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
    console.error('Error fetching Vivamax content:', error);
    return [];
  }
}

// Load Vivamax content with current filters
async function loadVivamaxContent() {
  document.getElementById('current-page').textContent = currentPage;
  const vivamaxContent = await fetchVivamaxContent(currentPage, currentGenre, currentSort, currentType);
  displayVivamaxContent(vivamaxContent);
  updatePaginationButtons();
}

// Filter Vivamax content
function filterVivamaxContent() {
  const genreSelect = document.getElementById('genre-filter');
  const sortSelect = document.getElementById('sort-filter');
  
  currentGenre = genreSelect.value;
  currentType = 'movie'; // Always set to movie
  currentSort = sortSelect.value;
  currentPage = 1;
  
  loadVivamaxContent();
}

// Display Vivamax content
function displayVivamaxContent(content) {
  const container = document.getElementById('vivamax-list');
  container.innerHTML = '';
  
  if (!content || content.length === 0) {
    container.innerHTML = '<div class="no-results">No Vivamax content found. Try different filters.</div>';
    return;
  }
  
  content.forEach(item => {
    if (!item.poster_path) return; // Skip items without posters
    
    const card = document.createElement('div');
    card.className = 'movie-card adult-content-card'; // Add adult-content-card class to all Vivamax content
    
    // Create HTML for the card
    let cardHTML = `
      <div class="card-img-container">
        <img src="${IMG_URL}${item.poster_path}" alt="${item.name}" loading="lazy" />
        <div class="content-type-badge">
          <i class="fas fa-film"></i> Movie
        </div>`;
    
    // Add Vivamax badge if it's a Vivamax movie
    if (item.is_vivamax) {
      cardHTML += `<div class="vivamax-badge">Vivamax</div>`;
    }
    
    // Add R-18 badge for adult content
    cardHTML += `<div class="adult-content-badge"><i class="fas fa-exclamation-circle"></i> 18+</div>`;
    
    // Add additional R-18 badge if specifically marked as R-18
    if (item.is_r18) {
      cardHTML += `<div class="r18-badge">R-18</div>`;
    }
    
    cardHTML += `
      </div>
      <div class="movie-info">
        <h3>${item.name}</h3>
        <div class="movie-meta">
          <span class="rating"><i class="fas fa-star"></i> ${Math.round(item.vote_average * 10) / 10}</span>
          <span class="year">${item.first_air_date?.split('-')[0] || 'N/A'}</span>
          <span class="adult-tag">Adult</span>
        </div>
      </div>
    `;
    
    card.innerHTML = cardHTML;
    
    card.onclick = () => showDetails(item);
    container.appendChild(card);
  });
}

// Function to show details for a selected item
function showDetails(item) {
  currentItem = item;
  
  // Set title based on media type (movie or TV show)
  document.getElementById('modal-title').textContent = item.name;
  document.getElementById('modal-description').textContent = item.overview || 'No description available.';
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').textContent = Math.round(item.vote_average * 10) / 10;
  document.getElementById('modal-year').textContent = item.first_air_date?.split('-')[0] || 'N/A';
  
  // Add content type indicator
  const contentTypeEl = document.getElementById('modal-content-type');
  if (contentTypeEl) {
    const contentType = 'Movie';
    const typeIcon = 'fa-film';
    contentTypeEl.innerHTML = `<i class="fas ${typeIcon}"></i> ${contentType}`;
    contentTypeEl.style.display = 'inline-flex';
  }
  
  // Add adult content indicator
  const genresContainer = document.getElementById('modal-genres');
  if (genresContainer) {
    genresContainer.innerHTML = '';
    
    // Add R-18 tag if it's marked as R-18
    if (item.is_r18) {
      const r18Span = document.createElement('span');
      r18Span.className = 'genre-tag r18-tag';
      r18Span.textContent = 'R-18';
      genresContainer.appendChild(r18Span);
    }
    
    // Add Adult tag for all content
    const adultSpan = document.createElement('span');
    adultSpan.className = 'genre-tag adult-tag';
    adultSpan.textContent = 'Adult';
    genresContainer.appendChild(adultSpan);
    
    // Add Vivamax tag if it's from Vivamax
    if (item.is_vivamax) {
      const vivamaxSpan = document.createElement('span');
      vivamaxSpan.className = 'genre-tag vivamax-tag';
      vivamaxSpan.textContent = 'Vivamax';
      genresContainer.appendChild(vivamaxSpan);
    }
  }
  
  // Add adult content warning
  const modalWarning = document.getElementById('modal-warning');
  if (modalWarning) {
    modalWarning.innerHTML = `
      <div class="modal-warning">
        <i class="fas fa-exclamation-triangle"></i>
        <span>This content is for adults only (18+). Viewer discretion is advised.</span>
      </div>
    `;
    modalWarning.style.display = 'block';
  }
  
  if (item.genre_ids && item.genre_ids.length > 0) {
    item.genre_ids.forEach(genreId => {
      const genre = GENRE_MAP[genreId];
      if (genre) {
        const span = document.createElement('span');
        span.textContent = genre;
        genresContainer.appendChild(span);
      }
    });
  } else {
    const span = document.createElement('span');
    span.textContent = 'Vivamax';
    genresContainer.appendChild(span);
  }
  
  // Fetch similar content
  fetchSimilarContent(item);
  document.getElementById('modal').style.display = 'flex';
  changeServer();
}

// Function to close the modal
function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

// Function to fetch similar content based on the selected item
async function fetchSimilarContent(item) {
  try {
    // Determine if it's a movie or TV show
    const mediaType = item.media_type || 'movie';
    const contentType = 'movie'; // Always movie
    
    // Fetch similar content based on media type
    const url = `${BASE_URL}/${contentType}/${item.id}/similar?api_key=${API_KEY}&include_adult=true`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Similar API responded with status: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Filter for adult Filipino content by language or origin country and adult themes
    const vivamaxContent = data.results.filter(content => {
      // Check for Filipino language or Philippines origin
      const isFilipino = 
        content.original_language === 'tl' || 
        content.original_language === 'fil' || 
        (content.origin_country && content.origin_country.includes('PH')) ||
        // Check title or overview for Filipino/Tagalog/Pinoy keywords
        (content.title && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(content.title))) ||
        (content.overview && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(content.overview)));
      
      // Check for adult themes in title or overview
      const hasAdultThemes = 
        (content.title && (/adult|mature|sexy|bold|desire|passion|forbidden|affair|romance|love|temptation/i.test(content.title))) ||
        (content.overview && (/adult|mature|sexy|bold|desire|passion|forbidden|affair|romance|love|temptation/i.test(content.overview)));
      
      // Must have a poster image
      const hasPoster = !!content.poster_path;
      
      return isFilipino && hasAdultThemes && hasPoster;
    });
    
    // If not enough Filipino similar content, fetch recommendations
    if (vivamaxContent.length < 3) {
      const recUrl = `${BASE_URL}/${contentType}/${item.id}/recommendations?api_key=${API_KEY}&include_adult=true`;
      const recRes = await fetch(recUrl);
      
      if (!recRes.ok) {
        throw new Error(`Recommendations API responded with status: ${recRes.status}`);
      }
      
      const recData = await recRes.json();
      
      // Filter for adult Filipino content
      const vivamaxRecs = recData.results.filter(content => {
        // Check for Filipino language or Philippines origin
        const isFilipino = 
          content.original_language === 'tl' || 
          content.original_language === 'fil' || 
          (content.origin_country && content.origin_country.includes('PH')) ||
          // Check title or overview for Filipino/Tagalog/Pinoy keywords
          (content.title && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(content.title))) ||
          (content.overview && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(content.overview)));
        
        // Check for adult themes in title or overview
        const hasAdultThemes = 
          (content.title && (/adult|mature|sexy|bold|desire|passion|forbidden|affair|romance|love|temptation/i.test(content.title))) ||
          (content.overview && (/adult|mature|sexy|bold|desire|passion|forbidden|affair|romance|love|temptation/i.test(content.overview)));
        
        // Must have a poster image
        const hasPoster = !!content.poster_path;
        
        return isFilipino && hasAdultThemes && hasPoster;
      });
      
      // Combine and remove duplicates
      const combined = [...vivamaxContent];
      vivamaxRecs.forEach(rec => {
        if (!combined.some(content => content.id === rec.id)) {
          // Add media type to the content
          rec.media_type = contentType;
          // Normalize property names for movies
          rec.name = rec.title;
          rec.first_air_date = rec.release_date;
          combined.push(rec);
        }
      });
      
      // Add media type to all content items
      vivamaxContent.forEach(content => {
        content.media_type = contentType;
        // Normalize property names for movies
        content.name = content.title;
        content.first_air_date = content.release_date;
      });
      
      displaySimilarContent(combined.slice(0, 6));
    } else {
      // Add media type to all content items
      vivamaxContent.forEach(content => {
        content.media_type = contentType;
        // Normalize property names for movies
        content.name = content.title;
        content.first_air_date = content.release_date;
      });
      
      displaySimilarContent(vivamaxContent.slice(0, 6));
    }
  } catch (error) {
    console.error('Error fetching similar content:', error);
    displaySimilarContent([]);
  }
}

// Function to display similar content
function displaySimilarContent(shows) {
  const similarContainer = document.getElementById('similar-content-list');
  similarContainer.innerHTML = '';
  
  if (shows.length === 0) {
    similarContainer.innerHTML = '<p class="no-similar">No similar content found</p>';
    return;
  }
  
  shows.forEach(show => {
    if (!show.poster_path) return;
    
    // Determine content type icon and label
    const typeIcon = 'fa-film';
    const typeLabel = 'Movie';
    
    const similarItem = document.createElement('div');
    similarItem.className = 'similar-item';
    similarItem.onclick = () => {
      showDetails(show);
    };
    
    // Create image container for badge positioning
    const imgContainer = document.createElement('div');
    imgContainer.className = 'similar-img-container';
    
    const img = document.createElement('img');
    img.src = `${IMG_URL}${show.poster_path}`;
    img.alt = show.name;
    img.loading = 'lazy';
    
    // Create content type badge
    const badge = document.createElement('div');
    badge.className = 'content-type-badge similar-badge';
    badge.innerHTML = `<i class="fas ${typeIcon}"></i> ${typeLabel}`;
    
    // Create title element
    const title = document.createElement('p');
    title.className = 'similar-title';
    title.textContent = show.name;
    
    // Assemble the components
    imgContainer.appendChild(img);
    imgContainer.appendChild(badge);
    similarItem.appendChild(imgContainer);
    similarItem.appendChild(title);
    similarContainer.appendChild(similarItem);
  });
}

// Function to change server
function changeServer() {
  const server = document.getElementById('server').value;
  let embedURL = "";
  
  // Determine if it's a movie or TV show
  const mediaType = currentItem.media_type || 'movie';
  const contentType = 'movie'; // Always movie
  
  switch(server) {
    case "2embed":
      embedURL = `https://www.2embed.cc/embed/${currentItem.id}`;
      break;
    case "superembed":
      embedURL = `https://multiembed.mov/?video_id=${currentItem.id}&tmdb=1`;
      break;
    case "vidsrc":
      embedURL = `https://vidsrc.to/embed/${contentType}/${currentItem.id}`;
      break;
    case "vidsrcme":
      embedURL = `https://vidsrc.me/embed/${contentType}/${currentItem.id}`;
      break;
    case "vidsrcpro":
      embedURL = `https://vidsrc.pro/embed/${contentType}/${currentItem.id}`;
      break;
    case "vidsrcto":
      embedURL = `https://vidsrc.to/embed/${contentType}/${currentItem.id}`;
      break;
    case "vidsrcstream":
      embedURL = `https://vidsrc.stream/embed/${contentType}/${currentItem.id}`;
      break;
  }
  
  const quality = document.getElementById('quality').value;
  if (quality !== 'auto') {
    embedURL += `?quality=${quality}`;
  }

  document.getElementById('modal-video').src = embedURL;
  
  // Add a note about server selection
  const serverNote = document.querySelector('.server-note span');
  serverNote.innerHTML = `If the current server is not working, please select another server from the options below. To enable subtitles, click the settings icon in the video player.`;
}

// Function to change quality
function changeQuality() {
  changeServer();
}

// Pagination functions
function nextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    loadVivamaxContent();
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    loadVivamaxContent();
  }
}

function updatePaginationButtons() {
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = currentPage === totalPages;
}

// Search functions
function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
}

async function searchVivamaxContent() {
  const query = document.getElementById('search-input').value;
  if (!query.trim()) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }
  
  try {
    const container = document.getElementById('search-results');
    container.innerHTML = '';
    let searchResults = [];
    
    // Adult content keywords to combine with the search query
    const adultKeywords = ['Vivamax', 'adult', 'mature', 'sexy', 'bold'];
    
    // Search with each adult keyword combination
    for (const keyword of adultKeywords) {
      const searchQuery = `${query} ${keyword}`;
      const movieRes = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${searchQuery}&include_adult=true`);
      
      if (!movieRes.ok) continue;
      
      const movieData = await movieRes.json();
      
      if (movieData.results && movieData.results.length > 0) {
        // Filter for likely adult Pinoy content
        const filteredResults = movieData.results.filter(movie => {
          // Check for Filipino language or Philippines origin
          const isFilipino = 
            movie.original_language === 'tl' || 
            movie.original_language === 'fil' || 
            (movie.origin_country && movie.origin_country.includes('PH')) ||
            // Check title or overview for Filipino/Tagalog/Pinoy keywords
            (movie.title && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(movie.title))) ||
            (movie.overview && (/filipino|tagalog|pinoy|pilipino|vivamax/i.test(movie.overview)));
          
          // Check for adult themes in title or overview
          const hasAdultThemes = 
            (movie.title && (/adult|mature|sexy|bold|desire|passion|forbidden|affair|romance|love|temptation/i.test(movie.title))) ||
            (movie.overview && (/adult|mature|sexy|bold|desire|passion|forbidden|affair|romance|love|temptation/i.test(movie.overview)));
          
          // Must have a poster image
          const hasPoster = !!movie.poster_path;
          
          return isFilipino && hasAdultThemes && hasPoster;
        });
        
        filteredResults.forEach(movie => {
          // Only add if not already in results
          if (!searchResults.some(item => item.id === movie.id)) {
            // Add a type property to identify as movie
            movie.media_type = 'movie';
            // Normalize property names
            movie.name = movie.title;
            movie.first_air_date = movie.release_date;
            // Add Vivamax tag for display
            movie.is_vivamax = true;
            searchResults.push(movie);
          }
        });
      }
    }
    
    // If no results, try with Filipino language filter specifically for adult content
    if (searchResults.length === 0) {
      const filipinoRes = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&with_original_language=tl&include_adult=true`);
      
      if (filipinoRes.ok) {
        const filipinoData = await filipinoRes.json();
        
        // Filter for adult themes
        const filteredResults = filipinoData.results.filter(movie => {
          // Check for adult themes in title or overview
          const hasAdultThemes = 
            (movie.title && (/adult|mature|sexy|bold|desire|passion|forbidden|affair|romance|love|temptation/i.test(movie.title))) ||
            (movie.overview && (/adult|mature|sexy|bold|desire|passion|forbidden|affair|romance|love|temptation/i.test(movie.overview)));
          
          // Must have a poster image
          const hasPoster = !!movie.poster_path;
          
          return hasAdultThemes && hasPoster;
        });
        
        filteredResults.forEach(movie => {
          // Only add if not already in results
          if (!searchResults.some(item => item.id === movie.id)) {
            // Add a type property to identify as movie
            movie.media_type = 'movie';
            // Normalize property names
            movie.name = movie.title;
            movie.first_air_date = movie.release_date;
            // Add Vivamax tag for display
            movie.is_vivamax = true;
            searchResults.push(movie);
          }
        });
      }
    }
    
    // Sort by popularity
    searchResults = searchResults.sort((a, b) => b.popularity - a.popularity);
    
    if (searchResults.length === 0) {
      // If no exact Vivamax content found, try a broader search
      const broadSearchUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}+Filipino+adult`;
      const broadRes = await fetch(broadSearchUrl);
      
      if (!broadRes.ok) {
        throw new Error(`Broad search API responded with status: ${broadRes.status}`);
      }
      
      const broadData = await broadRes.json();
      
      // Filter for movies only with posters
      const broadResults = broadData.results.filter(item => item.poster_path);
      
      // Normalize property names for movies
      broadResults.forEach(item => {
        item.media_type = 'movie';
        item.name = item.title;
        item.first_air_date = item.release_date;
        // Mark as adult content
        item.is_adult = true;
        // Add R-18 tag if it has R-18 keywords
        item.is_r18 = 
          (item.title && (/r-18|r18|adult|mature|x-rated|xxx|nsfw|18\+/i.test(item.title))) ||
          (item.overview && (/r-18|r18|adult|mature|x-rated|xxx|nsfw|18\+/i.test(item.overview)));
        // Add Vivamax tag for display
        item.is_vivamax = true;
      });
      
      if (broadResults.length === 0) {
        container.innerHTML = '<div class="no-results">No Vivamax content found</div>';
        return;
      }
      
      // Display broad search results
      broadResults.forEach(item => {
        if (!item.poster_path) return;
        
        // Create card
        const card = document.createElement('div');
        card.className = 'search-card adult-content-card'; // Add adult-content-card class
        
        // Create HTML for the card
        let cardHTML = `
          <div class="card-img-container">
            <img src="${IMG_URL}${item.poster_path}" alt="${item.name}" loading="lazy" />
            <div class="content-type-badge search-badge">
              <i class="fas fa-film"></i> Movie
            </div>`;
        
        // Add Vivamax badge if it's a Vivamax movie
        if (item.is_vivamax) {
          cardHTML += `<div class="vivamax-badge">Vivamax</div>`;
        }
        
        // Add R-18 badge for adult content
        cardHTML += `<div class="adult-content-badge"><i class="fas fa-exclamation-circle"></i> 18+</div>`;
        
        // Add additional R-18 badge if specifically marked as R-18
        if (item.is_r18) {
          cardHTML += `<div class="r18-badge">R-18</div>`;
        }
        
        cardHTML += `
          </div>
          <div class="search-info">
            <h3>${item.name}</h3>
            <div class="search-meta">
              <span>${item.first_air_date?.split('-')[0] || 'N/A'}</span>
              <span class="adult-tag">Adult</span>
            </div>
          </div>
        `;
        
        card.innerHTML = cardHTML;
        
        card.onclick = () => {
          closeSearchModal();
          showDetails(item);
        };
        container.appendChild(card);
      });
      
      return;
    }
    
    // Display search results
    searchResults.forEach(item => {
      if (!item.poster_path) return;
      
      // Create card
      const card = document.createElement('div');
      card.className = 'search-card adult-content-card'; // Add adult-content-card class
      
      // Create HTML for the card
      let cardHTML = `
        <div class="card-img-container">
          <img src="${IMG_URL}${item.poster_path}" alt="${item.name}" loading="lazy" />
          <div class="content-type-badge search-badge">
            <i class="fas fa-film"></i> Movie
          </div>`;
      
      // Add Vivamax badge if it's a Vivamax movie
      if (item.is_vivamax) {
        cardHTML += `<div class="vivamax-badge">Vivamax</div>`;
      }
      
      // Add R-18 badge for adult content
      cardHTML += `<div class="adult-content-badge"><i class="fas fa-exclamation-circle"></i> 18+</div>`;
      
      // Add additional R-18 badge if specifically marked as R-18
      if (item.is_r18) {
        cardHTML += `<div class="r18-badge">R-18</div>`;
      }
      
      cardHTML += `
        </div>
        <div class="search-info">
          <h3>${item.name}</h3>
          <div class="search-meta">
            <span>${item.first_air_date?.split('-')[0] || 'N/A'}</span>
            <span class="adult-tag">Adult</span>
          </div>
        </div>
      `;
      
      card.innerHTML = cardHTML;
      
      card.onclick = () => {
        closeSearchModal();
        showDetails(item);
      };
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error searching Vivamax content:', error);
    document.getElementById('search-results').innerHTML = 
      '<div class="no-results">Error searching. Please try again later.</div>';
  }
}

// Toggle menu for mobile
function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('active');
}

// Donation popup functions
function openDonationPopup() {
  document.getElementById('donation-popup').classList.add('active');
}

function closeDonationPopup() {
  document.getElementById('donation-popup').classList.remove('active');
}

// Initialize
loadVivamaxContent();
