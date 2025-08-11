import { $ } from './utils.js';

// UI rendering and card display functions
export function renderStatuses(p, nodeId) {
  const el = $(nodeId); 
  el.innerHTML = '';
  if (p.status.burn) addTag('🔥 ' + p.status.burn + ' (' + (p.status.burnTurns || 0) + ')');
  if (p.status.nextPlus) addTag('✨ +' + p.status.nextPlus + ' atk');
  if (!p.isAI && p.quirk === 'piercer' && !p.status.firstAttackUsed) addTag('⟂ pierce 1 ready');
  
  function addTag(txt) { 
    const s = document.createElement('span'); 
    s.className = 'tag'; 
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
  if (c.id === 'curiosity') {
    parts.push('End: If you bank energy, next start draw +1.');
  }
  if (c.id === 'droid' || self.droidProcArm) {
    parts.push('Start of next turn: random +1 (draw, energy, shield, heal, next atk).');
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
    out.push(`burn ${(themClone.status.burn || 0)}`); 
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
    $('#youHP').textContent = Game.you.hp;
    $('#youSH').textContent = Game.you.shield;
    $('#youEN').textContent = `${Game.you.energy}/${Game.you.maxEnergy}`;
    $('#oppHP').textContent = Game.opp.hp;
    $('#oppSH').textContent = Game.opp.shield;
    $('#oppEN').textContent = `${Game.opp.energy}/${Game.opp.maxEnergy}`;
    $('#streak').textContent = Game.streak;
    renderStatuses(Game.you, '#youStatus');
    renderStatuses(Game.opp, '#oppStatus');
    const handEl = $('#hand'); 
    handEl.innerHTML = '';
    Game.you.hand.forEach((card, idx) => {
      const b = document.createElement('button');
      b.className = 'card';
      const pv = predictCard(card, Game.you, Game.opp, Game);
      const cost = `<div class="cost">${card.cost}</div>`;
      b.innerHTML = `${cost}<div class="sym">${card.sym}</div><div class="nm">${card.name}</div><div class="ct">${cardText(card)}</div><div class="pv">${pv}</div>`;
      const affordable = Game.you.canAfford(card);
      b.disabled = Game.turn !== 'you' || !affordable || Game.over;
      if (!affordable) b.classList.add('insufficient');
      if (!b.disabled) b.onclick = () => { Game.playCard(Game.you, idx); };
      handEl.appendChild(b);
    });
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