const API_KEY = '648c004c97b5a1425c702528ab88ddac';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;
let currentPage = 1;
let totalPages = 1;
let currentGenre = '';
let currentSort = 'popularity.desc';

// Genre mapping for TV shows
const GENRE_MAP = {
  '10759': 'Action & Adventure',
  '16': 'Animation',
  '35': 'Comedy',
  '80': 'Crime',
  '99': 'Documentary',
  '18': 'Drama',
  '10751': 'Family',
  '10762': 'Kids',
  '9648': 'Mystery',
  '10763': 'News',
  '10764': 'Reality',
  '10765': 'Sci-Fi & Fantasy',
  '10766': 'Soap',
  '10767': 'Talk',
  '10768': 'War & Politics',
  '37': 'Western'
};

async function fetchTVShows(page = 1, genre = '', sort = 'popularity.desc') {
  let url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&sort_by=${sort}&page=${page}&page_size=25`;
  if (genre) {
    url += `&with_genres=${genre}`;
  }
  const res = await fetch(url);
  const data = await res.json();
  totalPages = data.total_pages;
  return data.results.slice(0, 25);
}

function displayTVShows(tvshows) {
  const container = document.getElementById('tvshows-list');
  container.innerHTML = '';
  tvshows.forEach(show => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img src="${IMG_URL}${show.poster_path}" alt="${show.name}" />
      <div class="movie-info">
        <h3>${show.name}</h3>
        <div class="movie-meta">
          <span class="rating"><i class="fas fa-star"></i> ${Math.round(show.vote_average * 10) / 10}</span>
          <span class="year">${show.first_air_date?.split('-')[0]}</span>
        </div>
      </div>
    `;
    card.onclick = () => showDetails(show);
    container.appendChild(card);
  });
  addPagination();
}

function addPagination() {
  const container = document.getElementById('tvshows-list');
  const pagination = document.createElement('div');
  pagination.className = 'pagination';

  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      loadTVShows();
    }
  };

  // Page number
  const pageNum = document.createElement('span');
  pageNum.className = 'page-number';
  pageNum.textContent = `Page ${currentPage}`;

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.textContent = 'Next';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadTVShows();
    }
  };

  pagination.appendChild(prevBtn);
  pagination.appendChild(pageNum);
  pagination.appendChild(nextBtn);
  container.appendChild(pagination);
}

async function loadTVShows() {
  const tvshows = await fetchTVShows(currentPage, currentGenre, currentSort);
  displayTVShows(tvshows);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function filterTVShows() {
  currentGenre = document.getElementById('genre-filter').value;
  currentSort = document.getElementById('sort-filter').value;
  currentPage = 1;
  await loadTVShows();
}

// Original showDetails function that will be called after age verification if needed
function originalShowDetails(show) {
  currentItem = show;
  document.getElementById('modal-title').textContent = show.name;
  document.getElementById('modal-description').textContent = show.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${show.poster_path}`;
  
  // Update rating
  const rating = Math.round(show.vote_average * 10) / 10;
  document.getElementById('modal-rating').textContent = rating;
  
  // Update year
  const year = show.first_air_date?.split('-')[0];
  document.getElementById('modal-year').textContent = year;
  
  // Update genres
  const genresContainer = document.getElementById('modal-genres');
  genresContainer.innerHTML = '';
  show.genre_ids?.forEach(genreId => {
    const genre = GENRE_MAP[genreId];
    if (genre) {
      const span = document.createElement('span');
      span.textContent = genre;
      genresContainer.appendChild(span);
    }
  });

  // Fetch and display similar content
  fetchSimilarContent(show);

  changeServer();
  document.getElementById('modal').style.display = 'flex';
}

// Wrapper function that handles age verification before showing details
function showDetails(show) {
  // Check if the age verification module is available
  if (window.JFlixAgeVerification) {
    // Use the age verification system
    return window.JFlixAgeVerification.checkAgeAndShowContent(show, originalShowDetails);
  } else {
    // Fallback to original function if age verification module is not loaded
    return originalShowDetails(show);
  }
}

// Function to fetch similar content based on the selected TV show
async function fetchSimilarContent(show) {
  try {
    const res = await fetch(`${BASE_URL}/tv/${show.id}/similar?api_key=${API_KEY}`);
    const data = await res.json();
    
    displaySimilarContent(data.results.slice(0, 8)); // Display up to 8 similar shows
  } catch (error) {
    console.error('Error fetching similar content:', error);
  }
}

// Function to display similar content in the modal
function displaySimilarContent(shows) {
  const similarContainer = document.getElementById('similar-content-list');
  similarContainer.innerHTML = '';
  
  if (!shows || shows.length === 0) {
    similarContainer.innerHTML = '<p style="color: rgba(255,255,255,0.7);">No similar TV shows found.</p>';
    return;
  }
  
  shows.forEach(show => {
    if (!show.poster_path) return; // Skip shows without posters
    
    const similarItem = document.createElement('div');
    similarItem.classList.add('similar-item');
    similarItem.onclick = () => showDetails(show);
    
    const img = document.createElement('img');
    img.src = `${IMG_URL}${show.poster_path}`;
    img.alt = show.name;
    
    const title = document.createElement('div');
    title.classList.add('similar-item-title');
    title.textContent = show.name;
    
    similarItem.appendChild(img);
    similarItem.appendChild(title);
    similarContainer.appendChild(similarItem);
  });
}

function changeServer() {
  const server = document.getElementById('server').value;
  let embedURL = "";
  switch(server) {
    case "2embed":
      embedURL = `https://www.2embed.cc/embed/${currentItem.id}`;
      break;
    case "superembed":
      embedURL = `https://multiembed.mov/?video_id=${currentItem.id}&tmdb=1`;
      break;
    case "vidsrc":
      embedURL = `https://vidsrc.to/embed/tv/${currentItem.id}`;
      break;
    case "vidsrcme":
      embedURL = `https://vidsrc.me/embed/tv/${currentItem.id}`;
      break;
    case "vidsrcpro":
      embedURL = `https://vidsrc.pro/embed/tv/${currentItem.id}`;
      break;
    case "vidsrcto":
      embedURL = `https://vidsrc.to/embed/tv/${currentItem.id}`;
      break;
    case "vidsrcstream":
      embedURL = `https://vidsrc.stream/embed/tv/${currentItem.id}`;
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



function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
}

async function searchTVShows() {
  const query = document.getElementById('search-input').value;
  if (!query.trim()) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }
  
  try {
    const res = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${query}&page=1`);
    if (!res.ok) throw new Error('Failed to fetch search results');
    
    const data = await res.json();
    const container = document.getElementById('search-results');
    container.innerHTML = '';
    
    // Check if age verification module is available
    const ageVerificationAvailable = window.JFlixAgeVerification ? true : false;
    
    // Separate Pinoy adult content from regular content
    const regularContent = [];
    const pinoyAdultContent = [];
    
    data.results.forEach(show => {
      // Skip items without poster
      if (!show.poster_path) return;
      
      // Check if this is likely Pinoy adult content
      const isPinoyAdult = ageVerificationAvailable ? 
        window.JFlixAgeVerification.isPinoyAdult(show) : (
          // Fallback check if module not available
          (show.original_language === 'tl' || show.original_language === 'fil') &&
          ((show.name && /adult|mature|sexy|bold|desire|passion|forbidden|affair|vivamax/i.test(show.name)) ||
           (show.overview && /adult|mature|sexy|bold|desire|passion|forbidden|affair|vivamax/i.test(show.overview)))
        );
      
      if (isPinoyAdult) {
        pinoyAdultContent.push(show);
      } else {
        regularContent.push(show);
      }
    });
    
    // Combine results with regular content first, then adult content
    // This way, adult content will still be accessible but requires verification
    const combinedResults = [...regularContent, ...pinoyAdultContent];
    
    // Limit to first 10 results
    const limitedResults = combinedResults.slice(0, 10);
    
    if (limitedResults.length === 0) {
      container.innerHTML = '<div class="no-results">No TV shows found</div>';
      return;
    }
    
    limitedResults.forEach(show => {
      const card = document.createElement('div');
      card.className = 'search-card';
      
      // Add special class for Pinoy adult content
      if (ageVerificationAvailable && window.JFlixAgeVerification.isPinoyAdult(show)) {
        card.classList.add('adult-content-card');
      }
      
      card.innerHTML = `
        <img src="${IMG_URL}${show.poster_path}" alt="${show.name}" />
        <div class="search-info">
          <h3>${show.name}</h3>
          <div class="search-meta">
            <span class="rating"><i class="fas fa-star"></i> ${Math.round(show.vote_average * 10) / 10}</span>
            <span class="year">${show.first_air_date?.split('-')[0] || 'N/A'}</span>
          </div>
        </div>
      `;
      
      // Add adult content indicator for Pinoy adult content
      if (ageVerificationAvailable && window.JFlixAgeVerification.isPinoyAdult(show)) {
        const adultBadge = document.createElement('div');
        adultBadge.className = 'adult-content-badge';
        adultBadge.innerHTML = '<i class="fas fa-exclamation-circle"></i> 18+';
        card.appendChild(adultBadge);
      }
      
      card.onclick = () => {
        closeSearchModal();
        showDetails(show);
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
        Pinoy adult shows are primarily available on the 
        <a href="vivamax.html" class="vivamax-link">Vivamax page</a>.</span>
      `;
      container.appendChild(noteDiv);
    }
  } catch (error) {
    console.error('Search error:', error);
    container.innerHTML = '<div class="no-results">Error loading search results. Please try again.</div>';
  }
}

function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('active');
}

// Initialize
loadTVShows(); 