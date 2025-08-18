// test-analysis.js
// Test script to generate sample telemetry data and test the analysis

import { loadTelemetry, recordBattle, recordCardPlayed, recordCombat, recordTurn, recordOpponent } from './src/telemetry.js';
import { analyzeGameStates } from './src/game-analysis.js';

// Generate sample telemetry data for testing
function generateSampleData() {
  console.log('Generating sample telemetry data...');
  
  // Record some battles
  for (let i = 0; i < 20; i++) {
    const result = Math.random() > 0.3 ? 'win' : 'loss';
    const streak = result === 'win' ? i % 5 + 1 : 0;
    const playerHP = result === 'win' ? Math.floor(Math.random() * 20) + 1 : 0;
    const turns = Math.floor(Math.random() * 10) + 3;
    
    recordBattle(result, streak, playerHP, 20, turns);
    recordOpponent(`opponent_${i % 5}`, result === 'win');
  }
  
  // Record card plays
  const cards = ['swords', 'star', 'echo', 'shield', 'heart', 'fire', 'bolt', 'loop', 'wallop', 'reap'];
  const types = ['attack', 'power', 'skill', 'attack', 'skill', 'skill', 'attack', 'power', 'attack', 'attack'];
  
  for (let i = 0; i < 200; i++) {
    const cardIdx = Math.floor(Math.random() * cards.length);
    recordCardPlayed(cards[cardIdx], types[cardIdx], Math.floor(Math.random() * 3) + 1);
  }
  
  // Record combat data
  for (let i = 0; i < 50; i++) {
    recordCombat({
      damageDealt: Math.floor(Math.random() * 10) + 1,
      damageTaken: Math.floor(Math.random() * 8),
      energySpent: Math.floor(Math.random() * 5) + 1,
      cardsDrawn: Math.floor(Math.random() * 3),
      shieldGained: Math.floor(Math.random() * 5),
      healingReceived: Math.floor(Math.random() * 4),
      maxEnergy: Math.floor(Math.random() * 3) + 3
    });
  }
  
  // Record turn data
  for (let i = 0; i < 100; i++) {
    const cardsPlayed = Math.floor(Math.random() * 4) + 1;
    const energySpent = Math.floor(Math.random() * 5) + 1;
    const wasAllEnergySpent = Math.random() > 0.6;
    const echoUsed = Math.random() > 0.9;
    
    recordTurn(cardsPlayed, energySpent, wasAllEnergySpent, echoUsed);
  }
  
  console.log('Sample data generated successfully!');
}

// Test the analysis
function testAnalysis() {
  console.log('Running analysis test...');
  
  try {
    const analysis = analyzeGameStates();
    console.log('Analysis Results:', analysis);
    
    // Test specific analyses
    console.log('\n--- Turn Distribution ---');
    console.log('Energy Efficiency:', (analysis.turnDistribution.efficiency.energyEfficiency * 100).toFixed(1) + '%');
    console.log('Echo Utilization:', (analysis.turnDistribution.efficiency.echoUtilization * 100).toFixed(1) + '%');
    
    console.log('\n--- Strategic Depth ---');
    console.log('Strategic Diversity:', (analysis.strategicDepth.strategicDiversity * 100).toFixed(1) + '%');
    console.log('Risk Tolerance:', (analysis.strategicDepth.riskRewardProfile.riskTolerance * 100).toFixed(1) + '%');
    
    console.log('\n--- Missed Opportunities ---');
    analysis.missedOpportunities.forEach((opp, index) => {
      console.log(`${index + 1}. ${opp.area}: ${opp.insight}`);
    });
    
    console.log('\n--- Design Insights ---');
    analysis.designInsights.forEach((insight, index) => {
      console.log(`${index + 1}. ${insight.category}: ${insight.insight}`);
    });
    
    console.log('\nAnalysis test completed successfully!');
    return true;
  } catch (error) {
    console.error('Analysis test failed:', error);
    return false;
  }
}

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  loadTelemetry();
  generateSampleData();
  testAnalysis();
} else {
  // Browser environment
  window.testAnalysis = () => {
    generateSampleData();
    return testAnalysis();
  };
}