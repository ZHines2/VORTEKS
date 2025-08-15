// leaderboard.js
// VORTEKS Global Leaderboard System

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
  } catch (e) {
    console.warn('Failed to load player profile:', e);
    playerProfile = { ...DEFAULT_PLAYER_PROFILE };
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

// Load leaderboard data from localStorage
export function loadLeaderboard() {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('Failed to load leaderboard:', e);
    return [];
  }
}

// Save leaderboard data to localStorage
export function saveLeaderboard(data) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save leaderboard:', e);
  }
}

// Submit player stats to leaderboard
export function submitToLeaderboard(analytics) {
  const profile = getPlayerProfile();
  
  if (!profile.shareStats || !profile.nickname) {
    return false; // Player hasn't opted in or set nickname
  }

  const leaderboard = loadLeaderboard();
  const timestamp = Date.now();

  // Create entry for this player
  const entry = {
    nickname: profile.nickname,
    timestamp: timestamp,
    stats: {
      totalWins: analytics.battles.wins,
      totalGames: analytics.battles.totalGames,
      winStreak: analytics.battles.bestStreak,
      perfectWins: analytics.battles.perfectWins,
      quickWins: analytics.battles.quickWins,
      winRate: parseFloat(analytics.battles.winRate.replace('%', '')),
      favoriteCard: analytics.cards.favoriteCard || 'None',
      uniqueCards: analytics.cards.uniqueCards,
      totalCardsPlayed: analytics.cards.totalPlayed,
      totalDamage: analytics.combat.totalDamage,
      maxSingleHit: analytics.combat.maxSingleHit,
      opponentsDefeated: analytics.opponents.uniqueDefeated,
      easterEggsSeen: analytics.opponents.easterEggsSeen,
      firstPlayed: analytics.session.firstPlayed
    }
  };

  // Remove any existing entry for this player
  const filteredBoard = leaderboard.filter(e => e.nickname !== profile.nickname);
  
  // Add new entry
  filteredBoard.push(entry);
  
  // Save updated leaderboard
  saveLeaderboard(filteredBoard);
  
  // Update last submitted timestamp
  profile.lastSubmitted = timestamp;
  savePlayerProfile();
  
  return true;
}

// Get leaderboard for a specific category
export function getLeaderboard(category, limit = 10) {
  const leaderboard = loadLeaderboard();
  
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
export function getPlayerRank(category) {
  const profile = getPlayerProfile();
  if (!profile.nickname) return null;
  
  const leaderboard = getLeaderboard(category, 1000); // Get full leaderboard
  const rank = leaderboard.findIndex(entry => entry.nickname === profile.nickname);
  
  return rank >= 0 ? rank + 1 : null;
}

// Check if player can submit to leaderboard
export function canSubmitToLeaderboard() {
  const profile = getPlayerProfile();
  return profile.shareStats && profile.nickname && profile.nickname.trim().length > 0;
}

// Reset all leaderboard data (admin function)
export function resetLeaderboard() {
  localStorage.removeItem(LEADERBOARD_KEY);
  return true;
}

export { LEADERBOARD_CATEGORIES };