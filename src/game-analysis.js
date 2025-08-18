// game-analysis.js
// VORTEKS Strategic Analysis and Game State Intelligence System

import { getTelemetry } from './telemetry.js';
import { CARDS } from '../data/cards.js';

// Enhanced game state analysis
export class GameStateAnalyzer {
  constructor() {
    this.telemetry = getTelemetry();
    this.cardDatabase = CARDS.reduce((acc, card) => {
      acc[card.id] = card;
      return acc;
    }, {});
  }

  // Comprehensive analysis of all game aspects
  analyzeComplete() {
    return {
      turnDistribution: this.analyzeTurnDistribution(),
      cardSynergies: this.analyzeCardSynergies(),
      strategicDepth: this.analyzeStrategicDepth(),
      gameStateTransitions: this.analyzeGameStateTransitions(),
      missedOpportunities: this.identifyMissedOpportunities(),
      designInsights: this.generateDesignInsights()
    };
  }

  // Turn distribution and pattern analysis
  analyzeTurnDistribution() {
    const { turns, combat, battles } = this.telemetry;
    
    const efficiency = turns.total > 0 ? {
      avgCardsPerTurn: parseFloat(turns.averageCardsPerTurn),
      avgEnergyPerTurn: parseFloat(turns.averageEnergyPerTurn),
      energyEfficiency: turns.allEnergyTurns / turns.total,
      echoUtilization: turns.echoActivations / turns.total,
      maxTurnPotential: turns.maxCardsInTurn / turns.maxEnergyInTurn
    } : {};

    return {
      efficiency,
      patterns: {
        perfectTurnRate: turns.allEnergyTurns / turns.total,
        echoStrategicValue: turns.echoActivations > 0 ? 
          (combat.totalDamageDealt / turns.total) / turns.echoActivations : 0,
        turnLengthVariance: this.calculateTurnVariance(),
        optimalTurnComposition: this.identifyOptimalTurns()
      },
      insights: this.generateTurnInsights(efficiency)
    };
  }

  // Card synergy and combination analysis
  analyzeCardSynergies() {
    const { cards } = this.telemetry;
    const played = cards.played || {};
    
    // Identify high-synergy pairs based on card mechanics
    const synergies = {
      focusAttacks: this.analyzeFocusSynergy(played),
      echoMultipliers: this.analyzeEchoSynergy(played),
      energyRamps: this.analyzeEnergyRamp(played),
      defensiveChains: this.analyzeDefensiveChains(played),
      burnCombos: this.analyzeBurnCombos(played)
    };

    return {
      synergies,
      underutilizedCombos: this.identifyUnderutilizedCombos(played),
      strategicRecommendations: this.generateSynergyRecommendations(synergies)
    };
  }

  // Strategic depth and decision complexity analysis
  analyzeStrategicDepth() {
    const { cards, combat, battles } = this.telemetry;
    
    const riskRewardProfile = this.analyzeRiskReward();
    const decisionComplexity = this.analyzeDecisionComplexity();
    const skillProgression = this.analyzeSkillProgression();

    return {
      riskRewardProfile,
      decisionComplexity,
      skillProgression,
      strategicDiversity: this.calculateStrategicDiversity(),
      adaptabilityMeasure: this.calculateAdaptability()
    };
  }

  // Game state transition analysis
  analyzeGameStateTransitions() {
    const { battles, combat } = this.telemetry;
    
    return {
      gamePhases: this.identifyGamePhases(),
      comebackMechanics: this.analyzeComebackMechanics(),
      winConditionPaths: this.analyzeWinConditions(),
      stateTransitionEfficiency: this.calculateStateTransitionEfficiency()
    };
  }

  // Identify missed opportunities and design gaps
  identifyMissedOpportunities() {
    const opportunities = [];

    // Strategic depth opportunities
    if (this.telemetry.turns.echoActivations < this.telemetry.turns.total * 0.1) {
      opportunities.push({
        type: 'strategic',
        area: 'Echo Utilization',
        insight: 'Echo cards are underutilized - suggest tutorial or UI hints for combo potential',
        impact: 'medium',
        actionable: true
      });
    }

    // Turn efficiency opportunities
    const energyEfficiency = this.telemetry.turns.allEnergyTurns / this.telemetry.turns.total;
    if (energyEfficiency < 0.3) {
      opportunities.push({
        type: 'efficiency',
        area: 'Energy Management',
        insight: 'Players often leave energy unused - consider energy rollover or bonus mechanics',
        impact: 'high',
        actionable: true
      });
    }

    // Card diversity opportunities
    const cardDiversity = this.calculateCardDiversity();
    if (cardDiversity < 0.6) {
      opportunities.push({
        type: 'variety',
        area: 'Card Diversity',
        insight: 'Limited card variety in play - strengthen weaker cards or add situational benefits',
        impact: 'medium',
        actionable: true
      });
    }

    // Risk/reward balance opportunities
    const riskCardUsage = this.calculateRiskCardUsage();
    if (riskCardUsage < 0.15) {
      opportunities.push({
        type: 'balance',
        area: 'Risk/Reward Cards',
        insight: 'High-risk cards (Wallop, Reap) are avoided - consider buffing or adding safety nets',
        impact: 'low',
        actionable: true
      });
    }

    return opportunities;
  }

  // Generate design insights for strategic depth
  generateDesignInsights() {
    const insights = [];

    // Card representation insights
    insights.push({
      category: 'Card Design',
      insight: 'Echo represents recursive strategy but needs more visual/audio feedback for impact',
      evidence: `Echo usage: ${this.telemetry.turns.echoActivations} times across ${this.telemetry.turns.total} turns`,
      recommendation: 'Add satisfying visual effects and damage number accumulation for Echo chains'
    });

    // Turn flow insights
    const avgCardsPerTurn = parseFloat(this.telemetry.turns.averageCardsPerTurn || 0);
    if (avgCardsPerTurn < 2) {
      insights.push({
        category: 'Game Flow',
        insight: 'Low cards per turn suggests limited strategic options or energy constraints',
        evidence: `Average ${avgCardsPerTurn.toFixed(1)} cards per turn`,
        recommendation: 'Consider starting energy increase or more 0-cost cards for combo enablers'
      });
    }

    // Strategic depth insights
    const cardTypeBalance = this.telemetry.cards.typePreference;
    const totalTypes = (cardTypeBalance?.attack || 0) + (cardTypeBalance?.skill || 0) + (cardTypeBalance?.power || 0);
    if (totalTypes > 0) {
      const attackRatio = (cardTypeBalance.attack || 0) / totalTypes;
      if (attackRatio > 0.6) {
        insights.push({
          category: 'Strategic Balance',
          insight: 'Heavy attack focus suggests power/skill cards need strengthening',
          evidence: `${(attackRatio * 100).toFixed(1)}% attack cards played`,
          recommendation: 'Buff non-attack cards or add attack scaling to power/skill cards'
        });
      }
    }

    // Win condition insights
    if (this.telemetry.battles.quickWins / this.telemetry.battles.wins > 0.3) {
      insights.push({
        category: 'Game Length',
        insight: 'High quick win rate may indicate unbalanced early game aggression',
        evidence: `${this.telemetry.battles.quickWins} quick wins out of ${this.telemetry.battles.wins} total wins`,
        recommendation: 'Add early game defensive options or nerf early aggression'
      });
    }

    return insights;
  }

  // Helper methods for analysis calculations

  calculateTurnVariance() {
    // Simplified variance calculation based on available data
    const avgCards = parseFloat(this.telemetry.turns.averageCardsPerTurn || 0);
    const maxCards = this.telemetry.turns.maxCardsInTurn || 0;
    return maxCards > 0 ? (maxCards - avgCards) / maxCards : 0;
  }

  identifyOptimalTurns() {
    const { turns, combat } = this.telemetry;
    const damagePerTurn = turns.total > 0 ? combat.totalDamageDealt / turns.total : 0;
    const energyPerTurn = parseFloat(turns.averageEnergyPerTurn || 0);
    
    return {
      estimatedOptimal: Math.ceil(energyPerTurn * 1.2), // 20% above average
      actualMax: turns.maxCardsInTurn,
      efficiency: energyPerTurn > 0 ? damagePerTurn / energyPerTurn : 0
    };
  }

  generateTurnInsights(efficiency) {
    const insights = [];
    
    if (efficiency.energyEfficiency < 0.4) {
      insights.push('Players frequently end turns with unused energy - consider energy banking or overflow mechanics');
    }
    
    if (efficiency.echoUtilization < 0.1) {
      insights.push('Echo cards are rarely used - they may need clearer value proposition or better synergy design');
    }
    
    if (efficiency.maxTurnPotential > 2) {
      insights.push('High potential for explosive turns exists but may not be achievable consistently');
    }

    return insights;
  }

  analyzeFocusSynergy(played) {
    const focusPlayed = played.star || 0;  // Focus card ID is 'star'
    const attackCards = (played.swords || 0) + (played.dagger || 0) + (played.wallop || 0);
    
    return {
      focusUsage: focusPlayed,
      potentialSynergy: attackCards,
      synergyRatio: attackCards > 0 ? focusPlayed / attackCards : 0,
      recommendation: focusPlayed < attackCards * 0.3 ? 'Increase Focus usage for attack optimization' : 'Good Focus/Attack balance'
    };
  }

  analyzeEchoSynergy(played) {
    const echoPlayed = played.echo || 0;
    const totalCards = Object.values(played).reduce((a, b) => a + b, 0);
    
    return {
      echoUsage: echoPlayed,
      echoRate: totalCards > 0 ? echoPlayed / totalCards : 0,
      potentialValue: this.calculateEchoPotential(played),
      recommendation: echoPlayed < totalCards * 0.05 ? 'Echo underutilized - consider combo tutorials' : 'Echo usage adequate'
    };
  }

  calculateEchoPotential(played) {
    // Calculate potential value of Echo based on high-value cards that could be echoed
    const highValueCards = (played.star || 0) + (played.dagger || 0) + (played.wallop || 0) + (played.loop || 0);
    return highValueCards * 0.8; // 80% of high-value cards could benefit from Echo
  }

  analyzeEnergyRamp(played) {
    const surgeUsage = played.loop || 0; // Surge card for energy ramp
    const avgEnergyPerTurn = parseFloat(this.telemetry.turns.averageEnergyPerTurn || 0);
    
    return {
      rampCards: surgeUsage,
      energyGrowth: avgEnergyPerTurn - 3, // Starting energy is 3
      rampEfficiency: surgeUsage > 0 ? (avgEnergyPerTurn - 3) / surgeUsage : 0
    };
  }

  analyzeDefensiveChains(played) {
    const defensiveCards = (played.shield || 0) + (played.heart || 0) + (played.impervious || 0);
    const totalCards = Object.values(played).reduce((a, b) => a + b, 0);
    
    return {
      defensiveRatio: totalCards > 0 ? defensiveCards / totalCards : 0,
      healingFocus: (played.heart || 0) / Math.max(defensiveCards, 1),
      blockingFocus: (played.shield || 0) / Math.max(defensiveCards, 1)
    };
  }

  analyzeBurnCombos(played) {
    const burnCards = played.fire || 0; // Ignite creates burn
    const attackCards = (played.swords || 0) + (played.dagger || 0);
    
    return {
      burnUsage: burnCards,
      burnToAttackRatio: attackCards > 0 ? burnCards / attackCards : 0,
      attritionStrategy: burnCards / Math.max(Object.values(played).reduce((a, b) => a + b, 0), 1)
    };
  }

  identifyUnderutilizedCombos(played) {
    const combos = [];
    
    // Focus + Echo combo (multiply Focus benefit)
    const focusEchoRatio = (played.star || 0) > 0 && (played.echo || 0) > 0 ? 
      (played.echo || 0) / (played.star || 0) : 0;
    if (focusEchoRatio < 0.3) {
      combos.push({
        cards: ['Focus', 'Echo'],
        potential: 'High',
        description: 'Echo can duplicate Focus-buffed attacks for massive damage',
        currentUtilization: 'Low'
      });
    }

    // Surge + High-cost cards
    const surgeRatio = (played.loop || 0) / Math.max(Object.values(played).reduce((a, b) => a + b, 0), 1);
    if (surgeRatio < 0.1) {
      combos.push({
        cards: ['Surge', 'High-cost spells'],
        potential: 'Medium',
        description: 'Surge enables powerful late-game plays with expensive cards',
        currentUtilization: 'Low'
      });
    }

    return combos;
  }

  generateSynergyRecommendations(synergies) {
    const recommendations = [];
    
    if (synergies.focusAttacks.synergyRatio < 0.3) {
      recommendations.push('Consider UI hints when Focus is played to suggest attack card follow-ups');
    }
    
    if (synergies.echoMultipliers.echoRate < 0.05) {
      recommendations.push('Echo needs better visual feedback or cost reduction to encourage experimentation');
    }
    
    if (synergies.energyRamps.rampEfficiency < 1) {
      recommendations.push('Energy ramp cards may need buffs or cheaper alternatives for smoother scaling');
    }

    return recommendations;
  }

  analyzeRiskReward() {
    const riskCards = ['wallop', 'reap', 'presto']; // Cards with life costs
    const played = this.telemetry.cards.played || {};
    const totalCards = Object.values(played).reduce((a, b) => a + b, 0);
    
    const riskCardUsage = riskCards.reduce((sum, cardId) => sum + (played[cardId] || 0), 0);
    
    return {
      riskTolerance: totalCards > 0 ? riskCardUsage / totalCards : 0,
      riskCardTypes: riskCards.map(cardId => ({
        card: cardId,
        usage: played[cardId] || 0,
        riskLevel: cardId === 'reap' ? 'High' : cardId === 'wallop' ? 'Medium' : 'Low'
      })),
      recommendation: riskCardUsage < totalCards * 0.1 ? 'Risk cards underused - consider safety nets or buffs' : 'Healthy risk/reward balance'
    };
  }

  analyzeDecisionComplexity() {
    const { turns, cards } = this.telemetry;
    const avgCardsPerTurn = parseFloat(turns.averageCardsPerTurn || 0);
    const uniqueCards = Object.keys(cards.played || {}).length;
    
    return {
      choicesPerTurn: avgCardsPerTurn,
      cardVariety: uniqueCards,
      complexityScore: avgCardsPerTurn * uniqueCards * 0.1, // Simplified complexity metric
      engagement: avgCardsPerTurn > 2 ? 'High' : avgCardsPerTurn > 1.5 ? 'Medium' : 'Low'
    };
  }

  analyzeSkillProgression() {
    const { battles } = this.telemetry;
    const winRate = battles.total > 0 ? battles.wins / battles.total : 0;
    const streakConsistency = battles.maxStreak > 0 ? battles.currentStreak / battles.maxStreak : 0;
    
    return {
      winRate,
      streakConsistency,
      perfectGameRate: battles.wins > 0 ? battles.perfectWins / battles.wins : 0,
      speedImprovement: battles.wins > 0 ? battles.quickWins / battles.wins : 0,
      skillTrend: this.calculateSkillTrend(winRate, streakConsistency)
    };
  }

  calculateSkillTrend(winRate, streakConsistency) {
    if (winRate > 0.7 && streakConsistency > 0.5) return 'Expert';
    if (winRate > 0.5 && streakConsistency > 0.3) return 'Proficient';
    if (winRate > 0.3) return 'Learning';
    return 'Beginner';
  }

  calculateStrategicDiversity() {
    const { cards } = this.telemetry;
    const typePreference = cards.typePreference || {};
    const total = typePreference.attack + typePreference.skill + typePreference.power;
    
    if (total === 0) return 0;
    
    // Calculate Shannon diversity index for card types
    const ratios = [
      typePreference.attack / total,
      typePreference.skill / total,
      typePreference.power / total
    ].filter(r => r > 0);
    
    return -ratios.reduce((sum, ratio) => sum + ratio * Math.log2(ratio), 0) / Math.log2(3);
  }

  calculateAdaptability() {
    const { opponents, cards } = this.telemetry;
    const opponentVariety = Object.keys(opponents.defeated || {}).length;
    const cardVariety = Object.keys(cards.played || {}).length;
    
    return {
      opponentAdaptation: Math.min(opponentVariety / 5, 1), // Normalize to 5 different opponents
      strategicFlexibility: Math.min(cardVariety / CARDS.length, 1),
      overallAdaptability: (opponentVariety + cardVariety) / (5 + CARDS.length)
    };
  }

  identifyGamePhases() {
    // Analyze typical game progression patterns
    return {
      earlyGame: 'Turns 1-3: Focus on efficiency and setup',
      midGame: 'Turns 4-7: Combo execution and pressure',
      lateGame: 'Turns 8+: High-impact plays and finishers',
      criticalDecisions: this.identifyCriticalDecisionPoints()
    };
  }

  identifyCriticalDecisionPoints() {
    return [
      'Turn 1: Aggressive vs defensive opening',
      'Energy 4+: Enable high-cost cards vs maintain efficiency',
      'Low HP: Risk tolerance for Wallop/Reap usage',
      'Echo timing: Immediate value vs combo setup'
    ];
  }

  analyzeComebackMechanics() {
    const { battles, combat } = this.telemetry;
    
    return {
      comebackPotential: 'Medium', // Based on card analysis
      defenseToOffenseRatio: combat.totalShieldGained / Math.max(combat.totalDamageDealt, 1),
      healingImportance: combat.totalHealingReceived / Math.max(combat.totalDamageTaken, 1),
      riskPlayValue: 'Cards like Reap provide comeback potential at high risk'
    };
  }

  analyzeWinConditions() {
    const { battles, combat } = this.telemetry;
    
    return {
      aggroWins: battles.quickWins,
      controlWins: battles.perfectWins,
      comboWins: 'Estimated based on Echo usage', // Could be enhanced with more specific tracking
      totalWins: battles.wins,
      dominantStrategy: battles.quickWins > battles.perfectWins ? 'Aggressive' : 'Defensive'
    };
  }

  calculateStateTransitionEfficiency() {
    const { turns, combat } = this.telemetry;
    const damagePerTurn = turns.total > 0 ? combat.totalDamageDealt / turns.total : 0;
    const energyPerTurn = parseFloat(turns.averageEnergyPerTurn || 0);
    
    return {
      damageEfficiency: energyPerTurn > 0 ? damagePerTurn / energyPerTurn : 0,
      turnEfficiency: turns.allEnergyTurns / Math.max(turns.total, 1),
      stateProgression: 'Moderate', // Could be enhanced with more specific tracking
      optimizationPotential: this.calculateOptimizationPotential(damagePerTurn, energyPerTurn)
    };
  }

  calculateOptimizationPotential(damagePerTurn, energyPerTurn) {
    // Theoretical maximum assuming perfect synergy
    const theoreticalMax = energyPerTurn * 2; // Assumes 2 damage per energy as baseline
    const current = damagePerTurn;
    const potential = Math.max(0, theoreticalMax - current);
    
    return {
      current: current.toFixed(1),
      theoretical: theoreticalMax.toFixed(1),
      improvementPotential: potential.toFixed(1),
      efficiency: theoreticalMax > 0 ? (current / theoreticalMax * 100).toFixed(1) + '%' : '0%'
    };
  }

  calculateCardDiversity() {
    const { cards } = this.telemetry;
    const played = cards.played || {};
    const uniqueCards = Object.keys(played).length;
    return uniqueCards / CARDS.length;
  }

  calculateRiskCardUsage() {
    const riskCards = ['wallop', 'reap', 'presto'];
    const played = this.telemetry.cards.played || {};
    const totalCards = Object.values(played).reduce((a, b) => a + b, 0);
    const riskCardUsage = riskCards.reduce((sum, cardId) => sum + (played[cardId] || 0), 0);
    
    return totalCards > 0 ? riskCardUsage / totalCards : 0;
  }
}

// Main analysis function for external use
export function analyzeGameStates() {
  const analyzer = new GameStateAnalyzer();
  return analyzer.analyzeComplete();
}

// Specific analysis functions for targeted insights
export function analyzeTurnPatterns() {
  const analyzer = new GameStateAnalyzer();
  return analyzer.analyzeTurnDistribution();
}

export function analyzeCardEffectiveness() {
  const analyzer = new GameStateAnalyzer();
  return analyzer.analyzeCardSynergies();
}

export function analyzeStrategicOpportunities() {
  const analyzer = new GameStateAnalyzer();
  return analyzer.identifyMissedOpportunities();
}