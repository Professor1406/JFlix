const API_KEY = '648c004c97b5a1425c702528ab88ddac';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;
let currentPage = 1;
let totalPages = 1;
let currentGenre = '';
let currentSort = 'popularity.desc';

// Genre mapping for Anime
const GENRE_MAP = {
  '16': 'Animation',
  '28': 'Action',
  '12': 'Adventure',
  '35': 'Comedy',
  '18': 'Drama',
  '14': 'Fantasy',
  '27': 'Horror',
  '9648': 'Mystery',
  '10749': 'Romance',
  '878': 'Sci-Fi',
  '53': 'Thriller'
};

async function fetchAnime(page = 1, genre = '', sort = 'popularity.desc') {
  let url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&sort_by=${sort}&page=${page}&with_original_language=ja&with_genres=16&page_size=25`;
  if (genre && genre !== '16') {
    url += `,${genre}`;
  }
  const res = await fetch(url);
  const data = await res.json();
  totalPages = data.total_pages;
  return data.results.slice(0, 25);
}

function displayAnime(animeList) {
  const container = document.getElementById('anime-list');
  container.innerHTML = '';
  animeList.forEach(anime => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img src="${IMG_URL}${anime.poster_path}" alt="${anime.name}" />
      <div class="movie-info">
        <h3>${anime.name}</h3>
        <div class="movie-meta">
          <span class="rating"><i class="fas fa-star"></i> ${Math.round(anime.vote_average * 10) / 10}</span>
          <span class="year">${anime.first_air_date?.split('-')[0]}</span>
        </div>
      </div>
    `;
    card.onclick = () => showDetails(anime);
    container.appendChild(card);
  });
  addPagination();
}

function addPagination() {
  const container = document.getElementById('anime-list');
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
      loadAnime();
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
      loadAnime();
    }
  };

  pagination.appendChild(prevBtn);
  pagination.appendChild(pageNum);
  pagination.appendChild(nextBtn);
  container.appendChild(pagination);
}

async function loadAnime() {
  const animeList = await fetchAnime(currentPage, currentGenre, currentSort);
  displayAnime(animeList);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function filterAnime() {
  currentGenre = document.getElementById('genre-filter').value;
  currentSort = document.getElementById('sort-filter').value;
  currentPage = 1;
  await loadAnime();
}

function showDetails(anime) {
  currentItem = anime;
  document.getElementById('modal-title').textContent = anime.name;
  document.getElementById('modal-description').textContent = anime.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${anime.poster_path}`;
  // Update rating
  const rating = Math.round(anime.vote_average * 10) / 10;
  document.getElementById('modal-rating').textContent = rating;
  // Update year
  const year = anime.first_air_date?.split('-')[0];
  document.getElementById('modal-year').textContent = year;
  // Update genres
  const genresContainer = document.getElementById('modal-genres');
  genresContainer.innerHTML = '';
  anime.genre_ids?.forEach(genreId => {
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

async function searchAnime() {
  const query = document.getElementById('search-input').value;
  if (!query.trim()) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }
  const res = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${query}&page=1`);
  const data = await res.json();
  const container = document.getElementById('search-results');
  container.innerHTML = '';
  const limitedResults = data.results.filter(item => item.original_language === 'ja' && item.genre_ids.includes(16)).slice(0, 10);
  if (limitedResults.length === 0) {
    container.innerHTML = '<div class="no-results">No anime found</div>';
    return;
  }
  limitedResults.forEach(anime => {
    if (!anime.poster_path) return;
    const card = document.createElement('div');
    card.className = 'search-card';
    card.innerHTML = `
      <img src="${IMG_URL}${anime.poster_path}" alt="${anime.name}" />
      <div class="search-info">
        <h3>${anime.name}</h3>
        <div class="search-meta">
          <span class="rating"><i class="fas fa-star"></i> ${Math.round(anime.vote_average * 10) / 10}</span>
          <span class="year">${anime.first_air_date?.split('-')[0] || 'N/A'}</span>
        </div>
      </div>
    `;
    card.onclick = () => {
      closeSearchModal();
      showDetails(anime);
    };
    container.appendChild(card);
  });
}

function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('active');
}

// Initialize
loadAnime(); 