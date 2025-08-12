import { clamp, $, shuffle } from './utils.js';
import { createPlayer } from './player.js';
import { drawOppFace, setOpponentName } from './face-generator.js';
import { makePersonaDeck, createAIPlayer } from './ai.js';
import { checkAchievementUnlocks, checkPersonaDefeatUnlocks, recordBattleResult, getUnlockableCardsInfo, STARTER_CARDS } from './card-unlock.js';
import { CARDS } from '../data/cards.js';
import { 
  OVERHEAL_LIMIT_MULT, 
  AI_ALLOW_OVERHEAL, 
  SAFETY_MAX_ENERGY, 
  MIN_BURN_TICK,
  ACHIEVEMENTS 
} from './config.js';

// Global log function (will be set by main script)
let log = null;

export function setLogFunction(logFn) {
  log = logFn;
  // Only set window.log if it's not already set
  if (!window.log) {
    window.log = logFn;
  }
  // Ensure it's available to the Game object
  if (typeof Game !== 'undefined') {
    Game.log = logFn;
  }
}

// Helper functions for actor-aware logging
function logYou(text) {
  const logFn = log || window.log;
  if (logFn && typeof logFn === 'function') {
    logFn({ actor: 'you', text });
  }
}

function logOpp(text) {
  const logFn = log || window.log;
  if (logFn && typeof logFn === 'function') {
    logFn({ actor: 'opp', text });
  }
}

function logAction(actor, text) {
  const logFn = log || window.log;
  if (logFn && typeof logFn === 'function') {
    logFn({ actor, text });
  }
}

// Generic logging helper
function logMessage(text) {
  const logFn = log || window.log;
  if (logFn && typeof logFn === 'function') {
    logFn(text);
  }
}

// Game state and logic
export const Game = {
  you: null, 
  opp: null, 
  turn: 'you', 
  over: false, 
  streak: 0, 
  persona: null,
  ai: null,
  oppFeatures: null, // Store opponent face features for easter eggs
  turnTypes: new Set(), // Track card types played in current turn
  playerTurnDamage: 0, // Track cumulative damage dealt by player this turn
  playerTurnEnergySpent: 0, // Track energy spent by player this turn
  playerTurnCardsDrawn: 0, // Track cards drawn by player this turn
  isEchoing: false, // Flag to prevent recursive echo effects
  
  // Enhanced stats tracking
  stats: {
    maxEnergyDuringRun: 3,
    peakOverheal: 0,
    totalOverhealGained: 0,
    maxHandSizeTurn: 5,
    maxBurnAmount: 0,
    firstPerfectWin: false
  },
  
  setLogFunction(logFn) {
    setLogFunction(logFn);
  },
  
  init() {
    this.you = createPlayer(false);
    this.opp = createPlayer(true);
    this.ai = createAIPlayer(this);
    
    // Face first → persona → AI deck
    const faceInfo = drawOppFace();
    this.persona = faceInfo.persona;
    this.oppFeatures = faceInfo.features; // Store features for logging
    setOpponentName(this.persona, this.oppFeatures);
    this.opp.deck = makePersonaDeck(this.persona);
    
    // Log easter egg appearance
    if (this.oppFeatures.isEasterEgg) {
      logMessage(`✨ RARE FACE ENCOUNTERED! ${this.oppFeatures.easterEggType} ${this.persona} appears! ✨`);
      logMessage(`[${this.oppFeatures.rarity.toUpperCase()} RARITY] Special abilities may activate later...`);
    }
    
    // Player builds deck, then picks quirk, then start
    // This will be called from UI module
    if (window.openDeckBuilder) {
      window.openDeckBuilder((yourDeck) => {
        this.you.deck = yourDeck;
        this.you.draw(5); 
        this.opp.draw(5);
        this.turn = 'you'; 
        this.over = false;
        if (log || window.log) {
          const logFn = log || window.log;
          if (typeof logFn === 'function') logFn('New game. You start.');
        }
        this.pickQuirk(() => { 
          this.startTurn(this.you); 
          if (window.render) window.render(); 
        });
      });
    }
  },
  
  initQuick() {
    this.you = createPlayer(false);
    this.opp = createPlayer(true);
    this.ai = createAIPlayer(this);
    
    const faceInfo = drawOppFace();
    this.persona = faceInfo.persona; 
    this.oppFeatures = faceInfo.features; // Store features for logging
    setOpponentName(this.persona, this.oppFeatures);
    this.opp.deck = makePersonaDeck(this.persona);
    
    // Log easter egg appearance
    if (this.oppFeatures.isEasterEgg) {
      logMessage(`✨ RARE FACE ENCOUNTERED! ${this.oppFeatures.easterEggType} ${this.persona} appears! ✨`);
      logMessage(`[${this.oppFeatures.rarity.toUpperCase()} RARITY] Special abilities may activate later...`);
    }
    
    // Build random deck for quick start
    if (window.buildRandomDeck) {
      this.you.deck = window.buildRandomDeck(20, 4);
    }
    
    this.you.draw(5); 
    this.opp.draw(5);
    this.turn = 'you'; 
    this.over = false; 
    if (log || window.log) {
      const logFn = log || window.log;
      if (typeof logFn === 'function') logFn('Quick Start. You start.');
    }
    this.pickQuirk(() => { 
      this.startTurn(this.you); 
      if (window.render) window.render(); 
    });
  },
  
  pickQuirk(done) {
    const modal = $('#quirkModal');
    modal.hidden = false;
    // The quirk grid is now dynamically rendered from main.js
    // We'll set up a global selection handler
    window.onQuirkSelected = (quirkId) => {
      this.you.quirk = quirkId;
      if (quirkId === 'minty') { 
        this.you.maxEnergy = Math.max(this.you.maxEnergy + 1, 1); // Remove cap
        this.you.energy = this.applyEnergyGain(this.you, 1); 
      }
      modal.hidden = true;
      if (log || window.log) {
        const logFn = log || window.log;
        if (typeof logFn === 'function') logFn('Quirk: ' + quirkId.toUpperCase());
      }
      this.applyQuirkBattleStart(this.you);
      done();
    };
  },
  
  // Helper method for applying burn with stacking support
  applyBurn(target, newBurnAmount, newBurnTurns) {
    if (newBurnAmount <= 0 || newBurnTurns <= 0) return;

    // Implement burn stacking: add amounts, keep max turns
    const existingBurn = target.status.burn || 0;
    const existingTurns = target.status.burnTurns || 0;
    
    target.status.burn = Math.max(MIN_BURN_TICK, existingBurn + newBurnAmount);
    target.status.burnTurns = Math.max(existingTurns, newBurnTurns);
    
    // Track max burn amount stats
    if (target.isAI) { // Player is applying burn to opponent
      this.stats.maxBurnAmount = Math.max(this.stats.maxBurnAmount, target.status.burn);
    }
  },

  // Helper method for applying heal with overheal support
  applyHeal(player, amount) {
    if (amount <= 0) return player.hp;
    
    // Check if player should get overheal (player always, AI based on config)
    const allowOverheal = !player.isAI || AI_ALLOW_OVERHEAL;
    
    if (allowOverheal) {
      const overhealLimit = Math.floor(player.maxHP * OVERHEAL_LIMIT_MULT);
      const newHP = Math.min(player.hp + amount, overhealLimit);
      
      // Track overheal stats for player
      if (!player.isAI && newHP > player.maxHP) {
        const overhealAmount = newHP - player.maxHP;
        this.stats.totalOverhealGained += overhealAmount;
        this.stats.peakOverheal = Math.max(this.stats.peakOverheal, overhealAmount);
      }
      
      return newHP;
    } else {
      // Traditional healing capped at maxHP
      return Math.min(player.hp + amount, player.maxHP);
    }
  },

  // Helper method for applying energy with uncapping support
  applyEnergyGain(player, amount) {
    if (amount <= 0) return player.energy;
    
    // Allow energy to exceed maxEnergy, but track true value
    const newEnergy = player.energy + amount;
    
    // Track max energy for player stats
    if (!player.isAI) {
      this.stats.maxEnergyDuringRun = Math.max(this.stats.maxEnergyDuringRun, newEnergy);
    }
    
    // For display purposes, we may clamp at SAFETY_MAX_ENERGY in UI
    return newEnergy;
  },

  startTurn(p) {
    p.status.firstAttackUsed = false;
    if (p.status.frozenNext) { 
      p.energyPenaltyNext = 1; 
      p.status.frozenNext = 0; 
      $('#' + (p.isAI ? 'opp' : 'you') + 'Panel').classList.add('flash'); 
      setTimeout(() => $('#' + (p.isAI ? 'opp' : 'you') + 'Panel').classList.remove('flash'), 250); 
    }
    p.energy = p.maxEnergy - (p.energyPenaltyNext || 0);
    p.energyPenaltyNext = 0;
    
    // Handle Curiosity next-turn draw effect
    if (p.status.curiosityNextDraw) {
      const actorName = p === this.you ? '[YOU]' : '[CAT]';
      logMessage(`${actorName} Curiosity triggers (+1 draw).`);
      p.draw(1);
      p.status.curiosityNextDraw = false;
    }
    
    // Handle Droid Protocol next-turn random bonus
    if (p.status.droidProcNext) {
      const actorName = p === this.you ? '[YOU]' : '[ROBOT]';
      const bonuses = [
        () => { p.shield += 1; return '+1 shield'; },
        () => { p.hp = this.applyHeal(p, 1); return 'Heal 1'; },
        () => { p.draw(1); return 'Draw 1'; },
        () => { p.energy = this.applyEnergyGain(p, 1); return '+1 energy'; },
        () => { p.status.nextPlus = (p.status.nextPlus||0)+1; return '+1 next atk'; }
      ];
      const randomBonus = bonuses[Math.floor(Math.random() * bonuses.length)];
      const description = randomBonus();
      logMessage(`${actorName} Droid Protocol: ${description}`);
      p.status.droidProcNext = false;
    }
    
    // Apply quirk effects for player turns
    if (p === this.you && p.quirk) {
      this.applyQuirkTurnStart(p);
    }
    
    // Reset per-turn achievement tracking if player's turn
    if (p === this.you) {
      this.turnTypes = new Set();
      this.playerTurnDamage = 0;
      this.playerTurnEnergySpent = 0;
      this.playerTurnCardsDrawn = 0;
      
      // Track max hand size
      this.stats.maxHandSizeTurn = Math.max(this.stats.maxHandSizeTurn, p.hand.length);
    }
    
    // Log turn start and draw
    const isPlayer = (p === this.you);
    if (isPlayer) {
      logYou('draws 1');
    } else {
      logOpp('draws 1');
    }
    
    p.draw(1);
    if (window.render) window.render();
  },
  
  endTurn() {
    const me = this.turn === 'you' ? this.you : this.opp;
    
    // Log end turn
    if (me === this.you) {
      logYou('ends turn');
    } else {
      logOpp('ends turn');
    }
    
    // Emit turnEnd event for achievements if player's turn
    if (me === this.you) {
      checkAchievementUnlocks({
        event: 'turnEnd',
        turnTypes: this.turnTypes,
        youShield: this.you.shield,
        youUnspentEnergy: this.you.energy,
        energySpentThisTurn: this.playerTurnEnergySpent
      });
    }
    
    // Handle Curiosity power effect: bank unspent energy for next turn draw
    if (me.status.curiosityPower && me.energy > 0) {
      me.status.curiosityNextDraw = true;
      const actorName = me === this.you ? '[YOU]' : '[CAT]';
      logMessage(`${actorName} Curiosity stores potential.`);
    }
    
    if (me.status.burn && me.status.burnTurns > 0) { 
      // Track burn damage if it's happening to opponent and player dealt it
      const burnDamage = me.status.burn;
      if (me === this.opp) {
        checkAchievementUnlocks({
          event: 'burnDamage',
          source: 'you',
          amount: burnDamage
        });
      }
      this.hit(me, burnDamage, true, false); 
      me.status.burnTurns--; 
    }
    if (me.status.burnTurns === 0) me.status.burn = 0;
    this.turn = this.turn === 'you' ? 'opp' : 'you';
    const now = this.turn === 'you' ? this.you : this.opp;
    this.startTurn(now);
    if (this.turn === 'opp' && !this.over) { 
      setTimeout(() => this.ai.aiPlay(), 500);
    }
  },
  
  playCard(p, idx) { 
    if (this.over) return; 
    const card = p.hand[idx]; 
    if (!card) return; 
    if (!p.canAfford(card)) return;
    
    // Log card play
    const isPlayer = (p === this.you);
    const cardName = card.name || card.id;
    const costStr = card.cost > 0 ? ` (${card.cost}⚡)` : '';
    if (isPlayer) {
      logYou(`plays ${cardName}${costStr}`);
    } else {
      logOpp(`plays ${cardName}${costStr}`);
    }
    
    // Track card types and emit achievement events for player
    if (isPlayer) {
      this.turnTypes.add(card.type);
      
      // For reconsider, track the actual energy spent (all remaining)
      const energyToSpend = card.id === 'reconsider' ? p.energy : card.cost;
      this.playerTurnEnergySpent += energyToSpend;
      
      checkAchievementUnlocks({
        event: 'cardPlayed',
        cardId: card.id,
        cardType: card.type,
        youEnergyAfter: card.id === 'reconsider' ? 0 : (p.energy - card.cost)
      });
    }
    
    // spend cost first (returns actual amount spent for reconsider)
    const actualCost = p.spend(card.cost, card);
    p.lastPlayed = card;
    // remove from hand and send to discard BEFORE resolving effect
    p.removeFromHand(idx);
    p.discard.push(card);
    // apply via interpreter
    this.applyCard(card, p, (p === this.you ? this.opp : this.you), false);
    this.checkWin();
    if (window.render) window.render();
  },
  
  hit(target, dmg, pierce = false, simulate = false) {
    const atk = this.turn === 'you' ? this.you : this.opp;
    
    // Apply Focus bonus (+nextPlus) and consume it
    if (atk.status.nextPlus && atk.status.nextPlus > 0) {
      dmg += atk.status.nextPlus;
      if (!simulate) {
        atk.status.nextPlus = 0;
      }
    }
    
    let extraPierce = 0;
    if (!atk.isAI && atk.quirk === 'piercer' && !atk.status.firstAttackUsed) { 
      extraPierce = 1; 
    }
    
    let originalDmg = dmg;
    let blocked = 0;
    
    if (!pierce) {
      // Piercer allows 1 damage to bypass shield, but rest is blocked normally
      let pierceAmount = Math.min(extraPierce, dmg);
      let remainingDmg = dmg - pierceAmount;
      
      // Block remaining damage with shield
      const used = Math.min(target.shield, remainingDmg); 
      if (used > 0) { 
        target.shield -= used; 
        if (!simulate && window.bumpShield) window.bumpShield(target); 
        remainingDmg -= used; 
        blocked = used;
      }
      
      // Total damage is pierced amount + unblocked remainder
      dmg = pierceAmount + remainingDmg;
    }
    if (dmg > 0) { 
      target.hp = Math.max(0, target.hp - dmg); 
      if (!simulate && window.bumpHP) window.bumpHP(target); 
    }
    
    // Log damage and track for achievements
    if (!simulate && originalDmg > 0) {
      const attackerIsPlayer = (atk === this.you);
      const targetIsPlayer = (target === this.you);
      
      // Track player damage for achievements
      if (attackerIsPlayer && dmg > 0) {
        this.playerTurnDamage += dmg;
        checkAchievementUnlocks({
          event: 'damage',
          source: 'you',
          amount: dmg
        });
        
        // Track pierce damage separately
        if (pierce || extraPierce > 0) {
          checkAchievementUnlocks({
            event: 'pierceDamage',
            source: 'you',
            amount: dmg
          });
        }
      }
      
      // Track damage taken by player (for Guardian unlock)
      if (targetIsPlayer && dmg > 0) {
        checkAchievementUnlocks({
          event: 'damage',
          target: 'you',
          amount: dmg
        });
      }
      
      let msg = '';
      if (pierce && extraPierce > 0) {
        msg = `hits for ${originalDmg} (pierces ${extraPierce + originalDmg})`;
      } else if (pierce) {
        msg = `hits for ${originalDmg} (pierce)`;
      } else if (blocked > 0) {
        msg = `hits for ${dmg} (${blocked} blocked)`;
      } else {
        msg = `hits for ${dmg}`;
      }
      
      if (attackerIsPlayer) {
        logYou(msg);
      } else {
        logOpp(msg);
      }
    }
    
    // Check for win after any damage that could be lethal
    if (!simulate && dmg > 0) {
      this.checkWin();
    }
    
    if (!simulate && !atk.status.firstAttackUsed && (dmg > 0 || pierce || extraPierce > 0)) {
      atk.status.firstAttackUsed = true;
    }
    if (!simulate && window.bump) { 
      const panel = target.isAI ? $('#oppPanel') : $('#youPanel'); 
      window.bump(panel, 'hit'); 
    }
  },
  
  // Card interpreter (simulate=false mutates; true returns a diff)
  applyCard(card, me, them, simulate = false) {
    const state = { me, them };
    const effects = card.effects || {};
    const status = card.status || { target: {}, self: {} };
    
    // 1) scaling & additive modifiers
    let dmg = effects.damage || 0;
    if (card.scaling && card.scaling.addToDamageFromSelf && state.me.status.nextPlus) { 
      dmg += state.me.status.nextPlus; 
      if (!simulate) { 
        state.me.status.nextPlus = 0; 
      } 
    }
    
    // spicy burn
    let burnObj = status.target && status.target.burn ? { ...status.target.burn } : null;
    if (burnObj && card.scaling && card.scaling.addToBurnFromSelf && state.me.quirk === 'spicy') { 
      burnObj.amount += (card.scaling.addToBurnFromSelf.spicyQuirk || 0); 
    }
    
    // 2) primary numeric effects
    if (effects.heal && !simulate) { 
      const isPlayer = (state.me === this.you);
      if (isPlayer) {
        logYou(`heals ${effects.heal}`);
      } else {
        logOpp(`heals ${effects.heal}`);
      }
      state.me.hp = this.applyHeal(state.me, effects.heal); 
    }
    if (effects.shield && !simulate) { 
      const isPlayer = (state.me === this.you);
      if (isPlayer) {
        logYou(`gains ${effects.shield} shield`);
      } else {
        logOpp(`gains ${effects.shield} shield`);
      }
      state.me.shield += effects.shield; 
    }
    if (effects.pierce) { 
      this.hit(state.them, dmg, true, simulate); 
    } else if (dmg > 0) { 
      this.hit(state.them, dmg, false, simulate); 
    }
    if (effects.draw) { 
      if (!simulate) { 
        state.me.draw(effects.draw); 
      } 
    }
    if (effects.reconsider && !simulate) {
      // Reconsider effect: spend all remaining energy, reshuffle deck
      const isPlayer = (state.me === this.you);
      const energySpent = state.me.energy;
      if (isPlayer) {
        this.playerTurnEnergySpent += energySpent;
      }
      state.me.energy = 0; // Spend all remaining energy
      
      // Reshuffle: move discard into deck and shuffle
      state.me.deck.push(...state.me.discard);
      state.me.discard = [];
      shuffle(state.me.deck);
      
      if (isPlayer) {
        logYou(`spends ${energySpent}⚡ and reshuffles deck`);
      } else {
        logOpp(`spends ${energySpent}⚡ and reshuffles deck`);
      }
    }
    
    // 3) statuses
    if (burnObj && !simulate) { 
      const isPlayer = (state.me === this.you);
      if (isPlayer) {
        logYou(`applies Burn (${burnObj.amount})`);
      } else {
        logOpp(`applies Burn (${burnObj.amount})`);
      }
      this.applyBurn(state.them, burnObj.amount, burnObj.turns);
    }
    if (status.target && status.target.freezeEnergy && !simulate) { 
      const isPlayer = (state.me === this.you);
      if (isPlayer) {
        logYou(`freezes opponent`);
      } else {
        logOpp(`freezes opponent`);
      }
      state.them.status.frozenNext = (state.them.status.frozenNext || 0) + status.target.freezeEnergy; 
    }
    if (status.self) {
      if (status.self.nextPlus) { 
        state.me.status.nextPlus = (state.me.status.nextPlus || 0) + status.self.nextPlus; 
      }
      if (status.self.maxEnergyDelta) { 
        state.me.maxEnergy = Math.max(state.me.maxEnergy + status.self.maxEnergyDelta, 1); // Remove cap
      }
      if (status.self.energyNowDelta) { 
        state.me.energy = this.applyEnergyGain(state.me, status.self.energyNowDelta); 
      }
      if (status.self.curiosityPower && !simulate) { 
        state.me.status.curiosityPower = true; 
      }
      if (status.self.droidProcArm && !simulate) { 
        state.me.status.droidProcNext = true; 
      }
    }
    
    // 4) special: Echo
    if (card.id === 'echo') {
      const last = me.lastPlayed && me.lastPlayed.id !== 'echo' ? me.lastPlayed : null;
      if (last) {
        // Echo repeats last card without paying its cost
        // Add a flag to prevent recursive echoes and ensure clean state
        const wasEchoing = this.isEchoing;
        this.isEchoing = true;
        this.applyCard(last, me, them, simulate);
        this.isEchoing = wasEchoing;
      } else {
        if (!simulate) { 
          me.draw(1); 
        }
      }
    }
    
    if (simulate) { 
      return { me: state.me, them: state.them }; 
    }
  },
  
  simDamage(attacker, defender, card) {
    const a = JSON.parse(JSON.stringify(attacker));
    const d = JSON.parse(JSON.stringify(defender));
    const g = Object.create(Game); 
    g.you = a; 
    g.opp = d; 
    g.turn = (attacker === this.you ? 'you' : 'opp');
    const before = d.hp; 
    g.applyCard(card, a, d, true); 
    return Math.max(0, before - d.hp);
  },
  
  applyQuirkTurnStart(p) {
    switch (p.quirk) {
      case 'guardian':
        p.shield += 1;
        logYou('Guardian: +1 shield');
        break;
      case 'scholar':
        if (Math.random() < 0.25) {
          p.draw(1);
          logYou('Scholar: drew +1 card (25% chance)');
        }
        break;
      // MY FIRST QUIRK and other quirks don't have turn start effects
    }
  },
  
  applyQuirkBattleStart(p) {
    switch (p.quirk) {
      case 'myfirst':
        p.draw(1);
        logYou('MY FIRST QUIRK: drew +1 opening hand card');
        break;
      case 'hearty':
        const hpGain = Math.min(5, p.maxHP - p.hp);
        p.hp += hpGain;
        logYou(`Hearty: gained ${hpGain} HP`);
        break;
      // Other quirks don't have battle start effects
    }
  },
  
  checkWin() {
    if (this.you.hp <= 0 || this.opp.hp <= 0) {
      this.over = true; 
      const youWin = this.opp.hp <= 0 && this.you.hp > 0;
      log(youWin ? 'You win!' : 'AI wins!');
      if (youWin) { 
        this.streak++; 
        
        // Track perfect win (win at full HP)
        if (this.you.hp === this.you.maxHP && !this.stats.firstPerfectWin) {
          this.stats.firstPerfectWin = true;
        }
      } else { 
        this.streak = 0; 
      }
      
      // Record battle results and emit achievement events
      recordBattleResult(youWin ? 'win' : 'loss');
      checkAchievementUnlocks({
        event: 'battleEnd',
        result: youWin ? 'win' : 'loss',
        streak: this.streak,
        youHP: this.you.hp
      });
      if (youWin) {
        checkPersonaDefeatUnlocks(this.persona, this.oppFeatures);
        this.showVictoryModal();
      }
    }
  },

  // Show victory modal with action buttons
  showVictoryModal() {
    const modal = $('#victoryModal');
    modal.hidden = false;
  },

  // Next battle: new opponent, reset stats, preserve deck and quirk
  nextBattle() {
    const modal = $('#victoryModal');
    modal.hidden = true;
    
    // Reset player stats
    this.you.hp = this.you.maxHP;
    this.you.shield = 0;
    this.you.energy = this.you.maxEnergy;
    this.you.status = { nextPlus: 0, firstAttackUsed: false };
    
    // Shuffle deck back together
    this.you.deck = shuffle([...this.you.hand, ...this.you.discard]);
    this.you.hand = [];
    this.you.discard = [];
    this.you.draw(5);
    
    // Apply battle start quirk effects (after deck is properly reshuffled)
    this.applyQuirkBattleStart(this.you);
    
    // Generate new opponent
    this.generateNewOpponent();
    
    // Reset game state
    this.over = false;
    this.turn = 'you';
    this.turnTypes = new Set();
    this.playerTurnDamage = 0;
    
    logAction('system', 'Next battle begins.');
    if (window.render) window.render();
  },

  // Generate new opponent with different face and deck
  generateNewOpponent() {
    // Generate new face and persona
    const faceInfo = drawOppFace();
    this.persona = faceInfo.persona;
    this.oppFeatures = faceInfo.features;
    setOpponentName(this.persona, this.oppFeatures);
    
    // Reset opponent stats  
    this.opp.hp = this.opp.maxHP;
    this.opp.shield = 0;
    this.opp.energy = this.opp.maxEnergy;
    this.opp.status = { nextPlus: 0, firstAttackUsed: false };
    
    // Create new AI deck based on current opponent persona
    this.opp.deck = makePersonaDeck(this.persona);
    this.opp.hand = [];
    this.opp.discard = [];
    this.opp.draw(5);
    
    // Log the new opponent
    let logMessage = 'New opponent: ' + this.persona + ' appears!';
    if (this.oppFeatures.isEasterEgg) {
      logMessage = `✨ RARE OPPONENT! ${this.oppFeatures.easterEggType} ${this.persona} appears! ✨ [${this.oppFeatures.rarity.toUpperCase()}]`;
    }
    logMessage(logMessage);
  },

  // Clear log function for restart
  clearLog() {
    const logElement = $('#log');
    if (logElement) {
      logElement.innerHTML = '';
    }
  },

  // Open unlocks modal and populate with card info
  openUnlocks() {
    const modal = $('#unlocksModal');
    const grid = $('#unlocksGrid');
    
    // Clear existing content
    grid.innerHTML = '';
    
    // Create card lookup map
    const cardMap = {};
    CARDS.forEach(card => {
      cardMap[card.id] = card;
    });
    
    // Add starter cards (always unlocked)
    STARTER_CARDS.forEach(id => {
      const card = cardMap[id];
      if (card) {
        const cardEl = document.createElement('div');
        cardEl.className = 'qcard';
        cardEl.style.opacity = '1';
        cardEl.innerHTML = `
          <div style="font-size:20px">${card.sym}</div>
          <div><strong>${card.name}</strong></div>
          <div style="font-size:12px; color:var(--good)">STARTER</div>
        `;
        grid.appendChild(cardEl);
      }
    });
    
    // Add unlockable cards
    const unlockableCards = getUnlockableCardsInfo();
    unlockableCards.forEach(info => {
      const card = cardMap[info.id];
      if (card) {
        const cardEl = document.createElement('div');
        cardEl.className = 'qcard';
        cardEl.style.opacity = info.unlocked ? '1' : '0.4';
        
        let statusText = info.unlocked ? 
          '<div style="font-size:12px; color:var(--good)">UNLOCKED</div>' :
          '<div style="font-size:12px; color:var(--bad)">LOCKED</div>';
        
        cardEl.innerHTML = `
          <div style="font-size:20px">${card.sym}</div>
          <div><strong>${card.name}</strong></div>
          ${statusText}
          <div style="font-size:10px; margin-top:4px">${info.description}</div>
          ${info.progress ? `<div style="font-size:10px; color:var(--accent)">${info.progress}</div>` : ''}
        `;
        
        if (!info.unlocked) {
          cardEl.style.position = 'relative';
          cardEl.innerHTML += '<div style="position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; font-size:12px; color:white; font-weight:bold">LOCKED</div>';
        }
        
        grid.appendChild(cardEl);
      }
    });
    
    modal.hidden = false;
  },

  // Restart to start screen
  resetGameToStart() {
    this.clearLog();
    this.streak = 0;
    this.over = false;
    
    // Hide victory modal and show start modal
    $('#victoryModal').hidden = true;
    $('#startModal').hidden = false;
    
    logAction('system', 'Game restarted.');
  }
};