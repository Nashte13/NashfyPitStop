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
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupMobileMenu();
    this.showSection('home');
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('href').substring(1);
        this.showSection(section);
        this.updateActiveLink(link);
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

    // Close mobile menu when clicking on links
    const mobileLinks = document.querySelectorAll('#mobileMenu a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.toggleMobileMenu();
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
    this.loadRaceSchedule();
    this.loadNews();
    this.loadVenues();
    this.loadBlogs();
    this.loadRaceReactions();
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

  async loadRaceSchedule() {
    try {
      const res = await fetch("https://ergast.com/api/f1/2025.json");
      const data = await res.json();
      const races = data.MRData?.RaceTable?.Races ?? [];
      
      if (races.length > 0) {
        this.renderSchedule(races);
        this.startRaceCountdown(races);
      }
    } catch (e) {
      this.renderMockSchedule();
    }
  }

  renderSchedule(races) {
    const list = document.getElementById("scheduleList");
    if (!list) return;

    list.innerHTML = "";
    races.slice(0, 6).forEach((race) => {
      const eatDate = new Date(race.date + "T" + (race.time || "15:00:00Z"));
      const card = document.createElement("div");
      card.className = "glass-card space-y-2";
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="text-sm text-blue-600">Round ${race.round}</div>
          <div class="chip bg-orange-100 text-orange-700">${race.Circuit?.Location?.country || ""}</div>
        </div>
        <div class="text-lg font-semibold text-blue-900">${race.raceName}</div>
        <div class="text-blue-700">${formatDateEAT(eatDate)} EAT</div>
      `;
      list.appendChild(card);
    });
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

  startRaceCountdown(races) {
    const now = new Date();
    const nextRace = races.find(r => new Date(r.date + "T" + (r.time || "15:00:00Z")) > now) || races[0];
    
    if (nextRace) {
      const targetDate = new Date(nextRace.date + "T" + (nextRace.time || "15:00:00Z"));
      this.updateCountdown(targetDate);
    }
  }

  updateCountdown(targetDate) {
    const el = document.getElementById("nextRaceCountdown");
    if (!el) return;

    const update = () => {
      const now = new Date();
      const diff = targetDate - now;
      
      if (diff <= 0) {
        el.textContent = "RACE DAY!";
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        el.textContent = `${days}d ${hours}h ${minutes}m`;
      } else {
        el.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      }
    };

    update();
    setInterval(update, 1000);
  }

  loadNews() {
    const newsData = [
      {
        title: "Verstappen Dominates Saudi Arabian GP",
        summary: "Red Bull's Max Verstappen secures another commanding victory in Jeddah",
        image: "🏎️",
        category: "Race Results"
      },
      {
        title: "New Regulations for 2025 Season",
        summary: "FIA announces updated technical regulations focusing on sustainability",
        image: "📋",
        category: "Regulations"
      },
      {
        title: "Hamilton's Move to Ferrari Confirmed",
        summary: "Seven-time world champion makes historic switch to Scuderia Ferrari",
        image: "🔴",
        category: "Driver News"
      },
      {
        title: "Nairobi Watch Party Venues Announced",
        summary: "Check out the best spots to watch F1 races in Kenya's capital",
        image: "🏁",
        category: "Community"
      }
    ];

    this.renderNewsCarousel(newsData);
  }

  renderNewsCarousel(newsData) {
    const track = document.getElementById("carouselTrack");
    if (!track) return;

    track.innerHTML = "";
    newsData.forEach((news, index) => {
      const slide = document.createElement("div");
      slide.className = "min-w-full px-4";
      slide.innerHTML = `
        <div class="glass-card p-6">
          <div class="flex items-center gap-4">
            <div class="text-4xl">${news.image}</div>
            <div>
              <div class="chip bg-orange-100 text-orange-700 mb-2">${news.category}</div>
              <h4 class="font-bold text-blue-900 mb-2">${news.title}</h4>
              <p class="text-blue-700">${news.summary}</p>
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
    let currentIndex = 0;

    const updateCarousel = () => {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
    };

    prevBtn?.addEventListener("click", () => {
      currentIndex = Math.max(0, currentIndex - 1);
      updateCarousel();
    });

    nextBtn?.addEventListener("click", () => {
      currentIndex = Math.min(3, currentIndex + 1);
      updateCarousel();
    });

    // Auto-advance carousel
    setInterval(() => {
      currentIndex = (currentIndex + 1) % 4;
      updateCarousel();
    }, 5000);
  }

  loadVenues() {
    const venuesData = [
      {
        name: "K1 Klubhouse",
        location: "Westlands, Nairobi",
        description: "Premium sports bar with large screens and great atmosphere",
        capacity: "50+ people",
        amenities: ["Large Screens", "Food & Drinks", "Parking"]
      },
      {
        name: "Brew Bistro",
        location: "Lavington, Nairobi",
        description: "Cozy venue with craft beer and F1 fan community",
        capacity: "30+ people",
        amenities: ["Craft Beer", "Snacks", "WiFi"]
      },
      {
        name: "Tamarind Mombasa",
        location: "Mombasa",
        description: "Beachfront venue with ocean views during races",
        capacity: "40+ people",
        amenities: ["Ocean View", "Fresh Seafood", "AC"]
      },
      {
        name: "Sky Lounge Kampala",
        location: "Kampala, Uganda",
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
      const card = document.createElement("div");
      card.className = "glass-card";
      card.innerHTML = `
        <h4 class="font-bold text-blue-900 mb-2">${venue.name}</h4>
        <p class="text-blue-600 text-sm mb-2">📍 ${venue.location}</p>
        <p class="text-blue-700 mb-3">${venue.description}</p>
        <div class="space-y-2">
          <div class="text-sm text-blue-600">👥 ${venue.capacity}</div>
          <div class="flex flex-wrap gap-1">
            ${venue.amenities.map(amenity => 
              `<span class="chip bg-green-100 text-green-700 text-xs">${amenity}</span>`
            ).join('')}
          </div>
        </div>
      `;
      venuesList.appendChild(card);
    });
  }

  loadBlogs() {
    const blogsData = [
      {
        title: "The Future of F1 in Africa",
        excerpt: "Exploring the potential for Formula 1 races on the African continent and what it means for local fans.",
        author: "Nashfy Team",
        date: "March 10, 2025",
        readTime: "5 min read"
      },
      {
        title: "East African F1 Fan Culture",
        excerpt: "How F1 fandom has grown across Kenya, Uganda, Tanzania, and Rwanda over the past decade.",
        author: "Community Writer",
        date: "March 8, 2025",
        readTime: "7 min read"
      },
      {
        title: "Race Weekend Survival Guide",
        excerpt: "Everything you need to know about organizing the perfect F1 watch party in East Africa.",
        author: "Event Coordinator",
        date: "March 5, 2025",
        readTime: "4 min read"
      }
    ];

    this.renderBlogs(blogsData);
  }

  renderBlogs(blogsData) {
    const blogsList = document.getElementById("blogsList");
    if (!blogsList) return;

    blogsList.innerHTML = "";
    blogsData.forEach(blog => {
      const card = document.createElement("div");
      card.className = "glass-card";
      card.innerHTML = `
        <h4 class="font-bold text-blue-900 mb-2">${blog.title}</h4>
        <p class="text-blue-700 mb-3">${blog.excerpt}</p>
        <div class="flex items-center justify-between text-sm text-blue-600">
          <span>By ${blog.author}</span>
          <span>${blog.date} • ${blog.readTime}</span>
        </div>
      `;
      blogsList.appendChild(card);
    });
  }

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
      
      question.answers.forEach((answer, answerIndex) => {
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

  handleSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Simulate form submission
    alert("Welcome to NashfyPitStop! You've successfully joined our community. We'll send you updates about upcoming events and races.");
    
    // Reset form
    form.reset();
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  new Navigation();
  new RealTimeData();
  new QuizSystem();
  new JoinClubForm();
});