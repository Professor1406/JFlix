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

function showDetails(movie) {
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

  changeServer();
  document.getElementById('modal').style.display = 'flex';
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

  const subtitle = document.getElementById('subtitle').value;
  if (subtitle !== 'none') {
    embedURL += (embedURL.includes('?') ? '&' : '?') + `subtitle=${subtitle}`;
  }

  document.getElementById('modal-video').src = embedURL;
}

function changeQuality() {
  if (document.getElementById('modal-video').src) {
    changeServer();
  }
}

function changeSubtitle() {
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
    
    // Limit to first 10 results
    const limitedResults = data.results.slice(0, 10);
    
    if (limitedResults.length === 0) {
      container.innerHTML = '<div class="no-results">No movies found</div>';
      return;
    }

    limitedResults.forEach(movie => {
      if (!movie.poster_path) return;
      const card = document.createElement('div');
      card.className = 'search-card';
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
      card.onclick = () => {
        closeSearchModal();
        showDetails(movie);
      };
      container.appendChild(card);
    });
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