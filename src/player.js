import { shuffle } from './utils.js';

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
    status: { 
      burn: 0, 
      burnTurns: 0, 
      frozenNext: 0, 
      nextPlus: 0, 
      firstAttackUsed: false 
    },
    quirk: null,
    
    draw(n = 1) { 
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
        } 
      } 
    },
    
    canAfford(card) { 
      return this.energy >= card.cost;
    },
    
    spend(cost) { 
      this.energy = Math.max(0, this.energy - cost);
    },
    
    removeFromHand(idx) { 
      return this.hand.splice(idx, 1)[0];
    },
  };
}