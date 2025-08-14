// idle-game.js
// Tamagotchi-like idle game system that leverages telemetry metadata

import { getTelemetry, saveTelemetry } from './telemetry.js';

const IDLE_GAME_KEY = 'vorteks-idle-creature';
const IDLE_GAME_VERSION = 2; // Updated for new stats and VORTEK

// VORTEK evolution stages
const CREATURE_STAGES = {
  EGG: { name: 'Egg', emoji: '🥚', minLevel: 0, size: 'tiny' },
  HATCHLING: { name: 'VORTEK Sprite', emoji: '🌟', minLevel: 5, size: 'small' },
  JUVENILE: { name: 'Echo Beast', emoji: '⚡', minLevel: 15, size: 'medium' },
  ADULT: { name: 'Card Master', emoji: '🔮', minLevel: 30, size: 'large' },
  ELDER: { name: 'VORTEKS Avatar', emoji: '🌌', minLevel: 50, size: 'massive' }
};

// Default VORTEK data
const DEFAULT_CREATURE = {
  version: IDLE_GAME_VERSION,
  name: 'VORTEK',
  isCustomNamed: false,
  level: 1,
  experience: 0,
  stage: 'EGG',
  uniqueSound: null, // Will be generated when first displayed
  
  // Core stats (0-100)
  happiness: 50,
  energy: 50,
  wisdom: 50,
  power: 50,
  
  // Extended personality stats (0-100)
  curiosity: 40,    // Explores room, discovers new things
  creativity: 35,   // Artistic expression, decoration preferences
  loyalty: 60,      // Bond strength with player
  playfulness: 55,  // Interaction with toys and environment
  focus: 45,        // Concentration ability, learning speed
  courage: 40,      // Battle readiness, confidence
  
  // Room environment and interactions
  roomElements: {
    bed: { unlocked: true, interactionCount: 0 },
    mirror: { unlocked: false, interactionCount: 0 },
    bookshelf: { unlocked: false, interactionCount: 0 },
    toybox: { unlocked: false, interactionCount: 0 },
    plant: { unlocked: false, interactionCount: 0 },
    artEasel: { unlocked: false, interactionCount: 0 }
  },
  
  // Idle progression
  totalIdleTime: 0,
  lastChecked: Date.now(),
  
  // Evolution tracking
  battleInfluence: 0,    // Influenced by win ratio
  cardMastery: 0,        // Influenced by cards played variety
  strategicDepth: 0,     // Influenced by average turn length and energy usage
  
  // Needs and care
  needsAttention: false,
  lastFed: Date.now(),
  lastPlayed: Date.now(),
  lastExplored: Date.now(),
  
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
    
    // Extended stats also change slowly during idle
    currentCreature.focus = Math.min(100, currentCreature.focus + Math.min(3, hoursIdle * 0.3));
    currentCreature.curiosity = Math.max(0, currentCreature.curiosity - Math.min(5, hoursIdle * 0.4));
    currentCreature.playfulness = Math.max(0, currentCreature.playfulness - Math.min(8, hoursIdle * 0.6));
    
    // Loyalty increases slightly during long idle (missing the player)
    if (hoursIdle > 4) {
      currentCreature.loyalty = Math.min(100, currentCreature.loyalty + Math.min(2, hoursIdle * 0.1));
    }
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
export function updateCreatureFromTelemetry() {
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
  
  // Apply performance modifier for experience gain
  const modifiers = getPerformanceModifiers(currentCreature);
  const adjustedAmount = Math.floor(amount * modifiers.experienceMultiplier);
  
  currentCreature.experience += adjustedAmount;
  
  // Level up check
  const expNeeded = currentCreature.level * 10;
  if (currentCreature.experience >= expNeeded) {
    currentCreature.level++;
    currentCreature.experience -= expNeeded;
    
    // Level up bonuses with personality influence
    const loyaltyBonus = Math.floor(modifiers.loyaltyBonus / 10);
    currentCreature.happiness = Math.min(100, currentCreature.happiness + 10 + loyaltyBonus);
    currentCreature.energy = Math.min(100, currentCreature.energy + 15 + loyaltyBonus);
    
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
          currentCreature.curiosity += 15;
          currentCreature.playfulness += 10;
          break;
        case 'JUVENILE':
          currentCreature.power += 15;
          currentCreature.courage += 20;
          currentCreature.focus += 10;
          break;
        case 'ADULT':
          currentCreature.wisdom += 15;
          currentCreature.power += 10;
          currentCreature.creativity += 20;
          currentCreature.loyalty += 15;
          break;
        case 'ELDER':
          currentCreature.wisdom += 20;
          currentCreature.power += 20;
          currentCreature.happiness = 100;
          currentCreature.courage += 25;
          currentCreature.focus += 20;
          currentCreature.creativity += 15;
          currentCreature.loyalty = 100;
          break;
      }
      
      // Cap all stats at 100
      ['wisdom', 'power', 'curiosity', 'playfulness', 'courage', 'focus', 'creativity', 'loyalty'].forEach(stat => {
        currentCreature[stat] = Math.min(100, currentCreature[stat]);
      });
      
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
  const modifiers = getPerformanceModifiers(currentCreature);
  
  // Reduced cooldown based on performance modifiers
  const baseCooldown = 0.5; // 30 minutes
  const adjustedCooldown = baseCooldown * (1 - modifiers.cooldownReduction / 100);
  const hoursSinceLastPlay = (now - currentCreature.lastPlayed) / (1000 * 60 * 60);
  
  if (hoursSinceLastPlay < adjustedCooldown) return false;
  
  // Enhanced gains based on personality
  const happinessGain = 15 + Math.floor(modifiers.loyaltyBonus / 10);
  const playfulnessGain = 8 + Math.floor(currentCreature.playfulness >= 70 ? 4 : 0);
  const loyaltyGain = 3 + Math.floor(modifiers.loyaltyBonus / 20);
  const energyCost = Math.max(2, Math.floor(5 * modifiers.energyEfficiency));
  
  currentCreature.happiness = Math.min(100, currentCreature.happiness + happinessGain);
  currentCreature.playfulness = Math.min(100, currentCreature.playfulness + playfulnessGain);
  currentCreature.loyalty = Math.min(100, currentCreature.loyalty + loyaltyGain);
  currentCreature.energy = Math.max(0, currentCreature.energy - energyCost);
  currentCreature.lastPlayed = now;
  currentCreature.needsAttention = false;
  
  // Enhanced experience chance for highly playful VORTEKs
  const expChance = currentCreature.playfulness >= 70 ? 0.5 : 0.3;
  if (Math.random() < expChance) {
    gainExperience(1);
  }
  
  saveIdleGame();
  return true;
}

export function meditateWithCreature() {
  if (!currentCreature) return false;
  
  const modifiers = getPerformanceModifiers(currentCreature);
  const energyCost = Math.max(5, Math.floor(10 * modifiers.energyEfficiency));
  
  if (currentCreature.energy < energyCost) return false;
  
  // Enhanced gains for focused/wise VORTEKs
  const wisdomGain = 5 + (currentCreature.focus >= 70 ? 3 : 0);
  const focusGain = 7 + (currentCreature.wisdom >= 70 ? 3 : 0);
  const loyaltyGain = 2 + Math.floor(modifiers.loyaltyBonus / 25);
  
  currentCreature.wisdom = Math.min(100, currentCreature.wisdom + wisdomGain);
  currentCreature.focus = Math.min(100, currentCreature.focus + focusGain);
  currentCreature.loyalty = Math.min(100, currentCreature.loyalty + loyaltyGain);
  currentCreature.energy -= energyCost;
  currentCreature.happiness = Math.min(100, currentCreature.happiness + 5);
  
  gainExperience(1);
  
  saveIdleGame();
  return true;
}

// Get current creature info for display
export function getCreatureInfo() {
  const creature = getCreature();
  const stage = CREATURE_STAGES[creature.stage];
  const appearance = getCreatureAppearance(creature);
  
  return {
    ...creature,
    stageName: stage.name,
    stageEmoji: appearance.emoji,
    stageSize: stage.size,
    visualEffects: appearance.effects,
    personalityDisplay: appearance.personality,
    expNeeded: creature.level * 10,
    expProgress: (creature.experience / (creature.level * 10)) * 100,
    
    // All stats for easy access
    coreStats: {
      happiness: creature.happiness,
      energy: creature.energy,
      wisdom: creature.wisdom,
      power: creature.power
    },
    
    extendedStats: {
      curiosity: creature.curiosity,
      creativity: creature.creativity,
      loyalty: creature.loyalty,
      playfulness: creature.playfulness,
      focus: creature.focus,
      courage: creature.courage
    },
    
    // Room information
    unlockedRoomElements: Object.keys(creature.roomElements).filter(
      key => creature.roomElements[key].unlocked
    ),
    
    // Status messages
    statusMessage: getStatusMessage(creature),
    moodMessage: getMoodMessage(creature),
    roomActivity: getRoomActivityMessage(creature),
    
    // Performance modifiers
    performanceModifiers: getPerformanceModifiers(creature)
  };
}

function getRoomActivityMessage(creature) {
  const unlockedCount = Object.values(creature.roomElements).filter(el => el.unlocked).length;
  
  if (unlockedCount === 1) return "Exploring the basic room setup...";
  if (unlockedCount <= 3) return "Getting comfortable in the room...";
  if (unlockedCount <= 5) return "Making the room feel like home...";
  return "Living happily in a fully furnished room!";
}

// Dynamic appearance based on personality stats
function getCreatureAppearance(creature) {
  const stage = CREATURE_STAGES[creature.stage];
  let baseEmoji = stage.emoji;
  let effects = [];
  let personality = '';
  
  // Find dominant personality traits (stats above 70)
  const dominantTraits = [];
  if (creature.curiosity >= 70) dominantTraits.push('curious');
  if (creature.creativity >= 70) dominantTraits.push('creative');
  if (creature.loyalty >= 70) dominantTraits.push('loyal');
  if (creature.playfulness >= 70) dominantTraits.push('playful');
  if (creature.focus >= 70) dominantTraits.push('focused');
  if (creature.courage >= 70) dominantTraits.push('brave');
  
  // Modify appearance based on dominant traits and stage
  if (creature.stage === 'EGG') {
    // Egg variations based on stats
    if (creature.happiness >= 80) baseEmoji = '✨🥚✨';
    else if (creature.energy >= 80) baseEmoji = '⚡🥚⚡';
    else if (creature.creativity >= 60) baseEmoji = '🎨🥚';
    else if (creature.curiosity >= 60) baseEmoji = '🔍🥚';
    
    personality = dominantTraits.length > 0 ? `Showing signs of ${dominantTraits.join(', ')} nature` : 'Developing personality...';
  } else {
    // Post-hatch appearance modifications
    if (dominantTraits.includes('creative') && dominantTraits.includes('playful')) {
      baseEmoji = stage.emoji + '🎨';
      personality = 'Artistic Entertainer';
    } else if (dominantTraits.includes('brave') && dominantTraits.includes('focused')) {
      baseEmoji = '⚔️' + stage.emoji;
      personality = 'Fierce Warrior';
    } else if (dominantTraits.includes('loyal') && dominantTraits.includes('curious')) {
      baseEmoji = stage.emoji + '💎';
      personality = 'Devoted Explorer';
    } else if (dominantTraits.includes('creative')) {
      baseEmoji = '🎭' + stage.emoji;
      personality = 'Creative Soul';
    } else if (dominantTraits.includes('brave')) {
      baseEmoji = stage.emoji + '🛡️';
      personality = 'Bold Adventurer';
    } else if (dominantTraits.includes('playful')) {
      baseEmoji = '🎈' + stage.emoji;
      personality = 'Joyful Spirit';
    } else if (dominantTraits.includes('focused')) {
      baseEmoji = '🧩' + stage.emoji;
      personality = 'Wise Scholar';
    } else if (dominantTraits.includes('curious')) {
      baseEmoji = '🔮' + stage.emoji;
      personality = 'Keen Observer';
    } else if (dominantTraits.includes('loyal')) {
      baseEmoji = stage.emoji + '💝';
      personality = 'Faithful Companion';
    } else {
      personality = 'Balanced Being';
    }
  }
  
  // Add visual effects based on current state
  if (creature.happiness >= 90) effects.push('✨ Radiating Joy');
  if (creature.energy >= 95) effects.push('⚡ Energetic Aura');
  if (creature.wisdom >= 85) effects.push('🧠 Thoughtful Glow');
  if (creature.power >= 85) effects.push('💪 Powerful Presence');
  
  // Special effects for extreme stat combinations
  if (creature.courage >= 80 && creature.power >= 80) {
    effects.push('🔥 Battle Ready');
  }
  if (creature.creativity >= 80 && creature.happiness >= 80) {
    effects.push('🌈 Inspirational');
  }
  if (creature.loyalty >= 90 && creature.focus >= 80) {
    effects.push('💫 Harmonious Bond');
  }
  
  return {
    emoji: baseEmoji,
    effects: effects,
    personality: personality
  };
}

// Performance modifiers based on stats
function getPerformanceModifiers(creature) {
  return {
    // Experience gain multiplier (0.5x to 2.0x based on wisdom and focus)
    experienceMultiplier: 0.5 + ((creature.wisdom + creature.focus) / 200) * 1.5,
    
    // Battle performance boost (0% to 25% based on courage and power)
    battleBonus: Math.floor(((creature.courage + creature.power) / 200) * 25),
    
    // Energy efficiency (better stats = less energy consumed)
    energyEfficiency: 1 - ((creature.focus + creature.wisdom) / 300),
    
    // Interaction cooldown reduction (0% to 50% based on relevant stats)
    cooldownReduction: Math.floor(((creature.playfulness + creature.energy) / 200) * 50),
    
    // Room exploration effectiveness (higher curiosity = better exploration)
    explorationBonus: Math.floor((creature.curiosity / 100) * 100),
    
    // Creativity bonus for artistic interactions
    creativityBonus: Math.floor((creature.creativity / 100) * 100),
    
    // Loyalty affects stat gains from interactions
    loyaltyBonus: Math.floor((creature.loyalty / 100) * 50)
  };
}

function getStatusMessage(creature) {
  const modifiers = getPerformanceModifiers(creature);
  
  // Priority messages based on urgent needs
  if (creature.needsAttention) return "Needs attention!";
  if (creature.energy < 20) {
    if (creature.playfulness >= 70) return "Too tired to play...";
    if (creature.focus >= 70) return "Too drained to concentrate...";
    return "Feeling tired...";
  }
  if (creature.happiness < 30) {
    if (creature.loyalty >= 70) return "Missing you deeply...";
    if (creature.courage >= 70) return "Feeling discouraged...";
    return "Feeling sad...";
  }
  
  // Positive status messages based on personality
  if (creature.happiness > 80 && creature.energy > 60) {
    if (creature.playfulness >= 70) return "Bouncing with joy!";
    if (creature.creativity >= 70) return "Bursting with inspiration!";
    if (creature.courage >= 70) return "Ready for adventure!";
    return "Very happy!";
  }
  
  // Personality-driven neutral states
  if (creature.curiosity >= 70 && creature.wisdom > 60) return "Pondering mysteries...";
  if (creature.creativity >= 70) return "Feeling artistic...";
  if (creature.focus >= 70) return "In deep concentration...";
  if (creature.courage >= 70) return "Feeling bold...";
  if (creature.loyalty >= 70) return "Devoted and faithful...";
  if (creature.playfulness >= 70) return "Looking for fun...";
  if (creature.wisdom > 80) return "Deep in thought...";
  
  return "Content";
}

function getMoodMessage(creature) {
  const telemetry = getTelemetry();
  const modifiers = getPerformanceModifiers(creature);
  
  // High-level achievement messages
  if (creature.level >= 50) {
    if (creature.loyalty >= 90) return "A legendary bond forged through countless battles!";
    if (creature.courage >= 90) return "Fearless legendary VORTEKS master!";
    return "A legendary VORTEKS master!";
  }
  
  if (creature.level >= 30) {
    if (creature.creativity >= 80) return "Masterfully creating new battle strategies!";
    if (creature.focus >= 80) return "Precisely mastering card combat techniques!";
    return "Mastering the art of card combat...";
  }
  
  if (creature.level >= 15) {
    if (creature.curiosity >= 70) return "Eagerly studying your every move!";
    if (creature.playfulness >= 70) return "Joyfully growing stronger through play!";
    return "Growing stronger with each battle!";
  }
  
  if (creature.level >= 5) {
    if (creature.wisdom >= 60) return "Thoughtfully analyzing your battle strategies...";
    if (creature.loyalty >= 70) return "Devotedly learning from your guidance...";
    return "Learning your battle strategies...";
  }
  
  // Battle streak responses with personality
  if (telemetry.battles.currentStreak >= 10) {
    if (creature.courage >= 70) return "Fearlessly celebrating your incredible victories!";
    if (creature.loyalty >= 70) return "Proudly admiring your unbeatable streak!";
    return "Amazed by your incredible streak!";
  }
  
  if (telemetry.battles.currentStreak > 5) {
    if (creature.playfulness >= 70) return "Dancing with excitement at your victories!";
    if (creature.creativity >= 70) return "Artistically inspired by your winning style!";
    return "Inspired by your victories!";
  }
  
  if (telemetry.battles.currentStreak > 2) {
    if (creature.focus >= 70) return "Intently studying your winning patterns!";
    return "Excited by your winning streak!";
  }
  
  // Experience-based messages with personality
  if (telemetry.battles.total > 100) {
    if (creature.wisdom >= 80) return "Deeply contemplating your vast expertise...";
    if (creature.curiosity >= 70) return "Fascinated by your extensive battle knowledge!";
    return "Studying your vast experience...";
  }
  
  if (telemetry.battles.total > 50) {
    if (creature.loyalty >= 70) return "Faithfully absorbing lessons from your battles...";
    return "Learning from your many battles...";
  }
  
  if (telemetry.battles.total > 20) {
    if (creature.focus >= 60) return "Carefully observing your tactical evolution...";
    return "Watching your tactical evolution...";
  }
  
  if (telemetry.battles.total > 10) {
    if (creature.curiosity >= 60) return "Curiously studying your developing skills...";
    return "Observing your growing skill...";
  }
  
  // Early stage messages with personality hints
  if (creature.stage === 'EGG') {
    if (creature.creativity >= 50) return "Dreaming of artistic possibilities!";
    if (creature.courage >= 50) return "Preparing for brave adventures!";
    if (creature.curiosity >= 50) return "Sensing exciting discoveries ahead!";
    return "Preparing to hatch into something amazing!";
  }
  
  if (creature.stage === 'HATCHLING') {
    if (creature.playfulness >= 60) return "Playfully exploring the VORTEKS world!";
    if (creature.loyalty >= 60) return "Bonding closely while taking first steps!";
    return "Taking first steps in the VORTEKS world!";
  }
  
  return "Beginning a new adventure together...";
}

// Migration function for future versions
function migrateCreature(oldData) {
  const migrated = { ...DEFAULT_CREATURE, ...oldData };
  migrated.version = IDLE_GAME_VERSION;
  
  // Add new stats if they don't exist
  if (!migrated.curiosity) migrated.curiosity = 40;
  if (!migrated.creativity) migrated.creativity = 35;
  if (!migrated.loyalty) migrated.loyalty = 60;
  if (!migrated.playfulness) migrated.playfulness = 55;
  if (!migrated.focus) migrated.focus = 45;
  if (!migrated.courage) migrated.courage = 40;
  
  // Add room elements if they don't exist
  if (!migrated.roomElements) {
    migrated.roomElements = DEFAULT_CREATURE.roomElements;
  }
  
  // Convert old "Vortex" name to "VORTEK"
  if (migrated.name === 'Vortex') {
    migrated.name = 'VORTEK';
    migrated.isCustomNamed = false;
  }
  
  // Add missing room interaction timestamps
  if (!migrated.lastExplored) migrated.lastExplored = Date.now();
  
  return migrated;
}

// Set custom name for VORTEK
export function setVortekName(newName) {
  if (!currentCreature || !newName || newName.length > 20) return false;
  
  currentCreature.name = newName.trim();
  currentCreature.isCustomNamed = true;
  saveIdleGame();
  return true;
}

// Room interaction functions
export function exploreRoom() {
  if (!currentCreature) return false;
  
  const now = Date.now();
  const modifiers = getPerformanceModifiers(currentCreature);
  
  // Reduced cooldown for curious VORTEKs
  const baseCooldown = 0.25; // 15 minutes
  const adjustedCooldown = baseCooldown * (1 - modifiers.explorationBonus / 200);
  const hoursSinceLastExplore = (now - currentCreature.lastExplored) / (1000 * 60 * 60);
  
  if (hoursSinceLastExplore < adjustedCooldown) return false;
  
  // Enhanced exploration gains for curious VORTEKs
  const curiosityGain = 3 + (currentCreature.curiosity >= 70 ? 2 : 0);
  const happinessGain = 2 + Math.floor(modifiers.explorationBonus / 50);
  const energyCost = Math.max(1, Math.floor(3 * modifiers.energyEfficiency));
  
  currentCreature.curiosity = Math.min(100, currentCreature.curiosity + curiosityGain);
  currentCreature.happiness = Math.min(100, currentCreature.happiness + happinessGain);
  currentCreature.energy = Math.max(0, currentCreature.energy - energyCost);
  currentCreature.lastExplored = now;
  
  // Chance to unlock new room elements based on level and stats
  unlockRoomElements();
  
  // Enhanced experience chance for curious VORTEKs
  const expChance = 0.4 + (modifiers.explorationBonus / 200);
  if (Math.random() < expChance) {
    gainExperience(1);
  }
  
  saveIdleGame();
  return true;
}

function unlockRoomElements() {
  if (!currentCreature) return;
  
  const { level, wisdom, curiosity, creativity } = currentCreature;
  
  // Mirror unlocks at level 5 with some curiosity
  if (level >= 5 && curiosity >= 30 && !currentCreature.roomElements.mirror.unlocked) {
    currentCreature.roomElements.mirror.unlocked = true;
    currentCreature.happiness += 10;
  }
  
  // Bookshelf unlocks at level 10 with wisdom
  if (level >= 10 && wisdom >= 40 && !currentCreature.roomElements.bookshelf.unlocked) {
    currentCreature.roomElements.bookshelf.unlocked = true;
    currentCreature.wisdom += 5;
  }
  
  // Toybox unlocks at level 8 with playfulness
  if (level >= 8 && currentCreature.playfulness >= 50 && !currentCreature.roomElements.toybox.unlocked) {
    currentCreature.roomElements.toybox.unlocked = true;
    currentCreature.playfulness += 5;
  }
  
  // Plant unlocks at level 15 with focus
  if (level >= 15 && currentCreature.focus >= 45 && !currentCreature.roomElements.plant.unlocked) {
    currentCreature.roomElements.plant.unlocked = true;
    currentCreature.focus += 5;
  }
  
  // Art easel unlocks at level 20 with creativity
  if (level >= 20 && creativity >= 50 && !currentCreature.roomElements.artEasel.unlocked) {
    currentCreature.roomElements.artEasel.unlocked = true;
    currentCreature.creativity += 10;
  }
}

export function interactWithRoomElement(elementName) {
  if (!currentCreature || !currentCreature.roomElements[elementName]?.unlocked) return false;
  
  const element = currentCreature.roomElements[elementName];
  const modifiers = getPerformanceModifiers(currentCreature);
  let interacted = false;
  
  switch (elementName) {
    case 'bed':
      if (currentCreature.energy < 90) {
        // Enhanced rest for loyal VORTEKs
        const energyGain = 15 + Math.floor(modifiers.loyaltyBonus / 10);
        const happinessGain = 3 + (currentCreature.loyalty >= 70 ? 2 : 0);
        
        currentCreature.energy = Math.min(100, currentCreature.energy + energyGain);
        currentCreature.happiness = Math.min(100, currentCreature.happiness + happinessGain);
        interacted = true;
      }
      break;
      
    case 'mirror':
      // Enhanced self-reflection for curious VORTEKs
      const curiosityGain = 2 + (currentCreature.curiosity >= 70 ? 2 : 0);
      const happinessGain = 2 + Math.floor(modifiers.explorationBonus / 50);
      
      currentCreature.curiosity = Math.min(100, currentCreature.curiosity + curiosityGain);
      currentCreature.happiness = Math.min(100, currentCreature.happiness + happinessGain);
      interacted = true;
      break;
      
    case 'bookshelf':
      const energyCost = Math.max(3, Math.floor(5 * modifiers.energyEfficiency));
      if (currentCreature.energy >= energyCost) {
        // Enhanced learning for focused VORTEKs
        const wisdomGain = 4 + (currentCreature.focus >= 70 ? 3 : 0);
        const focusGain = 2 + (currentCreature.wisdom >= 70 ? 2 : 0);
        
        currentCreature.wisdom = Math.min(100, currentCreature.wisdom + wisdomGain);
        currentCreature.focus = Math.min(100, currentCreature.focus + focusGain);
        currentCreature.energy -= energyCost;
        interacted = true;
      }
      break;
      
    case 'toybox':
      // Enhanced play for playful VORTEKs
      const playfulnessGain = 5 + (currentCreature.playfulness >= 70 ? 3 : 0);
      const happinessGain2 = 5 + Math.floor(modifiers.loyaltyBonus / 20);
      const energyCost2 = Math.max(2, Math.floor(3 * modifiers.energyEfficiency));
      
      currentCreature.playfulness = Math.min(100, currentCreature.playfulness + playfulnessGain);
      currentCreature.happiness = Math.min(100, currentCreature.happiness + happinessGain2);
      currentCreature.energy = Math.max(0, currentCreature.energy - energyCost2);
      interacted = true;
      break;
      
    case 'plant':
      const energyCost3 = Math.max(1, Math.floor(2 * modifiers.energyEfficiency));
      // Enhanced gardening for focused VORTEKs
      const focusGain2 = 3 + (currentCreature.focus >= 70 ? 2 : 0);
      const wisdomGain2 = 2 + (currentCreature.wisdom >= 70 ? 1 : 0);
      
      currentCreature.focus = Math.min(100, currentCreature.focus + focusGain2);
      currentCreature.wisdom = Math.min(100, currentCreature.wisdom + wisdomGain2);
      currentCreature.energy -= energyCost3;
      interacted = true;
      break;
      
    case 'artEasel':
      const energyCost4 = Math.max(5, Math.floor(8 * modifiers.energyEfficiency));
      if (currentCreature.energy >= energyCost4) {
        // Enhanced artistry for creative VORTEKs
        const creativityGain = 6 + Math.floor(modifiers.creativityBonus / 20);
        const happinessGain3 = 4 + (currentCreature.creativity >= 70 ? 3 : 0);
        
        currentCreature.creativity = Math.min(100, currentCreature.creativity + creativityGain);
        currentCreature.happiness = Math.min(100, currentCreature.happiness + happinessGain3);
        currentCreature.energy -= energyCost4;
        interacted = true;
      }
      break;
  }
  
  if (interacted) {
    element.interactionCount++;
    saveIdleGame();
  }
  
  return interacted;
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
  
  const modifiers = getPerformanceModifiers(currentCreature);
  let updated = false;
  
  switch (eventType) {
    case 'card_played':
      // Enhanced curiosity gain for curious VORTEKs
      const happinessGain = 0.5 + (currentCreature.playfulness >= 70 ? 0.3 : 0);
      const curiosityGain = 0.3 + (modifiers.explorationBonus / 500);
      const energyCost = Math.max(0.1, 0.2 * modifiers.energyEfficiency);
      
      currentCreature.happiness = Math.min(100, currentCreature.happiness + happinessGain);
      currentCreature.curiosity = Math.min(100, currentCreature.curiosity + curiosityGain);
      currentCreature.energy = Math.max(0, currentCreature.energy - energyCost);
      updated = true;
      break;
      
    case 'battle_won':
      // Enhanced victory rewards based on courage and loyalty
      const happinessBonus = 8 + Math.floor(modifiers.loyaltyBonus / 10);
      const courageBonus = 2 + (currentCreature.courage >= 70 ? 1 : 0);
      const loyaltyBonus = 1 + Math.floor(modifiers.loyaltyBonus / 50);
      const expBonus = 3 + Math.floor(modifiers.battleBonus / 10);
      
      currentCreature.happiness = Math.min(100, currentCreature.happiness + happinessBonus);
      currentCreature.courage = Math.min(100, currentCreature.courage + courageBonus);
      currentCreature.loyalty = Math.min(100, currentCreature.loyalty + loyaltyBonus);
      gainExperience(expBonus);
      currentCreature.lastPlayed = Date.now();
      currentCreature.needsAttention = false;
      updated = true;
      break;
      
    case 'battle_lost':
      // Learning from defeat - enhanced for wise VORTEKs
      const happinessLoss = Math.max(1, 3 - Math.floor(modifiers.loyaltyBonus / 30));
      const wisdomGain = 2 + (currentCreature.wisdom >= 70 ? 1 : 0);
      const focusGain = 1 + (currentCreature.focus >= 70 ? 1 : 0);
      
      currentCreature.happiness = Math.max(0, currentCreature.happiness - happinessLoss);
      currentCreature.wisdom = Math.min(100, currentCreature.wisdom + wisdomGain);
      currentCreature.focus = Math.min(100, currentCreature.focus + focusGain);
      gainExperience(1);
      updated = true;
      break;
      
    case 'damage_dealt':
      // Power growth enhanced for courageous VORTEKs
      if (data.amount >= 5) {
        const powerGain = 1 + (currentCreature.courage >= 70 ? 0.5 : 0);
        const courageGain = 0.5 + (currentCreature.power >= 70 ? 0.3 : 0);
        
        currentCreature.power = Math.min(100, currentCreature.power + powerGain);
        currentCreature.courage = Math.min(100, currentCreature.courage + courageGain);
        updated = true;
      }
      break;
      
    case 'strategic_play':
      // Enhanced strategic learning for focused VORTEKs
      if (data.energySpent >= 5) {
        const wisdomGain = 1 + (currentCreature.focus >= 70 ? 0.5 : 0);
        const focusGain = 1.5 + (currentCreature.wisdom >= 70 ? 0.5 : 0);
        
        currentCreature.wisdom = Math.min(100, currentCreature.wisdom + wisdomGain);
        currentCreature.focus = Math.min(100, currentCreature.focus + focusGain);
        updated = true;
      }
      break;
      
    case 'creative_combo':
      // Enhanced creativity for already creative VORTEKs
      const creativityGain = 2 + Math.floor(modifiers.creativityBonus / 50);
      const playfulnessGain = 1 + (currentCreature.creativity >= 70 ? 0.5 : 0);
      
      currentCreature.creativity = Math.min(100, currentCreature.creativity + creativityGain);
      currentCreature.playfulness = Math.min(100, currentCreature.playfulness + playfulnessGain);
      updated = true;
      break;
  }
  
  if (updated) {
    // Update telemetry-based stats
    updateCreatureFromTelemetry();
    saveIdleGame();
  }
}