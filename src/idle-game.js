// idle-game.js
// Tamagotchi-like idle game system that leverages telemetry metadata

import { getTelemetry, saveTelemetry } from './telemetry.js';

const IDLE_GAME_KEY = 'vorteks-idle-creature';
const IDLE_GAME_VERSION = 1;

// Creature states and evolution stages
const CREATURE_STAGES = {
  EGG: { name: 'Egg', emoji: '🥚', minLevel: 0 },
  HATCHLING: { name: 'Vortex Sprite', emoji: '🌟', minLevel: 5 },
  JUVENILE: { name: 'Echo Beast', emoji: '⚡', minLevel: 15 },
  ADULT: { name: 'Card Master', emoji: '🔮', minLevel: 30 },
  ELDER: { name: 'VORTEKS Avatar', emoji: '🌌', minLevel: 50 }
};

// Default creature data
const DEFAULT_CREATURE = {
  version: IDLE_GAME_VERSION,
  name: 'Vortex',
  level: 1,
  experience: 0,
  stage: 'EGG',
  
  // Core stats (0-100)
  happiness: 50,
  energy: 50,
  wisdom: 50,
  power: 50,
  
  // Idle progression
  lastChecked: Date.now(),
  totalIdleTime: 0,
  
  // Evolution tracking
  battleInfluence: 0,    // Influenced by win ratio
  cardMastery: 0,        // Influenced by cards played variety
  strategicDepth: 0,     // Influenced by average turn length and energy usage
  
  // Needs and care
  needsAttention: false,
  lastFed: Date.now(),
  lastPlayed: Date.now(),
  
  // Achievements and rewards
  achievements: [],
  rewards: []
};

let currentCreature = null;

// Load creature data
export function loadIdleGame() {
  try {
    const stored = localStorage.getItem(IDLE_GAME_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.version !== IDLE_GAME_VERSION) {
        currentCreature = migrateCreature(data);
      } else {
        currentCreature = { ...DEFAULT_CREATURE, ...data };
      }
    } else {
      currentCreature = { ...DEFAULT_CREATURE };
      currentCreature.lastChecked = Date.now();
    }
  } catch (e) {
    console.warn('Failed to load idle game data:', e);
    currentCreature = { ...DEFAULT_CREATURE };
    currentCreature.lastChecked = Date.now();
  }
  
  // Update creature based on idle time and telemetry
  updateCreatureFromIdle();
  updateCreatureFromTelemetry();
  
  saveIdleGame();
  return currentCreature;
}

// Save creature data
export function saveIdleGame() {
  if (!currentCreature) return;
  
  try {
    currentCreature.lastChecked = Date.now();
    localStorage.setItem(IDLE_GAME_KEY, JSON.stringify(currentCreature));
  } catch (e) {
    console.warn('Failed to save idle game data:', e);
  }
}

// Get current creature
export function getCreature() {
  if (!currentCreature) {
    loadIdleGame();
  }
  return currentCreature;
}

// Update creature based on idle time since last check
function updateCreatureFromIdle() {
  if (!currentCreature) return;
  
  const now = Date.now();
  const timeSinceLastCheck = now - currentCreature.lastChecked;
  const hoursIdle = timeSinceLastCheck / (1000 * 60 * 60);
  
  if (hoursIdle < 0.1) return; // Less than 6 minutes, no significant change
  
  currentCreature.totalIdleTime += timeSinceLastCheck;
  
  // Gradual stat changes during idle time
  if (hoursIdle > 0.5) { // 30+ minutes idle
    // Energy slowly decreases
    currentCreature.energy = Math.max(0, currentCreature.energy - Math.min(10, hoursIdle * 2));
    
    // Happiness slowly decreases if not cared for
    const hoursSincePlay = (now - currentCreature.lastPlayed) / (1000 * 60 * 60);
    if (hoursSincePlay > 2) {
      currentCreature.happiness = Math.max(0, currentCreature.happiness - Math.min(15, hoursSincePlay));
    }
    
    // Wisdom slowly increases (passive learning)
    currentCreature.wisdom = Math.min(100, currentCreature.wisdom + Math.min(5, hoursIdle * 0.5));
  }
  
  // Long idle periods (6+ hours) have special effects
  if (hoursIdle > 6) {
    currentCreature.needsAttention = true;
    
    // But also provide some experience for patience
    gainExperience(Math.floor(hoursIdle / 2));
  }
  
  currentCreature.lastChecked = now;
}

// Update creature stats based on telemetry data
function updateCreatureFromTelemetry() {
  if (!currentCreature) return;
  
  const telemetry = getTelemetry();
  if (!telemetry) return;
  
  // Battle influence (win ratio and streaks)
  const winRatio = telemetry.battles.total > 0 ? telemetry.battles.wins / telemetry.battles.total : 0;
  currentCreature.battleInfluence = Math.floor(winRatio * 100);
  
  // Card mastery (variety of cards played)
  const cardsPlayed = Object.keys(telemetry.cards.played || {}).length;
  currentCreature.cardMastery = Math.min(100, cardsPlayed * 3);
  
  // Strategic depth (average energy usage and turn efficiency)
  const avgEnergyPerTurn = telemetry.turns.averageEnergyPerTurn || 1;
  currentCreature.strategicDepth = Math.min(100, avgEnergyPerTurn * 20);
  
  // Update core stats based on influences
  currentCreature.power = Math.min(100, Math.floor(
    (currentCreature.battleInfluence * 0.4) + 
    (currentCreature.cardMastery * 0.3) + 
    (currentCreature.level * 0.3)
  ));
  
  // Experience gain from battles
  if (telemetry.battles.total > currentCreature.level) {
    const battleExp = telemetry.battles.total - currentCreature.level;
    gainExperience(battleExp);
  }
}

// Gain experience and potentially level up
function gainExperience(amount) {
  if (!currentCreature || amount <= 0) return;
  
  currentCreature.experience += amount;
  
  // Level up check
  const expNeeded = currentCreature.level * 10;
  if (currentCreature.experience >= expNeeded) {
    currentCreature.level++;
    currentCreature.experience -= expNeeded;
    
    // Level up bonuses
    currentCreature.happiness = Math.min(100, currentCreature.happiness + 10);
    currentCreature.energy = Math.min(100, currentCreature.energy + 15);
    
    // Check for evolution
    checkEvolution();
    
    return true; // Leveled up
  }
  
  return false;
}

// Check if creature should evolve
function checkEvolution() {
  if (!currentCreature) return false;
  
  const currentStage = CREATURE_STAGES[currentCreature.stage];
  let evolved = false;
  
  for (const [stageKey, stage] of Object.entries(CREATURE_STAGES)) {
    if (currentCreature.level >= stage.minLevel && 
        stage.minLevel > currentStage.minLevel) {
      currentCreature.stage = stageKey;
      currentCreature.happiness = 100; // Evolution makes creature very happy
      currentCreature.energy = 100;
      
      // Add special evolution bonuses based on stage
      switch (stageKey) {
        case 'HATCHLING':
          currentCreature.wisdom += 10;
          break;
        case 'JUVENILE':
          currentCreature.power += 15;
          break;
        case 'ADULT':
          currentCreature.wisdom += 15;
          currentCreature.power += 10;
          break;
        case 'ELDER':
          currentCreature.wisdom += 20;
          currentCreature.power += 20;
          currentCreature.happiness = 100;
          break;
      }
      
      evolved = true;
      break; // Only evolve one stage at a time
    }
  }
  
  return evolved;
}

// Player interactions
export function feedCreature() {
  if (!currentCreature) return false;
  
  const now = Date.now();
  const hoursSinceLastFed = (now - currentCreature.lastFed) / (1000 * 60 * 60);
  
  if (hoursSinceLastFed < 1) return false; // Can't feed too often
  
  currentCreature.energy = Math.min(100, currentCreature.energy + 20);
  currentCreature.happiness = Math.min(100, currentCreature.happiness + 10);
  currentCreature.lastFed = now;
  currentCreature.needsAttention = false;
  
  saveIdleGame();
  return true;
}

export function playWithCreature() {
  if (!currentCreature) return false;
  
  const now = Date.now();
  const hoursSinceLastPlay = (now - currentCreature.lastPlayed) / (1000 * 60 * 60);
  
  if (hoursSinceLastPlay < 0.5) return false; // Can't play too often
  
  currentCreature.happiness = Math.min(100, currentCreature.happiness + 15);
  currentCreature.energy = Math.max(0, currentCreature.energy - 5); // Playing uses energy
  currentCreature.lastPlayed = now;
  currentCreature.needsAttention = false;
  
  // Small chance to gain experience from play
  if (Math.random() < 0.3) {
    gainExperience(1);
  }
  
  saveIdleGame();
  return true;
}

export function meditateWithCreature() {
  if (!currentCreature) return false;
  
  if (currentCreature.energy < 10) return false; // Need energy to meditate
  
  currentCreature.wisdom = Math.min(100, currentCreature.wisdom + 5);
  currentCreature.energy -= 10;
  currentCreature.happiness = Math.min(100, currentCreature.happiness + 5);
  
  gainExperience(1);
  
  saveIdleGame();
  return true;
}

// Get current creature info for display
export function getCreatureInfo() {
  const creature = getCreature();
  const stage = CREATURE_STAGES[creature.stage];
  
  return {
    ...creature,
    stageName: stage.name,
    stageEmoji: stage.emoji,
    expNeeded: creature.level * 10,
    expProgress: (creature.experience / (creature.level * 10)) * 100,
    
    // Status messages
    statusMessage: getStatusMessage(creature),
    moodMessage: getMoodMessage(creature)
  };
}

function getStatusMessage(creature) {
  if (creature.needsAttention) return "Needs attention!";
  if (creature.energy < 20) return "Feeling tired...";
  if (creature.happiness < 30) return "Feeling sad...";
  if (creature.happiness > 80 && creature.energy > 60) return "Very happy!";
  if (creature.wisdom > 80) return "Deep in thought...";
  return "Content";
}

function getMoodMessage(creature) {
  const telemetry = getTelemetry();
  
  if (creature.level >= 50) return "A legendary VORTEKS master!";
  if (creature.level >= 30) return "Mastering the art of card combat...";
  if (creature.level >= 15) return "Growing stronger with each battle!";
  if (creature.level >= 5) return "Learning your battle strategies...";
  
  if (telemetry.battles.currentStreak >= 10) return "Amazed by your incredible streak!";
  if (telemetry.battles.currentStreak > 5) return "Inspired by your victories!";
  if (telemetry.battles.currentStreak > 2) return "Excited by your winning streak!";
  
  if (telemetry.battles.total > 100) return "Studying your vast experience...";
  if (telemetry.battles.total > 50) return "Learning from your many battles...";
  if (telemetry.battles.total > 20) return "Watching your tactical evolution...";
  if (telemetry.battles.total > 10) return "Observing your growing skill...";
  
  if (creature.stage === 'EGG') return "Preparing to hatch into something amazing!";
  if (creature.stage === 'HATCHLING') return "Taking first steps in the VORTEKS world!";
  
  return "Beginning a new adventure together...";
}

// Migration function for future versions
function migrateCreature(oldData) {
  const migrated = { ...DEFAULT_CREATURE, ...oldData };
  migrated.version = IDLE_GAME_VERSION;
  return migrated;
}

// Reset creature (for debugging or starting over)
export function resetCreature() {
  currentCreature = { ...DEFAULT_CREATURE };
  currentCreature.lastChecked = Date.now();
  saveIdleGame();
  return currentCreature;
}

// Update companion based on real-time telemetry events
export function updateCompanionFromGameplay(eventType, data = {}) {
  if (!currentCreature) return;
  
  let updated = false;
  
  switch (eventType) {
    case 'card_played':
      // Small happiness boost for playing cards
      currentCreature.happiness = Math.min(100, currentCreature.happiness + 0.5);
      // Small energy use for concentration
      currentCreature.energy = Math.max(0, currentCreature.energy - 0.2);
      updated = true;
      break;
      
    case 'battle_won':
      // Significant happiness and experience boost for winning
      currentCreature.happiness = Math.min(100, currentCreature.happiness + 8);
      gainExperience(3);
      currentCreature.lastPlayed = Date.now();
      currentCreature.needsAttention = false;
      updated = true;
      break;
      
    case 'battle_lost':
      // Slight happiness decrease but wisdom gain from learning
      currentCreature.happiness = Math.max(0, currentCreature.happiness - 3);
      currentCreature.wisdom = Math.min(100, currentCreature.wisdom + 2);
      gainExperience(1);
      updated = true;
      break;
      
    case 'damage_dealt':
      // Power boost from dealing damage
      if (data.amount >= 5) {
        currentCreature.power = Math.min(100, currentCreature.power + 1);
        updated = true;
      }
      break;
      
    case 'strategic_play':
      // Wisdom boost for complex plays (spending lots of energy)
      if (data.energySpent >= 5) {
        currentCreature.wisdom = Math.min(100, currentCreature.wisdom + 1);
        updated = true;
      }
      break;
  }
  
  if (updated) {
    // Update telemetry-based stats
    updateCreatureFromTelemetry();
    saveIdleGame();
  }
}