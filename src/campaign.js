// campaign.js
// Campaign (Roguelike) Mode implementation for VORTEKS

import { CAMPAIGN } from './config.js';
import { CARDS } from '../data/cards.js';

const CAMPAIGN_STORAGE_KEY = 'vorteks-campaign';

// Campaign state object
let campaignState = {
  active: false,
  deck: [],
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
      victories: 0,
      boosterLevel: 0,
      selectedQuirk: selectedQuirk,
      currentRewards: null
    };
    this.save();
    console.log('Campaign started with deck:', campaignState.deck);
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

    // Add accepted cards to deck
    rewardSelections.forEach((accepted, index) => {
      if (accepted && campaignState.currentRewards[index]) {
        campaignState.deck.push(campaignState.currentRewards[index].cardId);
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