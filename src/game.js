import { clamp, $, shuffle } from './utils.js';
import { createPlayer } from './player.js';
import { drawOppFace, setOpponentName } from './face-generator.js';
import { makePersonaDeck, createAIPlayer } from './ai.js';
import { checkAchievementUnlocks, checkPersonaDefeatUnlocks, recordBattleResult, getUnlockableCardsInfo, STARTER_CARDS } from './card-unlock.js';
import { recordBattle, recordCardPlayed, recordCombat, recordTurn, recordQuirk, recordOpponent } from './telemetry.js';
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
          // Ensure UI shows streak (not booster) for regular play mode
          if (window.updateCampaignUI) window.updateCampaignUI();
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
      // Ensure UI shows streak (not booster) for regular play mode
      if (window.updateCampaignUI) window.updateCampaignUI();
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
      
      // Record quirk usage for telemetry
      recordQuirk(quirkId);
      
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
    
    const oldHP = player.hp;
    
    // Check if player should get overheal (player always, AI based on config)
    const allowOverheal = !player.isAI || AI_ALLOW_OVERHEAL;
    
    let newHP;
    if (allowOverheal) {
      const overhealLimit = Math.floor(player.maxHP * OVERHEAL_LIMIT_MULT);
      newHP = Math.min(player.hp + amount, overhealLimit);
      
      // Track overheal stats for player
      if (!player.isAI && newHP > player.maxHP) {
        const overhealAmount = newHP - player.maxHP;
        this.stats.totalOverhealGained += overhealAmount;
        this.stats.peakOverheal = Math.max(this.stats.peakOverheal, overhealAmount);
      }
    } else {
      // Traditional healing capped at maxHP
      newHP = Math.min(player.hp + amount, player.maxHP);
    }
    
    // Track healing events for achievement unlocks (only for player)
    if (!player.isAI && newHP > oldHP) {
      checkAchievementUnlocks({
        event: 'heal',
        amount: newHP - oldHP,
        newHP: newHP,
        source: 'healing'
      });
    }
    
    return newHP;
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
    
    // Reset Dream Expansion turn tracking
    p.status.lastTurnShieldGained = 0;
    
    if (p.status.frozenNext) { 
      p.energyPenaltyNext = 1; 
      p.status.frozenNext = 0; 
      $('#' + (p.isAI ? 'opp' : 'you') + 'Panel').classList.add('flash'); 
      setTimeout(() => $('#' + (p.isAI ? 'opp' : 'you') + 'Panel').classList.remove('flash'), 250); 
    }
    p.energy = p.maxEnergy - (p.energyPenaltyNext || 0);
    p.energyPenaltyNext = 0;
    
    // Trigger turnStart achievement checks for player
    if (p === this.you) {
      checkAchievementUnlocks({
        event: 'turnStart',
        youEnergy: p.energy
      });
    }
    
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
    
    // Handle Hope status: heal random amount (1-5) each turn for 3 turns, stackable
    if (p.status.hopeAmount && p.status.hopeTurns > 0) {
      const hopeHeal = Math.floor(Math.random() * 5) + 1; // 1-5 random healing per stack
      const totalHeal = hopeHeal * p.status.hopeAmount; // multiply by stacks
      p.hp = this.applyHeal(p, totalHeal);
      p.status.hopeTurns--;
      
      const actorName = p === this.you ? '[YOU]' : '[OPPONENT]';
      logMessage(`${actorName} Hope heals for ${totalHeal} HP (${hopeHeal} × ${p.status.hopeAmount} stacks).`);
      
      // Clear hope when turns are done
      if (p.status.hopeTurns <= 0) {
        p.status.hopeAmount = 0;
        p.status.hopeTurns = 0;
        logMessage(`${actorName} Hope effect ends.`);
      }
    }
    
    // Handle Impervious status transition
    if (p.status && p.status.imperviousNext) {
      // Activate immunity for this turn
      p.status.impervious = true;
      p.status.imperviousNext = false;
      const actorName = p === this.you ? '[YOU]' : '[OPPONENT]';
      logMessage(`${actorName} is now Impervious - immune to all damage this turn.`);
    } else if (p.status && p.status.impervious) {
      // Clear immunity at start of next turn
      p.status.impervious = false;
      const actorName = p === this.you ? '[YOU]' : '[OPPONENT]';
      logMessage(`${actorName} Impervious effect ends.`);
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
    
    // Reset last played card for this turn (for Echo functionality)
    p.lastPlayedThisTurn = null;
    
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
    
    // Clear overload flag when turn ends
    me.echoNext = false;
    
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
          target: 'opponent',
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
    const costStr = card.cost > 0 ? ` (${card.cost}🔆)` : '';
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
      
      // Record card usage for telemetry
      recordCardPlayed(card.id, card.type, energyToSpend);
      recordCombat({
        energySpent: energyToSpend
      });
      
      checkAchievementUnlocks({
        event: 'cardPlayed',
        cardId: card.id,
        cardType: card.type,
        card: card, // Add full card object for flavor unlocks
        youEnergyAfter: card.id === 'reconsider' ? 0 : (p.energy - card.cost)
      });
    }
    
    // spend cost first (returns actual amount spent for reconsider)
    const actualCost = p.spend(card.cost, card);
    p.lastPlayed = card;
    
    // Track card for Dream Expansion mechanics
    p.status.lastCardPlayed = card.id;
    p.status.lastCardType = card.type;
    
    // Track last played card this turn for Echo functionality - but don't track Echo itself
    if (card.id !== 'echo') {
      // Store a clean copy without stolen markers to prevent Echo issues
      p.lastPlayedThisTurn = {
        ...card,
        stolenFrom: undefined,
        originalOwner: undefined
      };
    }
    // remove from hand but don't discard yet - wait until after effects resolve
    const playedCard = p.removeFromHand(idx);
    // apply via interpreter
    this.applyCard(card, p, (p === this.you ? this.opp : this.you), false);
    
    // Check if this card should be echoed by Overload (and it's not Overload itself to prevent infinite loops)
    if (p.echoNext && card.id !== 'overload' && !this.isEchoing) {
      // Clear the echo flag first to prevent infinite loops
      p.echoNext = false;
      // Set echoing flag and repeat the card without cost
      const wasEchoing = this.isEchoing;
      this.isEchoing = true;
      if (isPlayer) {
        logYou(`Overload triggers - repeating ${cardName}`);
      } else {
        logOpp(`Overload triggers - repeating ${cardName}`);
      }
      this.applyCard(card, p, (p === this.you ? this.opp : this.you), false);
      this.isEchoing = wasEchoing;
    }
    
    // now discard the card AFTER all effects are resolved (prevents infinite loops)
    // Check if this card was stolen via Presto and return to original owner
    if (playedCard.stolenFrom && playedCard.originalOwner && playedCard.originalOwner.discard) {
      try {
        // Return stolen card to original owner's discard pile
        playedCard.originalOwner.discard.push(playedCard);
        // Clean up the stolen markers
        delete playedCard.stolenFrom;
        delete playedCard.originalOwner;
        
        const isPlayer = (p === this.you);
        if (isPlayer) {
          logYou(`returns ${playedCard.name || 'a card'} to opponent's discard`);
        } else {
          logOpp(`returns ${playedCard.name || 'a card'} to your discard`);
        }
      } catch (error) {
        console.error('Error returning stolen card:', error);
        // Fallback: put in current player's discard
        p.discard.push(playedCard);
      }
    } else {
      // Normal discard to current player's discard pile
      p.discard.push(playedCard);
    }
    this.checkWin();
    if (window.render) window.render();
  },
  
  hit(target, dmg, pierce = false, simulate = false) {
    const atk = this.turn === 'you' ? this.you : this.opp;
    
    // Check for immunity - if target is impervious, no damage is dealt
    if (target.status && target.status.impervious) {
      if (!simulate) {
        const targetName = target === this.you ? '[YOU]' : '[OPPONENT]';
        logMessage(`${targetName} is Impervious - damage blocked by immunity!`);
        // Show immunity effect
        if (window.bumpShield) window.bumpShield(target);
      }
      return; // No damage dealt, shields maintained
    }
    
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
    
    // Reactive Armor effect: Gain 2 Shield when taking pierce damage
    if (pierce && target.status && target.status.reactiveArmor && !simulate) {
      target.shield += 2;
      const targetName = target === this.you ? 'You' : 'Opponent';
      if (target === this.you) {
        logYou('reactive armor activates (+2 Shield vs pierce)');
      } else {
        logOpp('reactive armor activates (+2 Shield vs pierce)');
      }
      if (window.bumpShield) window.bumpShield(target);
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
        
        // Record combat data for telemetry
        recordCombat({
          damageDealt: dmg,
          pierceDamage: pierce || extraPierce > 0 ? dmg : 0
        });
        
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
        // Record damage taken for telemetry
        recordCombat({
          damageTaken: dmg
        });
        
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
    // Handle life cost first (before other effects)
    if (effects.lifeCost && !simulate) {
      const isPlayer = (state.me === this.you);
      if (isPlayer) {
        logYou(`pays ${effects.lifeCost} life`);
      } else {
        logOpp(`pays ${effects.lifeCost} life`);
      }
      state.me.hp = Math.max(0, state.me.hp - effects.lifeCost);
    }
    if (effects.heal && !simulate) { 
      const isPlayer = (state.me === this.you);
      if (isPlayer) {
        logYou(`heals ${effects.heal}`);
        // Record healing for telemetry
        recordCombat({
          healingReceived: effects.heal
        });
      } else {
        logOpp(`heals ${effects.heal}`);
      }
      state.me.hp = this.applyHeal(state.me, effects.heal); 
      // FX: Healing effect
      if (window.fxHeal) window.fxHeal(state.me);
    }
    if (effects.shield && !simulate) { 
      const isPlayer = (state.me === this.you);
      if (isPlayer) {
        logYou(`gains ${effects.shield} shield`);
        // Record shield gain for telemetry
        recordCombat({
          shieldGained: effects.shield
        });
      } else {
        logOpp(`gains ${effects.shield} shield`);
      }
      state.me.shield += effects.shield;
      
      // Track shield gained this turn for Dream Expansion mechanics
      if (!state.me.status.lastTurnShieldGained) {
        state.me.status.lastTurnShieldGained = 0;
      }
      state.me.status.lastTurnShieldGained += effects.shield;
      
      // FX: Shield effect
      if (window.fxGuard) window.fxGuard(state.me);
    }
    if (effects.pierce) { 
      this.hit(state.them, dmg, true, simulate);
      // FX: Pierce effects for specific cards
      if (!simulate) {
        if (card.id === 'bolt' && window.fxZap) window.fxZap(state.them);
        if (card.id === 'dagger' && window.fxSlash) window.fxSlash(state.them);
      }
    } else if (dmg > 0) { 
      this.hit(state.them, dmg, false, simulate); 
      // FX: Strike effect for regular damage
      if (!simulate && card.id === 'swords' && window.fxStrike) window.fxStrike(state.them);
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
        logYou(`spends ${energySpent}🔆 and reshuffles deck`);
      } else {
        logOpp(`spends ${energySpent}🔆 and reshuffles deck`);
      }
      
      // FX: Reconsider effect
      if (window.fxReconsider) window.fxReconsider();
    }
    if (effects.presto && !simulate) {
      // Presto effect: steal a random card from opponent's discard pile
      const isPlayer = (state.me === this.you);
      if (state.them.discard.length > 0) {
        // Pick a random card from opponent's discard pile
        const randomIndex = Math.floor(Math.random() * state.them.discard.length);
        const stolenCards = state.them.discard.splice(randomIndex, 1);
        
        // Defensive check: ensure we actually got a card
        if (stolenCards.length > 0 && stolenCards[0]) {
          const stolenCard = stolenCards[0];
          
          // Clean any existing stolen markers to prevent conflicts
          delete stolenCard.stolenFrom;
          delete stolenCard.originalOwner;
          
          // Mark the card as stolen for proper return mechanics
          stolenCard.stolenFrom = state.them.isAI ? 'opp' : 'you';
          stolenCard.originalOwner = state.them;
          
          // Add to player's hand
          state.me.hand.push(stolenCard);
          
          if (isPlayer) {
            logYou(`steals ${stolenCard.name || 'a card'} from opponent's discard`);
          } else {
            logOpp(`steals ${stolenCard.name || 'a card'} from your discard`);
          }
        } else {
          // Fallback if card extraction failed
          if (isPlayer) {
            logYou('finds nothing to steal from opponent\'s discard');
          } else {
            logOpp('finds nothing to steal from your discard');
          }
        }
      } else {
        // No cards in opponent's discard pile
        if (isPlayer) {
          logYou('finds nothing to steal from opponent\'s discard');
        } else {
          logOpp('finds nothing to steal from your discard');
        }
      }
    }
    if (effects.ferriglobin && !simulate) {
      // Ferriglobin effect: convert all shield to health
      const isPlayer = (state.me === this.you);
      const shieldAmount = state.me.shield;
      
      if (shieldAmount > 0) {
        // Remove all shield
        state.me.shield = 0;
        
        // Convert to healing
        state.me.hp = this.applyHeal(state.me, shieldAmount);
        
        if (isPlayer) {
          logYou(`converts ${shieldAmount} shield to ${shieldAmount} health`);
          // Record healing for telemetry
          recordCombat({
            healingReceived: shieldAmount
          });
        } else {
          logOpp(`converts ${shieldAmount} shield to ${shieldAmount} health`);
        }
        
        // FX: Healing effect
        if (window.fxHeal) window.fxHeal(state.me);
      } else {
        // No shield to convert
        if (isPlayer) {
          logYou('has no shield to convert');
        } else {
          logOpp('has no shield to convert');
        }
      }
    }
    if (effects.reap && !simulate) {
      // Reap effect: deal damage equal to half current health to opponent, take same damage yourself
      const isPlayer = (state.me === this.you);
      const reapDamage = Math.floor(state.me.hp / 2);
      
      if (reapDamage > 0) {
        // Deal damage to opponent using the correct hit function (reap is not pierce damage)
        this.hit(state.them, reapDamage, false, false);
        
        // Deal damage to self (ignores shields and armor since it's self-inflicted)
        state.me.hp = Math.max(1, state.me.hp - reapDamage); // Prevent suicide, leave at 1 HP minimum
        
        if (isPlayer) {
          logYou(`reaps souls for ${reapDamage} damage to both players`);
          // Record both damage dealt and received for telemetry
          recordCombat({
            damageDealt: reapDamage, // Use reapDamage instead of actualDamageToOpp since hit doesn't return damage
            damageReceived: reapDamage
          });
        } else {
          logOpp(`reaps souls for ${reapDamage} damage to both players`);
        }
        
        // FX: Dark magic effect
        if (window.fxReap) window.fxReap(state.me);
      } else {
        // Not enough HP to reap (at 1 HP)
        if (isPlayer) {
          logYou('cannot reap with so little life force');
        } else {
          logOpp('cannot reap with so little life force');
        }
      }
    }
    
    // Dream Expansion Card Effects
    if (effects.pressure && !simulate) {
      // Pressure: Deal 1 damage +1 for each Shield opponent gained last turn (max +5)
      const isPlayer = (state.me === this.you);
      const bonusDamage = Math.min(state.them.status.lastTurnShieldGained || 0, 5);
      const totalDamage = 1 + bonusDamage;
      
      if (totalDamage > 1) {
        if (isPlayer) {
          logYou(`applies pressure for ${totalDamage} damage (${bonusDamage} bonus from opponent's shields)`);
        } else {
          logOpp(`applies pressure for ${totalDamage} damage (${bonusDamage} bonus from your shields)`);
        }
      } else {
        if (isPlayer) {
          logYou(`applies pressure for ${totalDamage} damage`);
        } else {
          logOpp(`applies pressure for ${totalDamage} damage`);
        }
      }
      
      this.hit(state.them, totalDamage, false, false);
    }
    
    if (effects.equilibrium && !simulate) {
      // Equilibrium: If opponent has 2+ more total resources, gain the difference in energy
      const isPlayer = (state.me === this.you);
      const myResources = state.me.energy + state.me.hand.length;
      const theirResources = state.them.energy + state.them.hand.length;
      const resourceDiff = theirResources - myResources;
      
      if (resourceDiff >= 2) {
        const energyGain = Math.min(resourceDiff, 3); // Cap at 3 energy gain
        state.me.energy = Math.min(state.me.energy + energyGain, state.me.maxEnergy);
        
        if (isPlayer) {
          logYou(`restores equilibrium, gaining ${energyGain} energy`);
        } else {
          logOpp(`restores equilibrium, gaining ${energyGain} energy`);
        }
      } else {
        if (isPlayer) {
          logYou(`seeks equilibrium but finds balance`);
        } else {
          logOpp(`seeks equilibrium but finds balance`);
        }
      }
    }
    
    if (effects.sabotage && !simulate) {
      // Sabotage: AI chooses between opponent discards 1 card OR loses 1 energy next turn
      const isPlayer = (state.me === this.you);
      const hasCards = state.them.hand.length > 0;
      const hasEnergy = state.them.energy > 0;
      
      // AI decision logic: prefer energy drain if opponent has high energy, otherwise discard
      const chooseEnergyDrain = hasEnergy && (state.them.energy >= 2 || !hasCards);
      
      if (chooseEnergyDrain && hasEnergy) {
        state.them.energy = Math.max(0, state.them.energy - 1);
        if (isPlayer) {
          logYou(`sabotages opponent's energy reserves`);
        } else {
          logOpp(`sabotages your energy reserves`);
        }
      } else if (hasCards) {
        const discardedCard = state.them.hand.splice(Math.floor(Math.random() * state.them.hand.length), 1)[0];
        state.them.discard.push(discardedCard);
        if (isPlayer) {
          logYou(`sabotages opponent's hand`);
        } else {
          logOpp(`sabotages your hand`);
        }
      } else {
        if (isPlayer) {
          logYou(`attempts sabotage but finds no target`);
        } else {
          logOpp(`attempts sabotage but finds no target`);
        }
      }
    }
    
    if (effects.adaptation && !simulate) {
      // Adaptation: Gain bonus based on opponent's last card type
      const isPlayer = (state.me === this.you);
      const oppLastCardType = state.them.status.lastCardType;
      
      if (oppLastCardType) {
        if (oppLastCardType === 'defense' || oppLastCardType === 'skill') {
          // +2 damage vs Shield/defensive cards
          dmg += 2;
          if (isPlayer) {
            logYou(`adapts to opponent's defenses (+2 damage)`);
          } else {
            logOpp(`adapts to your defenses (+2 damage)`);
          }
        } else if (oppLastCardType === 'card-draw') {
          // +1 draw vs Draw cards
          state.me.draw(1);
          if (isPlayer) {
            logYou(`adapts to opponent's card play (draw 1)`);
          } else {
            logOpp(`adapts to your card play (draw 1)`);
          }
        } else if (oppLastCardType === 'energy' || oppLastCardType === 'power') {
          // +1 energy vs Energy/power cards
          state.me.energy = Math.min(state.me.energy + 1, state.me.maxEnergy);
          if (isPlayer) {
            logYou(`adapts to opponent's power (gain 1 energy)`);
          } else {
            logOpp(`adapts to your power (gain 1 energy)`);
          }
        } else {
          if (isPlayer) {
            logYou(`adapts but finds no advantage`);
          } else {
            logOpp(`adapts but finds no advantage`);
          }
        }
      } else {
        if (isPlayer) {
          logYou(`seeks adaptation but finds no pattern`);
        } else {
          logOpp(`seeks adaptation but finds no pattern`);
        }
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
      // FX: Burn effect
      if (window.fxBurn) window.fxBurn(state.them);
    }
    if (status.target && status.target.freezeEnergy && !simulate) { 
      const isPlayer = (state.me === this.you);
      if (isPlayer) {
        logYou(`freezes opponent`);
      } else {
        logOpp(`freezes opponent`);
      }
      state.them.status.frozenNext = (state.them.status.frozenNext || 0) + status.target.freezeEnergy;
      // FX: Freeze effect
      if (window.fxFreeze) window.fxFreeze(state.them);
    }
    if (status.self) {
      if (status.self.nextPlus) { 
        state.me.status.nextPlus = (state.me.status.nextPlus || 0) + status.self.nextPlus;
        // FX: Focus effect
        if (!simulate && window.fxFocus) window.fxFocus(state.me);
      }
      if (status.self.maxEnergyDelta) { 
        state.me.maxEnergy = Math.max(state.me.maxEnergy + status.self.maxEnergyDelta, 1); // Remove cap
      }
      if (status.self.energyNowDelta) { 
        state.me.energy = this.applyEnergyGain(state.me, status.self.energyNowDelta);
        // FX: Surge effect for Loop card
        if (!simulate && card.id === 'loop' && window.fxSurge) window.fxSurge(state.me);
      }
      if (status.self.curiosityPower && !simulate) { 
        state.me.status.curiosityPower = true; 
      }
      if (status.self.droidProcArm && !simulate) { 
        state.me.status.droidProcNext = true; 
      }
      if (status.self.hopeStatus && !simulate) {
        // Hope effect: grant healing over time (stacks)
        if (!state.me.status) state.me.status = {};
        state.me.status.hopeAmount = (state.me.status.hopeAmount || 0) + 1; // stack
        state.me.status.hopeTurns = 3; // reset to 3 turns when new hope is applied
        const isPlayer = (state.me === this.you);
        if (isPlayer) {
          logYou(`gains Hope (${state.me.status.hopeAmount} stacks, 3 turns)`);
        } else {
          logOpp(`gains Hope (${state.me.status.hopeAmount} stacks, 3 turns)`);
        }
      }
      if (status.self.imperviousNext && !simulate) {
        // Impervious effect: grant immunity next turn
        if (!state.me.status) state.me.status = {};
        state.me.status.imperviousNext = true;
        const isPlayer = (state.me === this.you);
        if (isPlayer) {
          logYou('becomes Impervious - immune to all damage next turn');
        } else {
          logOpp('becomes Impervious - immune to all damage next turn');
        }
      }
      if (status.self.cleanse && !simulate) {
        // Purge effect: clear all status effects
        const isPlayer = (state.me === this.you);
        if (isPlayer) {
          logYou('cleanses all status effects');
        } else {
          logOpp('cleanses all status effects');
        }
        
        // Clear debuffs
        state.me.status.burn = 0;
        state.me.status.burnTurns = 0;
        state.me.status.frozenNext = 0;
        
        // Clear buffs (this is a design choice - should cleanse remove buffs too?)
        state.me.status.nextPlus = 0;
        state.me.status.curiosityPower = false;
        state.me.status.droidProcNext = false;
        state.me.status.curiosityNextDraw = false;
        
        // Clear Hope effect
        state.me.status.hopeAmount = 0;
        state.me.status.hopeTurns = 0;
        
        // Clear immunity effects
        if (!state.me.status) state.me.status = {};
        state.me.status.impervious = false;
        state.me.status.imperviousNext = false;
        
        // FX: Purge effect
        if (window.fxPurge) window.fxPurge(state.me);
      }
    }
    
    // 4) special: Echo (repeat last card)
    if (card.id === 'echo') {
      const last = me.lastPlayedThisTurn && me.lastPlayedThisTurn.id !== 'echo' ? me.lastPlayedThisTurn : null;
      if (last) {
        // Echo repeats last card without paying its cost
        // Add a flag to prevent recursive echoes and ensure clean state
        const wasEchoing = this.isEchoing;
        this.isEchoing = true;
        
        // Create a clean copy of the card to avoid issues with stolen card markers
        // This prevents crashes when echoing stolen cards that may have been modified
        const cardCopy = {
          ...last,
          // Remove any stolen card markers to prevent conflicts
          stolenFrom: undefined,
          originalOwner: undefined
        };
        
        try {
          this.applyCard(cardCopy, me, them, simulate);
        } catch (error) {
          console.error('Error applying echoed card:', error);
          // Fallback: just draw a card if echo fails
          if (!simulate) {
            me.draw(1);
            const isPlayer = (me === this.you);
            if (isPlayer) {
              logYou(`echo failed, draws 1 card instead`);
            } else {
              logOpp(`echo failed, draws 1 card instead`);
            }
          }
        }
        
        this.isEchoing = wasEchoing;
        if (!simulate) {
          const isPlayer = (me === this.you);
          if (isPlayer) {
            logYou(`repeats ${last.name}`);
          } else {
            logOpp(`repeats ${last.name}`);
          }
        }
      } else {
        if (!simulate) { 
          me.draw(1); 
          const isPlayer = (me === this.you);
          if (isPlayer) {
            logYou('has no valid card to echo, draws 1 card instead');
          } else {
            logOpp('has no valid card to echo, draws 1 card instead');
          }
        }
      }
      // FX: Echo effect
      if (!simulate && window.fxEcho) window.fxEcho(state.me);
    }
    
    // 5) special: Overload (prepare to repeat next card)
    if (card.id === 'overload') {
      // Overload sets a flag to repeat the next non-Overload card played
      if (!simulate) {
        me.echoNext = true;
        const isPlayer = (me === this.you);
        if (isPlayer) {
          logYou('prepares to overload the next card played');
        } else {
          logOpp('prepares to overload the next card played');
        }
      }
      // FX: Overload effect (reuse echo effect for now)
      if (!simulate && window.fxEcho) window.fxEcho(state.me);
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
      case 'saint':
        p.hp = this.applyHeal(p, 1);
        logYou('Saint: healed +1 HP');
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
        p.hp = this.applyHeal(p, 5);
        logYou('Hearty: +5 HP');
        break;
      // Other quirks don't have battle start effects
    }
  },
  
  checkWin() {
    if (this.over) return; // Prevent multiple streak increments if already won
    
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
        
        // Handle campaign defeat
        if (window.Campaign && window.Campaign.active) {
          window.Campaign.abandon();
          logAction('system', 'Campaign ended due to defeat. Returning to start screen.');
          // Clear campaign UI and return to start after a brief delay
          setTimeout(() => {
            if (window.showStart) {
              window.showStart();
            }
          }, 2000);
        }
      }
      
      // Record battle results and emit achievement events
      recordBattleResult(youWin ? 'win' : 'loss');
      recordBattle(youWin ? 'win' : 'loss', this.streak, this.you.hp, this.you.maxHP, 0); // TODO: track turn count
      recordOpponent(this.persona, youWin, this.oppFeatures?.isEasterEgg || false);
      
      // Auto-submit to leaderboards if player has opted in
      if (window.canSubmitToLeaderboard && window.canSubmitToLeaderboard()) {
        try {
          const analytics = window.getAnalytics();
          if (window.submitToLeaderboard) {
            // Submit asynchronously without blocking game flow
            window.submitToLeaderboard(analytics).then(success => {
              if (success) {
                console.log('Battle result automatically submitted to leaderboard');
              }
            }).catch(e => {
              console.warn('Failed to auto-submit to leaderboard:', e);
            });
          }
        } catch (e) {
          console.warn('Failed to auto-submit to leaderboard:', e);
        }
      }
      
      checkAchievementUnlocks({
        event: 'battleEnd',
        result: youWin ? 'win' : 'loss',
        streak: this.streak,
        youHP: this.you.hp,
        oppPersona: this.persona // Add opponent persona for flavor unlocks
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
    
    // Return any stolen cards still in hand to their original owners before shuffling
    this.cleanupStolenCards();
    
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

  // Clean up stolen cards from both players' hands and discard piles
  cleanupStolenCards() {
    // Helper function to return stolen cards from a card array
    const returnStolenCardsFromArray = (cardArray, playerName) => {
      for (let i = cardArray.length - 1; i >= 0; i--) {
        const card = cardArray[i];
        if (card.stolenFrom && card.originalOwner && card.originalOwner.discard) {
          try {
            // Remove from current array
            const stolenCard = cardArray.splice(i, 1)[0];
            // Return to original owner's discard pile
            stolenCard.originalOwner.discard.push(stolenCard);
            // Clean up markers
            delete stolenCard.stolenFrom;
            delete stolenCard.originalOwner;
            
            if (playerName === 'you') {
              logYou(`returns ${stolenCard.name || 'a card'} to opponent at battle end`);
            } else {
              logOpp(`returns ${stolenCard.name || 'a card'} to you at battle end`);
            }
          } catch (error) {
            console.error('Error returning stolen card during cleanup:', error);
          }
        }
      }
    };
    
    // Clean up stolen cards from both players
    returnStolenCardsFromArray(this.you.hand, 'you');
    returnStolenCardsFromArray(this.you.discard, 'you');
    returnStolenCardsFromArray(this.opp.hand, 'opp');
    returnStolenCardsFromArray(this.opp.discard, 'opp');
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
    let msg = 'New opponent: ' + this.persona + ' appears!';
    if (this.oppFeatures.isEasterEgg) {
      msg = `✨ RARE OPPONENT! ${this.oppFeatures.easterEggType} ${this.persona} appears! ✨ [${this.oppFeatures.rarity.toUpperCase()}]`;
    }
    logMessage(msg);
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
    
    // Abandon campaign if active when restarting
    if (window.Campaign && window.Campaign.active) {
      window.Campaign.abandon();
    }
    
    // Ensure UI shows streak (not booster) when returning to start
    if (window.updateCampaignUI) window.updateCampaignUI();
    
    // Hide victory modal and show start modal
    $('#victoryModal').hidden = true;
    $('#startModal').hidden = false;
    
    logAction('system', 'Game restarted.');
  }
};