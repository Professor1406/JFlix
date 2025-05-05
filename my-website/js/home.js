const API_KEY = '648c004c97b5a1425c702528ab88ddac'; // Replace with your TMDB API key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

// DOM Elements
const banner = document.getElementById('banner');
const bannerTitle = document.getElementById('banner-title');
const trendingList = document.getElementById('trending-list');
const moviesList = document.getElementById('movies-list');
const tvshowsList = document.getElementById('tvshows-list');
const animeList = document.getElementById('anime-list');
const modal = document.getElementById('modal');
const searchModal = document.getElementById('search-modal');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const serverSelector = document.getElementById('server');

// State
let currentContent = [];
let currentGenre = 'all';
let currentSort = 'popular';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTrending();
  loadMovies();
  loadTVShows();
  loadAnime();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  // Genre filter buttons
  document.querySelectorAll('.genre-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('.genre-btn.active').classList.remove('active');
      btn.classList.add('active');
      currentGenre = btn.dataset.genre;
      filterContent();
    });
  });

  // Sort dropdown
  document.getElementById('sort-by').addEventListener('change', (e) => {
    currentSort = e.target.value;
    sortContent();
  });

  // Search type filter
  document.getElementById('search-type').addEventListener('change', () => {
    searchTMDB();
  });

  // Scroll event for navbar
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// Content Loading Functions
async function loadTrending() {
  try {
    const response = await fetch(`${BASE_URL}/trending/all/week?api_key=${API_KEY}`);
    const data = await response.json();
    displayContent(data.results, trendingList);
  } catch (error) {
    console.error('Error loading trending:', error);
  }
}

async function loadMovies() {
  try {
    const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);
    const data = await response.json();
    displayContent(data.results, moviesList);
  } catch (error) {
    console.error('Error loading movies:', error);
  }
}

async function loadTVShows() {
  try {
    const response = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}`);
    const data = await response.json();
    displayContent(data.results, tvshowsList);
  } catch (error) {
    console.error('Error loading TV shows:', error);
  }
}

async function loadAnime() {
  try {
    const response = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16`);
    const data = await response.json();
    displayContent(data.results, animeList);
  } catch (error) {
    console.error('Error loading anime:', error);
  }
}

// Display Functions
function displayContent(items, container) {
  container.innerHTML = '';
  items.forEach(item => {
    const card = createContentCard(item);
    container.appendChild(card);
  });
}

function createContentCard(item) {
  const card = document.createElement('div');
  card.className = 'content-card';
  card.innerHTML = `
    <img src="${IMAGE_BASE_URL}${item.poster_path}" alt="${item.title || item.name}" />
    <div class="card-overlay">
      <h3>${item.title || item.name}</h3>
      <div class="card-rating">${Math.round(item.vote_average * 10) / 10} ★</div>
    </div>
  `;
  card.addEventListener('click', () => openModal(item));
  return card;
}

// Modal Functions
function openModal(item) {
  modal.style.display = 'block';
  document.getElementById('modal-image').src = `${IMAGE_BASE_URL}${item.poster_path}`;
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
  
  // Set up video player with error handling
  const videoFrame = document.getElementById('modal-video');
  videoFrame.dataset.itemId = item.id;
  videoFrame.dataset.mediaType = item.media_type || 'movie';
  
  try {
    const server = serverSelector.value;
    const videoUrl = getVideoUrl(item.id, server);
    videoFrame.src = videoUrl;
    
    // Add error event listener
    videoFrame.onerror = function() {
      console.error('Error loading video from server:', server);
      // Try next server in the list
      const currentIndex = Array.from(serverSelector.options).findIndex(option => option.value === server);
      const nextIndex = (currentIndex + 1) % serverSelector.options.length;
      const nextServer = serverSelector.options[nextIndex].value;
      serverSelector.value = nextServer;
      videoFrame.src = getVideoUrl(item.id, nextServer);
    };
  } catch (error) {
    console.error('Error setting up video player:', error);
  }
}

function closeModal() {
  modal.style.display = 'none';
  document.getElementById('modal-video').src = '';
}

// Search Functions
function openSearchModal() {
  searchModal.style.display = 'block';
  searchInput.focus();
}

function closeSearchModal() {
  searchModal.style.display = 'none';
  searchInput.value = '';
  searchResults.innerHTML = '';
}

async function searchTMDB() {
  const query = searchInput.value;
  const type = document.getElementById('search-type').value;
  
  if (query.length < 3) {
    searchResults.innerHTML = '';
    return;
  }

  try {
    let url = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
    if (type !== 'all') {
      url = `${BASE_URL}/search/${type}?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    displaySearchResults(data.results);
  } catch (error) {
    console.error('Error searching:', error);
  }
}

function displaySearchResults(results) {
  searchResults.innerHTML = '';
  results.forEach(result => {
    const card = createContentCard(result);
    searchResults.appendChild(card);
  });
}

// Filter and Sort Functions
function filterContent() {
  const allLists = [trendingList, moviesList, tvshowsList, animeList];
  allLists.forEach(list => {
    const cards = list.querySelectorAll('.content-card');
    cards.forEach(card => {
      const genres = card.dataset.genres || '';
      if (currentGenre === 'all' || genres.includes(currentGenre)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

function sortContent() {
  const allLists = [trendingList, moviesList, tvshowsList, animeList];
  allLists.forEach(list => {
    const cards = Array.from(list.querySelectorAll('.content-card'));
    cards.sort((a, b) => {
      switch (currentSort) {
        case 'rating':
          return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
        case 'newest':
          return new Date(b.dataset.date) - new Date(a.dataset.date);
        case 'oldest':
          return new Date(a.dataset.date) - new Date(b.dataset.date);
        default:
          return parseFloat(b.dataset.popularity) - parseFloat(a.dataset.popularity);
      }
    });
    cards.forEach(card => list.appendChild(card));
  });
}

// Server quality mapping
const serverQualities = {
  'vidsrc.to': '4K',
  '2embed.org': '1080p',
  'vidsrc.me': '1080p',
  'vidsrc.pro': '1080p',
  'vidsrc.stream': '1080p',
  'superembed.stream': '720p',
  'vidsrc.icu': '720p',
  'vidsrc.xyz': '720p',
  'vidsrc.cc': '720p',
  'vidsrc.net': '720p',
  'vidsrc.plus': '720p',
  'vidsrc.one': '720p',
  'vidsrc.two': '720p',
  'vidsrc.three': '720p',
  'vidsrc.four': '720p',
  'vidsrc.five': '720p',
  'vidsrc.six': '720p',
  'vidsrc.seven': '720p',
  'vidsrc.eight': '720p',
  'vidsrc.nine': '720p',
  'vidsrc.ten': '720p',
  'vidsrc.backup1': '720p',
  'vidsrc.backup2': '720p',
  'vidsrc.backup3': '720p',
  'vidsrc.backup4': '720p',
  'vidsrc.backup5': '720p'
};

function updateServerInfo(server) {
  const qualityElement = document.getElementById('server-quality');
  const statusElement = document.getElementById('server-status');
  
  qualityElement.textContent = `Quality: ${serverQualities[server] || 'Unknown'}`;
  statusElement.textContent = 'Status: Active';
}

function getVideoUrl(itemId, server) {
  const type = currentItem.media_type || 'movie';
  let embedUrl = '';

  // Premium Servers (4K/1080p)
  if (server === 'vidsrc.to') {
    embedUrl = `https://vidsrc.to/embed/${type}/${itemId}`;
  } else if (server === '2embed.org') {
    embedUrl = `https://2embed.org/embed/${type}/${itemId}`;
  } else if (server === 'vidsrc.me') {
    embedUrl = `https://vidsrc.me/embed/${type}/${itemId}`;
  } else if (server === 'vidsrc.pro') {
    embedUrl = `https://vidsrc.pro/embed/${type}/${itemId}`;
  } else if (server === 'vidsrc.stream') {
    embedUrl = `https://vidsrc.stream/embed/${type}/${itemId}`;
  }
  // HD Servers (720p)
  else if (server === 'superembed.stream') {
    embedUrl = `https://superembed.stream/e/${type}/${itemId}`;
  } else if (server === 'vidsrc.icu') {
    embedUrl = `https://vidsrc.icu/embed/${type}/${itemId}`;
  } else if (server === 'vidsrc.xyz') {
    embedUrl = `https://vidsrc.xyz/embed/${type}/${itemId}`;
  } else if (server === 'vidsrc.cc') {
    embedUrl = `https://vidsrc.cc/embed/${type}/${itemId}`;
  } else if (server === 'vidsrc.net') {
    embedUrl = `https://vidsrc.net/embed/${type}/${itemId}`;
  }
  // Alternative Servers
  else if (server.startsWith('vidsrc.')) {
    const domain = server.split('.')[1];
    embedUrl = `https://vidsrc.${domain}/embed/${type}/${itemId}`;
  }
  // Backup Servers
  else if (server.startsWith('vidsrc.backup')) {
    const backupNum = server.replace('vidsrc.backup', '');
    embedUrl = `https://vidsrc-backup${backupNum}.com/embed/${type}/${itemId}`;
  } else {
    // Default to premium server
    embedUrl = `https://vidsrc.to/embed/${type}/${itemId}`;
  }

  return embedUrl;
}

function changeServer() {
  const videoFrame = document.getElementById('modal-video');
  const errorMessage = document.querySelector('.video-error');
  const statusElement = document.getElementById('server-status');
  const currentItem = videoFrame.dataset.itemId;
  const server = serverSelector.value;
  
  // Update server info
  updateServerInfo(server);
  
  // Hide error message
  errorMessage.style.display = 'none';
  statusElement.textContent = 'Status: Loading...';
  
  try {
    const videoUrl = getVideoUrl(currentItem, server);
    videoFrame.src = videoUrl;
    
    // Add error event listener
    videoFrame.onerror = function() {
      console.error('Error loading video from server:', server);
      errorMessage.style.display = 'block';
      statusElement.textContent = 'Status: Failed';
      
      // Try next server in the same group first
      const currentGroup = serverSelector.selectedOptions[0].parentElement;
      const currentIndex = Array.from(currentGroup.options).findIndex(option => option.value === server);
      const nextIndex = (currentIndex + 1) % currentGroup.options.length;
      
      if (nextIndex !== currentIndex) {
        const nextServer = currentGroup.options[nextIndex].value;
        serverSelector.value = nextServer;
        videoFrame.src = getVideoUrl(currentItem, nextServer);
        updateServerInfo(nextServer);
      } else {
        // If no more servers in current group, try next group
        const nextGroup = currentGroup.nextElementSibling;
        if (nextGroup && nextGroup.tagName === 'OPTGROUP') {
          const nextServer = nextGroup.options[0].value;
          serverSelector.value = nextServer;
          videoFrame.src = getVideoUrl(currentItem, nextServer);
          updateServerInfo(nextServer);
        }
      }
    };

    // Add load event listener
    videoFrame.onload = function() {
      statusElement.textContent = 'Status: Active';
    };
  } catch (error) {
    console.error('Error changing server:', error);
    errorMessage.style.display = 'block';
    statusElement.textContent = 'Status: Error';
  }
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
  if (e.target === searchModal) {
    closeSearchModal();
  }
});