import { CARDS } from '../data/cards.js';
import { shuffle } from './utils.js';

// AI opponent logic and deck building
export function makePersonaDeck(kind) {
  const counts = { 
    heart: 2, swords: 2, shield: 2, echo: 2, fire: 2, 
    snow: 2, bolt: 2, star: 2, dagger: 2, loop: 2 
  };
  
  if (kind === 'Doctor') { 
    counts.heart += 2; 
    counts.shield += 1; 
    counts.dagger -= 1; 
  }
  if (kind === 'Bruiser') { 
    counts.swords += 2; 
    counts.dagger += 1; 
    counts.heart -= 1; 
  }
  if (kind === 'Trickster') { 
    counts.echo += 2; 
    counts.snow += 1; 
    counts.swords -= 1; 
  }
  if (kind === 'cat') {
    // Cat deck: 3 copies of Curiosity + balanced mix of low-cost attacks/skills
    counts.curiosity = 3;
    counts.swords += 1;  // More basic attacks
    counts.bolt += 1;    // Low-cost draw attack
    counts.heart += 1;   // Some sustain
    counts.shield += 1;  // Some defense
    counts.dagger -= 1;  // Fewer expensive cards
    counts.loop -= 1;    // Fewer expensive cards
  }
  
  const deck = []; 
  for (const id in counts) { 
    if (counts[id] > 0) {  // Only add cards with positive counts
      for (let i = 0; i < counts[id]; i++) { 
        const card = CARDS.find(c => c.id === id);
        if (card) {  // Only add if card exists
          deck.push(card); 
        }
      } 
    }
  }
  return shuffle(deck);
}

export function createAIPlayer(game) {
  return {
    aiPlay() {
      if (game.over) return;
      const ai = game.opp; 
      const playable = ai.hand.map((c, i) => ({ c, i })).filter(x => ai.canAfford(x.c));
      if (!playable.length) { 
        game.endTurn(); 
        return;
      }
      
      // lethal check using interpreter
      const lethal = playable.find(x => game.simDamage(ai, game.you, x.c) >= game.you.hp);
      if (lethal) { 
        game.playCard(ai, lethal.i); 
        return this.aiPlay(); 
      }
      
      const healLow = ai.hp <= 8 && playable.find(x => x.c.id === 'heart'); 
      if (healLow) { 
        game.playCard(ai, healLow.i); 
        return this.aiPlay(); 
      }
      
      const surgeEarly = ai.maxEnergy < 5 && playable.find(x => x.c.id === 'loop'); 
      if (surgeEarly) { 
        game.playCard(ai, surgeEarly.i); 
        return this.aiPlay(); 
      }
      
      // prefer highest dmg attack first
      const attacks = playable
        .filter(x => x.c.type === 'attack')
        .sort((a, b) => game.simDamage(ai, game.you, b.c) - game.simDamage(ai, game.you, a.c));
      if (attacks[0]) { 
        game.playCard(ai, attacks[0].i); 
        return this.aiPlay(); 
      }
      
      const prio = ['fire', 'snow', 'star', 'shield', 'echo'];
      for (const id of prio) { 
        const pick = playable.find(x => x.c.id === id); 
        if (pick) { 
          game.playCard(ai, pick.i); 
          return this.aiPlay(); 
        } 
      }
      
      game.playCard(ai, playable[0].i); 
      return this.aiPlay();
    }
  };
}