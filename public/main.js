// NashfyPitStop - F1 Community Hub for East Africa
const EAT_OFFSET_MINUTES = 180; // UTC+3

// Utility Functions
function getNowInEAT() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + EAT_OFFSET_MINUTES * 60000);
}

function formatTimeHHMM(date) {
  return date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDateEAT(date) {
  return date.toLocaleString("en-KE", { 
    weekday: "short", 
    month: "short", 
    day: "numeric", 
    hour: "2-digit", 
    minute: "2-digit", 
    hour12: false, 
    timeZone: "Africa/Nairobi" 
  });
}

// Navigation System
class Navigation {
  constructor() {
    this.currentSection = 'home';
    this.pageTitles = {
      'home': 'Home | NashfyPitStop',
      'about': 'About | NashfyPitStop',
      'watch-party': 'Watch Party Venues | NashfyPitStop',
      'blogs': 'F1 News & Community | NashfyPitStop',
      'join-club': 'Join the Club | NashfyPitStop'
    };
    this.init();
    // Check URL hash on load
    this.handleInitialRoute();
  }

  init() {
    this.setupNavigation();
    this.setupMobileMenu();
  }
  
  handleInitialRoute() {
    // Get section from URL hash
    const hash = window.location.hash.substring(1);
    const sectionId = (hash && document.getElementById(hash)) ? hash : 'home';
    this.showSection(sectionId);
    
    // Update active nav link
    const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
    if (navLink) {
      this.updateActiveLink(navLink);
    }
    
    // Listen for hash changes (back/forward buttons)
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.substring(1);
      const sectionId = (hash && document.getElementById(hash)) ? hash : 'home';
      this.showSection(sectionId);
      
      // Update active nav link
      const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
      if (navLink) {
        this.updateActiveLink(navLink);
      }
    });
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('href').substring(1);
        this.showSection(section);
        this.updateActiveLink(link);
        // Update URL hash
        if (window.history.pushState) {
          window.history.pushState(null, null, `#${section}`);
        } else {
          window.location.hash = section;
        }
      });
    });

    // Handle quick links (they use anchor tags but need navigation)
    const quickLinks = document.querySelectorAll('aside a[href^="#"]');
    quickLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('href').substring(1);
        this.showSection(section);
        // Update nav link if it exists
        const navLink = document.querySelector(`.nav-link[href="#${section}"]`);
        if (navLink) {
          this.updateActiveLink(navLink);
        }
        // Update URL hash
        if (window.history.pushState) {
          window.history.pushState(null, null, `#${section}`);
        } else {
          window.location.hash = section;
        }
      });
    });

    // Join Club buttons
    document.getElementById('joinClubBtn')?.addEventListener('click', () => {
      this.showSection('join-club');
      this.updateActiveLink(document.querySelector('[href="#join-club"]') || document.getElementById('joinClubBtn'));
    });
    document.getElementById('joinClubBtnMobile')?.addEventListener('click', () => {
      this.showSection('join-club');
      this.toggleMobileMenu();
    });
  }

  setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    mobileMenuBtn?.addEventListener('click', () => {
      this.toggleMobileMenu();
    });

    // Close mobile menu when clicking on links and navigate
    const mobileLinks = document.querySelectorAll('#mobileMenu a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('href').substring(1);
        this.showSection(section);
        this.toggleMobileMenu();
        // Update URL hash
        if (window.history.pushState) {
          window.history.pushState(null, null, `#${section}`);
        } else {
          window.location.hash = section;
        }
      });
    });
  }

  toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu?.classList.toggle('hidden');
  }

  showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('section[id], main[id]');
    sections.forEach(section => {
      section.classList.add('hidden');
      section.classList.remove('fade-in');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.remove('hidden');
      // Add fade-in animation
      setTimeout(() => {
        targetSection.classList.add('fade-in');
      }, 50);
      this.currentSection = sectionId;
      
      // Update URL hash (without triggering hashchange event)
      if (window.history.replaceState) {
        window.history.replaceState(null, null, `#${sectionId}`);
      } else {
        window.location.hash = sectionId;
      }
      
      // Update page title
      const title = this.pageTitles[sectionId] || 'NashfyPitStop | Kenya & East Africa F1 Community';
      document.title = title;
      
      // Reload venues when watch-party section is shown
      if (sectionId === 'watch-party') {
        // Small delay to ensure section is visible
        setTimeout(() => {
          if (window.realTimeData) {
            window.realTimeData.loadVenues();
          }
        }, 100);
      }
    }
  }

  updateActiveLink(activeLink) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
    });
    activeLink.classList.add('active');
  }
}

// Real-time Data Services
class RealTimeData {
  constructor() {
    this.init();
  }

  init() {
    this.startLocalTime();
    this.loadWeather();
    this.setupScheduleControls();
    this.loadRaceSchedule(2025); // Default to 2025
    this.loadNews();
    this.loadVenues();
    // Blog functionality moved to BlogPage class
    this.loadRaceReactions();
  }

  setupScheduleControls() {
    const seasonSelect = document.getElementById('seasonSelect');
    const refreshBtn = document.getElementById('refreshSchedule');
    
    seasonSelect?.addEventListener('change', (e) => {
      const year = parseInt(e.target.value);
      this.loadRaceSchedule(year);
    });

    refreshBtn?.addEventListener('click', () => {
      const year = parseInt(seasonSelect?.value || 2025);
      this.loadRaceSchedule(year);
    });
  }

  startLocalTime() {
    const updateTime = () => {
      const el = document.getElementById("localTime");
      if (el) {
        el.textContent = formatTimeHHMM(getNowInEAT());
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  async loadWeather() {
    const el = document.getElementById("weatherNairobi");
    if (!el) return;

    try {
      const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-1.286389&longitude=36.817223&current=temperature_2m");
      const data = await res.json();
      const temp = data?.current?.temperature_2m;
      if (typeof temp === "number") {
        el.textContent = `${Math.round(temp)}°C`;
      }
    } catch (e) {
      el.textContent = "24°C"; // Fallback
    }
  }

  async loadRaceSchedule(year = 2025) {
    const scheduleList = document.getElementById("scheduleList");
    const scheduleHeading = document.querySelector("#scheduleList")?.closest('.glass-card')?.querySelector('h3');
    
    // Show loading state
    if (scheduleList) {
      scheduleList.innerHTML = '<div class="col-span-2 text-center py-8 text-blue-600"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div><p>Loading schedule...</p></div>';
    }

    let races = [];
    let dataSource = 'unknown';

    // Tier 1: Try Python Backend (FastF1)
    try {
      console.log('🔵 Attempting to fetch from Python backend (FastF1)...');
      const backendData = await backend.getRaceSchedule(year, false);
      
      if (backendData && backendData.success && backendData.races && backendData.races.length > 0) {
        races = backendData.races;
        dataSource = 'backend-fastf1';
        console.log('✅ Loaded race schedule from Python backend (FastF1):', races.length, 'races');
      } else {
        throw new Error('Backend returned empty or invalid data');
      }
    } catch (backendError) {
      console.warn('⚠️ Backend unavailable or failed:', backendError.message);
      console.log('📝 Trying fallback: RapidAPI...');
      
      // Tier 2: Fallback to RapidAPI
      try {
        const url = 'https://f1-race-schedule.p.rapidapi.com/api';
        const options = {
          method: 'GET',
          headers: {
            'x-rapidapi-key': '4ac3a74c27msh0f95c51c4289c6bp15bd56jsna05879d977db',
            'x-rapidapi-host': 'f1-race-schedule.p.rapidapi.com'
          }
        };

        const res = await fetch(url, options);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('🔵 RapidAPI Response:', data);
        
        // Parse the response - handle different possible formats
        if (Array.isArray(data)) {
          races = data;
        } else if (data.races && Array.isArray(data.races)) {
          races = data.races;
        } else if (data.data && Array.isArray(data.data)) {
          races = data.data;
        } else if (data.schedule && Array.isArray(data.schedule)) {
          races = data.schedule;
        } else {
          throw new Error('Invalid API response format');
        }
        
        // Validate API data quality
        if (races.length > 0) {
          const hasValidData = races.some(race => {
            const raceName = race.raceName || race.name || race.grandPrix || race.title;
            return raceName && raceName !== 'Unknown' && raceName !== 'unknown';
          });
          
          if (hasValidData) {
            dataSource = 'rapidapi';
            console.log('✅ Loaded race schedule from RapidAPI:', races.length, 'races');
          } else {
            throw new Error('API data appears invalid');
          }
        } else {
          throw new Error('API returned empty array');
        }
      } catch (rapidApiError) {
        console.warn('⚠️ RapidAPI failed:', rapidApiError.message);
        console.log('📝 Falling back to manual data file...');
        
        // Tier 3: Fallback to manual JSON file
        try {
          const manualRes = await fetch('./data/race-schedule.json');
          if (manualRes.ok) {
            const manualData = await manualRes.json();
            races = manualData.races || [];
            dataSource = 'manual-json';
            console.log('✅ Loaded manual race schedule data:', races.length, 'races');
          } else {
            throw new Error('Manual data file not found');
          }
        } catch (manualError) {
          console.error('❌ All data sources failed:', manualError);
          this.renderMockSchedule();
          return;
        }
      }
    }
    
    // Filter by year (if needed - backend already filters, but manual data might need it)
    if (dataSource === 'rapidapi' || dataSource === 'manual-json') {
      const currentYear = new Date().getFullYear();
      if (year !== currentYear) {
        races = races.filter(race => {
          const raceYear = this.extractYearFromRace(race);
          return raceYear === year;
        });
      } else {
        races = races.filter(race => {
          const raceYear = this.extractYearFromRace(race);
          return raceYear === currentYear;
        });
      }
    }
    
    console.log('📊 Final parsed races for', year, ':', races.length, 'races (Source:', dataSource, ')');
    
    if (races.length > 0) {
      this.renderSchedule(races, year);
      // Only update countdown if viewing current year
      const currentYear = new Date().getFullYear();
      if (year === currentYear) {
        this.startRaceCountdown(races);
      }
    } else {
      if (scheduleList) {
        scheduleList.innerHTML = '<div class="col-span-2 text-center py-8 text-blue-600"><p>No races found for this season.</p></div>';
      }
    }
  }

  extractYearFromRace(race) {
    // Try different possible date fields
    if (race.date) {
      return new Date(race.date).getFullYear();
    }
    if (race.raceDate) {
      return new Date(race.raceDate).getFullYear();
    }
    if (race.startDate) {
      return new Date(race.startDate).getFullYear();
    }
    if (race.year) {
      return parseInt(race.year);
    }
    // Default to current year if can't determine
    return new Date().getFullYear();
  }

  renderSchedule(races, year) {
    const list = document.getElementById("scheduleList");
    const heading = document.querySelector("#scheduleList")?.closest('.glass-card')?.querySelector('h3');
    
    if (!list) return;

    // Update heading with selected year
    if (heading) {
      heading.textContent = `${year} Race Schedule (EAT)`;
    }

    list.innerHTML = "";
    
    const now = new Date();
    
    // Sort races by date
    const sortedRaces = races.sort((a, b) => {
      const dateA = this.parseRaceDate(a);
      const dateB = this.parseRaceDate(b);
      return dateA - dateB;
    });
    
    sortedRaces.forEach((race, index) => {
      const raceDate = this.parseRaceDate(race);
      const isPast = raceDate < now;
      const status = isPast ? "Done" : "Upcoming";
      const statusColor = isPast ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-700";
      const cardOpacity = isPast ? "opacity-75" : "";
      
      // Extract race information from different possible formats
      const raceName = race.raceName || race.name || race.grandPrix || race.title || race.circuit || `Race ${index + 1}`;
      const country = race.country || race.Circuit?.Location?.country || race.location?.country || race.location || "Unknown";
      const locality = race.locality || race.Circuit?.Location?.locality || race.location?.city || race.track?.location || race.circuit || "";
      const round = race.round || race.roundNumber || (index + 1);
      
      const card = document.createElement("div");
      card.className = `glass-card space-y-2 ${cardOpacity} hover:bg-white/40 transition-all duration-300`;
      card.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-blue-600 font-semibold">Round ${round}</div>
          <span class="chip ${statusColor} text-xs font-bold">${status}</span>
        </div>
        <div class="flex items-center gap-2 mb-2 flex-wrap">
          <div class="chip bg-orange-100 text-orange-700 text-xs">${country}</div>
          ${locality ? `<div class="text-xs text-blue-600">📍 ${locality}</div>` : ''}
        </div>
        <div class="text-lg font-bold text-blue-900 mb-2">${raceName}</div>
        <div class="space-y-1">
          <div class="text-sm font-semibold text-blue-700">${formatDateEAT(raceDate)} EAT</div>
          ${!isPast ? `<div class="text-xs text-blue-600">${this.getTimeUntilRace(raceDate)}</div>` : ''}
        </div>
      `;
      list.appendChild(card);
    });
  }

  parseRaceDate(race) {
    // Try different possible date/time fields
    if (race.date && race.time) {
      return new Date(race.date + "T" + race.time);
    }
    if (race.date) {
      return new Date(race.date);
    }
    if (race.raceDate && race.raceTime) {
      return new Date(race.raceDate + "T" + race.raceTime);
    }
    if (race.raceDate) {
      return new Date(race.raceDate);
    }
    if (race.startDate && race.startTime) {
      return new Date(race.startDate + "T" + race.startTime);
    }
    if (race.startDate) {
      return new Date(race.startDate);
    }
    if (race.datetime) {
      // Handle ISO format with timezone
      const dt = race.datetime.replace('+03:00', '').replace('Z', '');
      return new Date(dt);
    }
    // Default to far future if can't parse
    return new Date('2099-12-31');
  }

  getTimeUntilRace(raceDate) {
    const now = new Date();
    const diff = raceDate - now;
    
    if (diff <= 0) return "Race in progress or completed";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 7) {
      const weeks = Math.floor(days / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} away`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} away`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} away`;
    } else {
      return "Less than an hour away!";
    }
  }

  renderMockSchedule() {
    const list = document.getElementById("scheduleList");
    if (!list) return;

    const mockRaces = [
      { round: 1, name: "Bahrain Grand Prix", country: "Bahrain", date: "2025-03-09T15:00:00Z" },
      { round: 2, name: "Saudi Arabian Grand Prix", country: "Saudi Arabia", date: "2025-03-23T17:00:00Z" },
      { round: 3, name: "Australian Grand Prix", country: "Australia", date: "2025-04-06T06:00:00Z" },
    ];

    list.innerHTML = "";
    mockRaces.forEach((race) => {
      const eatDate = new Date(race.date);
      const card = document.createElement("div");
      card.className = "glass-card space-y-2";
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="text-sm text-blue-600">Round ${race.round}</div>
          <div class="chip bg-orange-100 text-orange-700">${race.country}</div>
        </div>
        <div class="text-lg font-semibold text-blue-900">${race.name}</div>
        <div class="text-blue-700">${formatDateEAT(eatDate)} EAT</div>
      `;
      list.appendChild(card);
    });
  }

  async startRaceCountdown(races) {
    const now = new Date();
    
    // Try to get next race from backend first (more accurate)
    try {
      const nextRaceData = await backend.getNextRace();
      if (nextRaceData && nextRaceData.success && nextRaceData.race) {
        const race = nextRaceData.race;
        const countdown = nextRaceData.countdown;
        
        // Update race name
        const nextRaceNameEl = document.getElementById('nextRaceName');
        if (nextRaceNameEl) {
          nextRaceNameEl.textContent = race.raceName || 'Next Race';
        }
        
        // Start countdown with backend data
        if (countdown && countdown.total_seconds > 0) {
          this.updateCountdownFromBackend(countdown, race);
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not get next race from backend, using local calculation:', error.message);
    }
    
    // Fallback: Calculate from races array
    // Sort races by date and find the next upcoming race (not past)
    const sortedRaces = races.sort((a, b) => {
      const dateA = this.parseRaceDate(a);
      const dateB = this.parseRaceDate(b);
      return dateA - dateB;
    });
    
    const nextRace = sortedRaces.find(r => {
      const raceDate = this.parseRaceDate(r);
      return raceDate > now;
    });
    
    if (nextRace) {
      const targetDate = this.parseRaceDate(nextRace);
      
      // Extract race name from different possible formats
      const raceName = nextRace.raceName || nextRace.name || nextRace.grandPrix || nextRace.title || "Next Race";
      
      // Update countdown display with race name
      const raceNameEl = document.getElementById("nextRaceName");
      if (raceNameEl) {
        raceNameEl.textContent = `${raceName} - Countdown`;
      }
      
      this.updateCountdown(targetDate, raceName);
    } else {
      // No upcoming races found
      const el = document.getElementById("nextRaceCountdown");
      if (el) {
        el.textContent = "Season Ended";
      }
      const raceNameEl = document.getElementById("nextRaceName");
      if (raceNameEl) {
        raceNameEl.textContent = "No upcoming races";
      }
    }
  }

  updateCountdownFromBackend(countdown, race) {
    const el = document.getElementById("nextRaceCountdown");
    const raceNameEl = document.getElementById("nextRaceName");
    
    if (!el) return;
    
    // Update race name
    if (raceNameEl) {
      raceNameEl.textContent = `${race.raceName || 'Next Race'} - Countdown`;
    }
    
    // Clear any existing interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    const update = () => {
      // Re-fetch countdown from backend for accuracy
      backend.getNextRace().then(nextRaceData => {
        if (nextRaceData && nextRaceData.success && nextRaceData.countdown) {
          const cd = nextRaceData.countdown;
          
          if (cd.total_seconds <= 0) {
            el.textContent = "RACE DAY!";
            el.classList.add("text-red-600", "animate-pulse");
            if (raceNameEl) {
              raceNameEl.textContent = `${race.raceName || 'Race'} - LIVE!`;
            }
            return;
          }
          
          const days = cd.days;
          const hours = cd.hours;
          const minutes = cd.minutes;
          const seconds = cd.seconds;
          
          if (days > 0) {
            el.textContent = `${days}d ${hours}h ${minutes}m`;
          } else if (hours > 0) {
            el.textContent = `${hours}h ${minutes}m ${seconds}s`;
          } else {
            el.textContent = `${minutes}m ${seconds}s`;
          }
          
          el.classList.remove("text-red-600", "animate-pulse");
        }
      }).catch(() => {
        // Fallback to local calculation if backend fails
        if (race.datetime) {
          const targetDate = new Date(race.datetime);
          this.updateCountdown(targetDate, race.raceName);
        }
      });
    };
    
    update(); // Initial update
    this.countdownInterval = setInterval(update, 1000); // Update every second
  }

  updateCountdown(targetDate, raceName = "") {
    const el = document.getElementById("nextRaceCountdown");
    if (!el) return;

    // Clear any existing interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    const update = () => {
      const now = new Date();
      const diff = targetDate - now;
      
      if (diff <= 0) {
        el.textContent = "RACE DAY!";
        el.classList.add("text-red-600", "animate-pulse");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Remove pulse animation if it exists
      el.classList.remove("text-red-600", "animate-pulse");

      if (days > 0) {
        el.textContent = `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        el.textContent = `${hours}h ${minutes}m ${seconds}s`;
      } else {
        el.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      }
    };

    update();
    this.countdownInterval = setInterval(update, 1000);
  }

  async loadNews() {
    // Try to fetch from F1 News API, fallback to mock data
    const url = 'https://f1-latest-news.p.rapidapi.com/news';
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '4ac3a74c27msh0f95c51c4289c6bp15bd56jsna05879d977db',
        'x-rapidapi-host': 'f1-latest-news.p.rapidapi.com'
      }
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.text();
      const apiNews = JSON.parse(result);
      
      // Debug: Log what we received from API
      console.log('✅ F1 News API Response (LIVE DATA):', apiNews);
      console.log('📊 Number of news items from API:', Array.isArray(apiNews) ? apiNews.length : 'Not an array');
      console.log('🕐 Fetched at:', new Date().toLocaleString());
      
      // Convert API format to carousel format (take first 4)
      if (Array.isArray(apiNews) && apiNews.length > 0) {
        const newsData = apiNews.slice(0, 4).map((news, index) => {
          // Map source to category
          const categoryMap = {
            'autosport': 'Race News',
            'skyf1': 'Sky Sports F1',
            'f1': 'Official F1',
            'bbc': 'BBC Sport',
            'espn': 'ESPN F1'
          };
          
          return {
            title: news.title || 'F1 News',
            summary: news.title || 'Latest Formula 1 updates',
            image: this.getNewsEmoji(news.source),
            category: categoryMap[news.source] || news.source || 'F1 News',
            url: news.url || '#',
            source: news.source || 'Unknown',
            fetchedAt: new Date().toISOString() // Track when fetched
          };
        });
        
        console.log('✅ Rendering', newsData.length, 'LIVE news items in carousel');
        
        // Update timestamp indicator
        const updateTimeEl = document.getElementById('newsUpdateTime');
        if (updateTimeEl) {
          updateTimeEl.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
        }
        
        this.renderNewsCarousel(newsData, true); // Pass true to indicate live data
        return;
      } else {
        console.warn('API returned empty array or invalid data, using fallback');
      }
    } catch (error) {
      console.error('Error loading F1 news for carousel:', error);
      console.log('Falling back to mock data');
    }

    // Fallback to mock data if API fails
    console.warn('⚠️ API failed, using fallback mock data');
    const newsData = this.getMockNewsData();
    this.renderNewsCarousel(newsData, false); // false = not live data
  }

  getMockNewsData() {
    return [
      {
        title: "Verstappen Dominates Saudi Arabian GP",
        summary: "Red Bull's Max Verstappen secures another commanding victory in Jeddah",
        image: "🏎️",
        category: "Race Results",
        url: "#blogs"
      },
      {
        title: "New Regulations for 2025 Season",
        summary: "FIA announces updated technical regulations focusing on sustainability",
        image: "📋",
        category: "Regulations",
        url: "#blogs"
      },
      {
        title: "Hamilton's Move to Ferrari Confirmed",
        summary: "Seven-time world champion makes historic switch to Scuderia Ferrari",
        image: "🔴",
        category: "Driver News",
        url: "#blogs"
      },
      {
        title: "Nairobi Watch Party Venues Announced",
        summary: "Check out the best spots to watch F1 races in Kenya's capital",
        image: "🏁",
        category: "Community",
        url: "#blogs"
      }
    ];
  }

  getNewsEmoji(source) {
    const emojiMap = {
      'autosport': '🏎️',
      'skyf1': '📺',
      'f1': '🏁',
      'bbc': '📰',
      'espn': '⚡'
    };
    return emojiMap[source] || '📰';
  }

  renderNewsCarousel(newsData, isLiveData = false) {
    const track = document.getElementById("carouselTrack");
    if (!track) return;

    track.innerHTML = "";
    newsData.forEach((news, index) => {
      const slide = document.createElement("div");
      slide.className = "min-w-full px-4";
      const newsUrl = news.url || "#blogs";
      const isExternal = newsUrl.startsWith('http');
      const liveIndicator = isLiveData ? '<span class="inline-flex items-center gap-1 text-xs text-green-600 font-semibold"><span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>LIVE</span>' : '';
      slide.innerHTML = `
        <div class="glass-card p-6 hover:bg-white/40 transition-all duration-300 cursor-pointer" ${isExternal ? `onclick="window.open('${newsUrl}', '_blank')"` : `onclick="document.querySelector('[href=\\"#blogs\\"]')?.click()"`}>
          <div class="flex items-center gap-4 flex-col sm:flex-row">
            <div class="text-4xl sm:text-5xl flex-shrink-0">${news.image}</div>
            <div class="flex-1 text-center sm:text-left">
              <div class="flex items-center gap-2 mb-2 flex-wrap justify-center sm:justify-start">
                <span class="chip bg-orange-100 text-orange-700 inline-block">${news.category}</span>
                ${liveIndicator}
              </div>
              <h4 class="font-bold text-blue-900 mb-2 text-lg sm:text-xl">${news.title}</h4>
              <p class="text-blue-700 text-sm sm:text-base">${news.summary}</p>
              ${isExternal ? '<p class="text-xs text-blue-600 mt-2">Click to read full article →</p>' : '<p class="text-xs text-blue-600 mt-2">Click to view all news →</p>'}
            </div>
          </div>
        </div>
      `;
      track.appendChild(slide);
    });

    this.setupCarouselControls();
  }

  setupCarouselControls() {
    const track = document.getElementById("carouselTrack");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    if (!track) return;
    
    const slides = track.children;
    const totalSlides = slides.length;
    let currentIndex = 0;

    const updateCarousel = () => {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
    };

    // Initialize
    updateCarousel();

    prevBtn?.addEventListener("click", () => {
      currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      updateCarousel();
    });

    nextBtn?.addEventListener("click", () => {
      currentIndex = (currentIndex + 1) % totalSlides;
      updateCarousel();
    });

    // Auto-advance carousel (only if we have slides)
    if (totalSlides > 0) {
      setInterval(() => {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateCarousel();
      }, 5000);
    }
  }

  async loadVenues() {
    // Try to load from Sanity CMS, fallback to mock data
    try {
      if (typeof sanity !== 'undefined' && sanity.projectId !== 'YOUR_PROJECT_ID') {
        console.log('🔵 Attempting to load venues from Sanity...');
        console.log('🔵 Project ID:', sanity.projectId);
        const venuesData = await sanity.getVenues();
        console.log('🔵 Raw venues data from Sanity:', venuesData);
        
        if (venuesData && venuesData.length > 0) {
          console.log('✅ Loaded venues from Sanity:', venuesData.length, 'venues');
          this.renderVenues(venuesData);
          return;
        } else {
          console.warn('⚠️ Sanity returned empty array or no venues found');
        }
      } else {
        console.warn('⚠️ Sanity not configured properly. Project ID:', typeof sanity !== 'undefined' ? sanity.projectId : 'undefined');
      }
    } catch (error) {
      console.error('❌ Error loading venues from Sanity:', error);
      console.error('❌ Error details:', error.message);
    }

    // Fallback to mock data
    const venuesData = [
      {
        name: "K1 Klubhouse",
        location: "Westlands, Nairobi",
        city: "Nairobi",
        description: "Premium sports bar with large screens and great atmosphere",
        capacity: "50+ people",
        amenities: ["Large Screens", "Food & Drinks", "Parking"]
      },
      {
        name: "Brew Bistro",
        location: "Lavington, Nairobi",
        city: "Nairobi",
        description: "Cozy venue with craft beer and F1 fan community",
        capacity: "30+ people",
        amenities: ["Craft Beer", "Snacks", "WiFi"]
      },
      {
        name: "Tamarind Mombasa",
        location: "Mombasa",
        city: "Mombasa",
        description: "Beachfront venue with ocean views during races",
        capacity: "40+ people",
        amenities: ["Ocean View", "Fresh Seafood", "AC"]
      },
      {
        name: "Sky Lounge Kampala",
        location: "Kampala, Uganda",
        city: "Kampala",
        description: "Rooftop venue with city views and premium experience",
        capacity: "60+ people",
        amenities: ["Rooftop", "Premium Bar", "City Views"]
      }
    ];

    this.renderVenues(venuesData);
  }

  renderVenues(venuesData) {
    const venuesList = document.getElementById("venuesList");
    if (!venuesList) return;

    venuesList.innerHTML = "";
    venuesData.forEach(venue => {
      const location = venue.location || `${venue.city || ''}`.trim();
      const amenities = venue.amenities || [];
      const imageUrl = venue.imageUrl || '';
      
      const card = document.createElement("div");
      card.className = "glass-card";
      card.innerHTML = `
        ${imageUrl ? `<img src="${imageUrl}" alt="${venue.name}" class="w-full h-48 object-cover rounded-lg mb-3">` : ''}
        <h4 class="font-bold text-blue-900 mb-2">${venue.name}</h4>
        <p class="text-blue-600 text-sm mb-2">📍 ${location}</p>
        <p class="text-blue-700 mb-3">${venue.description}</p>
        <div class="space-y-2">
          <div class="text-sm text-blue-600">👥 ${venue.capacity}</div>
          ${amenities.length > 0 ? `
          <div class="flex flex-wrap gap-1">
            ${amenities.map(amenity => 
              `<span class="chip bg-green-100 text-green-700 text-xs">${amenity}</span>`
            ).join('')}
          </div>
          ` : ''}
        </div>
      `;
      venuesList.appendChild(card);
    });
  }

  // Blog functionality moved to BlogPage class

  loadRaceReactions() {
    const reactionsData = [
      { name: "Kipchoge", comment: "Verstappen is absolutely unstoppable! 🏎️", time: "2 hours ago" },
      { name: "Wanjiku", comment: "Lando finally getting the results he deserves! 💪", time: "1 hour ago" },
      { name: "Musa", comment: "That overtake was incredible! F1 never disappoints", time: "45 min ago" },
      { name: "Grace", comment: "Can't wait for the next race weekend! 🏁", time: "30 min ago" }
    ];

    this.renderRaceReactions(reactionsData);
  }

  renderRaceReactions(reactionsData) {
    const reactionsContainer = document.getElementById("raceReactions");
    if (!reactionsContainer) return;

    reactionsContainer.innerHTML = "";
    reactionsData.forEach(reaction => {
      const reactionEl = document.createElement("div");
      reactionEl.className = "glass-card p-3 text-sm";
      reactionEl.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <span class="font-semibold text-blue-900">${reaction.name}</span>
          <span class="text-blue-500">${reaction.time}</span>
        </div>
        <p class="text-blue-700">${reaction.comment}</p>
      `;
      reactionsContainer.appendChild(reactionEl);
    });
  }
}

// Quiz System
class QuizSystem {
  constructor() {
    this.questions = [
      { q: "Which timezone does Kenya use?", a: ["UTC", "EAT", "CAT"], correct: 1 },
      { q: "Which circuit is in Africa?", a: ["Spa", "Monza", "Kyalami"], correct: 2 },
      { q: "How many wheels on an F1 car?", a: ["3", "4", "6"], correct: 1 },
    ];
    this.score = 0;
    this.init();
  }

  init() {
    this.renderQuiz();
  }

  renderQuiz() {
    const box = document.getElementById("quizBox");
    if (!box) return;

    box.innerHTML = "";
    this.questions.forEach((question, index) => {
      const questionEl = document.createElement("div");
      questionEl.className = "space-y-2 mb-4";
      questionEl.innerHTML = `<div class="font-semibold text-blue-900">Q${index + 1}. ${question.q}</div>`;
      
      question.a.forEach((answer, answerIndex) => {
        const btn = document.createElement("button");
        btn.className = "btn-secondary text-sm w-full text-left";
        btn.textContent = answer;
        btn.addEventListener("click", () => this.handleAnswer(questionEl, answerIndex, question.correct));
        questionEl.appendChild(btn);
      });
      
      box.appendChild(questionEl);
    });
  }

  handleAnswer(questionEl, selectedIndex, correctIndex) {
    const buttons = questionEl.querySelectorAll("button");
    buttons.forEach((btn, index) => {
      btn.disabled = true;
      if (index === correctIndex) {
        btn.classList.add("bg-green-600");
        if (index === selectedIndex) this.score++;
      } else if (index === selectedIndex) {
        btn.classList.add("bg-red-600");
      }
    });

    const result = document.getElementById("quizResult");
    if (result) {
      result.textContent = `Score: ${this.score}/${this.questions.length}`;
    }
  }
}

// Blog Page Handler
class BlogPage {
  constructor() {
    this.currentTab = 'f1News';
    this.f1NewsData = [];
    this.init();
  }

  init() {
    this.setupTabs();
    this.loadF1News();
    this.loadNashfyNews();
  }

  async loadNashfyNews() {
    // Try to load from Sanity CMS, fallback to mock data
    try {
      if (typeof sanity !== 'undefined' && sanity.projectId !== 'YOUR_PROJECT_ID') {
        const newsData = await sanity.getBlogPosts();
        if (newsData && newsData.length > 0) {
          console.log('✅ Loaded NashfyPitStop news from Sanity:', newsData.length);
          // Format dates for display
          const formattedNews = newsData.map(news => ({
            ...news,
            date: news.date ? new Date(news.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBD'
          }));
          this.renderNashfyNews(formattedNews);
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error loading NashfyPitStop news from Sanity, using fallback:', error);
    }

    // Fallback to mock data
    this.loadNashfyNewsFallback();
  }

  loadNashfyNewsFallback() {
    const nashfyNewsData = [
      {
        type: 'fan-reaction',
        title: 'Saudi Arabian GP - Fan Reactions',
        content: 'The energy at K1 Klubhouse was electric! Verstappen fans were celebrating while Lando supporters were thrilled with his podium finish. The crowd went wild during that final lap battle!',
        author: 'Community Reporter',
        date: 'March 8, 2025',
        location: 'Nairobi, Kenya',
        reactions: ['🔥', '🏎️', '💪']
      },
      {
        type: 'gossip',
        title: 'Rumors: Hamilton-Ferrari Chemistry',
        content: 'Word around the paddock is that Lewis is already making waves at Ferrari. Some insiders say the team dynamic is shifting, and we might see a different strategy approach this season.',
        author: 'F1 Insider',
        date: 'March 7, 2025',
        location: 'East Africa F1 Community',
        reactions: ['🤫', '🔴', '💭']
      },
      {
        type: 'watch-party',
        title: 'Mombasa Watch Party Recap',
        content: 'Tamarind Mombasa hosted an amazing watch party! Over 40 fans gathered, enjoying fresh seafood while watching the race. The ocean view made it even more special. Already planning the next one!',
        author: 'Event Coordinator',
        date: 'March 8, 2025',
        location: 'Mombasa, Kenya',
        reactions: ['🌊', '🍽️', '🎉']
      },
      {
        type: 'fan-opinion',
        title: 'Why East Africa Needs More F1 Coverage',
        content: 'As a long-time F1 fan in Kenya, I believe we need better local coverage. The passion is here, but we need more accessible content in our timezone and language. What do you think?',
        author: 'Kipchoge M.',
        date: 'March 6, 2025',
        location: 'Nairobi, Kenya',
        reactions: ['💬', '📺', '🌍']
      },
      {
        type: 'gossip',
        title: 'Red Bull Dominance - Is It Sustainable?',
        content: 'Everyone is talking about Red Bull\'s continued dominance. Some fans think the regulations need adjustment, while others believe it\'s just superior engineering. The debate is heating up in our community!',
        author: 'F1 Analyst',
        date: 'March 5, 2025',
        location: 'East Africa F1 Community',
        reactions: ['⚡', '🏆', '🤔']
      },
      {
        type: 'watch-party',
        title: 'Kampala Rooftop Experience',
        content: 'Sky Lounge Kampala delivered an incredible experience! The rooftop setting with city views was perfect. Great turnout, amazing atmosphere, and the race was absolutely thrilling. Can\'t wait for the next GP!',
        author: 'Event Organizer',
        date: 'March 8, 2025',
        location: 'Kampala, Uganda',
        reactions: ['🏙️', '✨', '🎊']
      },
      {
        type: 'fan-reaction',
        title: 'Charles Leclerc\'s Podium - Fan Celebration',
        content: 'Ferrari fans in Dar es Salaam were ecstatic! Charles finally got that podium finish. The watch party erupted when he crossed the line. This is what F1 community is all about!',
        author: 'Community Member',
        date: 'March 8, 2025',
        location: 'Dar es Salaam, Tanzania',
        reactions: ['🔴', '🏁', '🎉']
      },
      {
        type: 'fan-opinion',
        title: 'The Future of F1 in Africa',
        content: 'With growing interest across East Africa, I believe we\'re ready for an African Grand Prix. The passion, the community, and the infrastructure are developing. It\'s only a matter of time!',
        author: 'F1 Enthusiast',
        date: 'March 4, 2025',
        location: 'Kigali, Rwanda',
        reactions: ['🌍', '🏎️', '🚀']
      }
    ];

    this.renderNashfyNews(nashfyNewsData);
  }

  setupTabs() {
    const f1NewsTab = document.getElementById('f1NewsTab');
    const nashfyNewsTab = document.getElementById('nashfyNewsTab');
    const f1NewsContent = document.getElementById('f1NewsContent');
    const nashfyNewsContent = document.getElementById('nashfyNewsContent');

    f1NewsTab?.addEventListener('click', () => {
      this.switchTab('f1News');
    });

    nashfyNewsTab?.addEventListener('click', () => {
      this.switchTab('nashfyNews');
    });
  }

  switchTab(tabName) {
    const f1NewsTab = document.getElementById('f1NewsTab');
    const nashfyNewsTab = document.getElementById('nashfyNewsTab');
    const f1NewsContent = document.getElementById('f1NewsContent');
    const nashfyNewsContent = document.getElementById('nashfyNewsContent');

    // Update tab buttons
    if (tabName === 'f1News') {
      f1NewsTab?.classList.add('active', 'border-b-2', 'border-orange-500', 'text-blue-900');
      f1NewsTab?.classList.remove('text-blue-600');
      nashfyNewsTab?.classList.remove('active', 'border-b-2', 'border-orange-500', 'text-blue-900');
      nashfyNewsTab?.classList.add('text-blue-600');
      
      f1NewsContent?.classList.remove('hidden');
      nashfyNewsContent?.classList.add('hidden');
    } else {
      nashfyNewsTab?.classList.add('active', 'border-b-2', 'border-orange-500', 'text-blue-900');
      nashfyNewsTab?.classList.remove('text-blue-600');
      f1NewsTab?.classList.remove('active', 'border-b-2', 'border-orange-500', 'text-blue-900');
      f1NewsTab?.classList.add('text-blue-600');
      
      nashfyNewsContent?.classList.remove('hidden');
      f1NewsContent?.classList.add('hidden');
    }

    this.currentTab = tabName;
  }

  async loadF1News() {
    const loadingEl = document.getElementById('f1NewsLoading');
    const errorEl = document.getElementById('f1NewsError');
    const newsListEl = document.getElementById('f1NewsList');
    const retryBtn = document.getElementById('retryF1News');

    // Show loading, hide error and list
    loadingEl?.classList.remove('hidden');
    errorEl?.classList.add('hidden');
    newsListEl?.classList.add('hidden');

    const url = 'https://f1-latest-news.p.rapidapi.com/news';
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '4ac3a74c27msh0f95c51c4289c6bp15bd56jsna05879d977db',
        'x-rapidapi-host': 'f1-latest-news.p.rapidapi.com'
      }
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.text();
      const newsData = JSON.parse(result);

      this.f1NewsData = Array.isArray(newsData) ? newsData : [];
      this.renderF1News(this.f1NewsData);

      // Hide loading, show list
      loadingEl?.classList.add('hidden');
      newsListEl?.classList.remove('hidden');
    } catch (error) {
      console.error('Error loading F1 news:', error);
      
      // Hide loading, show error
      loadingEl?.classList.add('hidden');
      errorEl?.classList.remove('hidden');
      
      // Setup retry button
      retryBtn?.addEventListener('click', () => {
        this.loadF1News();
      }, { once: true });
    }
  }

  renderF1News(newsData) {
    const newsListEl = document.getElementById('f1NewsList');
    if (!newsListEl) return;

    newsListEl.innerHTML = '';

    if (newsData.length === 0) {
      newsListEl.innerHTML = `
        <div class="text-center py-8 text-blue-600">
          <p>No news available at the moment.</p>
        </div>
      `;
      return;
    }

    newsData.slice(0, 20).forEach((news, index) => {
      const card = document.createElement('div');
      card.className = 'glass-card hover:bg-white/40 transition-all duration-300';
      card.innerHTML = `
        <div class="flex items-start gap-3 sm:gap-4 flex-col sm:flex-row">
          <div class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-base sm:text-lg">
            ${index + 1}
          </div>
          <div class="flex-1 w-full">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span class="chip bg-orange-100 text-orange-700 text-xs">${news.source || 'F1 News'}</span>
            </div>
            <h4 class="font-bold text-blue-900 mb-2 text-base sm:text-lg hover:text-orange-600 transition-colors">
              <a href="${news.url}" target="_blank" rel="noopener noreferrer" class="hover:underline break-words">
                ${news.title}
              </a>
            </h4>
            <a href="${news.url}" target="_blank" rel="noopener noreferrer" 
               class="text-xs sm:text-sm text-blue-600 hover:text-orange-600 transition-colors inline-flex items-center gap-1">
              Read more →
            </a>
          </div>
        </div>
      `;
      newsListEl.appendChild(card);
    });
  }

  loadNashfyNewsFallback() {
    const nashfyNewsData = [
      {
        type: 'fan-reaction',
        title: 'Saudi Arabian GP - Fan Reactions',
        content: 'The energy at K1 Klubhouse was electric! Verstappen fans were celebrating while Lando supporters were thrilled with his podium finish. The crowd went wild during that final lap battle!',
        author: 'Community Reporter',
        date: 'March 8, 2025',
        location: 'Nairobi, Kenya',
        reactions: ['🔥', '🏎️', '💪']
      },
      {
        type: 'gossip',
        title: 'Rumors: Hamilton-Ferrari Chemistry',
        content: 'Word around the paddock is that Lewis is already making waves at Ferrari. Some insiders say the team dynamic is shifting, and we might see a different strategy approach this season.',
        author: 'F1 Insider',
        date: 'March 7, 2025',
        location: 'East Africa F1 Community',
        reactions: ['🤫', '🔴', '💭']
      },
      {
        type: 'watch-party',
        title: 'Mombasa Watch Party Recap',
        content: 'Tamarind Mombasa hosted an amazing watch party! Over 40 fans gathered, enjoying fresh seafood while watching the race. The ocean view made it even more special. Already planning the next one!',
        author: 'Event Coordinator',
        date: 'March 8, 2025',
        location: 'Mombasa, Kenya',
        reactions: ['🌊', '🍽️', '🎉']
      },
      {
        type: 'fan-opinion',
        title: 'Why East Africa Needs More F1 Coverage',
        content: 'As a long-time F1 fan in Kenya, I believe we need better local coverage. The passion is here, but we need more accessible content in our timezone and language. What do you think?',
        author: 'Kipchoge M.',
        date: 'March 6, 2025',
        location: 'Nairobi, Kenya',
        reactions: ['💬', '📺', '🌍']
      },
      {
        type: 'gossip',
        title: 'Red Bull Dominance - Is It Sustainable?',
        content: 'Everyone is talking about Red Bull\'s continued dominance. Some fans think the regulations need adjustment, while others believe it\'s just superior engineering. The debate is heating up in our community!',
        author: 'F1 Analyst',
        date: 'March 5, 2025',
        location: 'East Africa F1 Community',
        reactions: ['⚡', '🏆', '🤔']
      },
      {
        type: 'watch-party',
        title: 'Kampala Rooftop Experience',
        content: 'Sky Lounge Kampala delivered an incredible experience! The rooftop setting with city views was perfect. Great turnout, amazing atmosphere, and the race was absolutely thrilling. Can\'t wait for the next GP!',
        author: 'Event Organizer',
        date: 'March 8, 2025',
        location: 'Kampala, Uganda',
        reactions: ['🏙️', '✨', '🎊']
      },
      {
        type: 'fan-reaction',
        title: 'Charles Leclerc\'s Podium - Fan Celebration',
        content: 'Ferrari fans in Dar es Salaam were ecstatic! Charles finally got that podium finish. The watch party erupted when he crossed the line. This is what F1 community is all about!',
        author: 'Community Member',
        date: 'March 8, 2025',
        location: 'Dar es Salaam, Tanzania',
        reactions: ['🔴', '🏁', '🎉']
      },
      {
        type: 'fan-opinion',
        title: 'The Future of F1 in Africa',
        content: 'With growing interest across East Africa, I believe we\'re ready for an African Grand Prix. The passion, the community, and the infrastructure are developing. It\'s only a matter of time!',
        author: 'F1 Enthusiast',
        date: 'March 4, 2025',
        location: 'Kigali, Rwanda',
        reactions: ['🌍', '🏎️', '🚀']
      }
    ];

    this.renderNashfyNews(nashfyNewsData);
  }

  renderNashfyNews(newsData) {
    const newsListEl = document.getElementById('nashfyNewsList');
    if (!newsListEl) return;

    newsListEl.innerHTML = '';

    const typeIcons = {
      'fan-reaction': '💬',
      'gossip': '🤫',
      'watch-party': '🎉',
      'fan-opinion': '💭'
    };

    const typeColors = {
      'fan-reaction': 'bg-blue-100 text-blue-700',
      'gossip': 'bg-purple-100 text-purple-700',
      'watch-party': 'bg-orange-100 text-orange-700',
      'fan-opinion': 'bg-green-100 text-green-700'
    };

    newsData.forEach((news) => {
      const card = document.createElement('div');
      card.className = 'glass-card hover:bg-white/40 transition-all duration-300';
      card.innerHTML = `
        <div class="flex items-start gap-3 sm:gap-4 flex-col sm:flex-row">
          <div class="flex-shrink-0 text-3xl sm:text-4xl">${typeIcons[news.type] || '📰'}</div>
          <div class="flex-1 w-full">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span class="chip ${typeColors[news.type] || 'bg-gray-100 text-gray-700'} text-xs">
                ${news.type.replace('-', ' ').toUpperCase()}
              </span>
              <span class="text-xs text-blue-600">📍 ${news.location}</span>
            </div>
            <h4 class="font-bold text-blue-900 mb-2 text-base sm:text-lg">${news.title}</h4>
            <p class="text-blue-700 mb-3 text-sm sm:text-base">${news.content}</p>
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-blue-600 flex-wrap">
                <span>By ${news.author}</span>
                <span>•</span>
                <span>${news.date}</span>
              </div>
              <div class="flex items-center gap-1 sm:gap-2">
                ${news.reactions.map(reaction => `<span class="text-base sm:text-lg">${reaction}</span>`).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
      newsListEl.appendChild(card);
    });
  }
}

// Join Club Form Handler
class JoinClubForm {
  constructor() {
    this.init();
  }

  init() {
    const form = document.getElementById("joinClubForm");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit(form);
    });
  }

  async handleSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Try to submit to Sanity CMS
    try {
      if (typeof sanity !== 'undefined' && sanity.projectId !== 'YOUR_PROJECT_ID') {
        const result = await sanity.submitJoinClubForm(data);
        if (result.success) {
          alert("Welcome to NashfyPitStop! You've successfully joined our community. We'll send you updates about upcoming events and races.");
          form.reset();
          return;
        } else {
          console.warn('Form submission to Sanity failed, using fallback');
        }
      }
    } catch (error) {
      console.warn('Error submitting form to Sanity:', error);
    }
    
    // Fallback: Simulate form submission
    alert("Welcome to NashfyPitStop! You've successfully joined our community. We'll send you updates about upcoming events and races.");
    
    // Reset form
    form.reset();
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  const navigation = new Navigation();
  const realTimeData = new RealTimeData();
  window.realTimeData = realTimeData; // Make accessible globally for section navigation
  new QuizSystem();
  new JoinClubForm();
  new BlogPage();
});