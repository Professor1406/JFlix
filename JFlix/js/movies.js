const API_KEY = '648c004c97b5a1425c702528ab88ddac';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;
let currentPage = 1;
let totalPages = 1;
let currentGenre = '';
let currentSort = 'popularity.desc';

// Genre mapping
const GENRE_MAP = {
  '28': 'Action',
  '35': 'Comedy',
  '18': 'Drama',
  '27': 'Horror',
  '10749': 'Romance',
  '878': 'Sci-Fi'
};

async function fetchMovies(page = 1, genre = '', sort = 'popularity.desc') {
  let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=${sort}&page=${page}&with_watch_monetization_types=flatrate&page_size=25`;
  if (genre) {
    url += `&with_genres=${genre}`;
  }
  const res = await fetch(url);
  const data = await res.json();
  totalPages = data.total_pages;
  return data.results.slice(0, 25); // Always show 25 per page
}

function displayMovies(movies) {
  const container = document.getElementById('movies-list');
  container.innerHTML = '';
  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img src="${IMG_URL}${movie.poster_path}" alt="${movie.title}" />
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <div class="movie-meta">
          <span class="rating"><i class="fas fa-star"></i> ${Math.round(movie.vote_average * 10) / 10}</span>
          <span class="year">${movie.release_date?.split('-')[0]}</span>
        </div>
      </div>
    `;
    card.onclick = () => showDetails(movie);
    container.appendChild(card);
  });

  // Add pagination controls
  addPagination();
}

function addPagination() {
  const container = document.getElementById('movies-list');
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
      loadMovies();
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
      loadMovies();
    }
  };

  pagination.appendChild(prevBtn);
  pagination.appendChild(pageNum);
  pagination.appendChild(nextBtn);
  container.appendChild(pagination);
}

async function loadMovies() {
  const movies = await fetchMovies(currentPage, currentGenre, currentSort);
  displayMovies(movies);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function filterMovies() {
  currentGenre = document.getElementById('genre-filter').value;
  currentSort = document.getElementById('sort-filter').value;
  currentPage = 1;
  await loadMovies();
}

// Original showDetails function that will be called after age verification if needed
function originalShowDetails(movie) {
  currentItem = movie;
  document.getElementById('modal-title').textContent = movie.title;
  document.getElementById('modal-description').textContent = movie.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${movie.poster_path}`;
  
  // Update rating
  const rating = Math.round(movie.vote_average * 10) / 10;
  document.getElementById('modal-rating').textContent = rating;
  
  // Update year
  const year = movie.release_date?.split('-')[0];
  document.getElementById('modal-year').textContent = year;
  
  // Update genres
  const genresContainer = document.getElementById('modal-genres');
  genresContainer.innerHTML = '';
  movie.genre_ids?.forEach(genreId => {
    const genre = GENRE_MAP[genreId];
    if (genre) {
      const span = document.createElement('span');
      span.textContent = genre;
      genresContainer.appendChild(span);
    }
  });

  // Fetch and display similar content
  fetchSimilarContent(movie);

  changeServer();
  document.getElementById('modal').style.display = 'flex';
}

// Wrapper function that handles age verification before showing details
function showDetails(movie) {
  // Check if the age verification module is available
  if (window.JFlixAgeVerification) {
    // Use the age verification system
    return window.JFlixAgeVerification.checkAgeAndShowContent(movie, originalShowDetails);
  } else {
    // Fallback to original function if age verification module is not loaded
    return originalShowDetails(movie);
  }
}

// Function to fetch similar content based on the selected movie
async function fetchSimilarContent(movie) {
  try {
    console.log('Fetching similar content for movie:', movie);
    
    const url = `${BASE_URL}/movie/${movie.id}/similar?api_key=${API_KEY}`;
    console.log('Fetching from URL:', url);
    
    const res = await fetch(url);
    const data = await res.json();
    
    console.log('Similar content API response:', data);
    displaySimilarContent(data.results.slice(0, 8)); // Display up to 8 similar movies
  } catch (error) {
    console.error('Error fetching similar content:', error);
  }
}

// Function to display similar content in the modal
function displaySimilarContent(movies) {
  console.log('Displaying similar movies:', movies);
  const similarContainer = document.getElementById('similar-content-list');
  
  if (!similarContainer) {
    console.error('Similar content container not found in DOM');
    return;
  }
  
  console.log('Similar container found, clearing content');
  similarContainer.innerHTML = '';
  
  if (!movies || movies.length === 0) {
    console.log('No movies to display');
    similarContainer.innerHTML = '<p style="color: rgba(255,255,255,0.7);">No similar movies found.</p>';
    return;
  }
  
  console.log(`Adding ${movies.length} similar movies to container`);
  movies.forEach(movie => {
    if (!movie.poster_path) {
      console.log('Skipping movie without poster:', movie);
      return; // Skip movies without posters
    }
    
    console.log('Creating similar item for movie:', movie.title);
    const similarItem = document.createElement('div');
    similarItem.classList.add('similar-item');
    similarItem.onclick = () => showDetails(movie);
    
    const img = document.createElement('img');
    img.src = `${IMG_URL}${movie.poster_path}`;
    img.alt = movie.title;
    
    const title = document.createElement('div');
    title.classList.add('similar-item-title');
    title.textContent = movie.title;
    
    similarItem.appendChild(img);
    similarItem.appendChild(title);
    similarContainer.appendChild(similarItem);
  });
  
  console.log('Similar movies display complete');
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
      embedURL = `https://vidsrc.to/embed/movie/${currentItem.id}`;
      break;
    case "vidsrcme":
      embedURL = `https://vidsrc.me/embed/movie/${currentItem.id}`;
      break;
    case "vidsrcpro":
      embedURL = `https://vidsrc.pro/embed/movie/${currentItem.id}`;
      break;
    case "vidsrcto":
      embedURL = `https://vidsrc.to/embed/movie/${currentItem.id}`;
      break;
    case "vidsrcstream":
      embedURL = `https://vidsrc.stream/embed/movie/${currentItem.id}`;
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

async function searchMovies() {
  const query = document.getElementById('search-input').value;
  if (!query.trim()) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&page=1`);
    if (!res.ok) throw new Error('Failed to fetch search results');
    
    const data = await res.json();
    const container = document.getElementById('search-results');
    container.innerHTML = '';
    
    // Check if age verification module is available
    const ageVerificationAvailable = window.JFlixAgeVerification ? true : false;
    
    // Separate Pinoy adult content from regular content
    const regularContent = [];
    const pinoyAdultContent = [];
    
    data.results.forEach(movie => {
      // Skip items without poster
      if (!movie.poster_path) return;
      
      // Check if this is likely Pinoy adult content
      const isPinoyAdult = ageVerificationAvailable ? 
        window.JFlixAgeVerification.isPinoyAdult(movie) : (
          // Fallback check if module not available
          (movie.original_language === 'tl' || movie.original_language === 'fil') &&
          (movie.adult === true || 
           (movie.title && /adult|mature|sexy|bold|desire|passion|forbidden|affair|vivamax/i.test(movie.title)) ||
           (movie.overview && /adult|mature|sexy|bold|desire|passion|forbidden|affair|vivamax/i.test(movie.overview)))
        );
      
      if (isPinoyAdult) {
        pinoyAdultContent.push(movie);
      } else {
        regularContent.push(movie);
      }
    });
    
    // Combine results with regular content first, then adult content
    // This way, adult content will still be accessible but requires verification
    const combinedResults = [...regularContent, ...pinoyAdultContent];
    
    // Limit to first 10 results
    const limitedResults = combinedResults.slice(0, 10);
    
    if (limitedResults.length === 0) {
      container.innerHTML = '<div class="no-results">No movies found</div>';
      return;
    }

    limitedResults.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'search-card';
      
      // Add special class for Pinoy adult content
      if (ageVerificationAvailable && window.JFlixAgeVerification.isPinoyAdult(movie)) {
        card.classList.add('adult-content-card');
      }
      
      card.innerHTML = `
        <img src="${IMG_URL}${movie.poster_path}" alt="${movie.title}" />
        <div class="search-info">
          <h3>${movie.title}</h3>
          <div class="search-meta">
            <span class="rating"><i class="fas fa-star"></i> ${Math.round(movie.vote_average * 10) / 10}</span>
            <span class="year">${movie.release_date?.split('-')[0] || 'N/A'}</span>
          </div>
        </div>
      `;
      
      // Add adult content indicator for Pinoy adult content
      if (ageVerificationAvailable && window.JFlixAgeVerification.isPinoyAdult(movie)) {
        const adultBadge = document.createElement('div');
        adultBadge.className = 'adult-content-badge';
        adultBadge.innerHTML = '<i class="fas fa-exclamation-circle"></i> 18+';
        card.appendChild(adultBadge);
      }
      
      card.onclick = () => {
        closeSearchModal();
        showDetails(movie);
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
        Pinoy adult movies are primarily available on the 
        <a href="vivamax.html" class="vivamax-link">Vivamax page</a>.</span>
      `;
      container.appendChild(noteDiv);
    }
  } catch (error) {
    console.error('Search error:', error);
    const container = document.getElementById('search-results');
    container.innerHTML = '<div class="no-results">Error loading search results. Please try again.</div>';
  }
}

function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('active');
}

// Initialize
loadMovies(); 