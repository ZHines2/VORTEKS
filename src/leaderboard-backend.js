// leaderboard-backend.js
// VORTEKS Serverless Leaderboard Backend Integration

/*
  DEMO IMPLEMENTATION NOTICE:
  This is a demonstration of the serverless backend architecture.
  For production use, replace the functions below with actual API calls to:
  
  - Firebase Realtime Database
  - Supabase
  - JSONBin.io with API key
  - Custom REST API
  - Any other serverless backend
  
/*
  PRODUCTION BACKEND EXAMPLES:
  
  // Firebase Realtime Database
  export async function loadLeaderboardFromBackend() {
    const response = await fetch(`https://your-project.firebaseio.com/leaderboard.json`);
    const data = await response.json();
    return Object.values(data || {});
  }
  
  // Supabase
  export async function loadLeaderboardFromBackend() {
    const response = await fetch('https://your-project.supabase.co/rest/v1/leaderboard', {
      headers: { 'apikey': 'your-anon-key' }
    });
    return await response.json();
  }
  
  // JSONBin.io with API key
  export async function loadLeaderboardFromBackend() {
    const response = await fetch('https://api.jsonbin.io/v3/b/your-bin-id/latest', {
      headers: { 'X-Master-Key': 'your-api-key' }
    });
    const data = await response.json();
    return data.record.leaderboard;
  }
*/

// Configuration for serverless storage
const BACKEND_CONFIG = {
  FALLBACK_TIMEOUT: 2000, // 2 seconds timeout for demo
  RETRY_ATTEMPTS: 2
};

// Demo: simulate backend using shared localStorage key
const SHARED_LEADERBOARD_KEY = 'vorteks-shared-leaderboard';

let isBackendAvailable = true;
let syncInProgress = false;

// Check if backend is available (for this demo, always true)
export async function checkBackendHealth() {
  // Simulate network check
  try {
    // For demo purposes, we'll simulate a backend check
    await new Promise(resolve => setTimeout(resolve, 100));
    isBackendAvailable = true;
    return true;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    isBackendAvailable = false;
    return false;
  }
}

// Load leaderboard data from "backend" (shared localStorage for demo)
export async function loadLeaderboardFromBackend() {
  if (!isBackendAvailable) {
    console.log('Backend unavailable, using localStorage fallback');
    return null;
  }

  try {
    setSyncStatus(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // For demo: use a shared localStorage key to simulate global storage
    const stored = localStorage.getItem(SHARED_LEADERBOARD_KEY);
    const data = stored ? JSON.parse(stored) : { leaderboard: [], lastUpdated: new Date().toISOString() };
    
    console.log('Leaderboard data loaded from "backend"');
    return data.leaderboard || [];
  } catch (error) {
    console.warn('Failed to load from backend:', error);
    isBackendAvailable = false;
    return null;
  } finally {
    setSyncStatus(false);
  }
}

// Save leaderboard data to "backend" (shared localStorage for demo)
export async function saveLeaderboardToBackend(leaderboardData) {
  if (!isBackendAvailable) {
    console.log('Backend unavailable, skipping save');
    return false;
  }

  try {
    setSyncStatus(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Prepare the data payload
    const payload = {
      leaderboard: leaderboardData,
      lastUpdated: new Date().toISOString(),
      version: 1
    };

    // For demo: save to shared localStorage to simulate persistence
    localStorage.setItem(SHARED_LEADERBOARD_KEY, JSON.stringify(payload));
    
    console.log('Leaderboard data saved to "backend"');
    return true;
  } catch (error) {
    console.warn('Failed to save to backend:', error);
    isBackendAvailable = false;
    return false;
  } finally {
    setSyncStatus(false);
  }
}

// Sync localStorage data with backend (merge strategy)
export async function syncWithBackend(localData) {
  try {
    setSyncStatus(true);
    
    // Load backend data
    const backendData = await loadLeaderboardFromBackend();
    if (!backendData) {
      console.log('No backend data available, keeping local data');
      return localData;
    }

    // Merge strategy: keep the most recent entry for each player
    const mergedData = [];
    const playerMap = new Map();

    // Process backend data first
    backendData.forEach(entry => {
      if (entry.nickname && entry.timestamp) {
        playerMap.set(entry.nickname, entry);
      }
    });

    // Process local data, overwriting if newer
    localData.forEach(entry => {
      if (entry.nickname && entry.timestamp) {
        const existing = playerMap.get(entry.nickname);
        if (!existing || entry.timestamp > existing.timestamp) {
          playerMap.set(entry.nickname, entry);
        }
      }
    });

    // Convert back to array
    const merged = Array.from(playerMap.values());
    
    // Save merged data back to backend
    await saveLeaderboardToBackend(merged);
    
    console.log(`Synced leaderboard: ${merged.length} players`);
    return merged;
  } catch (error) {
    console.warn('Sync failed:', error);
    return localData; // Fallback to local data
  } finally {
    setSyncStatus(false);
  }
}

// Set sync status indicator
function setSyncStatus(syncing) {
  syncInProgress = syncing;
  
  // Update UI indicator if it exists
  const indicator = document.getElementById('syncIndicator');
  if (indicator) {
    indicator.style.display = syncing ? 'inline' : 'none';
    indicator.textContent = syncing ? '🔄' : '';
    indicator.title = syncing ? 'Syncing with server...' : '';
  }

  // Update refresh button if it exists
  const refreshBtn = document.getElementById('refreshLeaderboardBtn');
  if (refreshBtn) {
    refreshBtn.disabled = syncing;
    refreshBtn.textContent = syncing ? '⏳ SYNCING' : '🔄 REFRESH';
  }
}

// Get current sync status
export function isSyncing() {
  return syncInProgress;
}

// Get backend availability status
export function isBackendOnline() {
  return isBackendAvailable;
}

// Initialize backend (check health)
export async function initializeBackend() {
  console.log('Initializing leaderboard backend...');
  const available = await checkBackendHealth();
  
  if (available) {
    console.log('Backend is online and ready');
  } else {
    console.log('Backend is offline, using localStorage fallback');
  }
  
  return available;
}

// Manual backend reconnection attempt
export async function retryBackendConnection() {
  console.log('Attempting to reconnect to backend...');
  return await initializeBackend();
}