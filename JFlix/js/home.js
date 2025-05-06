const API_KEY = '648c004c97b5a1425c702528ab88ddac';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;
let trendingMovies = [];
let bannerIndex = 0;
let bannerInterval;

// Genre mapping
const GENRE_MAP = {
  'action': 28,
  'adventure': 12,
  'animation': 16,
  'comedy': 35,
  'crime': 80,
  'documentary': 99,
  'drama': 18,
  'family': 10751,
  'fantasy': 14,
  'horror': 27,
  'mystery': 9648,
  'romance': 10749,
  'sci-fi': 878,
  'thriller': 53,
  'war': 10752,
  'western': 37
};

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let allResults = [];
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );
    allResults = allResults.concat(filtered);
  }
  return allResults;
}

async function fetchByGenre(genreId) {
  const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`);
  const data = await res.json();
  return data.results;
}

function displayBanner(item) {
  const banner = document.getElementById('banner');
  banner.style.backgroundImage = `linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 100%), url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent = item.title || item.name;
  document.getElementById('banner-description').textContent = item.overview;

  // Genres
  const genreNames = (item.genre_ids || []).map(id => {
    const entry = Object.entries(GENRE_MAP).find(([_, gid]) => gid === id);
    return entry ? entry[0].charAt(0).toUpperCase() + entry[0].slice(1) : null;
  }).filter(Boolean);
  document.getElementById('banner-genre').textContent = genreNames.join(', ');

  // Rating
  const rating = Math.round((item.vote_average || 0) * 10) / 10;
  document.getElementById('banner-rating').innerHTML = `<i class='fas fa-star'></i> ${rating}`;

  // Year
  const year = (item.release_date || item.first_air_date || '').split('-')[0] || '';
  document.getElementById('banner-year').textContent = year;

  // Add click handlers for banner buttons
  document.querySelector('.play-btn').onclick = () => {
    currentItem = item;
    showDetails(item);
  };
  document.querySelector('.info-btn').onclick = () => showDetails(item);
}

function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img src="${IMG_URL}${item.poster_path}" alt="${item.title || item.name}" />
      <div class="movie-info">
        <h3>${item.title || item.name}</h3>
        <div class="movie-meta">
          <span class="rating"><i class="fas fa-star"></i> ${Math.round(item.vote_average * 10) / 10}</span>
          <span class="year">${(item.release_date || item.first_air_date)?.split('-')[0]}</span>
        </div>
      </div>
    `;
    card.onclick = () => showDetails(item);
    container.appendChild(card);
  });
}

function showDetails(item) {
  currentItem = item;
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  
  // Update rating
  const rating = Math.round(item.vote_average * 10) / 10;
  document.getElementById('modal-rating').textContent = rating;
  
  // Update year
  const year = (item.release_date || item.first_air_date)?.split('-')[0];
  document.getElementById('modal-year').textContent = year;
  
  // Update genres
  const genresContainer = document.getElementById('modal-genres');
  genresContainer.innerHTML = '';
  item.genre_ids?.forEach(genreId => {
    const genre = Object.entries(GENRE_MAP).find(([_, id]) => id === genreId)?.[0];
    if (genre) {
      const span = document.createElement('span');
      span.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
      genresContainer.appendChild(span);
    }
  });

  changeServer();
  document.getElementById('modal').style.display = 'flex';
}

function changeServer() {
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";

  switch(server) {
    case "2embed":
      embedURL = `https://www.2embed.cc/embed/${currentItem.id}`;
      break;
    case "superembed":
      embedURL = `https://multiembed.mov/?video_id=${currentItem.id}&tmdb=1`;
      break;
    case "vidsrc":
      embedURL = `https://vidsrc.to/embed/${type}/${currentItem.id}`;
      break;
    case "vidsrcme":
      embedURL = `https://vidsrc.me/embed/${type}/${currentItem.id}`;
      break;
    case "vidsrcpro":
      embedURL = `https://vidsrc.pro/embed/${type}/${currentItem.id}`;
      break;
    case "vidsrcto":
      embedURL = `https://vidsrc.to/embed/${type}/${currentItem.id}`;
      break;
    case "vidsrcstream":
      embedURL = `https://vidsrc.stream/embed/${type}/${currentItem.id}`;
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

async function filterByGenre(genre) {
  const genreId = GENRE_MAP[genre];
  if (!genreId) return;

  const movies = await fetchByGenre(genreId);
  displayList(movies, 'movies-list');
  
  // Update section title
  document.querySelector('#movies-list').closest('.content-section').querySelector('h2').textContent = 
    `Top ${genre.charAt(0).toUpperCase() + genre.slice(1)} Movies`;
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

async function searchTMDB() {
  const query = document.getElementById('search-input').value;
  if (!query.trim()) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }

  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
  const data = await res.json();

  const container = document.getElementById('search-results');
  container.innerHTML = '';
  data.results.forEach(item => {
    if (!item.poster_path) return;
    const card = document.createElement('div');
    card.className = 'search-card';
    card.innerHTML = `
      <img src="${IMG_URL}${item.poster_path}" alt="${item.title || item.name}" />
      <div class="search-info">
        <h3>${item.title || item.name}</h3>
        <p>${item.media_type === 'movie' ? 'Movie' : 'TV Show'}</p>
      </div>
    `;
    card.onclick = () => {
      closeSearchModal();
      showDetails(item);
    };
    container.appendChild(card);
  });
}

function startBannerRotation() {
  if (!trendingMovies.length) return;
  clearInterval(bannerInterval);
  bannerInterval = setInterval(() => {
    bannerIndex = (bannerIndex + 1) % trendingMovies.length;
    displayBanner(trendingMovies[bannerIndex]);
  }, 7000); // 7 seconds
}

async function init() {
  const movies = await fetchTrending('movie');
  const tvShows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();

  trendingMovies = movies || [];
  bannerIndex = 0;
  if (trendingMovies.length > 0) {
    displayBanner(trendingMovies[0]);
    startBannerRotation();
  }
  displayList(movies, 'movies-list');
  displayList(tvShows, 'tvshows-list');
  displayList(anime, 'anime-list');
}

function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('active');
}

init();
