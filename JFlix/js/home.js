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

async function fetchTrendingVivamaxContent() {
  try {
    // Make sure we have a valid API key
    if (!API_KEY) {
      console.error('API key is missing');
      return [];
    }
    
    // Search for Vivamax movies - but only non-adult content for the home page
    const searchUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=Vivamax&page=1&include_adult=false`;
    const searchRes = await fetch(searchUrl);
    
    if (!searchRes.ok) {
      throw new Error(`Vivamax search API responded with status: ${searchRes.status}`);
    }
    
    const searchData = await searchRes.json();
    
    // Process search results
    let vivamaxMovies = [];
    if (searchData.results && searchData.results.length > 0) {
      searchData.results.forEach(movie => {
        // Filter out adult content with Filipino keywords
        const isPinoyAdult = (
          // Check for adult themes in title or overview
          ((movie.title && /adult|mature|sexy|bold|desire|passion|forbidden|affair/i.test(movie.title)) ||
           (movie.overview && /adult|mature|sexy|bold|desire|passion|forbidden|affair/i.test(movie.overview))) &&
          // Check for Filipino indicators
          ((movie.title && /pinoy|filipino|tagalog|pilipino/i.test(movie.title)) ||
           (movie.overview && /pinoy|filipino|tagalog|pilipino/i.test(movie.overview)) ||
           movie.original_language === 'tl' ||
           movie.original_language === 'fil')
        );
        
        // Only add non-adult Pinoy content to home page
        if (!isPinoyAdult) {
          // Add a type property to identify as movie
          movie.media_type = 'movie';
          // Normalize property names
          movie.name = movie.title;
          movie.first_air_date = movie.release_date;
          vivamaxMovies.push(movie);
        }
      });
    }
    
    // If we don't have enough results, try with Filipino movies (non-adult only)
    if (vivamaxMovies.length < 10) {
      // Try with Filipino language filter (tl - Tagalog) but exclude adult content
      const movieUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&page=1&with_original_language=tl&include_adult=false`;
      
      const movieRes = await fetch(movieUrl);
      if (!movieRes.ok) {
        throw new Error(`Movie API responded with status: ${movieRes.status}`);
      }
      
      const movieData = await movieRes.json();
      
      // Add movies
      if (movieData.results && movieData.results.length > 0) {
        movieData.results.forEach(movie => {
          // Only add if not already in results
          if (!vivamaxMovies.some(item => item.id === movie.id)) {
            // Filter out adult content with Filipino keywords
            const isPinoyAdult = (
              // Check for adult themes in title or overview
              ((movie.title && /adult|mature|sexy|bold|desire|passion|forbidden|affair/i.test(movie.title)) ||
               (movie.overview && /adult|mature|sexy|bold|desire|passion|forbidden|affair/i.test(movie.overview)))
            );
            
            // Only add non-adult content to home page
            if (!isPinoyAdult) {
              // Add a type property to identify as movie
              movie.media_type = 'movie';
              // Normalize property names
              movie.name = movie.title;
              movie.first_air_date = movie.release_date;
              // Add Vivamax tag for display
              movie.is_vivamax = true;
              vivamaxMovies.push(movie);
            }
          }
        });
      }
    }
    
    // Sort by popularity and return
    return vivamaxMovies
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);
  } catch (error) {
    console.error('Error fetching Vivamax content:', error);
    return [];
  }
}

async function fetchTrendingKDramas() {
  try {
    // Make sure we have a valid API key
    if (!API_KEY) {
      console.error('API key is missing');
      return [];
    }
    
    // Method 1: Get all trending content and filter for Korean content from Korea
    const trendingUrl = `${BASE_URL}/trending/all/week?api_key=${API_KEY}`;
    const trendingRes = await fetch(trendingUrl);
    
    if (!trendingRes.ok) {
      throw new Error(`Trending API responded with status: ${trendingRes.status}`);
    }
    
    const trendingData = await trendingRes.json();
    // Filter for Korean content by language
    const koreanTrending = trendingData.results.filter(item => item.original_language === 'ko');
    
    // Normalize property names for movies
    koreanTrending.forEach(item => {
      if (item.media_type === 'movie') {
        item.name = item.title;
        item.first_air_date = item.release_date;
      }
    });
    
    // If we have enough trending Korean content, return it
    if (koreanTrending.length >= 10) {
      return koreanTrending.slice(0, 20);
    }
    
    // Method 2: Use discover API for Korean TV shows
    const tvUrl = `${BASE_URL}/discover/tv?api_key=${API_KEY}&sort_by=popularity.desc&with_original_language=ko&page=1`;
    const tvRes = await fetch(tvUrl);
    
    if (!tvRes.ok) {
      throw new Error(`TV Discover API responded with status: ${tvRes.status}`);
    }
    
    const tvData = await tvRes.json();
    
    // Method 3: Use discover API for Korean movies
    const movieUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&with_original_language=ko&page=1`;
    const movieRes = await fetch(movieUrl);
    
    if (!movieRes.ok) {
      throw new Error(`Movie Discover API responded with status: ${movieRes.status}`);
    }
    
    const movieData = await movieRes.json();
    
    // Combine all results
    let combined = [...koreanTrending];
    
    // Add TV shows
    tvData.results.forEach(show => {
      if (!combined.some(existing => existing.id === show.id && existing.media_type === 'tv')) {
        show.media_type = 'tv';
        combined.push(show);
      }
    });
    
    // Add movies
    movieData.results.forEach(movie => {
      if (!combined.some(existing => existing.id === movie.id && existing.media_type === 'movie')) {
        movie.media_type = 'movie';
        movie.name = movie.title;
        movie.first_air_date = movie.release_date;
        combined.push(movie);
      }
    });
    
    if (combined.length === 0) {
      throw new Error('No Korean content found in any endpoints');
    }
    
    // Sort by popularity and return top 20
    return combined
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 20);
  } catch (error) {
    console.error('Error fetching Korean content:', error.message || 'Unknown error');
    
    // Fallback to popular Korean content
    try {
      // Try popular TV shows
      const tvUrl = `${BASE_URL}/tv/popular?api_key=${API_KEY}&page=1`;
      const tvRes = await fetch(tvUrl);
      
      if (!tvRes.ok) {
        throw new Error(`TV Fallback API responded with status: ${tvRes.status}`);
      }
      
      const tvData = await tvRes.json();
      const koreanShows = tvData.results.filter(show => show.original_language === 'ko');
      koreanShows.forEach(show => show.media_type = 'tv');
      
      // Try popular movies
      const movieUrl = `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=1`;
      const movieRes = await fetch(movieUrl);
      
      if (!movieRes.ok) {
        throw new Error(`Movie Fallback API responded with status: ${movieRes.status}`);
      }
      
      const movieData = await movieRes.json();
      const koreanMovies = movieData.results.filter(movie => movie.original_language === 'ko');
      koreanMovies.forEach(movie => {
        movie.media_type = 'movie';
        movie.name = movie.title;
        movie.first_air_date = movie.release_date;
      });
      
      // Combine and return
      const combined = [...koreanShows, ...koreanMovies];
      
      if (combined.length === 0) {
        console.warn('No Korean content found in popular endpoints');
        return [];
      }
      
      return combined
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 20);
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError.message || 'Unknown error');
      return [];
    }
  }
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

// Original showDetails function that will be called after age verification if needed
function originalShowDetails(item) {
  if (!item) {
    console.error('No item provided to showDetails');
    return;
  }
  
  currentItem = item;
  
  // Safely update modal elements if they exist
  const modalTitle = document.getElementById('modal-title');
  const modalDescription = document.getElementById('modal-description');
  const modalImage = document.getElementById('modal-image');
  const modalRating = document.getElementById('modal-rating');
  const modalYear = document.getElementById('modal-year');
  const genresContainer = document.getElementById('modal-genres');
  const modalElement = document.getElementById('modal');
  
  if (modalTitle) modalTitle.textContent = item.title || item.name || 'Unknown Title';
  if (modalDescription) modalDescription.textContent = item.overview || 'No description available';
  if (modalImage && item.poster_path) modalImage.src = `${IMG_URL}${item.poster_path}`;
  
  // Update rating
  const rating = Math.round((item.vote_average || 0) * 10) / 10;
  if (modalRating) modalRating.textContent = rating;
  
  // Update year
  const year = (item.release_date || item.first_air_date)?.split('-')[0] || 'Unknown';
  if (modalYear) modalYear.textContent = year;
  
  // Update genres
  if (genresContainer) {
    genresContainer.innerHTML = '';
    
    // Add R-18 tag if it's marked as R-18
    if (item.is_r18) {
      const r18Span = document.createElement('span');
      r18Span.className = 'genre-tag r18-tag';
      r18Span.textContent = 'R-18';
      genresContainer.appendChild(r18Span);
    }
    
    // Add Adult tag if it's adult content
    if (item.is_adult || item.adult) {
      const adultSpan = document.createElement('span');
      adultSpan.className = 'genre-tag adult-tag';
      adultSpan.textContent = 'Adult';
      genresContainer.appendChild(adultSpan);
    }
    
    // Add Vivamax tag if it's from Vivamax
    if (item.is_vivamax) {
      const vivamaxSpan = document.createElement('span');
      vivamaxSpan.className = 'genre-tag vivamax-tag';
      vivamaxSpan.textContent = 'Vivamax';
      genresContainer.appendChild(vivamaxSpan);
    }
    
    // Add regular genres
    item.genre_ids?.forEach(genreId => {
      const genre = Object.entries(GENRE_MAP).find(([_, id]) => id === genreId)?.[0];
      if (genre) {
        const span = document.createElement('span');
        span.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
        genresContainer.appendChild(span);
      }
    });
  }
  
  // Add adult content warning if needed
  const modalWarning = document.getElementById('modal-warning');
  if (modalWarning) {
    if (item.is_adult || item.adult || item.is_r18) {
      modalWarning.innerHTML = `
        <div class="modal-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <span>This content is for adults only (18+). Viewer discretion is advised.</span>
        </div>
      `;
      modalWarning.style.display = 'block';
    } else {
      modalWarning.innerHTML = '';
      modalWarning.style.display = 'none';
    }
  }

  // Fetch and display similar content
  fetchSimilarContent(item);

  // Try to change server, but don't fail if it doesn't work
  try {
    changeServer();
  } catch (error) {
    console.log('Error changing server:', error);
  }
  
  // Display the modal if it exists
  if (modalElement) modalElement.style.display = 'flex';
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

// Function to fetch similar content based on the selected item
async function fetchSimilarContent(item) {
  try {
    console.log('Fetching similar content for:', item);
    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    console.log('Content type determined as:', type);
    
    const url = `${BASE_URL}/${type}/${item.id}/similar?api_key=${API_KEY}`;
    console.log('Fetching from URL:', url);
    
    const res = await fetch(url);
    const data = await res.json();
    
    console.log('Similar content API response:', data);
    displaySimilarContent(data.results.slice(0, 8)); // Display up to 8 similar items
  } catch (error) {
    console.error('Error fetching similar content:', error);
  }
}

// Function to display similar content in the modal
function displaySimilarContent(items) {
  console.log('Displaying similar content items:', items);
  const similarContainer = document.getElementById('similar-content-list');
  
  if (!similarContainer) {
    console.error('Similar content container not found in DOM');
    return;
  }
  
  console.log('Similar container found, clearing content');
  similarContainer.innerHTML = '';
  
  if (!items || items.length === 0) {
    console.log('No items to display');
    similarContainer.innerHTML = '<p style="color: rgba(255,255,255,0.7);">No similar content found.</p>';
    return;
  }
  
  console.log(`Adding ${items.length} similar items to container`);
  items.forEach(item => {
    if (!item.poster_path) {
      console.log('Skipping item without poster:', item);
      return; // Skip items without posters
    }
    
    console.log('Creating similar item for:', item.title || item.name);
    const similarItem = document.createElement('div');
    similarItem.classList.add('similar-item');
    similarItem.onclick = () => showDetails(item);
    
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    
    const title = document.createElement('div');
    title.classList.add('similar-item-title');
    title.textContent = item.title || item.name;
    
    similarItem.appendChild(img);
    similarItem.appendChild(title);
    similarContainer.appendChild(similarItem);
  });
  
  console.log('Similar content display complete');
}

function changeServer() {
  const serverElement = document.getElementById('server');
  if (!serverElement) {
    console.log('Server element not found');
    return; // Exit if server element doesn't exist
  }
  
  const server = serverElement.value;
  if (!currentItem) {
    console.log('No current item selected');
    return; // Exit if no current item
  }
  
  const type = currentItem.first_air_date ? "tv" : "movie";
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



  document.getElementById('modal-video').src = embedURL;
}

function changeQuality() {
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
  try {
    const query = document.getElementById('search-input').value;
    if (!query.trim()) {
      document.getElementById('search-results').innerHTML = '';
      return;
    }

    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
    if (!res.ok) throw new Error(`Search API responded with status: ${res.status}`);
    
    const data = await res.json();
    const container = document.getElementById('search-results');
    container.innerHTML = '';
    
    // Check if age verification module is available
    const ageVerificationAvailable = window.JFlixAgeVerification ? true : false;
    
    // Separate regular content from Pinoy adult content
    const regularContent = [];
    const pinoyAdultContent = [];
    
    data.results.forEach(item => {
      // Skip items without poster
      if (!item.poster_path) return;
      
      // Check if this is likely Pinoy adult content
      const isPinoyAdult = ageVerificationAvailable ? 
        window.JFlixAgeVerification.isPinoyAdult(item) : (
          // Fallback check if module not available
          (item.original_language === 'tl' || item.original_language === 'fil') &&
          ((item.title && /adult|mature|sexy|bold|desire|passion|forbidden|affair|vivamax/i.test(item.title || '')) ||
           (item.name && /adult|mature|sexy|bold|desire|passion|forbidden|affair|vivamax/i.test(item.name || '')) ||
           (item.overview && /adult|mature|sexy|bold|desire|passion|forbidden|affair|vivamax/i.test(item.overview || '')))
        );
      
      if (isPinoyAdult) {
        pinoyAdultContent.push(item);
      } else {
        regularContent.push(item);
      }
    });
    
    // Combine results with regular content first, then adult content
    // This way, adult content will still be accessible but requires verification
    const combinedResults = [...regularContent, ...pinoyAdultContent];
    
    // Limit to first 10 results
    const limitedResults = combinedResults.slice(0, 10);
    
    if (limitedResults.length === 0) {
      container.innerHTML = '<div class="no-results">No results found. Try a different search term.</div>';
      return;
    }
    
    limitedResults.forEach(item => {
      const card = document.createElement('div');
      card.className = 'search-card';
      
      // Add special class for Pinoy adult content
      if (ageVerificationAvailable && window.JFlixAgeVerification.isPinoyAdult(item)) {
        card.classList.add('adult-content-card');
      }
      
      card.innerHTML = `
        <img src="${IMG_URL}${item.poster_path}" alt="${item.title || item.name}" />
        <div class="search-info">
          <h3>${item.title || item.name}</h3>
          <div class="search-meta">
            <span class="rating"><i class="fas fa-star"></i> ${Math.round((item.vote_average || 0) * 10) / 10}</span>
            <span class="year">${(item.release_date || item.first_air_date)?.split('-')[0] || 'N/A'}</span>
            <span class="type">${item.media_type === 'movie' ? 'Movie' : 'TV Show'}</span>
          </div>
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
    console.error('Search error:', error);
    const container = document.getElementById('search-results');
    container.innerHTML = '<div class="no-results">Error loading search results. Please try again.</div>';
  }
}

function startBannerRotation() {
  if (!trendingMovies.length) return;
  clearInterval(bannerInterval);
  bannerInterval = setInterval(() => {
    bannerIndex = (bannerIndex + 1) % trendingMovies.length;
    displayBanner(trendingMovies[bannerIndex]);
  }, 7000); // 7 seconds
}

// Function to display featured content
function displayFeaturedContent(items, category = 'all') {
  const featuredList = document.getElementById('featured-list');
  if (!featuredList) return;
  
  // Clear previous content
  featuredList.innerHTML = '';
  
  // Filter items based on category
  let filteredItems = [];
  if (category === 'all') {
    filteredItems = items;
  } else {
    filteredItems = items.filter(item => item.category === category);
    
    // Re-sort filtered items by popularity and release date
    filteredItems.sort((a, b) => {
      // First sort by popularity (higher popularity comes first)
      if (b.popularity !== a.popularity) {
        return b.popularity - a.popularity;
      }
      
      // If popularity is the same, sort by release date (newer comes first)
      const dateA = a.first_air_date || a.release_date || '1900-01-01';
      const dateB = b.first_air_date || b.release_date || '1900-01-01';
      return new Date(dateB) - new Date(dateA);
    });
  }
  
  // Limit to 8 items
  const limitedItems = filteredItems.slice(0, 8);
  
  // Create featured cards
  limitedItems.forEach(item => {
    if (!item.poster_path) return;
    
    const card = document.createElement('div');
    card.className = 'featured-card';
    card.onclick = () => showDetails(item);
    
    // Determine badge icon and text based on category
    let badgeIcon = 'fa-film';
    let badgeText = 'Movie';
    
    switch(item.category) {
      case 'movies':
        badgeIcon = 'fa-film';
        badgeText = 'Movie';
        break;
      case 'tvshows':
        badgeIcon = 'fa-tv';
        badgeText = 'TV Show';
        break;
      case 'kdrama':
        badgeIcon = 'fa-heart';
        badgeText = 'K-Drama';
        break;
      case 'anime':
        badgeIcon = 'fa-dragon';
        badgeText = 'Anime';
        break;
    }
    
    // Format date to show month and year
    const releaseDate = item.first_air_date || item.release_date;
    const formattedDate = releaseDate ? new Date(releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'N/A';
    
    // Format popularity score (higher is better)
    const popularityScore = Math.round(item.popularity);
    
    // Create card HTML
    card.innerHTML = `
      <img src="${IMG_URL}${item.poster_path}" alt="${item.name}" class="featured-card-img" loading="lazy">
      <div class="featured-card-badge">
        <i class="fas ${badgeIcon}"></i> ${badgeText}
      </div>
      <div class="featured-card-overlay">
        <h3 class="featured-card-title">${item.name}</h3>
        <div class="featured-card-meta">
          <span><i class="fas fa-star"></i> ${Math.round(item.vote_average * 10) / 10}</span>
          <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
          <span><i class="fas fa-fire"></i> ${popularityScore}</span>
        </div>
      </div>
    `;
    
    featuredList.appendChild(card);
  });
}

// Function to initialize featured tabs
function initFeaturedTabs(allFeaturedItems) {
  const tabs = document.querySelectorAll('.featured-tab');
  if (!tabs.length) return;
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Get category and filter content
      const category = tab.getAttribute('data-category');
      displayFeaturedContent(allFeaturedItems, category);
    });
  });
}

async function init() {
  console.log('Initializing JFlix homepage...');
  try {
    const movies = await fetchTrending('movie');
    const tvShows = await fetchTrending('tv');
    const anime = await fetchTrendingAnime();
    const kdramas = await fetchTrendingKDramas();
    // Vivamax content loading removed from homepage
    console.log('Content loaded successfully');
    
    if (!movies || !movies.length) {
      console.error('No movies loaded');
    }

    trendingMovies = movies || [];
    bannerIndex = 0;
    if (trendingMovies.length > 0) {
      displayBanner(trendingMovies[0]);
      startBannerRotation();
    }
  
    // Prepare featured content
    const featuredMovies = movies.slice(0, 5).map(item => ({
      ...item,
      category: 'movies'
    }));
    
    const featuredTVShows = tvShows.slice(0, 5).map(item => ({
      ...item,
      category: 'tvshows'
    }));
    
    const featuredAnime = anime.slice(0, 5).map(item => ({
      ...item,
      category: 'anime'
    }));
    
    const featuredKDramas = kdramas.slice(0, 5).map(item => ({
      ...item,
      category: 'kdrama'
    }));
    
    // Combine all featured content
    const allFeaturedItems = [
      ...featuredMovies,
      ...featuredTVShows,
      ...featuredKDramas,
      ...featuredAnime
    ].sort((a, b) => {
      // First sort by popularity (higher popularity comes first)
      if (b.popularity !== a.popularity) {
        return b.popularity - a.popularity;
      }
      
      // If popularity is the same, sort by release date (newer comes first)
      const dateA = a.first_air_date || a.release_date || '1900-01-01';
      const dateB = b.first_air_date || b.release_date || '1900-01-01';
      return new Date(dateB) - new Date(dateA);
    });
    
    // Initialize featured tabs
    initFeaturedTabs(allFeaturedItems);
    
    // Display featured content (all categories)
    displayFeaturedContent(allFeaturedItems, 'all');
    
    // Display regular content sections
    displayList(movies, 'movies-list');
    displayList(tvShows, 'tvshows-list');
    displayList(anime, 'anime-list');
    displayList(kdramas, 'kdrama-list');
    // Vivamax display removed from homepage
    
    console.log('Loaded trending K-dramas:', kdramas.length);
    // Vivamax logging removed
  } catch (error) {
    console.error('Error initializing homepage:', error);
  }
}

function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('active');
}

init();
