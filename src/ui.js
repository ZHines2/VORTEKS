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
  let costStr = '';
  
  // Add energy cost if card has one
  if (card.cost > 0) {
    costStr += `${card.cost}🔆`;
  }
  
  // Add life cost if the card has one
  if (card.effects?.lifeCost) {
    if (costStr) costStr += ' '; // Add space if we already have energy cost
    costStr += `${card.effects.lifeCost}❤`;
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
  if (p.status.hopeAmount && p.status.hopeTurns > 0) {
    addTag(`🕊 Hope ${p.status.hopeAmount} (${p.status.hopeTurns})`);
  }
  if (p.status.infect && p.status.infect > 0) {
    addTag(`🦠 Infect ${p.status.infect}`);
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
    parts.push(`Foe -${st.freezeEnergy} 🔆 next.`); 
  }
  if (self.nextPlus) { 
    parts.push(`+${self.nextPlus} next atk.`); 
  }
  if (self.maxEnergyDelta) { 
    parts.push(`+${self.maxEnergyDelta} max 🔆.`); 
  }
  if (self.energyNowDelta) { 
    parts.push(`+${self.energyNowDelta} 🔆 now.`); 
  }
  if (c.id === 'echo') { 
    parts.push('Repeat last non‑Echo, else draw 1.'); 
  }
  if (c.id === 'reconsider') {
    parts.push('Costs 3 energy. Reshuffle your deck (discard → deck).');
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
  if (c.id === 'ferriglobin') {
    parts.push('Transform all your shield into health.');
  }
  if (c.id === 'hope') {
    parts.push('Heal 1-5 HP per turn for 3 turns. Effect stacks.');
  }
  
  // Add stolen card indicator text
  if (c.stolenFrom) {
    parts.push('STOLEN - Returns to opponent when played.');
  }
  
  return parts.join(' ');
}

// Helper function to safely clone player objects for prediction, handling circular references from stolen cards
function clonePlayerForPrediction(player) {
  const clone = {
    isAI: player.isAI,
    hp: player.hp,
    maxHP: player.maxHP,
    shield: player.shield,
    energy: player.energy,
    maxEnergy: player.maxEnergy,
    lastPlayed: player.lastPlayed ? cloneCardForPrediction(player.lastPlayed) : null,
    status: { ...player.status },
    quirk: player.quirk,
    deck: player.deck.map(cloneCardForPrediction),
    hand: player.hand.map(cloneCardForPrediction),
    discard: player.discard.map(cloneCardForPrediction)
  };
  
  // Add player methods needed for prediction
  clone.canAfford = player.canAfford;
  clone.spend = player.spend;
  clone.draw = player.draw;
  clone.removeFromHand = player.removeFromHand;
  
  return clone;
}

// Helper function to clone cards without circular references
function cloneCardForPrediction(card) {
  if (!card) return null;
  
  const cardClone = { ...card };
  
  // Remove circular references that could cause issues
  if (cardClone.stolenFrom) {
    cardClone.stolenFrom = cardClone.stolenFrom; // Keep the string identifier
    delete cardClone.originalOwner; // Remove the circular reference to player object
  }
  
  return cardClone;
}

export function predictCard(card, me, them, Game) {
  // Deep clone players while handling circular references from stolen cards
  const meClone = clonePlayerForPrediction(me);
  const themClone = clonePlayerForPrediction(them);
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
    out.push(`-1🔆 next`); 
  }
  if (card.id === 'star') { 
    out.push(`next +2`); 
  }
  if (card.id === 'loop') { 
    out.push(`+1🔆 max`); 
  }
  if (card.id === 'ferriglobin') {
    const shieldToConvert = beforeMeSh; // Use shield before card effect
    if (shieldToConvert > 0) {
      out.push(`${shieldToConvert} sh→hp`);
    } else {
      out.push('no shield');
    }
  }
  if (card.id === 'echo' && (!me.lastPlayedThisTurn || me.lastPlayedThisTurn.id === 'echo')) {
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

// New visual effects for cards that didn't have them
export function fxHeal(player) {
  const hpSpan = player.isAI ? $('#oppHP') : $('#youHP');
  if (!hpSpan) return;
  hpSpan.classList.add('heal-glow');
  setTimeout(() => hpSpan.classList.remove('heal-glow'), 800);
}

export function fxGuard(player) {
  const shieldSpan = player.isAI ? $('#oppSH') : $('#youSH');
  if (!shieldSpan) return;
  shieldSpan.classList.add('shield-shimmer');
  setTimeout(() => shieldSpan.classList.remove('shield-shimmer'), 700);
}

export function fxStrike(target) {
  const panel = target.isAI ? $('#oppPanel') : $('#youPanel');
  if (!panel) return;
  panel.classList.add('impact-flash');
  setTimeout(() => panel.classList.remove('impact-flash'), 350);
}

// Tournament UI Functions
export function initTournamentUI() {
  // Hide regular game UI and show tournament UI
  const wrap = document.querySelector('.wrap');
  const tournamentUI = document.getElementById('tournamentUI');
  
  if (wrap) wrap.style.display = 'none';
  if (tournamentUI) tournamentUI.hidden = false;
  
  // Set up tournament event handlers
  setupTournamentEventHandlers();
  
  // Initial render
  renderTournamentUI();
}

function setupTournamentEventHandlers() {
  // End turn button
  const endTurnBtn = document.getElementById('tournamentEndTurn');
  if (endTurnBtn) {
    endTurnBtn.onclick = () => {
      if (window.Tournament) {
        window.Tournament.endPlayerTurn();
      }
    };
  }
  
  // Quit tournament button
  const quitBtn = document.getElementById('tournamentQuit');
  if (quitBtn) {
    quitBtn.onclick = () => {
      if (window.Tournament) {
        window.Tournament.resetToStart();
      }
      hideTournamentUI();
    };
  }
}

export function renderTournamentUI() {
  if (!window.Tournament) return;
  
  renderTournamentParticipants();
  renderTournamentPlayerHand();
  renderTournamentStatus();
}

function renderTournamentParticipants() {
  if (!window.Tournament || !window.Tournament.participants) return;
  
  const participants = window.Tournament.participants;
  const player = participants.find(p => p.isPlayer);
  const opponents = participants.filter(p => !p.isPlayer);
  
  // Render player card
  renderPlayerCard(player);
  
  // Render opponent cards
  renderOpponentCards(opponents);
}

function renderPlayerCard(player) {
  if (!player) return;
  
  const playerCard = document.getElementById('tournamentPlayerCard');
  if (!playerCard) return;
  
  const hpSpan = document.getElementById('tournamentPlayerHP');
  const shieldSpan = document.getElementById('tournamentPlayerShield');
  const energySpan = document.getElementById('tournamentPlayerEnergy');
  const statusDiv = document.getElementById('tournamentPlayerStatus');
  
  if (hpSpan) hpSpan.textContent = player.hp;
  if (shieldSpan) shieldSpan.textContent = player.shield || 0;
  if (energySpan) energySpan.textContent = player.energy || 0;
  
  // Update status
  if (statusDiv) {
    statusDiv.innerHTML = '';
    if (player.status) {
      if (player.status.burn && player.status.burnTurns > 0) {
        statusDiv.innerHTML += `🔥 ${player.status.burn}(${player.status.burnTurns}) `;
      }
      if (player.status.nextPlus) {
        statusDiv.innerHTML += `✨ +${player.status.nextPlus} `;
      }
    }
  }
  
  // Highlight if it's player's turn
  const currentParticipant = window.Tournament.participants[window.Tournament.currentParticipantIndex];
  if (currentParticipant && currentParticipant.isPlayer) {
    playerCard.classList.add('current-turn');
  } else {
    playerCard.classList.remove('current-turn');
  }
  
  // Check if eliminated
  if (player.hp <= 0) {
    playerCard.classList.add('eliminated');
  } else {
    playerCard.classList.remove('eliminated');
  }
}

function renderOpponentCards(opponents) {
  const opponentsGrid = document.getElementById('tournamentOpponents');
  if (!opponentsGrid) return;
  
  opponentsGrid.innerHTML = '';
  
  opponents.forEach((opponent, index) => {
    const card = document.createElement('div');
    card.className = 'tournament-card';
    card.id = `tournament-opponent-${index}`;
    
    // Check if it's this opponent's turn
    const currentParticipant = window.Tournament.participants[window.Tournament.currentParticipantIndex];
    if (currentParticipant === opponent) {
      card.classList.add('current-turn');
    }
    
    // Check if eliminated
    if (opponent.hp <= 0) {
      card.classList.add('eliminated');
    }
    
    card.innerHTML = `
      <div class="card-header">${opponent.name}</div>
      <div class="card-stats">
        <div class="stat">❤${opponent.hp}</div>
        <div class="stat">🛡${opponent.shield || 0}</div>
        <div class="stat">🔆${opponent.energy || 0}</div>
      </div>
      <div class="card-status">
        ${opponent.status?.burn && opponent.status.burnTurns > 0 ? `🔥 ${opponent.status.burn}(${opponent.status.burnTurns})` : ''}
        ${opponent.status?.nextPlus ? `✨ +${opponent.status.nextPlus}` : ''}
      </div>
    `;
    
    opponentsGrid.appendChild(card);
  });
}

function renderTournamentPlayerHand() {
  if (!window.Tournament || !window.Tournament.you) return;
  
  const player = window.Tournament.you;
  const handDiv = document.getElementById('tournamentHand');
  if (!handDiv) return;
  
  handDiv.innerHTML = '';
  
  player.hand.forEach((card, index) => {
    const cardElement = document.createElement('button');
    cardElement.className = 'card tournament-hand-card';
    
    // Create proper card layout like in regular game
    const cost = `<div class="cost">${renderCost(card)}</div>`;
    const typeIcon = getCardTypeIcon(card.type);
    const typeIndicator = `<div class="card-type" title="${card.type} card">${typeIcon}</div>`;
    const stolenIndicator = card.stolenFrom ? 
      `<div class="stolen-indicator" title="Stolen card - returns to opponent when played">🎭</div>` : '';
    
    // Set innerHTML FIRST before adding event handlers
    cardElement.innerHTML = `${cost}${typeIndicator}${stolenIndicator}<div class="sym">${card.sym}</div><div class="nm">${card.name}</div><div class="ct">${cardText(card)}</div>`;
    
    // Add styling for stolen cards
    if (card.stolenFrom) {
      cardElement.classList.add('stolen');
    }
    
    // Check if card is playable and add event handlers AFTER setting innerHTML
    if (player.energy >= card.cost) {
      cardElement.classList.add('playable');
      cardElement.style.cursor = 'pointer';
      
      cardElement.onclick = () => {
        playTournamentCard(card, index);
      };
    } else {
      cardElement.classList.add('unplayable');
    }
    
    handDiv.appendChild(cardElement);
  });
}

function playTournamentCard(card, cardIndex) {
  if (!window.Tournament) return;
  
  const player = window.Tournament.you;
  const currentParticipant = window.Tournament.participants[window.Tournament.currentParticipantIndex];
  
  // Only allow playing cards on player's turn
  if (!currentParticipant || !currentParticipant.isPlayer) {
    return;
  }
  
  // If card needs a target, show target selection
  if (card.type === 'attack' || (card.effects && card.effects.needsTarget)) {
    showTargetSelection(card, cardIndex);
  } else {
    // Play card without target
    window.Tournament.playCard(player, card);
    renderTournamentUI();
  }
}

function showTargetSelection(card, cardIndex) {
  const prompt = document.getElementById('tournamentTargetPrompt');
  const targetsDiv = document.getElementById('tournamentTargets');
  
  if (!prompt || !targetsDiv) return;
  
  const validTargets = window.Tournament.getValidTargets();
  
  targetsDiv.innerHTML = '';
  
  validTargets.forEach(target => {
    const targetBtn = document.createElement('button');
    targetBtn.className = 'target-btn';
    targetBtn.textContent = `${target.name} (❤${target.hp})`;
    
    targetBtn.onclick = () => {
      window.Tournament.playCard(window.Tournament.you, card, target);
      hideTargetSelection();
      renderTournamentUI();
    };
    
    targetsDiv.appendChild(targetBtn);
  });
  
  // Add cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'target-btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.background = 'var(--bad)';
  cancelBtn.onclick = hideTargetSelection;
  targetsDiv.appendChild(cancelBtn);
  
  prompt.hidden = false;
}

function hideTargetSelection() {
  const prompt = document.getElementById('tournamentTargetPrompt');
  if (prompt) prompt.hidden = true;
}

function renderTournamentStatus() {
  if (!window.Tournament) return;
  
  const aliveSpan = document.getElementById('tournamentAlive');
  const turnSpan = document.getElementById('tournamentTurn');
  
  if (aliveSpan) {
    const alive = window.Tournament.participants.filter(p => p.hp > 0).length;
    aliveSpan.textContent = `${alive} Fighters Remaining`;
  }
  
  if (turnSpan) {
    turnSpan.textContent = `Turn: ${window.Tournament.turnCount}`;
  }
}

export function hideTournamentUI() {
  // Show regular game UI and hide tournament UI
  const wrap = document.querySelector('.wrap');
  const tournamentUI = document.getElementById('tournamentUI');
  
  if (wrap) wrap.style.display = 'block';
  if (tournamentUI) tournamentUI.hidden = true;
}

// Make tournament functions available globally
window.initTournamentUI = initTournamentUI;
window.renderTournamentUI = renderTournamentUI;
window.hideTournamentUI = hideTournamentUI;