// leaderboard-backend.js
// VORTEKS JSONBin v3 Backend Integration

/*
  JSONBin v3 Backend Implementation
  
  This adapter provides JSONBin.io integration for the global leaderboard.
  For quick prototyping, configure via browser console:
  
  window.JSONBIN_BIN_ID = 'your-bin-id';
  window.JSONBIN_MASTER_KEY = 'your-master-key'; // Optional: only needed for writes!
  
  Or use the configureJSONBin helper:
  configureJSONBin({ binId: 'your-bin-id', masterKey: 'your-master-key' });
  
  Read operations work with public bins without a master key.
  Write operations require a master key for security.
  
  SECURITY WARNING: Never commit MASTER_KEY to your repository!
  For production, use a serverless proxy to handle JSONBin authentication.
*/

import { sanitizeNickname } from './utils.js';

// Configuration for JSONBin backend
const BACKEND_CONFIG = {
  FALLBACK_TIMEOUT: 5000, // 5 seconds timeout for JSONBin requests
  RETRY_ATTEMPTS: 2,
  API_BASE: 'https://api.jsonbin.io/v3'
};

let isBackendAvailable = false;
let syncInProgress = false;
let binId = null;
let masterKey = null;

// Configure JSONBin credentials (runtime configuration)
export function configureJSONBin({ binId: newBinId, masterKey: newMasterKey }) {
  binId = newBinId;
  masterKey = newMasterKey;
  console.log('JSONBin configured with BIN_ID:', binId ? 'SET' : 'NOT SET');
  // Don't log the master key for security
}

// Get JSONBin configuration from window or runtime
function getJSONBinConfig() {
  // Try runtime config first, then window globals
  const currentBinId = binId || window.JSONBIN_BIN_ID;
  const currentMasterKey = masterKey || window.JSONBIN_MASTER_KEY;
  
  return {
    binId: currentBinId,
    masterKey: currentMasterKey,
    isConfigured: !!currentBinId // Only binId required, masterKey is optional for read-only operations
  };
}

// Check if backend is available
export async function checkBackendHealth() {
  const config = getJSONBinConfig();
  
  if (!config.isConfigured) {
    console.log('JSONBin not configured, using localStorage fallback');
    isBackendAvailable = false;
    return false;
  }

  try {
    // Test JSONBin connectivity with a simple read request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BACKEND_CONFIG.FALLBACK_TIMEOUT);
    
    const headers = {};
    // Only send master key header if we have one
    if (config.masterKey) {
      headers['X-Master-Key'] = config.masterKey;
    }
    
    const response = await fetch(`${BACKEND_CONFIG.API_BASE}/b/${config.binId}/latest`, {
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (response.ok) {
      isBackendAvailable = true;
      console.log('JSONBin backend is online');
      return true;
    } else {
      console.warn('JSONBin health check failed:', response.status);
      isBackendAvailable = false;
      return false;
    }
  } catch (error) {
    console.warn('JSONBin health check failed:', error.message);
    isBackendAvailable = false;
    return false;
  }
}

// Load leaderboard data from JSONBin
export async function loadLeaderboardFromBackend() {
  const config = getJSONBinConfig();
  
  if (!isBackendAvailable || !config.isConfigured) {
    console.log('JSONBin unavailable, using localStorage fallback');
    return null;
  }

  try {
    setSyncStatus(true);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BACKEND_CONFIG.FALLBACK_TIMEOUT);
    
    const headers = {};
    // Only send master key header if we have one
    if (config.masterKey) {
      headers['X-Master-Key'] = config.masterKey;
    }
    
    const response = await fetch(`${BACKEND_CONFIG.API_BASE}/b/${config.binId}/latest`, {
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Bin doesn't exist yet or is empty, return empty leaderboard
        console.log('JSONBin bin not found or empty, returning empty leaderboard');
        return [];
      }
      throw new Error(`JSONBin request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const leaderboard = data.record?.leaderboard || [];
    
    console.log(`Leaderboard data loaded from JSONBin: ${leaderboard.length} entries`);
    return leaderboard;
  } catch (error) {
    console.warn('Failed to load from JSONBin:', error.message);
    isBackendAvailable = false;
    return null;
  } finally {
    setSyncStatus(false);
  }
}

// Save leaderboard data to JSONBin
export async function saveLeaderboardToBackend(leaderboardData) {
  const config = getJSONBinConfig();
  
  if (!isBackendAvailable || !config.isConfigured) {
    console.log('JSONBin unavailable, skipping save');
    return false;
  }

  // Master key is required for write operations
  if (!config.masterKey) {
    console.log('JSONBin save requires master key, skipping save');
    return false;
  }

  try {
    setSyncStatus(true);
    
    // Prepare the data payload
    const payload = {
      leaderboard: leaderboardData,
      lastUpdated: new Date().toISOString(),
      version: 1
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BACKEND_CONFIG.FALLBACK_TIMEOUT);
    
    const response = await fetch(`${BACKEND_CONFIG.API_BASE}/b/${config.binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': config.masterKey
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`JSONBin save failed: ${response.status}`);
    }
    
    console.log(`Leaderboard data saved to JSONBin: ${leaderboardData.length} entries`);
    return true;
  } catch (error) {
    console.warn('Failed to save to JSONBin:', error.message);
    isBackendAvailable = false;
    return false;
  } finally {
    setSyncStatus(false);
  }
}

// Sync localStorage data with JSONBin (merge strategy)
export async function syncWithBackend(localData) {
  try {
    setSyncStatus(true);
    
    // Load backend data
    const backendData = await loadLeaderboardFromBackend();
    if (!backendData) {
      console.log('No JSONBin data available, keeping local data');
      return localData;
    }

    // Merge strategy: prefer playerId if present, then normalized nickname, then newest timestamp
    const playerMap = new Map();

    // Helper function to create player key for deduplication
    const getPlayerKey = (entry) => {
      if (entry.playerId) {
        return `id:${entry.playerId}`;
      }
      if (entry.nickname) {
        return `nick:${sanitizeNickname(entry.nickname).toLowerCase()}`;
      }
      return `fallback:${entry.timestamp}:${Math.random()}`;
    };

    // Process backend data first
    backendData.forEach(entry => {
      if (entry.nickname && entry.timestamp) {
        const key = getPlayerKey(entry);
        playerMap.set(key, entry);
      }
    });

    // Process local data, overwriting if newer or has better identifier
    localData.forEach(entry => {
      if (entry.nickname && entry.timestamp) {
        const key = getPlayerKey(entry);
        const existing = playerMap.get(key);
        
        if (!existing || 
            entry.timestamp > existing.timestamp || 
            (entry.playerId && !existing.playerId)) {
          playerMap.set(key, entry);
        }
      }
    });

    // Convert back to array
    const merged = Array.from(playerMap.values());
    
    // Save merged data back to JSONBin
    await saveLeaderboardToBackend(merged);
    
    console.log(`Synced leaderboard: ${merged.length} players`);
    return merged;
  } catch (error) {
    console.warn('Sync failed:', error.message);
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
    indicator.title = syncing ? 'Syncing with JSONBin...' : '';
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
  return isBackendAvailable && getJSONBinConfig().isConfigured;
}

// Initialize backend (check health)
export async function initializeBackend() {
  console.log('Initializing JSONBin leaderboard backend...');
  
  // Try to read config from window globals first
  const config = getJSONBinConfig();
  if (config.isConfigured) {
    const available = await checkBackendHealth();
    
    if (available) {
      console.log('JSONBin backend is online and ready');
    } else {
      console.log('JSONBin backend is offline, using localStorage fallback');
    }
    
    return available;
  } else {
    console.log('JSONBin not configured. Set window.JSONBIN_BIN_ID or use configureJSONBin()');
    console.log('Note: MASTER_KEY is only required for write operations');
    console.log('Using localStorage fallback');
    isBackendAvailable = false;
    return false;
  }
}

// Manual backend reconnection attempt
export async function retryBackendConnection() {
  console.log('Attempting to reconnect to JSONBin...');
  return await initializeBackend();
}