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

    // Initialize status if needed
    if (!target.status) target.status = {};

    // Implement burn stacking: always 1 damage per turn, stack turn duration
    const existingTurns = target.status.burnTurns || 0;
    
    target.status.burn = 1; // Always 1 damage per turn
    target.status.burnTurns = existingTurns + newBurnTurns; // Stack turn duration
    
    // Track max burn amount stats (always 1 now)
    if (target.isAI) { // Player is applying burn to opponent
      this.stats.maxBurnAmount = Math.max(this.stats.maxBurnAmount, 1);
    }
  },

  // Helper method for applying infect with stacking support
  applyInfect(target, newInfectStacks) {
    if (newInfectStacks <= 0) return;

    // Initialize status if needed
    if (!target.status) target.status = {};
    
    // Stack infect: add amounts (no turn limit like burn)
    const existingInfect = target.status.infect || 0;
    target.status.infect = existingInfect + newInfectStacks;
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
    
    // Reset card play counter to prevent false positives from previous turns
    p.cardPlayCount = {};
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
    
    // Handle Infect status: 50% chance to deal 1 damage per stack, 25% chance to cure per turn
    if (me.status.infect && me.status.infect > 0) {
      const actorName = me === this.you ? '[YOU]' : '[OPPONENT]';
      let damageDealt = 0;
      
      // Roll for damage on each stack
      for (let i = 0; i < me.status.infect; i++) {
        if (Math.random() < 0.5) { // 50% chance per stack
          damageDealt++;
        }
      }
      
      // Apply damage if any procs occurred
      if (damageDealt > 0) {
        this.hit(me, damageDealt, true, false);
        logMessage(`${actorName} Infect deals ${damageDealt} damage (${damageDealt}/${me.status.infect} stacks proc).`);
      }
      
      // Roll for natural cure (25% chance to remove 1 stack)
      if (Math.random() < 0.25) {
        me.status.infect = Math.max(0, me.status.infect - 1);
        if (me.status.infect === 0) {
          logMessage(`${actorName} Infect is naturally cured.`);
        } else {
          logMessage(`${actorName} Infect partially cured (${me.status.infect} stacks remain).`);
        }
      }
    }
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
    
    // Safety check: prevent potential infinite loops with rapid card repeats
    if (!this.isEchoing) {
      if (!p.cardPlayCount) p.cardPlayCount = {};
      p.cardPlayCount[card.id] = (p.cardPlayCount[card.id] || 0) + 1;
      
      // If same card played more than 15 times this turn, it might be an infinite loop
      if (p.cardPlayCount[card.id] > 15) {
        const isPlayer = (p === this.you);
        const cardName = card.name || card.id;
        if (isPlayer) {
          logYou(`${cardName} loop safety triggered - preventing infinite loop`);
        } else {
          logOpp(`${cardName} loop safety triggered - preventing infinite loop`);
        }
        return false;
      }
    }
    
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
      
      // Track the actual energy spent
      const energyToSpend = card.cost;
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
        youEnergyAfter: p.energy - card.cost
      });
    }
    
    // spend cost first (returns actual amount spent for reconsider)
    const actualCost = p.spend(card.cost, card);
    p.lastPlayed = card;
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
      // Reconsider effect: reshuffle deck (cost is already paid normally)
      
      // Reshuffle: move discard into deck and shuffle
      state.me.deck.push(...state.me.discard);
      state.me.discard = [];
      shuffle(state.me.deck);
      
      const isPlayer = (state.me === this.you);
      if (isPlayer) {
        logYou(`reshuffles deck`);
      } else {
        logOpp(`reshuffles deck`);
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
    if (status.target && status.target.infectStatus && !simulate) {
      const isPlayer = (state.me === this.you);
      if (isPlayer) {
        logYou(`applies Infect (1 stack)`);
      } else {
        logOpp(`applies Infect (1 stack)`);
      }
      this.applyInfect(state.them, 1);
      // FX: Infect effect
      if (window.fxInfect) window.fxInfect(state.them);
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
        state.me.status.infect = 0; // Clear infect stacks
        
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
      if (log) log(youWin ? 'You win!' : 'AI wins!');
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
    
    // Reset modal content to quick play mode (in case it was modified by tournament mode)
    const titleElement = modal.querySelector('div[style*="font-size:20px"]');
    if (titleElement) {
      titleElement.innerHTML = '<strong>Victory!</strong>';
      titleElement.style.color = 'var(--good)';
    }
    
    const messageElement = modal.querySelector('div[style*="margin-bottom:16px"]:not([style*="font-size"])');
    if (messageElement) {
      messageElement.textContent = 'You defeated your opponent and your streak continues!';
    }
    
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

// Tournament Mode - Battle Royale with 9 AI opponents
export const Tournament = {
  participants: [], // Array of all participants (player + 9 AI)
  you: null, // Player reference
  currentParticipantIndex: 0,
  over: false,
  winner: null,
  turnCount: 0,
  selectedQuirk: null,
  
  // Simple name generation function for tournament mode
  generateRandomName() {
    const syllA = [
      "Bo","Cha","Mo","Lu","Pe","Za","Ti","Gro","Mi","Lo","Ka","Quo","Fi","Ra","Sn","We","Zo","Do","Ni","Ju","Ro","Ta","Zu",
      "Aer","Bla","Cri","Dra","Elf","Fae","Grim","Hex","Ith","Jax","Kry","Lum","Myr","Nyx","Orb","Pix","Qua","Rune","Syl","Tho",
      "Ast","Byt","Cyb","Dat","Eon","Flux","Gal","Hyp","Ion","Jet","Kin","Lab","Mag","Neo","Oxi","Pla","Qbit","Ray","Syn","Tek"
    ];
    const syllB = [
      "bby","nky","bbit","mp","ggle","rk","zzle","mmy","nk","cko","ff","zz","bo","ppy","x","tron","floo","puff","dle","zzo",
      "wing","claw","fang","horn","tail","eye","maw","scale","fur","hide","bone","tooth","spike","blade","shard","gem","stone",
      "spell","ward","hex","curse","charm","rune","glyph","sigil","mark","seal","bind","weave","craft","lore","sage","witch",
      "byte","code","chip","core","link","node","port","sync","beam","wave","grid","net","web","bot","droid","mech","tech"
    ];
    
    const rngInt = (n) => Math.floor(Math.random() * n);
    return syllA[rngInt(syllA.length)] + syllB[rngInt(syllB.length)];
  },
  
  initQuick() {
    this.participants = [];
    this.currentParticipantIndex = 0;
    this.over = false;
    this.winner = null;
    this.turnCount = 0;
    
    // Create player with random deck
    this.you = createPlayer(false);
    this.you.name = 'YOU';
    this.you.persona = 'Player';
    this.you.isPlayer = true;
    if (window.buildRandomDeck) {
      this.you.deck = window.buildRandomDeck(20, 4);
    }
    this.participants.push(this.you);
    
    // Create 9 AI opponents
    for (let i = 0; i < 9; i++) {
      const ai = createPlayer(true);
      const faceInfo = drawOppFace();
      ai.persona = faceInfo.persona;
      ai.features = faceInfo.features;
      // Generate proper names using the same system as regular gameplay
      ai.name = faceInfo.features.isEasterEgg 
        ? `${this.generateRandomName()} the ${ai.persona}` 
        : this.generateRandomName() + (ai.persona ? ' the ' + ai.persona : '');
      ai.isPlayer = false;
      ai.deck = makePersonaDeck(ai.persona);
      ai.ai = createAIPlayer({
        you: this.you,
        opp: ai,
        turn: 'opp',
        over: false,
        simDamage: (attacker, defender, card) => {
          const damage = card.damage || 0;
          return Math.min(damage, defender.hp);
        }
      });
      this.participants.push(ai);
    }
    
    this.startTournament();
  },
  
  startTournament() {
    // Draw initial hands for all participants
    this.participants.forEach(p => {
      p.draw(5);
      p.energy = p.maxEnergy;
    });
    
    if (log || window.log) {
      const logFn = log || window.log;
      if (typeof logFn === 'function') {
        logFn('Tournament begins! 10 fighters enter, only 1 will remain!');
        logFn(`Participants: ${this.participants.map(p => p.name).join(', ')}`);
      }
    }
    
    // Start with player's turn
    this.currentParticipantIndex = 0;
    this.nextTurn();
    
    // Refresh UI
    if (window.renderTournamentUI) {
      window.renderTournamentUI();
    }
  },
  
  nextTurn() {
    if (this.over) return;
    
    // Check if tournament is over
    const livingParticipants = this.participants.filter(p => p.hp > 0);
    if (livingParticipants.length <= 1) {
      this.endTournament(livingParticipants[0] || null);
      return;
    }
    
    // Find next living participant
    let attempts = 0;
    while (attempts < this.participants.length) {
      this.currentParticipantIndex = (this.currentParticipantIndex + 1) % this.participants.length;
      const currentParticipant = this.participants[this.currentParticipantIndex];
      
      if (currentParticipant.hp > 0) {
        this.startParticipantTurn(currentParticipant);
        return;
      }
      attempts++;
    }
    
    // If we get here, something went wrong
    this.endTournament(null);
  },
  
  startParticipantTurn(participant) {
    if (this.over) return;
    
    this.turnCount++;
    
    // Process burn status at start of turn (like regular game endTurn)
    if (participant.status && participant.status.burn && participant.status.burnTurns > 0) { 
      const burnDamage = participant.status.burn;
      this.dealDamage(participant, burnDamage, null); // Apply burn damage
      participant.status.burnTurns--; 
      
      if (log || window.log) {
        const logFn = log || window.log;
        if (typeof logFn === 'function') {
          logFn(`${participant.name} takes ${burnDamage} burn damage`);
        }
      }
    }
    if (participant.status && participant.status.burnTurns === 0) {
      participant.status.burn = 0;
    }
    
    // Reset energy and draw card
    participant.energy = Math.min(participant.maxEnergy, 3 + (participant.status?.nextPlus || 0));
    if (participant.status?.nextPlus) participant.status.nextPlus = 0;
    
    // Apply freeze effect
    if (participant.status?.frozenNext) {
      participant.energy = Math.max(0, participant.energy - participant.status.frozenNext);
      participant.status.frozenNext = 0;
    }
    
    participant.draw(1);
    
    if (log || window.log) {
      const logFn = log || window.log;
      if (typeof logFn === 'function') {
        logFn(`${participant.name}'s turn (HP: ${participant.hp})`);
      }
    }
    
    if (participant.isPlayer) {
      // Player's turn - they can play cards and choose targets
      this.startPlayerTurn(participant);
    } else {
      // AI turn - play automatically
      this.playAITurn(participant);
    }
    
    // Refresh UI after turn starts
    if (window.renderTournamentUI) {
      window.renderTournamentUI();
    }
    if (window.render) window.render();
  },
  
  startPlayerTurn(player) {
    // Player's turn - UI should show available cards and allow targeting
    // This will be handled by the UI system
    if (log || window.log) {
      const logFn = log || window.log;
      if (typeof logFn === 'function') {
        logFn('Your turn! Choose your targets wisely.');
      }
    }
  },
  
  playAITurn(ai) {
    if (this.over) return;
    
    // AI plays cards targeting random living opponents
    let actionsThisTurn = 0;
    const maxActions = 10; // Prevent infinite loops
    
    while (ai.energy > 0 && actionsThisTurn < maxActions) {
      const playable = ai.hand.filter(card => card.cost <= ai.energy);
      if (playable.length === 0) break;
      
      // Simple AI: prioritize attacks, then other cards
      let cardToPlay = playable.find(c => c.type === 'attack') || playable[0];
      
      // Choose random target (excluding self)
      const potentialTargets = this.participants.filter(p => p !== ai && p.hp > 0);
      if (potentialTargets.length === 0) break;
      
      const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
      
      this.playCard(ai, cardToPlay, target);
      actionsThisTurn++;
    }
    
    // End AI turn after a short delay
    setTimeout(() => {
      this.nextTurn();
    }, 1000);
  },
  
  playCard(player, card, target = null) {
    if (this.over) return;
    
    // Remove card from hand and pay cost
    const cardIndex = player.hand.indexOf(card);
    if (cardIndex === -1) return;
    
    player.hand.splice(cardIndex, 1);
    player.energy -= card.cost;
    player.discard.push(card);
    
    // For tournament mode, we need to adapt the Game.applyCard method
    // Create a temporary game-like context for card application
    const gameContext = {
      you: player,
      opp: target || this.getRandomOpponent(player),
      applyHeal: (p, amount) => {
        const limit = p.maxHP * OVERHEAL_LIMIT_MULT;
        const newHP = Math.min(limit, p.hp + amount);
        return newHP;
      },
      applyEnergyGain: (p, amount) => {
        return Math.min(SAFETY_MAX_ENERGY, p.energy + amount);
      }
    };
    
    // Apply card effects using the existing game logic
    if (target) {
      // Card targets specific opponent
      this.applyCardToTarget(card, player, target, gameContext);
    } else {
      // Card affects self or needs random target
      if (card.type === 'attack') {
        const randomTarget = this.getRandomOpponent(player);
        if (randomTarget) {
          this.applyCardToTarget(card, player, randomTarget, gameContext);
        }
      } else {
        // Apply to self (healing, shield, etc.)
        this.applyCardToTarget(card, player, player, gameContext);
      }
    }
    
    if (log || window.log) {
      const logFn = log || window.log;
      if (typeof logFn === 'function') {
        const targetText = target ? ` → ${target.name}` : '';
        logFn(`${player.name} plays ${card.name}${targetText}`);
      }
    }
    
    // Check for eliminations
    this.checkEliminations();
    
    // Refresh UI after card play
    if (window.renderTournamentUI) {
      window.renderTournamentUI();
    }
  },
  
  applyCardToTarget(card, caster, target, gameContext) {
    // Use simplified version of Game.applyCard for tournament
    const effects = card.effects || {};
    
    // Apply damage
    if (effects.damage && target !== caster) {
      let damage = effects.damage;
      
      // Apply scaling if caster has nextPlus
      if (card.scaling?.addToDamageFromSelf?.nextPlus && caster.status?.nextPlus) {
        damage += caster.status.nextPlus;
        caster.status.nextPlus = 0;
      }
      
      this.dealDamage(target, damage, caster);
    }
    
    // Apply healing
    if (effects.heal && target === caster) {
      const limit = caster.maxHP * 1.5; // Simple overheal limit
      caster.hp = Math.min(limit, caster.hp + effects.heal);
      if (log || window.log) {
        const logFn = log || window.log;
        if (typeof logFn === 'function') {
          logFn(`${caster.name} heals ${effects.heal} HP`);
        }
      }
    }
    
    // Apply shield
    if (effects.shield && target === caster) {
      caster.shield = (caster.shield || 0) + effects.shield;
      if (log || window.log) {
        const logFn = log || window.log;
        if (typeof logFn === 'function') {
          logFn(`${caster.name} gains ${effects.shield} shield`);
        }
      }
    }
    
    // Apply status effects
    const status = card.status || { target: {}, self: {} };
    
    // Apply status to target
    if (target !== caster && status.target) {
      if (status.target.burn) {
        // Use the proper applyBurn method for consistent behavior
        Game.applyBurn(target, status.target.burn.amount, status.target.burn.turns);
      }
      if (status.target.freezeEnergy) {
        target.status = target.status || {};
        target.status.frozenNext = (target.status.frozenNext || 0) + status.target.freezeEnergy;
      }
    }
    
    // Apply status to self
    if (status.self) {
      if (status.self.nextPlus) {
        caster.status = caster.status || {};
        caster.status.nextPlus = (caster.status.nextPlus || 0) + status.self.nextPlus;
      }
      if (status.self.maxEnergyDelta) {
        caster.maxEnergy += status.self.maxEnergyDelta;
      }
      if (status.self.energyNowDelta) {
        caster.energy = Math.min(SAFETY_MAX_ENERGY, caster.energy + status.self.energyNowDelta);
      }
    }
    
    // Apply card draw
    if (effects.draw) {
      caster.draw(effects.draw);
    }
  },
  
  getRandomOpponent(player) {
    const opponents = this.participants.filter(p => p !== player && p.hp > 0);
    if (opponents.length === 0) return null;
    return opponents[Math.floor(Math.random() * opponents.length)];
  },
  
  dealDamage(target, amount, source) {
    const actualDamage = Math.max(0, amount - target.shield);
    target.shield = Math.max(0, target.shield - amount);
    target.hp -= actualDamage;
    
    if (log || window.log) {
      const logFn = log || window.log;
      if (typeof logFn === 'function') {
        logFn(`${target.name} takes ${actualDamage} damage (HP: ${target.hp})`);
      }
    }
  },
  
  checkEliminations() {
    this.participants.forEach(p => {
      if (p.hp <= 0 && !p.eliminated) {
        p.eliminated = true;
        if (log || window.log) {
          const logFn = log || window.log;
          if (typeof logFn === 'function') {
            logFn(`${p.name} has been eliminated!`);
          }
        }
      }
    });
  },
  
  endTournament(winner) {
    this.over = true;
    this.winner = winner;
    
    if (log || window.log) {
      const logFn = log || window.log;
      if (typeof logFn === 'function') {
        if (winner) {
          logFn(`Tournament over! ${winner.name} is the victor!`);
        } else {
          logFn('Tournament ended with no victor.');
        }
      }
    }
    
    // Show victory/defeat modal
    this.showTournamentResult();
  },
  
  showTournamentResult() {
    const modal = document.getElementById('victoryModal');
    if (!modal) return;
    
    const isPlayerWinner = this.winner && this.winner.isPlayer;
    
    // Update modal content for tournament
    const titleElement = modal.querySelector('div[style*="font-size:20px"]');
    if (titleElement) {
      titleElement.textContent = isPlayerWinner ? 'Tournament Victory!' : 'Tournament Defeat';
      titleElement.style.color = isPlayerWinner ? 'var(--good)' : 'var(--bad)';
    }
    
    const messageElement = modal.querySelector('div[style*="margin-bottom:16px"]:not([style*="font-size"])');
    if (messageElement) {
      if (isPlayerWinner) {
        messageElement.textContent = 'You defeated 9 AI opponents and won the tournament!';
      } else {
        const winnerName = this.winner ? this.winner.name : 'No one';
        messageElement.textContent = `${winnerName} won the tournament. Better luck next time!`;
      }
    }
    
    modal.hidden = false;
  },
  
  // End player turn and advance to next participant
  endPlayerTurn() {
    if (this.over) return;
    this.nextTurn();
  },
  
  // Get list of valid targets for player (all living opponents)
  getValidTargets() {
    return this.participants.filter(p => !p.isPlayer && p.hp > 0);
  },
  
  // Get list of valid targets for player (all living opponents)
  getValidTargets() {
    if (!this.you) return [];
    return this.participants.filter(p => p !== this.you && p.hp > 0);
  },
  
  // Reset tournament to start screen
  resetToStart() {
    this.over = true;
    this.participants = [];
    this.winner = null;
    
    // Hide victory modal and show start modal
    const victoryModal = document.getElementById('victoryModal');
    const startModal = document.getElementById('startModal');
    if (victoryModal) victoryModal.hidden = true;
    if (startModal) startModal.hidden = false;
    
    if (log || window.log) {
      const logFn = log || window.log;
      if (typeof logFn === 'function') {
        logFn('Tournament ended. Returning to start screen.');
      }
    }
    
    // Show start screen
    if (window.showStart) {
      window.showStart();
    }
  }
};