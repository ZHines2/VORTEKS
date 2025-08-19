import { CARDS } from '../data/cards.js';
import { shuffle } from './utils.js';

// AI opponent logic and deck building
export function makePersonaDeck(kind, unlockedCards = null, campaignBooster = 0) {
  const counts = { 
    heart: 2, swords: 2, shield: 2, echo: 2, fire: 2, 
    snow: 2, bolt: 2, star: 2, dagger: 2, loop: 2 
  };
  
  // Campaign scaling: Make opponents more challenging as booster level increases
  if (campaignBooster > 0) {
    // High risk, high reward scaling
    const scalingFactor = Math.min(campaignBooster * 0.3, 3); // Cap scaling at booster 10
    
    // Boost aggressive cards for higher risk/reward
    if (campaignBooster >= 2) {
      counts.dagger += Math.floor(scalingFactor);
      counts.fire += Math.floor(scalingFactor * 0.5);
    }
    
    // Add powerful cards at higher levels
    if (campaignBooster >= 4) {
      counts.wallop = Math.max(1, Math.floor(scalingFactor * 0.5));
      counts.purge = Math.max(1, Math.floor(scalingFactor * 0.3));
    }
    
    // Elite opponents at very high levels
    if (campaignBooster >= 7) {
      counts.presto = Math.max(1, Math.floor(scalingFactor * 0.2));
      // Reduce some basic cards to make room for powerful ones
      counts.heart = Math.max(1, counts.heart - 1);
      counts.shield = Math.max(1, counts.shield - 1);
    }
    
    // Ultra-elite scaling at extreme levels
    if (campaignBooster >= 10) {
      // Add more copies of the most powerful cards
      counts.wallop += 1;
      counts.presto += 1;
      counts.dagger += 1;
    }
  }
  
  if (kind === 'Doctor') { 
    counts.heart += 2; 
    counts.shield += 1; 
    counts.dagger -= 1;
    counts.purge = 2;  // Doctor uses purge cards
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
  if (kind === 'Sicko') {
    // Sicko deck: focused on infect + attrition strategy
    counts.infect = 3;   // Multiple infect cards for stacking
    counts.fire += 1;    // Damage over time synergy  
    counts.bolt += 1;    // Pierce to get through shields
    counts.heart += 1;   // Some sustain for longer games
    counts.shield += 1;  // Defense for attrition style
    counts.swords -= 1;  // Less direct damage
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
  if (kind === 'robot' || kind === 'Automaton') {
    // Robot deck: 3 copies of Droid Protocol + bias toward low-cost tempo/control
    counts.droid = 3;
    counts.bolt += 2;    // More low-cost tempo
    counts.snow += 1;    // Control elements
    counts.star += 1;    // Setup power
    counts.shield += 1;  // Defense
    counts.dagger -= 1;  // Fewer expensive finishers
    counts.loop -= 1;    // Fewer expensive ramp
    counts.fire -= 1;    // Less attrition
  }
  if (kind === 'ghost' || kind === 'Ghost' || kind === 'Specter') {
    // Ghost deck: 2 copies of Reap + spectral theme
    counts.reap = 2;
    counts.snow += 2;    // Freezing presence
    counts.purge += 1;   // Spiritual cleansing
    counts.dagger += 1;  // Ethereal strikes
    counts.fire -= 1;    // Less fire (opposing element)
    counts.heart -= 1;   // Less healing (undead)
    counts.shield -= 1;  // Less physical defense
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

// Create campaign-enhanced opponent with scaled stats
export function createCampaignOpponent(baseOpponent, campaignBooster = 0) {
  if (campaignBooster === 0) return baseOpponent;
  
  // Scale HP and Energy for high risk/high reward
  const hpBonus = Math.floor(campaignBooster * 2); // +2 HP per booster level
  const energyBonus = Math.min(Math.floor(campaignBooster * 0.5), 3); // +0.5 energy per level, capped at +3
  
  return {
    ...baseOpponent,
    maxHP: baseOpponent.maxHP + hpBonus,
    hp: baseOpponent.hp + hpBonus,
    maxEnergy: baseOpponent.maxEnergy + energyBonus,
    energy: baseOpponent.energy + energyBonus
  };
}

export function createAIPlayer(game) {
  return {
    aiPlay(depth = 0) {
      if (game.over) return;
      
      // Prevent infinite recursion - limit AI to reasonable number of cards per turn
      if (depth >= 20) {
        console.warn('AI recursion limit reached, ending turn');
        game.endTurn();
        return;
      }
      
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
        return this.aiPlay(depth + 1); 
      }
      
      const healLow = ai.hp <= 8 && playable.find(x => x.c.id === 'heart'); 
      if (healLow) { 
        game.playCard(ai, healLow.i); 
        return this.aiPlay(depth + 1); 
      }
      
      const surgeEarly = ai.maxEnergy < 5 && playable.find(x => x.c.id === 'loop'); 
      if (surgeEarly) { 
        game.playCard(ai, surgeEarly.i); 
        return this.aiPlay(depth + 1); 
      }
      
      // Play curiosity or droid early to showcase the powers
      const setupCard = playable.find(x => x.c.id === 'curiosity' || x.c.id === 'droid');
      if (setupCard) {
        game.playCard(ai, setupCard.i);
        return this.aiPlay(depth + 1);
      }
      
      // Desperate Reap play: only when losing badly (opponent has more than double our HP)
      const reapCard = playable.find(x => x.c.id === 'reap');
      if (reapCard && game.you.hp > ai.hp * 2) {
        game.playCard(ai, reapCard.i);
        return this.aiPlay(depth + 1);
      }
      
      // prefer highest dmg attack first
      const attacks = playable
        .filter(x => x.c.type === 'attack')
        .sort((a, b) => game.simDamage(ai, game.you, b.c) - game.simDamage(ai, game.you, a.c));
      if (attacks[0]) { 
        game.playCard(ai, attacks[0].i); 
        return this.aiPlay(depth + 1); 
      }
      
      const prio = ['fire', 'snow', 'star', 'shield', 'echo'];
      for (const id of prio) { 
        const pick = playable.find(x => x.c.id === id); 
        if (pick) { 
          game.playCard(ai, pick.i); 
          return this.aiPlay(depth + 1); 
        } 
      }
      
      // Fallback: play first affordable card, but be extra careful about infinite loops
      if (playable.length > 0) {
        game.playCard(ai, playable[0].i); 
        return this.aiPlay(depth + 1);
      }
      
      // If we somehow get here with no playable cards, end turn
      game.endTurn();
    }
  };
}