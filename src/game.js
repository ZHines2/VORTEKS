import { clamp, $ } from './utils.js';
import { createPlayer } from './player.js';
import { drawOppFace, setOpponentName } from './face-generator.js';
import { makePersonaDeck, createAIPlayer } from './ai.js';

// Global log function (will be set by main script)
let log = null;

export function setLogFunction(logFn) {
  log = logFn;
  // Also make it available globally for player.js
  window.log = logFn;
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
  
  init() {
    this.you = createPlayer(false);
    this.opp = createPlayer(true);
    this.ai = createAIPlayer(this);
    
    // Face first → persona → AI deck
    const faceInfo = drawOppFace();
    this.persona = faceInfo.persona;
    setOpponentName(this.persona);
    this.opp.deck = makePersonaDeck(this.persona);
    
    // Player builds deck, then picks quirk, then start
    // This will be called from UI module
    if (window.openDeckBuilder) {
      window.openDeckBuilder((yourDeck) => {
        this.you.deck = yourDeck;
        this.you.draw(5); 
        this.opp.draw(5);
        this.turn = 'you'; 
        this.over = false;
        log('New game. You start.');
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
    setOpponentName(this.persona);
    this.opp.deck = makePersonaDeck(this.persona);
    
    // Build random deck for quick start
    if (window.buildRandomDeck) {
      this.you.deck = window.buildRandomDeck(20, 4);
    }
    
    this.you.draw(5); 
    this.opp.draw(5);
    this.turn = 'you'; 
    this.over = false; 
    log('Quick Start. You start.');
    this.pickQuirk(() => { 
      this.startTurn(this.you); 
      if (window.render) window.render(); 
    });
  },
  
  pickQuirk(done) {
    const modal = $('#quirkModal');
    modal.hidden = false;
    modal.querySelectorAll('.qcard').forEach(el => {
      el.onclick = () => {
        const q = el.getAttribute('data-quirk');
        this.you.quirk = q;
        if (q === 'minty') { 
          this.you.maxEnergy = clamp(this.you.maxEnergy + 1, 1, 6); 
          this.you.energy = clamp(this.you.energy + 1, 0, this.you.maxEnergy); 
        }
        modal.hidden = true;
        log('Quirk: ' + q.toUpperCase());
        done();
      };
    });
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
    p.draw(1);
    if (window.render) window.render();
  },
  
  endTurn() {
    const me = this.turn === 'you' ? this.you : this.opp;
    if (me.status.burn && me.status.burnTurns > 0) { 
      this.hit(me, me.status.burn, true, false); 
      me.status.burnTurns--; 
      log(`${me.isAI ? 'AI' : 'You'} take burn.`);
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
    
    // spend cost first
    p.spend(card.cost);
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
    let extraPierce = 0;
    if (!atk.isAI && atk.quirk === 'piercer' && !atk.status.firstAttackUsed) { 
      extraPierce = 1; 
    }
    if (!pierce) {
      if (extraPierce > 0) { 
        const used = Math.min(target.shield, extraPierce); 
        target.shield -= used; 
      }
      const used = Math.min(target.shield, dmg); 
      if (used > 0) { 
        target.shield -= used; 
        if (!simulate && window.bumpShield) window.bumpShield(target); 
        dmg -= used; 
      }
    }
    if (dmg > 0) { 
      target.hp = Math.max(0, target.hp - dmg); 
      if (!simulate && window.bumpHP) window.bumpHP(target); 
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
    if (effects.heal) { 
      state.me.hp = clamp(state.me.hp + effects.heal, 0, state.me.maxHP); 
    }
    if (effects.shield) { 
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
    
    // 3) statuses
    if (burnObj) { 
      state.them.status.burn = burnObj.amount; 
      state.them.status.burnTurns = burnObj.turns; 
    }
    if (status.target && status.target.freezeEnergy) { 
      state.them.status.frozenNext = (state.them.status.frozenNext || 0) + status.target.freezeEnergy; 
    }
    if (status.self) {
      if (status.self.nextPlus) { 
        state.me.status.nextPlus = (state.me.status.nextPlus || 0) + status.self.nextPlus; 
      }
      if (status.self.maxEnergyDelta) { 
        state.me.maxEnergy = clamp(state.me.maxEnergy + status.self.maxEnergyDelta, 1, 6); 
      }
      if (status.self.energyNowDelta) { 
        state.me.energy = clamp(state.me.energy + status.self.energyNowDelta, 0, state.me.maxEnergy); 
      }
    }
    
    // 4) special: Echo
    if (card.id === 'echo') {
      const last = me.lastPlayed && me.lastPlayed.id !== 'echo' ? me.lastPlayed : null;
      if (last) {
        // Echo repeats last card without paying its cost
        this.applyCard(last, me, them, simulate);
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
  
  checkWin() {
    if (this.you.hp <= 0 || this.opp.hp <= 0) {
      this.over = true; 
      const youWin = this.opp.hp <= 0 && this.you.hp > 0;
      log(youWin ? 'You win!' : 'AI wins!');
      if (youWin) { 
        this.streak++; 
      } else { 
        this.streak = 0; 
      }
    }
  }
};