/**
 * Backend API Client for NashfyPitStop
 * Handles all communication with the Python FastAPI backend
 */
class BackendClient {
  constructor() {
    // Backend API URL - change this for production
    this.baseUrl = 'http://localhost:8000';
    this.apiUrl = `${this.baseUrl}/api`;
    
    // Cache for race schedule (5 minutes)
    this.cache = {
      raceSchedule: null,
      cacheTime: null,
      cacheDuration: 5 * 60 * 1000 // 5 minutes
    };
  }

  /**
   * Check if backend is available
   */
  async checkBackend() {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.warn('⚠️ Backend not available:', error.message);
      return false;
    }
  }

  /**
   * Get race schedule for a year
   */
  async getRaceSchedule(year = 2025, includeSessions = false) {
    try {
      // Check cache first
      if (this.cache.raceSchedule && 
          this.cache.raceSchedule.year === year &&
          this.cache.cacheTime &&
          (Date.now() - this.cache.cacheTime) < this.cache.cacheDuration) {
        console.log('📦 Using cached race schedule');
        return this.cache.raceSchedule;
      }

      const url = `${this.apiUrl}/race-schedule?year=${year}&include_sessions=${includeSessions}`;
      console.log('🔵 Fetching race schedule from backend:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.races) {
        // Cache the result
        this.cache.raceSchedule = data;
        this.cache.cacheTime = Date.now();
        
        console.log('✅ Race schedule loaded from backend:', data.count, 'races');
        return data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching race schedule from backend:', error);
      throw error;
    }
  }

  /**
   * Get race results
   */
  async getRaceResults(year = 2025, round = null, latest = false) {
    try {
      let url = `${this.apiUrl}/race-results?year=${year}`;
      if (round) {
        url += `&round=${round}`;
      }
      if (latest) {
        url += `&latest=true`;
      }
      
      console.log('🔵 Fetching race results from backend:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Race results loaded from backend');
        return data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching race results from backend:', error);
      throw error;
    }
  }

  /**
   * Get driver standings
   */
  async getDriverStandings(year = 2025, afterRound = null) {
    try {
      let url = `${this.apiUrl}/driver-standings?year=${year}`;
      if (afterRound) {
        url += `&after_round=${afterRound}`;
      }
      
      console.log('🔵 Fetching driver standings from backend:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Driver standings loaded from backend');
        return data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching driver standings from backend:', error);
      throw error;
    }
  }

  /**
   * Get constructor standings
   */
  async getConstructorStandings(year = 2025, afterRound = null) {
    try {
      let url = `${this.apiUrl}/constructor-standings?year=${year}`;
      if (afterRound) {
        url += `&after_round=${afterRound}`;
      }
      
      console.log('🔵 Fetching constructor standings from backend:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Constructor standings loaded from backend');
        return data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching constructor standings from backend:', error);
      throw error;
    }
  }

  /**
   * Get telemetry data
   */
  async getTelemetry(year = 2025, round = 1, session = 'R', driver = null) {
    try {
      let url = `${this.apiUrl}/telemetry?year=${year}&round=${round}&session=${session}`;
      if (driver) {
        url += `&driver=${driver}`;
      }
      
      console.log('🔵 Fetching telemetry from backend:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Telemetry loaded from backend');
        return data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching telemetry from backend:', error);
      throw error;
    }
  }

  /**
   * Get lap times
   */
  async getLapTimes(year = 2025, round = 1, session = 'R', driver = null) {
    try {
      let url = `${this.apiUrl}/lap-times?year=${year}&round=${round}&session=${session}`;
      if (driver) {
        url += `&driver=${driver}`;
      }
      
      console.log('🔵 Fetching lap times from backend:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Lap times loaded from backend');
        return data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching lap times from backend:', error);
      throw error;
    }
  }

  /**
   * Get next race information
   */
  async getNextRace() {
    try {
      const url = `${this.apiUrl}/next-race`;
      console.log('🔵 Fetching next race from backend:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Next race loaded from backend');
        return data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching next race from backend:', error);
      throw error;
    }
  }
}

// Initialize backend client
const backend = new BackendClient();

