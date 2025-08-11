// Card Unlock System for VORTEKS
// Manages which cards are available to players

const UNLOCK_STORAGE_KEY = 'vorteks-unlocked-cards';

// Define starter cards (available from the beginning)
const STARTER_CARDS = ['heart', 'swords', 'shield', 'fire', 'bolt', 'star'];

// Define unlockable cards with their unlock conditions (stubbed for future expansion)
const UNLOCKABLE_CARDS = {
  'echo': {
    name: 'Echo',
    unlockCondition: 'defeat_trickster', // Stub: defeat a persona with trickster AI
    description: 'Unlocked by defeating a Trickster persona'
  },
  'snow': {
    name: 'Freeze',
    unlockCondition: 'achieve_perfect_defense', // Stub: win without taking damage
    description: 'Unlocked by achieving perfect defense in a battle'
  },
  'dagger': {
    name: 'Pierce',
    unlockCondition: 'defeat_armored_foe', // Stub: defeat enemy with high shield
    description: 'Unlocked by defeating a heavily armored opponent'
  },
  'loop': {
    name: 'Surge',
    unlockCondition: 'win_streak_5', // Stub: achieve 5 win streak
    description: 'Unlocked by achieving a 5-win streak'
  }
};

/**
 * Get the list of currently unlocked card IDs
 * @returns {string[]} Array of unlocked card IDs
 */
export function getUnlockedCards() {
  try {
    const saved = localStorage.getItem(UNLOCK_STORAGE_KEY);
    const unlocked = saved ? JSON.parse(saved) : [];
    
    // Always include starter cards
    const allUnlocked = new Set([...STARTER_CARDS, ...unlocked]);
    return Array.from(allUnlocked);
  } catch (error) {
    console.warn('Failed to load unlock state, using starter cards only:', error);
    return [...STARTER_CARDS];
  }
}

/**
 * Check if a specific card is unlocked
 * @param {string} cardId - The card ID to check
 * @returns {boolean} True if the card is unlocked
 */
export function isCardUnlocked(cardId) {
  return getUnlockedCards().includes(cardId);
}

/**
 * Unlock a card and save to localStorage
 * @param {string} cardId - The card ID to unlock
 * @returns {boolean} True if card was newly unlocked, false if already unlocked
 */
export function unlockCard(cardId) {
  if (STARTER_CARDS.includes(cardId)) {
    return false; // Starter cards are always unlocked
  }
  
  if (!UNLOCKABLE_CARDS[cardId]) {
    console.warn(`Attempted to unlock unknown card: ${cardId}`);
    return false;
  }
  
  const currentUnlocked = getUnlockedCards();
  if (currentUnlocked.includes(cardId)) {
    return false; // Already unlocked
  }
  
  try {
    const saved = localStorage.getItem(UNLOCK_STORAGE_KEY);
    const unlocked = saved ? JSON.parse(saved) : [];
    unlocked.push(cardId);
    localStorage.setItem(UNLOCK_STORAGE_KEY, JSON.stringify(unlocked));
    
    // Show celebration message
    showUnlockCelebration(cardId);
    
    return true;
  } catch (error) {
    console.error('Failed to save unlock state:', error);
    return false;
  }
}

/**
 * Show a celebratory message when a card is unlocked
 * @param {string} cardId - The unlocked card ID
 */
function showUnlockCelebration(cardId) {
  const cardInfo = UNLOCKABLE_CARDS[cardId];
  if (!cardInfo) return;
  
  const message = `🎉 NEW CARD UNLOCKED! ${cardInfo.name} is now available in your deck builder!`;
  
  // Log to game log if available
  if (window.log) {
    window.log(message);
  }
  
  // Also show as alert for immediate feedback
  // TODO: Replace with proper UI notification in future
  console.log(message);
}

/**
 * Get all unlockable cards and their states
 * @returns {Object} Object with card info and unlock states
 */
export function getUnlockableCardsInfo() {
  const unlockedCards = getUnlockedCards();
  const info = {};
  
  for (const [cardId, cardData] of Object.entries(UNLOCKABLE_CARDS)) {
    info[cardId] = {
      ...cardData,
      isUnlocked: unlockedCards.includes(cardId)
    };
  }
  
  return info;
}

/**
 * Reset all unlocks (for testing/debugging)
 * @returns {void}
 */
export function resetUnlocks() {
  try {
    localStorage.removeItem(UNLOCK_STORAGE_KEY);
    console.log('All card unlocks reset to default (starter cards only)');
  } catch (error) {
    console.error('Failed to reset unlocks:', error);
  }
}

// Stub functions for future unlock trigger implementations
// These will be called when specific game events occur

/**
 * Check and potentially unlock cards based on defeating a persona
 * @param {string} persona - The defeated persona type
 * TODO: Implement persona-based unlock logic
 */
export function checkPersonaDefeatUnlocks(persona) {
  // Stub for future expansion
  console.log(`Checking unlocks for defeating ${persona} persona...`);
  
  // Example implementation (commented out until persona system is ready):
  // if (persona === 'trickster') {
  //   unlockCard('echo');
  // }
}

/**
 * Check and potentially unlock cards based on gameplay achievements
 * @param {string} achievement - The achievement earned
 * @param {Object} gameState - Current game state for context
 * TODO: Implement achievement-based unlock logic
 */
export function checkAchievementUnlocks(achievement, gameState = {}) {
  // Stub for future expansion
  console.log(`Checking unlocks for achievement: ${achievement}`);
  
  // Example implementations (commented out until systems are ready):
  // if (achievement === 'perfect_defense' && gameState.damageTaken === 0) {
  //   unlockCard('snow');
  // }
  // if (achievement === 'win_streak' && gameState.streak >= 5) {
  //   unlockCard('loop');
  // }
}

/**
 * Manual unlock function for testing and debugging
 * @param {string} cardId - Card to unlock
 */
export function debugUnlock(cardId) {
  if (unlockCard(cardId)) {
    console.log(`DEBUG: Manually unlocked ${cardId}`);
  } else {
    console.log(`DEBUG: ${cardId} was already unlocked or invalid`);
  }
}

// Export constants for use by other modules
export { STARTER_CARDS, UNLOCKABLE_CARDS };