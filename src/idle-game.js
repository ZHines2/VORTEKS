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
  if (creature.needsAttention) return "Yearning for your presence...";
  if (creature.energy < 20) {
    if (creature.playfulness >= 70) return "Spirit willing, but body weary...";
    if (creature.focus >= 70) return "Mind clouded by exhaustion...";
    if (creature.wisdom >= 70) return "Seeking rest to restore inner balance...";
    return "Energy flows low like a distant stream...";
  }
  if (creature.happiness < 30) {
    if (creature.loyalty >= 70) return "Heart aches in your absence...";
    if (creature.courage >= 70) return "Courage falters without your guidance...";
    if (creature.wisdom >= 70) return "Even the wise know sorrow...";
    return "Shadows gather in the soul...";
  }
  
  // Enlightened/Transcendent status messages for high stats
  if (creature.wisdom >= 90 && creature.focus >= 90) return "Dwelling in perfect mindfulness...";
  if (creature.courage >= 95) return "Fearless as the mountain, flowing as the stream...";
  if (creature.creativity >= 95) return "Reality bends to artistic vision...";
  if (creature.loyalty >= 95) return "United in spirit across all dimensions...";
  
  // Positive status messages based on personality
  if (creature.happiness > 80 && creature.energy > 60) {
    if (creature.playfulness >= 70) return "Dancing with the joy of existence!";
    if (creature.creativity >= 70) return "Painting reality with pure inspiration!";
    if (creature.courage >= 70) return "Heart blazing with warrior's fire!";
    if (creature.wisdom >= 70) return "Radiating serene contentment...";
    return "Soul shining like a beacon!";
  }
  
  // Mystical personality-driven neutral states
  if (creature.curiosity >= 70 && creature.wisdom > 60) return "Contemplating the eternal mysteries...";
  if (creature.creativity >= 70 && creature.focus >= 60) return "Weaving dreams into reality...";
  if (creature.focus >= 70 && creature.wisdom >= 60) return "Mind sharp as diamond, clear as water...";
  if (creature.courage >= 70 && creature.loyalty >= 60) return "Standing guard over sacred bonds...";
  if (creature.loyalty >= 70 && creature.wisdom >= 60) return "Heart anchored in unwavering devotion...";
  if (creature.playfulness >= 70 && creature.curiosity >= 60) return "Finding wonder in each moment...";
  if (creature.wisdom > 80) return "Touching the infinite with understanding...";
  if (creature.creativity >= 70) return "Channeling cosmic artistry...";
  if (creature.focus >= 70) return "Centered in perfect awareness...";
  if (creature.courage >= 70) return "Spirit unshakeable as ancient stone...";
  if (creature.loyalty >= 70) return "Bound by threads stronger than starlight...";
  if (creature.playfulness >= 70) return "Discovering magic in the ordinary...";
  
  return "Peacefully being...";
}

function getMoodMessage(creature) {
  const telemetry = getTelemetry();
  const modifiers = getPerformanceModifiers(creature);
  
  // High-level achievement messages with spiritual themes
  if (creature.level >= 50) {
    if (creature.loyalty >= 90) return "A sacred bond transcending space and time itself!";
    if (creature.courage >= 90) return "Fearless legend walking between worlds!";
    if (creature.wisdom >= 90) return "Ancient wisdom flowing through mortal form!";
    if (creature.creativity >= 90) return "Master artist painting reality with pure will!";
    return "Enlightened VORTEKS master dwelling in eternal now!";
  }
  
  if (creature.level >= 30) {
    if (creature.creativity >= 80) return "Weaving battle-poetry from the threads of strategy!";
    if (creature.focus >= 80) return "Mind like still water reflecting perfect truth!";
    if (creature.wisdom >= 80) return "Walking the middle path of tactical balance!";
    return "Ascending the mountain of mastery, step by step...";
  }
  
  if (creature.level >= 15) {
    if (creature.curiosity >= 70) return "Drinking deeply from the wellspring of knowledge!";
    if (creature.playfulness >= 70) return "Finding the sacred within the play of existence!";
    if (creature.courage >= 70) return "Growing bold through trials of heart and mind!";
    return "Strength blooms from seeds of perseverance!";
  }
  
  if (creature.level >= 5) {
    if (creature.wisdom >= 60) return "Meditation in motion, learning through being...";
    if (creature.loyalty >= 70) return "Trust deepening like roots in sacred soil...";
    if (creature.focus >= 60) return "Awareness sharpening like a blade in moonlight...";
    return "Absorbing the subtle art of strategic flow...";
  }
  
  // Battle streak responses with mystical personality
  if (telemetry.battles.currentStreak >= 10) {
    if (creature.courage >= 70) return "Riding the winds of destiny fearlessly!";
    if (creature.loyalty >= 70) return "Witnessing your legend unfold with devoted pride!";
    if (creature.wisdom >= 70) return "Your victories echo in the chambers of eternity!";
    return "Marveling at this dance of triumph and time!";
  }
  
  if (telemetry.battles.currentStreak > 5) {
    if (creature.playfulness >= 70) return "Celebrating the joyous rhythm of success!";
    if (creature.creativity >= 70) return "Your victories paint masterpieces in the air!";
    if (creature.focus >= 70) return "Witnessing the flow state of perfect execution!";
    return "Heart soaring with each victorious moment!";
  }
  
  if (telemetry.battles.currentStreak > 2) {
    if (creature.focus >= 70) return "Studying the sacred patterns of your success!";
    if (creature.curiosity >= 70) return "Discovering the secrets hidden in triumph!";
    return "Energy building like gathering storm clouds!";
  }
  
  // Experience-based messages with deeper wisdom
  if (telemetry.battles.total > 100) {
    if (creature.wisdom >= 80) return "Swimming in the ocean of accumulated wisdom...";
    if (creature.curiosity >= 70) return "Each battle a universe of infinite learning!";
    if (creature.courage >= 70) return "A warrior's thousand trials forge the soul!";
    return "Walking libraries of battle lore and legend...";
  }
  
  if (telemetry.battles.total > 50) {
    if (creature.loyalty >= 70) return "Drinking from the fountain of shared experience...";
    if (creature.focus >= 70) return "Patterns emerging from the chaos of conflict...";
    return "Wisdom crystallizing from the fires of experience...";
  }
  
  if (telemetry.battles.total > 20) {
    if (creature.focus >= 60) return "Watching the spiral dance of strategic evolution...";
    if (creature.creativity >= 60) return "Art emerging from the canvas of combat...";
    return "Seeds of mastery taking root in fertile ground...";
  }
  
  if (telemetry.battles.total > 10) {
    if (creature.curiosity >= 60) return "Wonder grows with each revealed mystery...";
    if (creature.playfulness >= 60) return "Finding joy in the game within the game...";
    return "First steps on the thousand-mile journey...";
  }
  
  // Early stage messages with mystical personality hints
  if (creature.stage === 'EGG') {
    if (creature.creativity >= 50) return "Dreams of cosmic artistry swirling within...";
    if (creature.courage >= 50) return "Warrior spirit stirring in primordial depths...";
    if (creature.curiosity >= 50) return "Ancient questions awakening in the shell...";
    if (creature.wisdom >= 50) return "Timeless knowledge gathering like morning dew...";
    if (creature.loyalty >= 50) return "Heart-bonds forming across the veil of being...";
    if (creature.focus >= 50) return "Consciousness crystallizing into perfect form...";
    return "Life force gathering like stars before dawn...";
  }
  
  if (creature.stage === 'HATCHLING') {
    if (creature.playfulness >= 60) return "Dancing through the first steps of existence!";
    if (creature.loyalty >= 60) return "Soul-threads weaving between kindred spirits!";
    if (creature.wisdom >= 60) return "Ancient memory awakening in youthful form...";
    if (creature.curiosity >= 60) return "Wonder-filled eyes seeing infinity everywhere!";
    return "Innocent wonder meeting infinite possibility!";
  }
  
  return "Two souls beginning their eternal dance together...";
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

// Get mystical flavor text for room interactions
export function getRoomInteractionMessage(elementName, creature, success = true) {
  if (!success) return getRoomInteractionFailMessage(elementName, creature);
  
  switch (elementName) {
    case 'bed':
      if (creature.loyalty >= 90) return `${creature.name} surrenders to dreams where souls dance eternally...`;
      else if (creature.loyalty >= 70) return `${creature.name} rests in the sanctuary of your shared bond...`;
      else if (creature.wisdom >= 90) return `${creature.name} sleeps to commune with ancient wisdom...`;
      else if (creature.wisdom >= 70) return `${creature.name} finds restoration in the temple of rest...`;
      else if (creature.focus >= 70) return `${creature.name} recharges with meditative slumber...`;
      else if (creature.creativity >= 70) return `${creature.name} dreams in colors beyond imagination...`;
      else if (creature.playfulness >= 70) return `${creature.name} rests to gather energy for cosmic play...`;
      return `${creature.name} finds peace in sacred repose...`;
      
    case 'mirror':
      if (creature.curiosity >= 90) return `${creature.name} gazes beyond reflection into infinite possibility...`;
      else if (creature.curiosity >= 70) return `${creature.name} discovers universes hidden in their own eyes...`;
      else if (creature.wisdom >= 90) return `${creature.name} sees the eternal self beyond temporal form...`;
      else if (creature.wisdom >= 70) return `${creature.name} contemplates the mirror of consciousness...`;
      else if (creature.creativity >= 70) return `${creature.name} finds artistic inspiration in self-reflection...`;
      else if (creature.focus >= 70) return `${creature.name} practices mindful self-awareness...`;
      return `${creature.name} ponders their own mysterious nature...`;
      
    case 'bookshelf':
      if (creature.wisdom >= 90) return `${creature.name} absorbs knowledge directly into their eternal essence...`;
      else if (creature.wisdom >= 70) return `${creature.name} drinks from the wellspring of accumulated wisdom...`;
      else if (creature.focus >= 90) return `${creature.name} reads between dimensions, understanding all...`;
      else if (creature.focus >= 70) return `${creature.name} concentrates intensely on profound teachings...`;
      else if (creature.curiosity >= 70) return `${creature.name} devours knowledge with insatiable wonder...`;
      else if (creature.creativity >= 70) return `${creature.name} finds inspiration in ancient stories...`;
      return `${creature.name} studies with reverent attention...`;
      
    case 'toybox':
      if (creature.playfulness >= 90) return `${creature.name} transforms toys into portals of pure joy...`;
      else if (creature.playfulness >= 70) return `${creature.name} plays with the innocent wisdom of eternal youth...`;
      else if (creature.creativity >= 90) return `${creature.name} reimagines toys as tools of cosmic artistry...`;
      else if (creature.creativity >= 70) return `${creature.name} creates masterpieces from simple playthings...`;
      else if (creature.curiosity >= 70) return `${creature.name} explores new dimensions of fun...`;
      else if (creature.loyalty >= 70) return `${creature.name} plays with thoughts of shared happiness...`;
      return `${creature.name} finds wonder in simple pleasures...`;
      
    case 'plant':
      if (creature.focus >= 90) return `${creature.name} communes with the plant's silent enlightenment...`;
      else if (creature.focus >= 70) return `${creature.name} meditates on the patient wisdom of growth...`;
      else if (creature.wisdom >= 90) return `${creature.name} learns from nature's eternal teachings...`;
      else if (creature.wisdom >= 70) return `${creature.name} finds profound lessons in green simplicity...`;
      else if (creature.creativity >= 70) return `${creature.name} draws artistic inspiration from living beauty...`;
      else if (creature.curiosity >= 70) return `${creature.name} marvels at the mysteries of life...`;
      return `${creature.name} tends to the sacred connection with nature...`;
      
    case 'artEasel':
      if (creature.creativity >= 90) return `${creature.name} paints visions that reshape reality itself...`;
      else if (creature.creativity >= 70) return `${creature.name} channels cosmic beauty through artistic expression...`;
      else if (creature.wisdom >= 90) return `${creature.name} creates art that teaches without words...`;
      else if (creature.wisdom >= 70) return `${creature.name} expresses profound truths through visual poetry...`;
      else if (creature.focus >= 70) return `${creature.name} enters perfect flow state while creating...`;
      else if (creature.playfulness >= 70) return `${creature.name} plays with colors like a child of light...`;
      return `${creature.name} brings inner visions into form...`;
      
    default:
      return `${creature.name} interacts with mysterious purpose...`;
  }
}

function getRoomInteractionFailMessage(elementName, creature) {
  switch (elementName) {
    case 'bed':
      if (creature.wisdom >= 90) return `${creature.name} knows rest is not needed when energy overflows...`;
      else if (creature.focus >= 70) return `${creature.name} is too energized for peaceful slumber...`;
      return `${creature.name} feels too alert for rest...`;
      
    case 'bookshelf':
      if (creature.wisdom >= 90) return `${creature.name} needs vital energy to properly honor the teachings...`;
      else if (creature.focus >= 70) return `${creature.name} requires clear mind-energy for deep study...`;
      return `${creature.name} lacks energy for concentrated learning...`;
      
    default:
      return `${creature.name} cannot interact with this right now...`;
  }
}