const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
const API_KEY = '648c004c97b5a1425c702528ab88ddac';

// State variables
let currentItem = null;
let currentPage = 1;
let totalPages = 1;
let currentGenre = '';
let currentSort = 'popularity.desc';
let currentType = 'all'; // Can be 'all', 'tv', or 'movie'

// Genre mapping for Korean content (both TV shows and movies)
const GENRE_MAP = {
  // TV Show genres
  '18': 'Drama',
  '10749': 'Romance',
  '9648': 'Mystery',
  '35': 'Comedy',
  '10751': 'Family',
  '10759': 'Action & Adventure',
  '10765': 'Fantasy',
  '10768': 'War & Politics',
  
  // Movie genres
  '28': 'Action',
  '12': 'Adventure',
  '16': 'Animation',
  '80': 'Crime',
  '99': 'Documentary',
  '14': 'Fantasy',
  '36': 'History',
  '27': 'Horror',
  '10402': 'Music',
  '878': 'Science Fiction',
  '10770': 'TV Movie',
  '53': 'Thriller',
  '10752': 'War',
  '37': 'Western'
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  loadKDramas();
  
  // Show donation popup with 10% probability
  if (Math.random() < 0.1) {
    setTimeout(() => {
      document.getElementById('donation-popup').style.display = 'flex';
    }, 30000);
  }
});

async function fetchKDramas(page = 1, genre = '', sort = 'popularity.desc', type = 'all') {
  try {
    // Make sure we have a valid API key
    if (!API_KEY) {
      console.error('API key is missing');
      return [];
    }
    
    let combinedResults = [];
    let tvData = { results: [], total_pages: 0 };
    let movieData = { results: [], total_pages: 0 };
    
    // Fetch Korean TV shows if type is 'all' or 'tv'
    if (type === 'all' || type === 'tv') {
      // Use Korean language filter which is the most reliable indicator
      let tvUrl = `${BASE_URL}/discover/tv?api_key=${API_KEY}&sort_by=${sort}&page=${page}&with_original_language=ko`;
      if (genre) {
        tvUrl += `&with_genres=${genre}`;
      }
      
      const tvRes = await fetch(tvUrl);
      if (!tvRes.ok) {
        throw new Error(`TV API responded with status: ${tvRes.status}`);
      }
      
      tvData = await tvRes.json();
      
      // Add TV shows
      if (tvData.results && tvData.results.length > 0) {
        tvData.results.forEach(show => {
          // Prioritize shows from Korea, but include all Korean language content
          // as the API doesn't always provide complete origin country data
          show.media_type = 'tv';
          combinedResults.push(show);
        });
      }
    }
    
    // Fetch Korean movies if type is 'all' or 'movie'
    if (type === 'all' || type === 'movie') {
      // Use Korean language filter which is the most reliable indicator
      let movieUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=${sort}&page=${page}&with_original_language=ko`;
      if (genre) {
        movieUrl += `&with_genres=${genre}`;
      }
      
      const movieRes = await fetch(movieUrl);
      if (!movieRes.ok) {
        throw new Error(`Movie API responded with status: ${movieRes.status}`);
      }
      
      movieData = await movieRes.json();
      
      // Add movies
      if (movieData.results && movieData.results.length > 0) {
        movieData.results.forEach(movie => {
          // Add all Korean language movies as the API doesn't always provide
          // complete production country data
          movie.media_type = 'movie';
          // Normalize property names to match TV show format
          movie.name = movie.title;
          movie.first_air_date = movie.release_date;
          combinedResults.push(movie);
        });
      }
    }
    
    // Set total pages based on the content type
    if (type === 'tv') {
      totalPages = tvData.total_pages || 1;
    } else if (type === 'movie') {
      totalPages = movieData.total_pages || 1;
    } else {
      // For 'all', use the maximum of both
      totalPages = Math.max(tvData.total_pages || 1, movieData.total_pages || 1);
    }
    
    // Sort by popularity and return
    if (combinedResults.length > 0) {
      return combinedResults
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 25);
    }
    
    // If no results, try fallback
    throw new Error('No Korean content found in discover endpoints');
  } catch (error) {
    console.error('Error fetching Korean content:', error.message || 'Unknown error');
    
    // Fallback to trending Korean content
    try {
      const fallbackUrl = `${BASE_URL}/trending/all/week?api_key=${API_KEY}`;
      const fallbackRes = await fetch(fallbackUrl);
      
      if (!fallbackRes.ok) {
        throw new Error(`Fallback API responded with status: ${fallbackRes.status}`);
      }
      
      const fallbackData = await fallbackRes.json();
      
      // Filter for Korean language content
      const koreanContent = fallbackData.results.filter(item => item.original_language === 'ko');
      
      // Normalize property names for movies
      koreanContent.forEach(item => {
        if (item.media_type === 'movie') {
          item.name = item.title;
          item.first_air_date = item.release_date;
        }
      });
      
      if (koreanContent.length === 0) {
        console.warn('No Korean content found in trending');
      }
      
      return koreanContent.slice(0, 25);
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError.message || 'Unknown error');
      return [];
    }
  }
}

function displayKDramas(kdramas) {
  const container = document.getElementById('kdrama-list');
  container.innerHTML = '';
  
  if (!kdramas || kdramas.length === 0) {
    container.innerHTML = '<div class="no-results">No Korean content found. Try different filters.</div>';
    return;
  }
  
  kdramas.forEach(item => {
    if (!item.poster_path) return; // Skip items without posters
    
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    // Determine content type icon and label
    const typeIcon = item.media_type === 'movie' ? 'fa-film' : 'fa-tv';
    const typeLabel = item.media_type === 'movie' ? 'Movie' : 'TV Show';
    
    card.innerHTML = `
      <div class="card-img-container">
        <img src="${IMG_URL}${item.poster_path}" alt="${item.name}" loading="lazy" />
        <div class="content-type-badge">
          <i class="fas ${typeIcon}"></i> ${typeLabel}
        </div>
      </div>
      <div class="movie-info">
        <h3>${item.name}</h3>
        <div class="movie-meta">
          <span class="rating"><i class="fas fa-star"></i> ${Math.round(item.vote_average * 10) / 10}</span>
          <span class="year">${item.first_air_date?.split('-')[0] || 'N/A'}</span>
        </div>
      </div>
    `;
    
    card.onclick = () => showDetails(item);
    container.appendChild(card);
  });
}

// Load Korean dramas with current filters
async function loadKDramas() {
  document.getElementById('current-page').textContent = currentPage;
  const kdramas = await fetchKDramas(currentPage, currentGenre, currentSort, currentType);
  displayKDramas(kdramas);
  updatePaginationButtons();
}

// Pagination functions
async function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    await loadKDramas();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

async function nextPage() {
  currentPage++;
  await loadKDramas();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updatePaginationButtons() {
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = currentPage >= totalPages;
}

// Filter Korean dramas
function filterKDramas() {
  const genreSelect = document.getElementById('genre-filter');
  const typeSelect = document.getElementById('type-filter');
  const sortSelect = document.getElementById('sort-filter');
  
  currentGenre = genreSelect.value;
  currentType = typeSelect.value;
  currentSort = sortSelect.value;
  currentPage = 1;
  
  loadKDramas();
}

// Original showDetails function that will be called after age verification if needed
function originalShowDetails(item) {
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
    const contentType = item.media_type === 'movie' ? 'Movie' : 'TV Show';
    const typeIcon = item.media_type === 'movie' ? 'fa-film' : 'fa-tv';
    contentTypeEl.innerHTML = `<i class="fas ${typeIcon}"></i> ${contentType}`;
    contentTypeEl.style.display = 'inline-flex';
  }
  
  const genresContainer = document.getElementById('modal-genres');
  genresContainer.innerHTML = '';
  
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
    span.textContent = 'Korean Content';
    genresContainer.appendChild(span);
  }
  
  // Update the fetchSimilarContent function to pass the media type
  fetchSimilarContent(item);
  document.getElementById('modal').style.display = 'flex';
  changeServer();
}

// Wrapper function that handles age verification before showing details
function showDetails(item) {
  // Check if the age verification module is available
  if (window.JFlixAgeVerification) {
    // Use the age verification system
    return window.JFlixAgeVerification.checkAgeAndShowContent(item, originalShowDetails);
  } else {
    // Fallback to original function if age verification module is not loaded
    return originalShowDetails(item);
  }
}

// Function to fetch similar content based on the selected K-drama
async function fetchSimilarContent(item) {
  try {
    // Determine if it's a movie or TV show
    const mediaType = item.media_type || 'tv';
    const contentType = mediaType === 'movie' ? 'movie' : 'tv';
    
    // Fetch similar content based on media type
    const url = `${BASE_URL}/${contentType}/${item.id}/similar?api_key=${API_KEY}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Similar API responded with status: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Filter for Korean content by language
    const koreanContent = data.results.filter(content => content.original_language === 'ko');
    
    // If not enough Korean similar content, fetch recommendations
    if (koreanContent.length < 3) {
      const recUrl = `${BASE_URL}/${contentType}/${item.id}/recommendations?api_key=${API_KEY}`;
      const recRes = await fetch(recUrl);
      
      if (!recRes.ok) {
        throw new Error(`Recommendations API responded with status: ${recRes.status}`);
      }
      
      const recData = await recRes.json();
      
      // Filter for Korean content by language
      const koreanRecs = recData.results.filter(content => content.original_language === 'ko');
      
      // Combine and remove duplicates
      const combined = [...koreanContent];
      koreanRecs.forEach(rec => {
        if (!combined.some(content => content.id === rec.id)) {
          // Add media type to the content
          rec.media_type = contentType;
          // Normalize property names for movies
          if (contentType === 'movie') {
            rec.name = rec.title;
            rec.first_air_date = rec.release_date;
          }
          combined.push(rec);
        }
      });
      
      // Add media type to all content items
      koreanContent.forEach(content => {
        content.media_type = contentType;
        // Normalize property names for movies
        if (contentType === 'movie') {
          content.name = content.title;
          content.first_air_date = content.release_date;
        }
      });
      
      displaySimilarContent(combined.slice(0, 6));
    } else {
      // Add media type to all content items
      koreanContent.forEach(content => {
        content.media_type = contentType;
        // Normalize property names for movies
        if (contentType === 'movie') {
          content.name = content.title;
          content.first_air_date = content.release_date;
        }
      });
      
      displaySimilarContent(koreanContent.slice(0, 6));
    }
  } catch (error) {
    console.error('Error fetching similar content:', error.message || 'Unknown error');
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
    const typeIcon = show.media_type === 'movie' ? 'fa-film' : 'fa-tv';
    const typeLabel = show.media_type === 'movie' ? 'Movie' : 'TV Show';
    
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

function changeServer() {
  const server = document.getElementById('server').value;
  let embedURL = "";
  
  // Determine if it's a movie or TV show
  const mediaType = currentItem.media_type || 'tv';
  const contentType = mediaType === 'movie' ? 'movie' : 'tv';
  
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
}

function changeQuality() {
  if (document.getElementById('modal-video').src) {
    changeServer();
  }
}

// Close modal
function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('active');
}

// Search functions
function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
}

async function searchKDramas() {
  const query = document.getElementById('search-input').value;
  if (!query.trim()) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }
  
  try {
    // Search for Korean TV shows
    const tvRes = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${query}&with_original_language=ko`);
    if (!tvRes.ok) throw new Error(`TV search API responded with status: ${tvRes.status}`);
    const tvData = await tvRes.json();
    
    // Search for Korean movies
    const movieRes = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&with_original_language=ko`);
    if (!movieRes.ok) throw new Error(`Movie search API responded with status: ${movieRes.status}`);
    const movieData = await movieRes.json();
    
    const container = document.getElementById('search-results');
    container.innerHTML = '';
    
    // Filter for Korean TV shows by language
    const koreanTVResults = tvData.results.filter(item => item.original_language === 'ko');
    
    // Filter for Korean movies by language
    const koreanMovieResults = movieData.results.filter(item => item.original_language === 'ko');
    
    // Add media type to each result
    koreanTVResults.forEach(item => item.media_type = 'tv');
    koreanMovieResults.forEach(item => {
      item.media_type = 'movie';
      // Normalize property names
      item.name = item.title;
      item.first_air_date = item.release_date;
    });
    
    // Combine results
    let combinedResults = [...koreanTVResults, ...koreanMovieResults];
    
    // Check if age verification module is available
    const ageVerificationAvailable = window.JFlixAgeVerification ? true : false;
    
    // Separate regular content from Pinoy adult content
    const regularContent = [];
    const pinoyAdultContent = [];
    
    combinedResults.forEach(item => {
      // Skip items without poster
      if (!item.poster_path) return;
      
      // Check if this is likely Pinoy adult content incorrectly tagged as Korean
      const isPinoyAdult = ageVerificationAvailable ? 
        window.JFlixAgeVerification.isPinoyAdult(item) : (
          // Fallback check if module not available
          ((item.name && /vivamax|pinoy|filipino|tagalog|pilipino/i.test(item.name)) ||
           (item.overview && /vivamax|pinoy|filipino|tagalog|pilipino/i.test(item.overview))) &&
          ((item.name && /adult|mature|sexy|bold|desire|passion|forbidden|affair/i.test(item.name)) ||
           (item.overview && /adult|mature|sexy|bold|desire|passion|forbidden|affair/i.test(item.overview)))
        );
      
      if (isPinoyAdult) {
        pinoyAdultContent.push(item);
      } else {
        regularContent.push(item);
      }
    });
    
    // Combine results with regular content first, then adult content
    // This way, adult content will still be accessible but requires verification
    const filteredResults = [...regularContent, ...pinoyAdultContent];
    
    // Sort by popularity
    filteredResults.sort((a, b) => b.popularity - a.popularity);
    
    if (filteredResults.length === 0) {
      container.innerHTML = '<div class="no-results">No Korean content found</div>';
      return;
    }
    
    filteredResults.forEach(item => {
      if (!item.poster_path) return;
      
      // Determine content type icon and label
      const typeIcon = item.media_type === 'movie' ? 'fa-film' : 'fa-tv';
      const typeLabel = item.media_type === 'movie' ? 'Movie' : 'TV Show';
      
      const card = document.createElement('div');
      card.className = 'search-card';
      
      // Add special class for Pinoy adult content
      if (ageVerificationAvailable && window.JFlixAgeVerification.isPinoyAdult(item)) {
        card.classList.add('adult-content-card');
      }
      
      card.innerHTML = `
        <div class="card-img-container">
          <img src="${IMG_URL}${item.poster_path}" alt="${item.name}" loading="lazy" />
          <div class="content-type-badge search-badge">
            <i class="fas ${typeIcon}"></i> ${typeLabel}
          </div>
        </div>
        <div class="search-info">
          <h3>${item.name}</h3>
          <p>${item.first_air_date?.split('-')[0] || 'N/A'}</p>
        </div>
      `;
      
      // Add adult content indicator for Pinoy adult content
      if (ageVerificationAvailable && window.JFlixAgeVerification.isPinoyAdult(item)) {
        const adultBadge = document.createElement('div');
        adultBadge.className = 'adult-content-badge';
        adultBadge.innerHTML = '<i class="fas fa-exclamation-circle"></i> 18+';
        card.appendChild(adultBadge);
      }
      
      card.onclick = () => {
        closeSearchModal();
        showDetails(item);
      };
      container.appendChild(card);
    });
    
    // If we have Pinoy adult content in the results, show a message
    if (pinoyAdultContent.length > 0) {
      const noteDiv = document.createElement('div');
      noteDiv.className = 'search-note';
      noteDiv.innerHTML = `
        <i class="fas fa-info-circle"></i> 
        <span>Some adult content requires age verification. 
        Pinoy adult content is primarily available on the 
        <a href="vivamax.html" class="vivamax-link">Vivamax page</a>.</span>
      `;
      container.appendChild(noteDiv);
    }
  } catch (error) {
    console.error('Error searching Korean content:', error);
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
loadKDramas();
