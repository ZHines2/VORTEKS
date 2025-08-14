// telemetry.js
// VORTEKS Player Analytics and Telemetry System

const TELEMETRY_KEY = 'vorteks-telemetry';
const TELEMETRY_VERSION = 1;

// Default telemetry structure
const DEFAULT_TELEMETRY = {
  version: TELEMETRY_VERSION,
  battles: {
    total: 0,
    wins: 0,
    losses: 0,
    maxStreak: 0,
    currentStreak: 0,
    perfectWins: 0, // Wins at full HP
    quickWins: 0,   // Wins in under 5 turns
  },
  cards: {
    played: {}, // cardId -> count
    favorite: null, // most played card
    typePreference: { // attack/skill/power usage
      attack: 0,
      skill: 0, 
      power: 0
    }
  },
  combat: {
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    totalEnergySpent: 0,
    totalCardsDrawn: 0,
    totalShieldGained: 0,
    totalHealingReceived: 0,
    pierceDamageDealt: 0,
    burnDamageDealt: 0,
    maxSingleHit: 0,
    maxEnergyReached: 3
  },
  turns: {
    total: 0,
    averageCardsPerTurn: 0,
    averageEnergyPerTurn: 0,
    maxCardsInTurn: 0,
    maxEnergyInTurn: 0,
    echoActivations: 0,
    allEnergyTurns: 0 // turns where all energy was spent
  },
  quirks: {
    used: {}, // quirkId -> count
    favorite: null
  },
  achievements: {
    unlocked: [],
    progress: {}
  },
  opponents: {
    defeated: {},      // persona -> count
    totalFaced: 0,
    favoriteTarget: null, // most defeated persona
    easterEggsSeen: 0
  },
  session: {
    firstPlayed: null,
    lastPlayed: null,
    totalPlayTime: 0,
    longestSession: 0
  }
};

let currentTelemetry = null;
let sessionStartTime = Date.now();

// Load telemetry data from localStorage
export function loadTelemetry() {
  try {
    const stored = localStorage.getItem(TELEMETRY_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Migrate if needed
      if (data.version !== TELEMETRY_VERSION) {
        currentTelemetry = migrateTelemetry(data);
      } else {
        currentTelemetry = { ...DEFAULT_TELEMETRY, ...data };
      }
    } else {
      currentTelemetry = { ...DEFAULT_TELEMETRY };
      currentTelemetry.session.firstPlayed = Date.now();
    }
  } catch (e) {
    console.warn('Failed to load telemetry:', e);
    currentTelemetry = { ...DEFAULT_TELEMETRY };
    currentTelemetry.session.firstPlayed = Date.now();
  }
  
  currentTelemetry.session.lastPlayed = Date.now();
  saveTelemetry();
  return currentTelemetry;
}

// Save telemetry data to localStorage
export function saveTelemetry() {
  if (!currentTelemetry) return;
  
  try {
    currentTelemetry.session.lastPlayed = Date.now();
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(currentTelemetry));
  } catch (e) {
    console.warn('Failed to save telemetry:', e);
  }
}

// Migrate old telemetry data
function migrateTelemetry(oldData) {
  const newData = { ...DEFAULT_TELEMETRY };
  // Copy over what we can from old data
  if (oldData.battles) Object.assign(newData.battles, oldData.battles);
  if (oldData.cards) Object.assign(newData.cards, oldData.cards);
  if (oldData.combat) Object.assign(newData.combat, oldData.combat);
  newData.version = TELEMETRY_VERSION;
  return newData;
}

// Reset all telemetry data
export function resetTelemetry() {
  currentTelemetry = { ...DEFAULT_TELEMETRY };
  currentTelemetry.session.firstPlayed = Date.now();
  currentTelemetry.session.lastPlayed = Date.now();
  saveTelemetry();
}

// Get current telemetry data
export function getTelemetry() {
  if (!currentTelemetry) {
    loadTelemetry();
  }
  return currentTelemetry;
}

// Record battle result
export function recordBattle(result, streak = 0, playerHP = 0, maxHP = 0, turns = 0) {
  const telemetry = getTelemetry();
  
  telemetry.battles.total++;
  telemetry.battles.currentStreak = streak;
  
  if (result === 'win') {
    telemetry.battles.wins++;
    telemetry.battles.maxStreak = Math.max(telemetry.battles.maxStreak, streak);
    
    if (playerHP === maxHP) {
      telemetry.battles.perfectWins++;
    }
    
    if (turns <= 5) {
      telemetry.battles.quickWins++;
    }
  } else {
    telemetry.battles.losses++;
    telemetry.battles.currentStreak = 0;
  }
  
  saveTelemetry();
}

// Record card played
export function recordCardPlayed(cardId, cardType = null, energyCost = 0) {
  const telemetry = getTelemetry();
  
  // Track card usage
  telemetry.cards.played[cardId] = (telemetry.cards.played[cardId] || 0) + 1;
  
  // Update favorite card
  const maxPlayed = Math.max(...Object.values(telemetry.cards.played));
  for (const [id, count] of Object.entries(telemetry.cards.played)) {
    if (count === maxPlayed) {
      telemetry.cards.favorite = id;
      break;
    }
  }
  
  // Track card type preference
  if (cardType && telemetry.cards.typePreference[cardType] !== undefined) {
    telemetry.cards.typePreference[cardType]++;
  }
  
  saveTelemetry();
}

// Record combat action
export function recordCombat(data) {
  const telemetry = getTelemetry();
  
  if (data.damageDealt) {
    telemetry.combat.totalDamageDealt += data.damageDealt;
    telemetry.combat.maxSingleHit = Math.max(telemetry.combat.maxSingleHit, data.damageDealt);
  }
  if (data.damageTaken) telemetry.combat.totalDamageTaken += data.damageTaken;
  if (data.energySpent) telemetry.combat.totalEnergySpent += data.energySpent;
  if (data.cardsDrawn) telemetry.combat.totalCardsDrawn += data.cardsDrawn;
  if (data.shieldGained) telemetry.combat.totalShieldGained += data.shieldGained;
  if (data.healingReceived) telemetry.combat.totalHealingReceived += data.healingReceived;
  if (data.pierceDamage) telemetry.combat.pierceDamageDealt += data.pierceDamage;
  if (data.burnDamage) telemetry.combat.burnDamageDealt += data.burnDamage;
  if (data.maxEnergy) telemetry.combat.maxEnergyReached = Math.max(telemetry.combat.maxEnergyReached, data.maxEnergy);
  
  saveTelemetry();
}

// Record turn data
export function recordTurn(cardsPlayed = 0, energySpent = 0, wasAllEnergySpent = false, echoUsed = false) {
  const telemetry = getTelemetry();
  
  telemetry.turns.total++;
  telemetry.turns.maxCardsInTurn = Math.max(telemetry.turns.maxCardsInTurn, cardsPlayed);
  telemetry.turns.maxEnergyInTurn = Math.max(telemetry.turns.maxEnergyInTurn, energySpent);
  
  if (wasAllEnergySpent) telemetry.turns.allEnergyTurns++;
  if (echoUsed) telemetry.turns.echoActivations++;
  
  // Update averages
  telemetry.turns.averageCardsPerTurn = 
    (telemetry.turns.averageCardsPerTurn * (telemetry.turns.total - 1) + cardsPlayed) / telemetry.turns.total;
  telemetry.turns.averageEnergyPerTurn = 
    (telemetry.turns.averageEnergyPerTurn * (telemetry.turns.total - 1) + energySpent) / telemetry.turns.total;
  
  saveTelemetry();
}

// Record quirk usage
export function recordQuirk(quirkId) {
  const telemetry = getTelemetry();
  
  telemetry.quirks.used[quirkId] = (telemetry.quirks.used[quirkId] || 0) + 1;
  
  // Update favorite quirk
  const maxUsed = Math.max(...Object.values(telemetry.quirks.used));
  for (const [id, count] of Object.entries(telemetry.quirks.used)) {
    if (count === maxUsed) {
      telemetry.quirks.favorite = id;
      break;
    }
  }
  
  saveTelemetry();
}

// Record opponent data
export function recordOpponent(persona, defeated = false, wasEasterEgg = false) {
  const telemetry = getTelemetry();
  
  telemetry.opponents.totalFaced++;
  
  if (defeated) {
    telemetry.opponents.defeated[persona] = (telemetry.opponents.defeated[persona] || 0) + 1;
    
    // Update favorite target
    const maxDefeated = Math.max(...Object.values(telemetry.opponents.defeated));
    for (const [p, count] of Object.entries(telemetry.opponents.defeated)) {
      if (count === maxDefeated) {
        telemetry.opponents.favoriteTarget = p;
        break;
      }
    }
  }
  
  if (wasEasterEgg) {
    telemetry.opponents.easterEggsSeen++;
  }
  
  saveTelemetry();
}

// Record achievement unlock
export function recordAchievement(achievementId, progress = null) {
  const telemetry = getTelemetry();
  
  if (!telemetry.achievements.unlocked.includes(achievementId)) {
    telemetry.achievements.unlocked.push(achievementId);
  }
  
  if (progress) {
    telemetry.achievements.progress[achievementId] = progress;
  }
  
  saveTelemetry();
}

// Get formatted analytics for display
export function getAnalytics() {
  const telemetry = getTelemetry();
  
  // Calculate session time
  const sessionTime = Date.now() - sessionStartTime;
  telemetry.session.totalPlayTime += sessionTime;
  telemetry.session.longestSession = Math.max(telemetry.session.longestSession, sessionTime);
  
  // Calculate derived stats
  const winRate = telemetry.battles.total > 0 ? 
    (telemetry.battles.wins / telemetry.battles.total * 100).toFixed(1) : '0.0';
  
  const avgDamagePerBattle = telemetry.battles.total > 0 ?
    (telemetry.combat.totalDamageDealt / telemetry.battles.total).toFixed(1) : '0.0';
    
  const efficiency = telemetry.combat.totalEnergySpent > 0 ?
    (telemetry.combat.totalDamageDealt / telemetry.combat.totalEnergySpent).toFixed(2) : '0.00';
  
  return {
    battles: {
      totalGames: telemetry.battles.total,
      wins: telemetry.battles.wins,
      losses: telemetry.battles.losses,
      winRate: winRate + '%',
      currentStreak: telemetry.battles.currentStreak,
      bestStreak: telemetry.battles.maxStreak,
      perfectWins: telemetry.battles.perfectWins,
      quickWins: telemetry.battles.quickWins
    },
    cards: {
      totalPlayed: Object.values(telemetry.cards.played).reduce((a, b) => a + b, 0),
      uniqueCards: Object.keys(telemetry.cards.played).length,
      favoriteCard: telemetry.cards.favorite,
      favoriteCount: telemetry.cards.favorite ? telemetry.cards.played[telemetry.cards.favorite] : 0,
      typeDistribution: telemetry.cards.typePreference
    },
    combat: {
      totalDamage: telemetry.combat.totalDamageDealt,
      damageTaken: telemetry.combat.totalDamageTaken,
      averageDamagePerBattle: avgDamagePerBattle,
      maxSingleHit: telemetry.combat.maxSingleHit,
      efficiency: efficiency,
      totalEnergySpent: telemetry.combat.totalEnergySpent,
      maxEnergyReached: telemetry.combat.maxEnergyReached,
      pierceDamage: telemetry.combat.pierceDamageDealt,
      burnDamage: telemetry.combat.burnDamageDealt
    },
    turns: {
      totalTurns: telemetry.turns.total,
      avgCardsPerTurn: telemetry.turns.averageCardsPerTurn.toFixed(1),
      avgEnergyPerTurn: telemetry.turns.averageEnergyPerTurn.toFixed(1),
      maxCardsInTurn: telemetry.turns.maxCardsInTurn,
      echoUses: telemetry.turns.echoActivations,
      efficiencyTurns: telemetry.turns.allEnergyTurns
    },
    quirks: {
      totalUsed: Object.values(telemetry.quirks.used).reduce((a, b) => a + b, 0),
      favorite: telemetry.quirks.favorite,
      favoriteCount: telemetry.quirks.favorite ? telemetry.quirks.used[telemetry.quirks.favorite] : 0
    },
    opponents: {
      totalFaced: telemetry.opponents.totalFaced,
      uniqueDefeated: Object.keys(telemetry.opponents.defeated).length,
      favoriteTarget: telemetry.opponents.favoriteTarget,
      favoriteTargetCount: telemetry.opponents.favoriteTarget ? telemetry.opponents.defeated[telemetry.opponents.favoriteTarget] : 0,
      easterEggsSeen: telemetry.opponents.easterEggsSeen
    },
    achievements: {
      unlockedCount: telemetry.achievements.unlocked.length,
      unlocked: telemetry.achievements.unlocked
    },
    session: {
      playTime: formatTime(telemetry.session.totalPlayTime),
      longestSession: formatTime(telemetry.session.longestSession),
      firstPlayed: telemetry.session.firstPlayed ? new Date(telemetry.session.firstPlayed).toLocaleDateString() : 'Unknown'
    }
  };
}

// Helper function to format time
function formatTime(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return '<1m';
  }
}