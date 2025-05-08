// Age Verification Module for JFlix
// This module handles age verification for Pinoy adult content across the site

// Set up global error handler to catch and log all JavaScript errors
window.addEventListener('error', function(event) {
  console.error('Global error caught:', event.error);
  console.error('Error message:', event.message);
  console.error('Error source:', event.filename, 'line:', event.lineno, 'column:', event.colno);
  // Don't prevent default to allow normal error handling
});

// Global variables
let isPinoyAdultContent = false;
let pendingContentItem = null;
let originalShowDetailsFunction = null;

// Function to initialize the age verification system
function initAgeVerificationSystem() {
  try {
    // Check if we already have the age verification overlay
    if (document.getElementById('global-age-verification')) {
      console.log('Age verification system already initialized');
      return; // Already initialized
    }
    
    console.log('Initializing age verification system...');
    
    // Create age verification overlay
    const ageVerificationHTML = `
      <div class="age-verification-overlay" id="global-age-verification" style="display: none;">
        <div class="age-verification-container">
          <i class="fas fa-exclamation-triangle warning-icon"></i>
          <h2>Age Verification Required</h2>
          <p>The content you are trying to access contains mature themes intended for adult audiences only. You must be at least 18 years old to view this content.</p>
          <div class="search-note">
            <i class="fas fa-info-circle"></i> Note: Pinoy adult movies are primarily available on the <a href="vivamax.html" class="vivamax-link">Vivamax page</a>.
          </div>
          
          <div class="age-verification-form">
            <div class="form-group">
              <label>Please enter your date of birth:</label>
              <div class="date-inputs">
                <select id="global-birth-month" aria-label="Birth Month">
                  <option value="">Month</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
                
                <select id="global-birth-day" aria-label="Birth Day">
                  <option value="">Day</option>
                  <!-- Days will be populated by JavaScript -->
                </select>
                
                <select id="global-birth-year" aria-label="Birth Year">
                  <option value="">Year</option>
                  <!-- Years will be populated by JavaScript -->
                </select>
              </div>
            </div>
            
            <button id="global-verify-age" disabled>Verify Age & Continue</button>
            <div class="error-message" id="global-age-error"></div>
          </div>
          
          <div class="age-verification-footer">
            <p>By continuing, you confirm that you are at least 18 years old and agree to view adult content.</p>
            <button class="exit-button" id="global-exit-button">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    try {
      // Add the overlay to the body
      const overlayDiv = document.createElement('div');
      overlayDiv.innerHTML = ageVerificationHTML;
      
      // Check if body exists before appending
      if (document.body) {
        document.body.appendChild(overlayDiv.firstElementChild);
        console.log('Age verification overlay added to DOM');
      } else {
        console.error('Document body not available for age verification overlay');
        return; // Exit if body isn't available
      }
    } catch (appendError) {
      console.error('Error appending age verification overlay:', appendError);
      return; // Exit on append error
    }
    
    try {
      // Populate days dropdown
      populateDays();
      console.log('Days dropdown populated');
    } catch (daysError) {
      console.error('Error populating days dropdown:', daysError);
      // Continue even if days population fails
    }
    
    try {
      // Populate years dropdown (100 years back from current year)
      const currentYear = new Date().getFullYear();
      const birthYear = document.getElementById('global-birth-year');
      
      if (!birthYear) {
        console.error('Birth year element not found');
        return; // Exit if element not found
      }
      
      for (let year = currentYear; year >= currentYear - 100; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        birthYear.appendChild(option);
      }
      console.log('Years dropdown populated');
      
      // Set up event listeners for the age verification form
      try {
        setupAgeVerificationListeners();
      } catch (listenerError) {
        console.error('Error setting up age verification listeners:', listenerError);
      }
    } catch (yearsError) {
      console.error('Error populating years dropdown:', yearsError);
    }
  } catch (error) {
    console.error('Error in initAgeVerificationSystem:', error);
    console.log('Error details:', error.message, error.stack);
  }
}

// Function to set up event listeners for age verification
function setupAgeVerificationListeners() {
  try {
    // Get form elements
    const birthMonth = document.getElementById('global-birth-month');
    const birthDay = document.getElementById('global-birth-day');
    const birthYear = document.getElementById('global-birth-year');
    const verifyButton = document.getElementById('global-verify-age');
    const exitButton = document.getElementById('global-exit-button');
    const errorMessage = document.getElementById('global-age-error');
    
    if (!birthMonth || !birthDay || !birthYear || !verifyButton || !exitButton) {
      console.error('One or more age verification elements not found');
      return;
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
    verifyButton.addEventListener('click', verifyAge);
    
    // Handle exit button
    exitButton.addEventListener('click', function() {
      hideAgeVerification();
      // Reset pending content
      pendingContentItem = null;
      originalShowDetailsFunction = null;
    });
    
    console.log('Age verification listeners set up successfully');
  } catch (error) {
    console.error('Error setting up age verification listeners:', error);
  }
}

// Function to verify user's age
function verifyAge() {
  try {
    const birthMonth = document.getElementById('global-birth-month');
    const birthDay = document.getElementById('global-birth-day');
    const birthYear = document.getElementById('global-birth-year');
    const errorMessage = document.getElementById('global-age-error');
    
    if (!birthMonth || !birthDay || !birthYear || !errorMessage) {
      console.error('One or more age verification elements not found in verifyAge');
      return;
    }
    
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
      sessionStorage.setItem('jflix_age_verified', 'true');
      
      // Also set Vivamax verification for compatibility
      sessionStorage.setItem('vivamax_age_verified', 'true');
      
      // Hide verification overlay
      hideAgeVerification();
      
      // Mark the pending content as verified if it exists
      if (pendingContentItem) {
        pendingContentItem.age_verified = true;
      }
      
      // Continue with showing the content
      if (pendingContentItem && typeof originalShowDetailsFunction === 'function') {
        console.log('Showing content after age verification:', pendingContentItem.title || pendingContentItem.name);
        originalShowDetailsFunction(pendingContentItem);
        pendingContentItem = null;
      }
    } else {
      errorMessage.textContent = 'You must be at least 18 years old to access this content.';
    }
  } catch (error) {
    console.error('Error in verifyAge function:', error);
  }
}
  
// Populate days based on selected month
function populateDays() {
  try {
    const birthMonth = document.getElementById('global-birth-month');
    const birthDay = document.getElementById('global-birth-day');
    const birthYear = document.getElementById('global-birth-year');
    
    if (!birthMonth || !birthDay) {
      console.error('Month or day element not found in populateDays');
      return;
    }
    
    const month = parseInt(birthMonth.value);
    const year = parseInt(birthYear ? birthYear.value : '') || new Date().getFullYear();
    
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
  } catch (error) {
    console.error('Error in populateDays function:', error);
  }
}

// Function to check if content is R-18/adult content that should go to Vivamax page
function isPinoyAdult(item) {
  try {
    // Skip items without data
    if (!item) {
      console.log('isPinoyAdult: No item provided');
      return false;
    }
    
    // If the item is already marked as adult or R-18 by our system, return true immediately
    try {
      if (item.is_adult === true || item.is_r18 === true) {
        console.log('Item already marked as adult/R-18 by our system');
        return true;
      }
    } catch (propError) {
      console.error('Error checking is_adult/is_r18 properties:', propError);
      // Continue with other checks
    }
    
    // Check if the item is explicitly marked as adult by TMDB
    let isExplicitlyAdult = false;
    try {
      isExplicitlyAdult = item.adult === true;
    } catch (adultError) {
      console.error('Error checking adult property:', adultError);
    }
    
    // Check for Filipino language or origin with safe property access
    let isFilipino = false;
    try {
      const originalLanguage = item.original_language || '';
      const originCountry = item.origin_country || [];
      const hasFilipinolanguage = originalLanguage === 'tl' || originalLanguage === 'fil';
      const hasPhOrigin = Array.isArray(originCountry) && originCountry.includes('PH');
      
      // Safely check production companies
      let hasFilipinoProdCompany = false;
      try {
        if (item.production_companies && Array.isArray(item.production_companies)) {
          hasFilipinoProdCompany = item.production_companies.some(company => {
            try {
              return company && company.name && 
                     (/vivamax|viva|philippines|filipino|pinoy/i.test(company.name));
            } catch (companyError) {
              return false;
            }
          });
        }
      } catch (prodCompanyError) {
        console.error('Error checking production companies:', prodCompanyError);
      }
      
      isFilipino = hasFilipinolanguage || hasPhOrigin || hasFilipinoProdCompany;
    } catch (filipinoError) {
      console.error('Error checking Filipino indicators:', filipinoError);
    }
    
    // Safely get title and overview
    const title = (item.title || item.name || '').toString();
    const overview = (item.overview || '').toString();
    
    // Enhanced keyword list for better detection of R-18 content
    const adultKeywords = [
      'adult', 'mature', 'sexy', 'bold', 'desire', 'passion', 'forbidden', 
      'affair', 'vivamax', 'temptation', 'sensual', 'intimate', 'erotic',
      'scandal', 'sin', 'lust', 'seduction', 'taboo', 'provocative', 'explicit',
      'r-18', 'r18', 'r rated', 'rated r', 'x-rated', 'x rated', 'nsfw', 
      'adult film', 'adult movie', 'adult content', 'adult only', '18+', 'xxx'
    ];
    
    // Safely check for adult keywords
    let hasAdultKeywords = false;
    try {
      const keywordRegex = new RegExp(adultKeywords.join('|'), 'i');
      hasAdultKeywords = keywordRegex.test(title) || keywordRegex.test(overview);
    } catch (keywordError) {
      console.error('Error checking adult keywords:', keywordError);
    }
    
    // Safely check for age restrictions in the certification data
    let isR18ByRating = false;
    try {
      // Check release dates if available
      if (item.release_dates && item.release_dates.results && 
          Array.isArray(item.release_dates.results)) {
        isR18ByRating = item.release_dates.results.some(country => {
          try {
            return country.release_dates && Array.isArray(country.release_dates) &&
                   country.release_dates.some(date => {
                     try {
                       return date.certification && 
                              ['R', 'NC-17', 'X', 'R-18', '18', 'R18'].includes(date.certification);
                     } catch (dateError) {
                       return false;
                     }
                   });
          } catch (countryError) {
            return false;
          }
        });
      }
      
      // Check content ratings if available and not already R-18
      if (!isR18ByRating && item.content_ratings && item.content_ratings.results && 
          Array.isArray(item.content_ratings.results)) {
        isR18ByRating = item.content_ratings.results.some(rating => {
          try {
            return ['R', 'NC-17', 'X', 'R-18', '18', 'R18', 'TV-MA'].includes(rating.rating);
          } catch (ratingError) {
            return false;
          }
        });
      }
    } catch (ratingError) {
      console.error('Error checking content ratings:', ratingError);
    }
    
    // Safely check for Vivamax content
    let isVivamax = false;
    try {
      isVivamax = /vivamax/i.test(title) || /vivamax/i.test(overview);
      
      // Check production companies if not already identified as Vivamax
      if (!isVivamax && item.production_companies && Array.isArray(item.production_companies)) {
        isVivamax = item.production_companies.some(company => {
          try {
            return company && company.name && /vivamax/i.test(company.name);
          } catch (companyError) {
            return false;
          }
        });
      }
    } catch (vivamaxError) {
      console.error('Error checking Vivamax indicators:', vivamaxError);
    }
    
    // Safely check for genre IDs that might indicate adult content
    let hasAdultGenre = false;
    try {
      if (item.genre_ids && Array.isArray(item.genre_ids)) {
        hasAdultGenre = item.genre_ids.includes(10749) || // Romance
                        item.genre_ids.includes(10762);   // Mature
      }
    } catch (genreError) {
      console.error('Error checking genre IDs:', genreError);
    }
    
    // Safely check for keywords that specifically indicate R-18 content
    let isR18ByKeywords = false;
    try {
      const r18Keywords = ['r-18', 'r18', 'x-rated', 'xxx', 'nsfw', '18+'];
      const r18Regex = new RegExp(r18Keywords.join('|'), 'i');
      isR18ByKeywords = r18Regex.test(title) || r18Regex.test(overview);
    } catch (r18KeywordError) {
      console.error('Error checking R-18 keywords:', r18KeywordError);
    }
    
    // If the content is determined to be adult, mark it for future reference
    const isAdult = isExplicitlyAdult || isR18ByRating || isVivamax || 
                   (isFilipino && (hasAdultKeywords || hasAdultGenre));
    
    if (isAdult) {
      // Safely mark the item as adult for future reference
      try {
        item.is_adult = true;
        
        // If it has R-18 keywords or rating, mark it as R-18
        if (isR18ByKeywords || isR18ByRating) {
          item.is_r18 = true;
        }
        
        // If it's Vivamax content, mark it as such
        if (isVivamax) {
          item.is_vivamax = true;
        }
      } catch (markError) {
        console.error('Error marking item properties:', markError);
        // Continue even if we can't mark the item
      }
    }
    
    return isAdult;
  } catch (error) {
    console.error('Error in isPinoyAdult:', error);
    console.log('Error details:', error.message, error.stack);
    return false; // Default to false on error
  }
}

// Function to show age verification
function showAgeVerification() {
  try {
    const ageVerification = document.getElementById('global-age-verification');
    if (ageVerification) {
      ageVerification.style.display = 'flex';
    } else {
      console.warn('Age verification overlay not found in DOM');
    }
  } catch (error) {
    console.error('Error in showAgeVerification:', error);
    // Don't try to use ageVerification here as it might be undefined
  }
}

// Function to hide age verification
function hideAgeVerification() {
  try {
    const ageVerification = document.getElementById('global-age-verification');
    if (ageVerification) {
      ageVerification.style.display = 'none';
    } else {
      console.warn('Age verification overlay not found in DOM when trying to hide');
    }
  } catch (error) {
    console.error('Error in hideAgeVerification:', error);
  }
}

// Function to check age verification and show content if verified
function checkAgeAndShowContent(item, originalFunction) {
  try {
    console.log('Checking age verification for item:', item ? (item.title || item.name || 'No title') : 'undefined item');
    
    // Initialize the age verification system if not already done
    try {
      initAgeVerificationSystem();
    } catch (initError) {
      console.error('Error initializing age verification system:', initError);
      // Continue with the function even if initialization fails
    }
    
    // Validate parameters
    if (!item) {
      console.warn('No item provided to checkAgeAndShowContent');
      return originalFunction && typeof originalFunction === 'function' ? originalFunction(item) : false;
    }
    
    if (!originalFunction || typeof originalFunction !== 'function') {
      console.error('No valid original function provided to checkAgeAndShowContent');
      return false;
    }
    
    // Safely check properties with try-catch to prevent undefined errors
    let isAdultContent = false;
    try {
      isAdultContent = item.is_adult === true || item.is_r18 === true;
      console.log('Adult content check result:', isAdultContent);
    } catch (propError) {
      console.error('Error checking adult content properties:', propError);
    }
    
    // Check if this is already marked as adult content by our system
    if (isAdultContent) {
      console.log('Item already marked as adult content by our system');
      
      // Check if age has been verified - with fallback
      const isAgeVerified = sessionStorage.getItem('jflix_age_verified') === 'true' || 
                           sessionStorage.getItem('vivamax_age_verified') === 'true';
      
      if (isAgeVerified) {
        console.log('Age already verified, showing content');
        // Age already verified, show content
        return originalFunction(item);
      } else {
        console.log('Age not verified, showing verification overlay');
        // Age not verified, show verification
        pendingContentItem = item;
        originalShowDetailsFunction = originalFunction;
        showAgeVerification();
        return false; // Prevent default action
      }
    }
    
    // Check if this is Pinoy adult content - with error handling
    let isPinoyAdultContent = false;
    try {
      isPinoyAdultContent = isPinoyAdult(item);
      console.log('isPinoyAdult check result:', isPinoyAdultContent);
    } catch (adultCheckError) {
      console.error('Error checking if content is Pinoy adult:', adultCheckError);
      // Default to false on error
      isPinoyAdultContent = false;
    }
    
    if (isPinoyAdultContent) {
      console.log('Item identified as Pinoy adult content');
      
      // Safely check if it's Vivamax content
      try {
        if (item.is_vivamax) {
          console.log('Item identified as Vivamax content');
        }
      } catch (vivamaxError) {
        console.error('Error checking Vivamax property:', vivamaxError);
      }
      
      // Safely check if it's R-18 content
      try {
        if (item.is_r18) {
          console.log('Item identified as R-18 content');
        }
      } catch (r18Error) {
        console.error('Error checking R-18 property:', r18Error);
      }
      
      // Check if age has been verified - with fallback
      const isAgeVerified = sessionStorage.getItem('jflix_age_verified') === 'true' || 
                           sessionStorage.getItem('vivamax_age_verified') === 'true';
      
      if (isAgeVerified) {
        console.log('Age already verified, showing content');
        // Age already verified, show content
        return originalFunction(item);
      } else {
        console.log('Age not verified, showing verification overlay');
        // Age not verified, show verification
        pendingContentItem = item;
        originalShowDetailsFunction = originalFunction;
        try {
          showAgeVerification();
        } catch (showVerificationError) {
          console.error('Error showing age verification:', showVerificationError);
          // If we can't show verification, fall back to showing content
          return originalFunction(item);
        }
        return false; // Prevent default action
      }
    } else {
      console.log('Not adult content, showing normally');
      // Not adult content, show normally
      return originalFunction(item);
    }
  } catch (error) {
    console.error('Error in checkAgeAndShowContent:', error);
    console.log('Error details:', error.message, error.stack);
    
    // On error, try to fall back to the original function
    try {
      if (originalFunction && typeof originalFunction === 'function') {
        console.log('Attempting to fall back to original function');
        return originalFunction(item);
      } else {
        console.warn('Cannot fall back: originalFunction is not valid');
      }
    } catch (fallbackError) {
      console.error('Error in fallback to original function:', fallbackError);
      console.log('Fallback error details:', fallbackError.message, fallbackError.stack);
    }
    
    // If all else fails, try to hide the verification overlay to prevent UI issues
    try {
      hideAgeVerification();
    } catch (hideError) {
      console.error('Error hiding age verification overlay:', hideError);
    }
    
    return false;
  }
}

// Export functions
window.JFlixAgeVerification = {
  init: initAgeVerificationSystem,
  isPinoyAdult: isPinoyAdult,
  checkAgeAndShowContent: checkAgeAndShowContent
};
