// scrimmage-findings.js
// AI vs AI battle findings tracking and cataloging system

const LS_FINDINGS_KEY = 'vorteks_scrimmage_findings';

// Initialize findings state
let _findingsState = {
  battles: [],
  cardPerformance: {},
  personaStats: {},
  edgeCases: [],
  lastUpdated: null,
  totalBattles: 0,
  version: '1.0'
};

// Load findings from localStorage
function loadFindings() {
  try {
    const stored = localStorage.getItem(LS_FINDINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      _findingsState = { ..._findingsState, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load scrimmage findings:', e);
  }
}

// Save findings to localStorage
function saveFindings() {
  try {
    _findingsState.lastUpdated = new Date().toISOString();
    localStorage.setItem(LS_FINDINGS_KEY, JSON.stringify(_findingsState));
  } catch (e) {
    console.warn('Failed to save scrimmage findings:', e);
  }
}

// Record a battle result
function recordBattle(battleData) {
  const battle = {
    id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ai1: {
      persona: battleData.ai1.persona,
      level: battleData.ai1.level,
      finalHP: battleData.ai1.finalHP,
      maxHP: battleData.ai1.maxHP,
      cardsPlayed: battleData.ai1.cardsPlayed || [],
      damageDealt: battleData.ai1.damageDealt || 0,
      damageTaken: battleData.ai1.damageTaken || 0
    },
    ai2: {
      persona: battleData.ai2.persona,
      level: battleData.ai2.level,
      finalHP: battleData.ai2.finalHP,
      maxHP: battleData.ai2.maxHP,
      cardsPlayed: battleData.ai2.cardsPlayed || [],
      damageDealt: battleData.ai2.damageDealt || 0,
      damageTaken: battleData.ai2.damageTaken || 0
    },
    winner: battleData.winner, // 'ai1', 'ai2', or 'draw'
    turns: battleData.turns || 0,
    duration: battleData.duration || 0,
    notable: battleData.notable || [], // Array of notable events
    edgeCases: battleData.edgeCases || [] // Array of edge cases detected
  };

  _findingsState.battles.push(battle);
  _findingsState.totalBattles++;

  // Update persona statistics
  updatePersonaStats(battle);
  
  // Update card performance tracking
  updateCardPerformance(battle);
  
  // Record edge cases
  if (battle.edgeCases.length > 0) {
    _findingsState.edgeCases.push(...battle.edgeCases.map(ec => ({
      ...ec,
      battleId: battle.id,
      timestamp: battle.timestamp
    })));
  }

  saveFindings();
  return battle.id;
}

// Update persona statistics
function updatePersonaStats(battle) {
  const personas = [battle.ai1.persona, battle.ai2.persona];
  const levels = [battle.ai1.level, battle.ai2.level];
  const results = [
    battle.winner === 'ai1' ? 'win' : battle.winner === 'ai2' ? 'loss' : 'draw',
    battle.winner === 'ai2' ? 'win' : battle.winner === 'ai1' ? 'loss' : 'draw'
  ];

  personas.forEach((persona, index) => {
    const key = `${persona}_L${levels[index]}`;
    if (!_findingsState.personaStats[key]) {
      _findingsState.personaStats[key] = {
        persona,
        level: levels[index],
        battles: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        avgTurnsPerBattle: 0,
        cardUsage: {}
      };
    }

    const stats = _findingsState.personaStats[key];
    stats.battles++;
    stats[results[index] + 's']++;
    
    const aiData = index === 0 ? battle.ai1 : battle.ai2;
    stats.totalDamageDealt += aiData.damageDealt;
    stats.totalDamageTaken += aiData.damageTaken;
    stats.avgTurnsPerBattle = ((stats.avgTurnsPerBattle * (stats.battles - 1)) + battle.turns) / stats.battles;

    // Track card usage
    if (aiData.cardsPlayed) {
      aiData.cardsPlayed.forEach(cardId => {
        stats.cardUsage[cardId] = (stats.cardUsage[cardId] || 0) + 1;
      });
    }
  });
}

// Update card performance tracking
function updateCardPerformance(battle) {
  const allCards = [...(battle.ai1.cardsPlayed || []), ...(battle.ai2.cardsPlayed || [])];
  
  allCards.forEach(cardId => {
    if (!_findingsState.cardPerformance[cardId]) {
      _findingsState.cardPerformance[cardId] = {
        timesPlayed: 0,
        inWinningGames: 0,
        inLosingGames: 0,
        avgDamageContribution: 0,
        edgeCaseCount: 0,
        maxDamageRecorded: 0,
        contexts: {} // Different contexts where card was played
      };
    }

    const cardStats = _findingsState.cardPerformance[cardId];
    cardStats.timesPlayed++;

    // Determine if this card was in a winning or losing context
    const ai1HasCard = battle.ai1.cardsPlayed?.includes(cardId);
    const ai2HasCard = battle.ai2.cardsPlayed?.includes(cardId);
    
    if (ai1HasCard && battle.winner === 'ai1') cardStats.inWinningGames++;
    if (ai1HasCard && battle.winner === 'ai2') cardStats.inLosingGames++;
    if (ai2HasCard && battle.winner === 'ai2') cardStats.inWinningGames++;
    if (ai2HasCard && battle.winner === 'ai1') cardStats.inLosingGames++;
  });
}

// Detect edge cases during battle
function detectEdgeCases(gameState, turnData) {
  const edgeCases = [];

  // High damage in single turn
  if (turnData.damageDealt >= 15) {
    edgeCases.push({
      type: 'high_damage_turn',
      description: `${turnData.damageDealt} damage dealt in single turn`,
      severity: 'high',
      context: { damage: turnData.damageDealt, cards: turnData.cardsPlayed }
    });
  }

  // Infinite loop potential
  if (turnData.cardsPlayed && turnData.cardsPlayed.length >= 8) {
    edgeCases.push({
      type: 'potential_infinite_loop',
      description: `${turnData.cardsPlayed.length} cards played in single turn`,
      severity: 'medium',
      context: { cardCount: turnData.cardsPlayed.length, cards: turnData.cardsPlayed }
    });
  }

  // Excessive healing
  if (turnData.healAmount >= 20) {
    edgeCases.push({
      type: 'excessive_healing',
      description: `${turnData.healAmount} healing in single turn`,
      severity: 'low',
      context: { healing: turnData.healAmount }
    });
  }

  // Shield stacking
  if (gameState.shield >= 30) {
    edgeCases.push({
      type: 'shield_stacking',
      description: `${gameState.shield} shields accumulated`,
      severity: 'medium',
      context: { shields: gameState.shield }
    });
  }

  // Long battle
  if (gameState.turn >= 50) {
    edgeCases.push({
      type: 'long_battle',
      description: `Battle lasted ${gameState.turn} turns`,
      severity: 'high',
      context: { turns: gameState.turn }
    });
  }

  return edgeCases;
}

// Generate findings report
function generateFindingsReport() {
  const report = {
    summary: {
      totalBattles: _findingsState.totalBattles,
      lastUpdated: _findingsState.lastUpdated,
      topPerformingPersonas: getTopPerformingPersonas(5),
      mostPlayedCards: getMostPlayedCards(10),
      criticalEdgeCases: getCriticalEdgeCases(5)
    },
    personaAnalysis: analyzePersonaPerformance(),
    cardAnalysis: analyzeCardPerformance(),
    edgeCaseAnalysis: analyzeEdgeCases(),
    recommendations: generateRecommendations()
  };

  return report;
}

// Get top performing personas
function getTopPerformingPersonas(limit = 5) {
  return Object.values(_findingsState.personaStats)
    .filter(p => p.battles >= 3) // Minimum battles for reliability
    .sort((a, b) => (b.wins / b.battles) - (a.wins / a.battles))
    .slice(0, limit)
    .map(p => ({
      persona: p.persona,
      level: p.level,
      winRate: (p.wins / p.battles * 100).toFixed(1) + '%',
      battles: p.battles,
      avgDamage: (p.totalDamageDealt / p.battles).toFixed(1)
    }));
}

// Get most played cards
function getMostPlayedCards(limit = 10) {
  return Object.entries(_findingsState.cardPerformance)
    .sort(([,a], [,b]) => b.timesPlayed - a.timesPlayed)
    .slice(0, limit)
    .map(([cardId, stats]) => ({
      cardId,
      timesPlayed: stats.timesPlayed,
      winRate: stats.timesPlayed > 0 ? 
        ((stats.inWinningGames / (stats.inWinningGames + stats.inLosingGames)) * 100).toFixed(1) + '%' 
        : 'N/A',
      maxDamage: stats.maxDamageRecorded
    }));
}

// Get critical edge cases
function getCriticalEdgeCases(limit = 5) {
  return _findingsState.edgeCases
    .filter(ec => ec.severity === 'high')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

// Analyze persona performance
function analyzePersonaPerformance() {
  const analysis = {};
  
  Object.values(_findingsState.personaStats).forEach(stats => {
    const key = stats.persona;
    if (!analysis[key]) {
      analysis[key] = {
        totalBattles: 0,
        avgWinRate: 0,
        levelPerformance: {},
        strongestCards: [],
        weaknesses: []
      };
    }

    analysis[key].totalBattles += stats.battles;
    analysis[key].levelPerformance[stats.level] = {
      winRate: (stats.wins / stats.battles * 100).toFixed(1) + '%',
      battles: stats.battles
    };

    // Find strongest cards for this persona
    const cardUsage = Object.entries(stats.cardUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    analysis[key].strongestCards = cardUsage;
  });

  return analysis;
}

// Analyze card performance
function analyzeCardPerformance() {
  const analysis = {};
  
  Object.entries(_findingsState.cardPerformance).forEach(([cardId, stats]) => {
    const totalGames = stats.inWinningGames + stats.inLosingGames;
    const winRate = totalGames > 0 ? (stats.inWinningGames / totalGames) : 0;
    
    analysis[cardId] = {
      timesPlayed: stats.timesPlayed,
      winRate: (winRate * 100).toFixed(1) + '%',
      maxDamage: stats.maxDamageRecorded,
      edgeCases: stats.edgeCaseCount,
      rating: getRating(winRate, stats.timesPlayed, stats.edgeCaseCount)
    };
  });

  return analysis;
}

// Analyze edge cases
function analyzeEdgeCases() {
  const typeCounts = {};
  const severityCounts = { high: 0, medium: 0, low: 0 };

  _findingsState.edgeCases.forEach(ec => {
    typeCounts[ec.type] = (typeCounts[ec.type] || 0) + 1;
    severityCounts[ec.severity]++;
  });

  return {
    totalEdgeCases: _findingsState.edgeCases.length,
    byType: typeCounts,
    bySeverity: severityCounts,
    recent: _findingsState.edgeCases
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
  };
}

// Generate recommendations
function generateRecommendations() {
  const recommendations = [];

  // Check for overpowered cards
  Object.entries(_findingsState.cardPerformance).forEach(([cardId, stats]) => {
    const totalGames = stats.inWinningGames + stats.inLosingGames;
    const winRate = totalGames > 0 ? (stats.inWinningGames / totalGames) : 0;
    
    if (winRate > 0.8 && totalGames >= 10) {
      recommendations.push({
        type: 'balance',
        priority: 'high',
        description: `Card "${cardId}" has ${(winRate * 100).toFixed(1)}% win rate - consider nerfing`,
        data: { cardId, winRate, games: totalGames }
      });
    }
  });

  // Check for edge case patterns
  const highSeverityEdgeCases = _findingsState.edgeCases.filter(ec => ec.severity === 'high');
  if (highSeverityEdgeCases.length > _findingsState.totalBattles * 0.1) {
    recommendations.push({
      type: 'stability',
      priority: 'high',
      description: `High edge case rate: ${highSeverityEdgeCases.length}/${_findingsState.totalBattles} battles`,
      data: { edgeCases: highSeverityEdgeCases.length, battles: _findingsState.totalBattles }
    });
  }

  return recommendations;
}

// Get rating for card performance
function getRating(winRate, timesPlayed, edgeCases) {
  let score = winRate * 100;
  
  // Adjust for sample size
  if (timesPlayed < 5) score *= 0.5;
  else if (timesPlayed < 10) score *= 0.8;
  
  // Penalty for edge cases
  score -= edgeCases * 5;
  
  if (score >= 80) return 'S';
  if (score >= 70) return 'A';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

// Clear all findings
function clearFindings() {
  _findingsState = {
    battles: [],
    cardPerformance: {},
    personaStats: {},
    edgeCases: [],
    lastUpdated: null,
    totalBattles: 0,
    version: '1.0'
  };
  saveFindings();
}

// Export findings as JSON
function exportFindings() {
  const exportData = {
    ..._findingsState,
    exportTimestamp: new Date().toISOString(),
    report: generateFindingsReport()
  };
  
  return JSON.stringify(exportData, null, 2);
}

// Initialize on load
loadFindings();

export {
  recordBattle,
  detectEdgeCases,
  generateFindingsReport,
  getTopPerformingPersonas,
  getMostPlayedCards,
  getCriticalEdgeCases,
  analyzePersonaPerformance,
  analyzeCardPerformance,
  analyzeEdgeCases,
  clearFindings,
  exportFindings,
  _findingsState as findingsState
};