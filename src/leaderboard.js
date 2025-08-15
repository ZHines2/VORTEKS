// leaderboard.js
// VORTEKS Global Leaderboard System

import { 
  loadLeaderboardFromBackend, 
  saveLeaderboardToBackend, 
  syncWithBackend,
  initializeBackend,
  isBackendOnline,
  isSyncing,
  configureJSONBin
} from './leaderboard-backend.js';
import { generateUUID, sanitizeNickname, clamp } from './utils.js';

const LEADERBOARD_KEY = 'vorteks-global-leaderboard';
const PLAYER_PROFILE_KEY = 'vorteks-player-profile';

// Leaderboard categories to track
const LEADERBOARD_CATEGORIES = {
  TOTAL_WINS: 'total_wins',
  WIN_STREAK: 'win_streak',
  PERFECT_WINS: 'perfect_wins',
  QUICK_WINS: 'quick_wins',
  WIN_RATE: 'win_rate',
  TOTAL_GAMES: 'total_games'
};

// Default player profile structure
const DEFAULT_PLAYER_PROFILE = {
  id: null, // UUIDv4 for unique identification
  nickname: null,
  shareStats: false,
  lastSubmitted: null
};

let playerProfile = null;

// Load player profile from localStorage
export function loadPlayerProfile() {
  try {
    const stored = localStorage.getItem(PLAYER_PROFILE_KEY);
    if (stored) {
      playerProfile = { ...DEFAULT_PLAYER_PROFILE, ...JSON.parse(stored) };
    } else {
      playerProfile = { ...DEFAULT_PLAYER_PROFILE };
    }
    
    // Ensure profile has a unique ID
    if (!playerProfile.id) {
      playerProfile.id = generateUUID();
      savePlayerProfile(); // Save the new ID immediately
    }
  } catch (e) {
    console.warn('Failed to load player profile:', e);
    playerProfile = { ...DEFAULT_PLAYER_PROFILE };
    playerProfile.id = generateUUID();
    savePlayerProfile();
  }
  return playerProfile;
}

// Save player profile to localStorage
export function savePlayerProfile() {
  if (!playerProfile) return;
  
  try {
    localStorage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(playerProfile));
  } catch (e) {
    console.warn('Failed to save player profile:', e);
  }
}

// Get current player profile
export function getPlayerProfile() {
  if (!playerProfile) {
    loadPlayerProfile();
  }
  return playerProfile;
}

// Update player profile
export function updatePlayerProfile(updates) {
  const profile = getPlayerProfile();
  Object.assign(profile, updates);
  savePlayerProfile();
  return profile;
}

// Load leaderboard data from backend or localStorage
export async function loadLeaderboard() {
  try {
    // Try to load from backend first
    if (isBackendOnline()) {
      const backendData = await loadLeaderboardFromBackend();
      if (backendData) {
        // Also save to localStorage as cache
        saveLeaderboardToLocalStorage(backendData);
        return backendData;
      }
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('Failed to load leaderboard:', e);
    // Final fallback - empty array
    return [];
  }
}

// Save leaderboard data to localStorage only
function saveLeaderboardToLocalStorage(data) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save leaderboard to localStorage:', e);
  }
}

// Save leaderboard data to both backend and localStorage
export async function saveLeaderboard(data) {
  // Always save to localStorage first (immediate fallback)
  saveLeaderboardToLocalStorage(data);
  
  // Try to save to backend
  if (isBackendOnline()) {
    const success = await saveLeaderboardToBackend(data);
    if (!success) {
      console.log('Backend save failed, data is still saved locally');
    }
  }
}

// Submit player stats to leaderboard
export async function submitToLeaderboard(analytics) {
  const profile = getPlayerProfile();
  
  if (!profile.shareStats || !profile.nickname) {
    return false; // Player hasn't opted in or set nickname
  }

  const leaderboard = await loadLeaderboard();
  const timestamp = Date.now();
  const sanitizedNickname = sanitizeNickname(profile.nickname);
  
  if (!sanitizedNickname || sanitizedNickname.length < 3) {
    console.warn('Nickname too short after sanitization');
    return false;
  }

  // Create entry for this player with sanitized/clamped stats
  const entry = {
    playerId: profile.id, // Primary identifier
    nickname: sanitizedNickname,
    timestamp: timestamp,
    stats: {
      totalWins: clamp(analytics.battles.wins || 0, 0, 999999),
      totalGames: clamp(analytics.battles.totalGames || 0, 0, 999999),
      winStreak: clamp(analytics.battles.bestStreak || 0, 0, 999999),
      perfectWins: clamp(analytics.battles.perfectWins || 0, 0, 999999),
      quickWins: clamp(analytics.battles.quickWins || 0, 0, 999999),
      winRate: clamp(parseFloat(analytics.battles.winRate.replace('%', '')) || 0, 0, 100),
      favoriteCard: String(analytics.cards.favoriteCard || 'None').substring(0, 50),
      uniqueCards: clamp(analytics.cards.uniqueCards || 0, 0, 999),
      totalCardsPlayed: clamp(analytics.cards.totalPlayed || 0, 0, 999999),
      totalDamage: clamp(analytics.combat.totalDamage || 0, 0, 999999),
      maxSingleHit: clamp(analytics.combat.maxSingleHit || 0, 0, 999999),
      opponentsDefeated: clamp(analytics.opponents.uniqueDefeated || 0, 0, 999),
      easterEggsSeen: clamp(analytics.opponents.easterEggsSeen || 0, 0, 999),
      firstPlayed: analytics.session.firstPlayed || timestamp
    }
  };

  // Remove any existing entry for this player (prefer playerId, fallback to nickname)
  const filteredBoard = leaderboard.filter(e => {
    if (e.playerId && profile.id) {
      return e.playerId !== profile.id;
    }
    // Backward compatibility: filter by nickname if no playerId
    return e.nickname !== sanitizedNickname;
  });
  
  // Add new entry
  filteredBoard.push(entry);
  
  // Save updated leaderboard
  await saveLeaderboard(filteredBoard);
  
  // Update last submitted timestamp
  profile.lastSubmitted = timestamp;
  savePlayerProfile();
  
  return true;
}

// Get leaderboard for a specific category
export async function getLeaderboard(category, limit = 10) {
  const leaderboard = await loadLeaderboard();
  
  if (leaderboard.length === 0) {
    return [];
  }

  let sortedBoard;
  
  switch (category) {
    case LEADERBOARD_CATEGORIES.TOTAL_WINS:
      sortedBoard = leaderboard.sort((a, b) => b.stats.totalWins - a.stats.totalWins);
      break;
    case LEADERBOARD_CATEGORIES.WIN_STREAK:
      sortedBoard = leaderboard.sort((a, b) => b.stats.winStreak - a.stats.winStreak);
      break;
    case LEADERBOARD_CATEGORIES.PERFECT_WINS:
      sortedBoard = leaderboard.sort((a, b) => b.stats.perfectWins - a.stats.perfectWins);
      break;
    case LEADERBOARD_CATEGORIES.QUICK_WINS:
      sortedBoard = leaderboard.sort((a, b) => b.stats.quickWins - a.stats.quickWins);
      break;
    case LEADERBOARD_CATEGORIES.WIN_RATE:
      // Only consider players with at least 5 games
      sortedBoard = leaderboard
        .filter(e => e.stats.totalGames >= 5)
        .sort((a, b) => b.stats.winRate - a.stats.winRate);
      break;
    case LEADERBOARD_CATEGORIES.TOTAL_GAMES:
      sortedBoard = leaderboard.sort((a, b) => b.stats.totalGames - a.stats.totalGames);
      break;
    default:
      sortedBoard = leaderboard.sort((a, b) => b.stats.totalWins - a.stats.totalWins);
  }
  
  return sortedBoard.slice(0, limit);
}

// Get all available leaderboard categories with display info
export function getLeaderboardCategories() {
  return [
    { 
      id: LEADERBOARD_CATEGORIES.TOTAL_WINS, 
      name: 'Total Wins', 
      icon: '🏆',
      description: 'Most battles won overall'
    },
    { 
      id: LEADERBOARD_CATEGORIES.WIN_STREAK, 
      name: 'Best Win Streak', 
      icon: '🔥',
      description: 'Longest consecutive wins'
    },
    { 
      id: LEADERBOARD_CATEGORIES.PERFECT_WINS, 
      name: 'Perfect Wins', 
      icon: '💎',
      description: 'Wins with full health remaining'
    },
    { 
      id: LEADERBOARD_CATEGORIES.QUICK_WINS, 
      name: 'Quick Wins', 
      icon: '⚡',
      description: 'Wins in 5 turns or fewer'
    },
    { 
      id: LEADERBOARD_CATEGORIES.WIN_RATE, 
      name: 'Win Rate', 
      icon: '📈',
      description: 'Highest win percentage (min 5 games)'
    },
    { 
      id: LEADERBOARD_CATEGORIES.TOTAL_GAMES, 
      name: 'Most Active', 
      icon: '🎮',
      description: 'Most battles played'
    }
  ];
}

// Get player's rank in a specific category
export async function getPlayerRank(category) {
  const profile = getPlayerProfile();
  if (!profile.nickname) return null;
  
  const leaderboard = await getLeaderboard(category, 1000); // Get full leaderboard
  const rank = leaderboard.findIndex(entry => {
    // Prefer playerId match, fallback to nickname for backward compatibility
    if (entry.playerId && profile.id) {
      return entry.playerId === profile.id;
    }
    return entry.nickname === sanitizeNickname(profile.nickname);
  });
  
  return rank >= 0 ? rank + 1 : null;
}

// Check if player can submit to leaderboard
export function canSubmitToLeaderboard() {
  const profile = getPlayerProfile();
  return profile.shareStats && profile.nickname && profile.nickname.trim().length > 0;
}

// Reset all leaderboard data (admin function)
export async function resetLeaderboard() {
  localStorage.removeItem(LEADERBOARD_KEY);
  
  // If backend is available, clear it too
  if (isBackendOnline()) {
    await saveLeaderboardToBackend([]);
  }
  
  return true;
}

// Sync local data with backend
export async function syncLeaderboard() {
  if (!isBackendOnline()) {
    console.log('Backend offline, cannot sync');
    return false;
  }
  
  try {
    const localData = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
    const syncedData = await syncWithBackend(localData);
    saveLeaderboardToLocalStorage(syncedData);
    return true;
  } catch (error) {
    console.warn('Sync failed:', error);
    return false;
  }
}

// Initialize the leaderboard system
export async function initializeLeaderboard() {
  // Initialize backend connection
  await initializeBackend();
  
  // If backend is available, try to sync existing local data
  if (isBackendOnline()) {
    await syncLeaderboard();
  }
}

export { LEADERBOARD_CATEGORIES, initializeBackend, isBackendOnline, isSyncing, configureJSONBin };