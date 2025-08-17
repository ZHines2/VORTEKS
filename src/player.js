import { shuffle } from './utils.js';
import { checkAchievementUnlocks } from './card-unlock.js';

// Player creation and management
export function createPlayer(isAI = false) {
  return {
    isAI,
    hp: 20, 
    maxHP: 20,
    shield: 0,
    deck: [], 
    hand: [], 
    discard: [],
    energy: 0, 
    maxEnergy: 3,
    lastPlayed: null,
    echoNext: false, // Flag to indicate next card should be echoed
    status: { 
      burn: 0, 
      burnTurns: 0, 
      frozenNext: 0, 
      nextPlus: 0, 
      firstAttackUsed: false,
      impervious: false,
      imperviousNext: false
    },
    quirk: null,
    
    draw(n = 1) { 
      let actualDrawn = 0;
      while (n-- > 0) { 
        if (!this.deck.length) { 
          this.deck = shuffle(this.discard.splice(0)); 
          if (this.deck.length) {
            // Need to access log function - will be provided by game controller
            if (window.log) {
              window.log((this.isAI ? 'AI' : 'You') + ' reshuffle.');
            }
          }
        } 
        if (this.deck.length) { 
          this.hand.push(this.deck.pop()); 
          actualDrawn++;
        } 
      }
      
      // Track card draws for player (for Scholar unlock)
      if (!this.isAI && actualDrawn > 0 && window.Game) {
        window.Game.playerTurnCardsDrawn += actualDrawn;
        checkAchievementUnlocks({
          event: 'cardDrawn',
          source: 'you',
          amount: actualDrawn
        });
      }
    },
    
    canAfford(card) { 
      // Reconsider card can always be played (costs "ALL" energy)
      if (card.id === 'reconsider') {
        return true;
      }
      // Check both energy cost and life cost
      const hasEnergyForCard = this.energy >= card.cost;
      const hasLifeForCard = !card.effects?.lifeCost || this.hp > card.effects.lifeCost; // Must have more life than cost (can't suicide)
      return hasEnergyForCard && hasLifeForCard;
    },
    
    spend(cost, card) { 
      // For reconsider card, spend all remaining energy
      if (card && card.id === 'reconsider') {
        const spent = this.energy;
        this.energy = 0;
        return spent;
      }
      const spent = Math.min(cost, this.energy);
      this.energy = Math.max(0, this.energy - cost);
      return spent;
    },
    
    removeFromHand(idx) { 
      return this.hand.splice(idx, 1)[0];
    },
  };
}