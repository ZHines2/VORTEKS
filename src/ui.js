import { $, clamp } from './utils.js';
import { SAFETY_MAX_ENERGY, OVERHEAL_LIMIT_MULT } from './config.js';

// Card type icon mapping for UI clarity
export function getCardTypeIcon(type) {
  const typeIcons = {
    'attack': '⚔',
    'skill': '🛠',
    'power': '💎'
  };
  return typeIcons[type] || '?';
}

// Cost rendering helper function
export function renderCost(card) {
  if (card.id === 'reconsider') {
    return 'ALL';
  }
  
  let costStr = card.cost.toString() + '⚡';
  
  // Add life cost if the card has one
  if (card.effects?.lifeCost) {
    costStr += ` ${card.effects.lifeCost}❤`;
  }
  
  return costStr;
}

// UI rendering and card display functions
export function renderStatuses(p, nodeId, Game = null) {
  const el = $(nodeId); 
  el.innerHTML = '';
  if (p.status.burn && p.status.burnTurns > 0) {
    addTag(`🔥 ${p.status.burn} (${p.status.burnTurns})`);
  }
  if (p.status.nextPlus) addTag('✨ +' + p.status.nextPlus + ' atk');
  if (!p.isAI && p.quirk === 'piercer' && !p.status.firstAttackUsed) addTag('⟂ pierce 1 ready');
  
  // Show achievement progress for player
  if (!p.isAI && Game && Game.turnTypes && Game.turnTypes.size > 0) {
    const types = Array.from(Game.turnTypes).map(getCardTypeIcon).join('');
    const progress = `${Game.turnTypes.size}/3`;
    addTag(`Types: ${types} (${progress})`, 'achievement-progress');
  }
  
  function addTag(txt, extraClass = '') { 
    const s = document.createElement('span'); 
    s.className = 'tag' + (extraClass ? ' ' + extraClass : ''); 
    s.textContent = txt; 
    el.appendChild(s);
  }
}

export function cardText(c) {
  const parts = []; 
  const e = c.effects || {}; 
  const s = c.status || {}; 
  const st = s.target || {}; 
  const self = s.self || {};
  
  if (e.damage) { 
    parts.push(`Deal ${e.damage} dmg${e.pierce ? ' (pierce)' : ''}.`); 
  }
  if (e.shield) { 
    parts.push(`Gain ${e.shield} shield.`); 
  }
  if (e.heal) { 
    parts.push(`Heal ${e.heal}.`); 
  }
  if (e.draw) { 
    parts.push(`Draw ${e.draw}.`); 
  }
  if (st.burn) { 
    parts.push(`Burn ${st.burn.amount} for ${st.burn.turns}.`); 
  }
  if (st.freezeEnergy) { 
    parts.push(`Foe -${st.freezeEnergy} ⚡ next.`); 
  }
  if (self.nextPlus) { 
    parts.push(`+${self.nextPlus} next atk.`); 
  }
  if (self.maxEnergyDelta) { 
    parts.push(`+${self.maxEnergyDelta} max ⚡.`); 
  }
  if (self.energyNowDelta) { 
    parts.push(`+${self.energyNowDelta} ⚡ now.`); 
  }
  if (c.id === 'echo') { 
    parts.push('Repeat last non‑Echo, else draw 1.'); 
  }
  if (c.id === 'reconsider') {
    parts.push('Spend all remaining energy. Reshuffle your deck (discard → deck).');
  }
  if (c.id === 'curiosity') {
    parts.push('End: If you bank energy, next start draw +1.');
  }
  if (c.id === 'droid' || self.droidProcArm) {
    parts.push('Start of next turn: random +1 (draw, energy, shield, heal, next atk).');
  }
  if (c.id === 'presto') {
    parts.push('Steal a random card from opponent\'s discard pile. Return when used.');
  }
  
  // Add stolen card indicator text
  if (c.stolenFrom) {
    parts.push('STOLEN - Returns to opponent when played.');
  }
  
  return parts.join(' ');
}

export function predictCard(card, me, them, Game) {
  const meClone = JSON.parse(JSON.stringify(me));
  const themClone = JSON.parse(JSON.stringify(them));
  const g = Object.create(Game);
  g.you = meClone; 
  g.opp = themClone; 
  g.turn = (me === Game.you ? 'you' : 'opp');
  const beforeHP = themClone.hp; 
  const beforeSh = themClone.shield; 
  const beforeMeHP = meClone.hp; 
  const beforeMeSh = meClone.shield;
  g.applyCard(card, meClone, themClone, true);
  const dmg = Math.max(0, beforeHP - themClone.hp);
  const shGain = Math.max(0, meClone.shield - beforeMeSh);
  const heal = Math.max(0, meClone.hp - beforeMeHP);
  let out = []; 
  if (dmg) out.push(`${dmg} dmg`); 
  if (shGain) out.push(`+${shGain} sh`); 
  if (heal) out.push(`+${heal} hp`);
  if (card.id === 'fire') { 
    const burnAmt = themClone.status.burn || 0;
    const burnTurns = themClone.status.burnTurns || 0;
    if (burnAmt && burnTurns) {
      out.push(`burn ${burnAmt} for ${burnTurns}`);
    } else if (burnAmt) {
      out.push(`burn ${burnAmt}`);
    }
  }
  if (card.id === 'snow') { 
    out.push(`-1⚡ next`); 
  }
  if (card.id === 'star') { 
    out.push(`next +2`); 
  }
  if (card.id === 'loop') { 
    out.push(`+1⚡ max`); 
  }
  if (card.id === 'echo' && (!me.lastPlayed || me.lastPlayed.id === 'echo')) {
    out = ['draw 1'];
  }
  return '→ ' + (out.join(', ') || '');
}

export function createRenderFunction(Game) {
  return () => {
    // HP rendering with overheal support
    const renderHP = (player, hpElementId) => {
      if (!player) return; // Safety check for tests
      const hpElement = $(hpElementId);
      const hp = player.hp;
      const maxHP = player.maxHP;
      
      if (hp > maxHP) {
        // Show overheal
        hpElement.innerHTML = `<span class="overheal">${hp}</span>/${maxHP}`;
      } else {
        hpElement.textContent = hp;
      }
    };

    renderHP(Game.you, '#youHP');
    renderHP(Game.opp, '#oppHP');
    
    if (Game.you) $('#youSH').textContent = Game.you.shield;
    
    // Energy rendering with safety cap for display
    const renderEnergy = (player, energyElementId) => {
      if (!player) return; // Safety check for tests
      const energyElement = $(energyElementId);
      const displayEnergy = Math.min(player.energy, SAFETY_MAX_ENERGY);
      energyElement.textContent = `${displayEnergy}/${player.maxEnergy}`;
    };
    
    renderEnergy(Game.you, '#youEN');
    renderEnergy(Game.opp, '#oppEN');
    
    if (Game.opp) $('#oppSH').textContent = Game.opp.shield;
    $('#streak').textContent = Game.streak || 0;
    if (Game.you) renderStatuses(Game.you, '#youStatus', Game);
    if (Game.opp) renderStatuses(Game.opp, '#oppStatus', Game);
    const handEl = $('#hand'); 
    handEl.innerHTML = '';
    if (Game.you && Game.you.hand) {
      Game.you.hand.forEach((card, idx) => {
        const b = document.createElement('button');
        b.className = 'card';
        const pv = predictCard(card, Game.you, Game.opp, Game);
        const cost = `<div class="cost">${renderCost(card)}</div>`;
        // Add card type indicator for achievement clarity
        const typeIcon = getCardTypeIcon(card.type);
        const typeIndicator = `<div class="card-type" title="${card.type} card">${typeIcon}</div>`;
        
        // Add stolen card indicator
        const stolenIndicator = card.stolenFrom ? 
          `<div class="stolen-indicator" title="Stolen card - returns to opponent when played">🎭</div>` : '';
        
        b.innerHTML = `${cost}${typeIndicator}${stolenIndicator}<div class="sym">${card.sym}</div><div class="nm">${card.name}</div><div class="ct">${cardText(card)}</div><div class="pv">${pv}</div>`;
        const affordable = Game.you.canAfford(card);
        b.disabled = Game.turn !== 'you' || !affordable || Game.over;
        if (!affordable) b.classList.add('insufficient');
        
        // Add styling for stolen cards
        if (card.stolenFrom) {
          b.classList.add('stolen');
        }
        
        if (!b.disabled) b.onclick = () => { Game.playCard(Game.you, idx); };
        handEl.appendChild(b);
      });
    }
    $('#endTurn').disabled = Game.turn !== 'you' || Game.over;
  };
}

// Animation helpers
export function bump(el, cls) { 
  el.classList.add(cls); 
  setTimeout(() => el.classList.remove(cls), 240);
}

export function bumpHP(p) { 
  const span = p.isAI ? $('#oppHP') : $('#youHP'); 
  span.classList.add('hpflash'); 
  setTimeout(() => span.classList.remove('hpflash'), 260);
}

export function bumpShield(p) { 
  const span = p.isAI ? $('#oppSH') : $('#youSH'); 
  span.classList.add('shieldhit'); 
  setTimeout(() => span.classList.remove('shieldhit'), 220);
}

// FX helpers for card effect microinteractions
export function fxBurn(target) {
  const panel = target.isAI ? $('#oppPanel') : $('#youPanel');
  if (!panel) return;
  panel.classList.add('ignite');
  setTimeout(() => panel.classList.remove('ignite'), 500);
}

export function fxFreeze(target) {
  const panel = target.isAI ? $('#oppPanel') : $('#youPanel');
  if (!panel) return;
  panel.classList.add('freeze');
  setTimeout(() => panel.classList.remove('freeze'), 600);
}

export function fxZap(target) {
  const panel = target.isAI ? $('#oppPanel') : $('#youPanel');
  if (!panel) return;
  panel.classList.add('zap');
  setTimeout(() => panel.classList.remove('zap'), 250);
}

export function fxFocus(player) {
  const panel = player.isAI ? $('#oppPanel') : $('#youPanel');
  if (!panel) return;
  panel.classList.add('twinkle');
  setTimeout(() => panel.classList.remove('twinkle'), 600);
}

export function fxSlash(target) {
  const panel = target.isAI ? $('#oppPanel') : $('#youPanel');
  if (!panel) return;
  panel.classList.add('slash');
  setTimeout(() => panel.classList.remove('slash'), 220);
}

export function fxSurge(player) {
  const pill = player.isAI ? $('#oppEN') : $('#youEN');
  if (!pill) return;
  pill.classList.add('surge');
  setTimeout(() => pill.classList.remove('surge'), 600);
}

export function fxEcho(player) {
  const panel = player.isAI ? $('#oppPanel') : $('#youPanel');
  if (!panel) return;
  panel.classList.add('ripple');
  setTimeout(() => panel.classList.remove('ripple'), 600);
}

export function fxReconsider() {
  const hand = $('#hand');
  if (!hand) return;
  hand.classList.add('swirl');
  setTimeout(() => hand.classList.remove('swirl'), 500);
}