// campaign.js
// Campaign (Roguelike) Mode implementation for VORTEKS

import { CAMPAIGN } from './config.js';
import { CARDS } from '../data/cards.js';

const CAMPAIGN_STORAGE_KEY = 'vorteks-campaign';

// Campaign state object
let campaignState = {
  active: false,
  deck: [],
  collection: [], // All cards the player owns/has collected
  victories: 0,
  boosterLevel: 0,
  selectedQuirk: null,
  currentRewards: null // Temporary storage for reward selection
};

// Campaign module
export const Campaign = {
  get active() {
    return campaignState.active;
  },

  get deck() {
    return [...campaignState.deck];
  },

  get collection() {
    return [...campaignState.collection];
  },

  get victories() {
    return campaignState.victories;
  },

  get boosterLevel() {
    return campaignState.boosterLevel;
  },

  get selectedQuirk() {
    return campaignState.selectedQuirk;
  },

  get currentRewards() {
    return campaignState.currentRewards;
  },

  // Start a new campaign run
  start(selectedQuirk = null) {
    campaignState = {
      active: true,
      deck: [...CAMPAIGN.STARTER_DECK],
      collection: [...CAMPAIGN.STARTER_DECK], // Start with same cards as deck
      victories: 0,
      boosterLevel: 0,
      selectedQuirk: selectedQuirk,
      currentRewards: null
    };
    this.save();
    console.log('Campaign started with deck:', campaignState.deck);
    console.log('Campaign started with collection:', campaignState.collection);
  },

  // Continue existing campaign
  continueExisting() {
    return this.load();
  },

  // Record a victory and increment booster level
  recordVictory(opponentDeck) {
    if (!campaignState.active) return false;
    
    campaignState.victories++;
    campaignState.boosterLevel = campaignState.victories; // boosterLevel == victories
    
    console.log(`Campaign victory #${campaignState.victories}, booster level: ${campaignState.boosterLevel}`);
    
    // Generate rewards based on opponent deck
    const rewards = this.generateRewards(opponentDeck);
    campaignState.currentRewards = rewards;
    
    this.save();
    return rewards;
  },

  // Generate reward cards from opponent deck
  generateRewards(opponentFullDeck) {
    const { boosterLevel } = campaignState;
    
    // Mandatory card: pick one unique card from opponent deck
    const availableCards = opponentFullDeck.filter(cardId => {
      // Try to pick cards not already in player deck for variety
      return !campaignState.deck.includes(cardId);
    });
    
    // If no unique cards available, allow duplicates
    const candidatePool = availableCards.length > 0 ? availableCards : opponentFullDeck;
    const mandatoryCard = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    
    const rewards = [
      { cardId: mandatoryCard, mandatory: true, accepted: true }
    ];

    // Calculate extra card probabilities using diminishing returns
    const saturation = 1 - Math.exp(-boosterLevel / CAMPAIGN.BOOSTER.K);
    let currentChance = saturation * CAMPAIGN.BOOSTER.P1_CAP;
    
    const chances = [currentChance];
    
    // Generate extra cards with diminishing returns
    while (currentChance > 0.05 && rewards.length < 5) { // Cap at 5 total cards
      if (Math.random() < currentChance) {
        // Pick another card from opponent deck
        const extraCard = candidatePool[Math.floor(Math.random() * candidatePool.length)];
        rewards.push({ cardId: extraCard, mandatory: false, accepted: true });
      } else {
        break; // Chain broken
      }
      currentChance *= CAMPAIGN.BOOSTER.DIMINISH;
      chances.push(currentChance);
    }

    // Log booster chances for debugging
    const chancePercentages = chances.map(c => (c * 100).toFixed(1) + '%').join(' -> ');
    console.log(`> Booster ${boosterLevel} chances: ${chancePercentages}`);

    return rewards;
  },

  // Accept selected rewards and add to deck
  acceptRewards(rewardSelections) {
    if (!campaignState.currentRewards) return false;

    // Add accepted cards to both deck and collection
    rewardSelections.forEach((accepted, index) => {
      if (accepted && campaignState.currentRewards[index]) {
        const cardId = campaignState.currentRewards[index].cardId;
        campaignState.deck.push(cardId);
        campaignState.collection.push(cardId);
      }
    });

    campaignState.currentRewards = null;
    this.save();
    return true;
  },

  // Remove a card from deck (for deck editing)
  removeCard(index) {
    if (!campaignState.active) return false;
    if (campaignState.deck.length <= CAMPAIGN.MIN_DECK_SIZE) return false;
    if (index < 0 || index >= campaignState.deck.length) return false;

    campaignState.deck.splice(index, 1);
    this.save();
    return true;
  },

  // Get unique cards in collection with counts
  getCollectionCounts() {
    const counts = {};
    campaignState.collection.forEach(cardId => {
      counts[cardId] = (counts[cardId] || 0) + 1;
    });
    return counts;
  },

  // Get current deck counts by card ID
  getDeckCounts() {
    const counts = {};
    campaignState.deck.forEach(cardId => {
      counts[cardId] = (counts[cardId] || 0) + 1;
    });
    return counts;
  },

  // Update deck from card counts (deck builder style)
  updateDeckFromCounts(newCounts) {
    if (!campaignState.active) return false;
    
    // Calculate total cards
    const totalCards = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
    
    // Enforce minimum deck size
    if (totalCards < CAMPAIGN.MIN_DECK_SIZE) {
      return false;
    }
    
    // Validate we don't exceed collection limits
    const collectionCounts = this.getCollectionCounts();
    for (const [cardId, requestedCount] of Object.entries(newCounts)) {
      if (requestedCount > (collectionCounts[cardId] || 0)) {
        console.warn(`Cannot add ${requestedCount} of ${cardId}, only have ${collectionCounts[cardId] || 0}`);
        return false;
      }
    }
    
    // Build new deck from counts
    const newDeck = [];
    for (const [cardId, count] of Object.entries(newCounts)) {
      for (let i = 0; i < count; i++) {
        newDeck.push(cardId);
      }
    }
    
    campaignState.deck = newDeck;
    this.save();
    return true;
  },

  // Rebuild collection from current deck (for fixing broken states)
  rebuildCollection() {
    if (!campaignState.active) return false;
    
    // Start with starter deck cards as base collection
    const newCollection = [...CAMPAIGN.STARTER_DECK];
    
    // Add any additional cards from deck that aren't in starter
    campaignState.deck.forEach(cardId => {
      // Only add if it's a reward card (not in starter deck)
      if (!CAMPAIGN.STARTER_DECK.includes(cardId)) {
        newCollection.push(cardId);
      }
    });
    
    campaignState.collection = newCollection;
    this.save();
    console.log('Collection rebuilt:', campaignState.collection);
    return true;
  },

  // Save campaign state to localStorage
  save() {
    try {
      localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(campaignState));
    } catch (e) {
      console.warn('Failed to save campaign state:', e);
    }
  },

  // Load campaign state from localStorage
  load() {
    try {
      const stored = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
      if (!stored) return false;
      
      const parsed = JSON.parse(stored);
      if (parsed.active) {
        campaignState = { ...campaignState, ...parsed };
        
        // Backward compatibility: if no collection exists, initialize it from deck
        if (!campaignState.collection) {
          campaignState.collection = [...campaignState.deck];
          console.log('Initialized collection from existing deck for backward compatibility');
          this.save(); // Save the updated state with collection
        }
        
        console.log('Campaign loaded:', campaignState);
        return true;
      }
    } catch (e) {
      console.warn('Failed to load campaign state:', e);
    }
    return false;
  },

  // Abandon current campaign run
  abandon() {
    campaignState = {
      active: false,
      deck: [],
      collection: [],
      victories: 0,
      boosterLevel: 0,
      selectedQuirk: null,
      currentRewards: null
    };
    try {
      localStorage.removeItem(CAMPAIGN_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear campaign state:', e);
    }
    console.log('Campaign abandoned');
  },

  // Get card name by ID
  getCardName(cardId) {
    const card = CARDS.find(c => c.id === cardId);
    return card ? card.name : cardId;
  }
};

// Expose globally for debugging and integration
window.Campaign = Campaign;