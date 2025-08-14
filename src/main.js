import { Game, setLogFunction } from './game.js';
import { createRenderFunction, bump, bumpHP, bumpShield, fxBurn, fxFreeze, fxZap, fxFocus, fxSlash, fxSurge, fxEcho, fxReconsider } from './ui.js';
import { openDeckBuilder, buildRandomDeck } from './deck-builder.js';
import { runSelfTests } from './tests.js';
import { initFaceGenerator, drawOppFace, setOpponentName } from './face-generator.js';
import { makePersonaDeck, createAIPlayer } from './ai.js';
import { createPlayer } from './player.js';
import { MOTTOS } from './mottos.js';
import { CARDS } from '../data/cards.js';
import { Campaign } from './campaign.js';
import { 
  getUnlockedCards, 
  isCardUnlocked, 
  unlockCard, 
  getUnlockableCardsInfo, 
  getUnlockableQuirksInfo,
  isQuirkUnlocked,
  getUnlockedQuirks,
  unlockQuirk,
  resetUnlocks,
  resetQuirks, 
  debugUnlock,
  checkPersonaDefeatUnlocks,
  checkAchievementUnlocks,
  recordBattleResult
} from './card-unlock.js';
import {
  loadTelemetry,
  saveTelemetry,
  resetTelemetry,
  getTelemetry,
  recordBattle,
  recordCardPlayed,
  recordCombat,
  recordTurn,
  recordQuirk,
  recordOpponent,
  recordAchievement,
  getAnalytics
} from './telemetry.js';

const MUSIC_FILE = 'VORTEKS.mp3';
const LS_KEY = 'vorteks-muted';
const HELP_SHOWN_KEY = 'vorteks-help-shown';
const DEFEATED_KEY = 'vorteks-defeated';
const QUIRK_KEY = 'vorteks-selected-quirk';

// Initialize telemetry system
loadTelemetry();

let music;
window.music = null; // Make music accessible globally for sound functions
const muteBtn = document.getElementById('muteBtn');
const helpBtn = document.getElementById('helpBtn');
const unlocksBtn = document.getElementById('unlocksBtn');
const glossaryBtn = document.getElementById('glossaryBtn');
const defeatedBtn = document.getElementById('defeatedBtn');
const telemetryBtn = document.getElementById('telemetryBtn');

// Defeated opponents helper functions
function loadDefeatedOpponents() {
  try {
    const data = localStorage.getItem(DEFEATED_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('Failed to load defeated opponents:', e);
    return [];
  }
}

function saveDefeatedOpponents(list) {
  try {
    localStorage.setItem(DEFEATED_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save defeated opponents:', e);
  }
}

function recordDefeatedOpponent(name, persona) {
  if (!name || !persona || name === 'NAME') return;
  
  const defeated = loadDefeatedOpponents();
  const timestamp = new Date().toISOString();
  
  // Check for duplicates (same name and persona)
  const exists = defeated.some(entry => entry.name === name && entry.persona === persona);
  if (!exists) {
    defeated.push({ name, persona, timestamp });
    saveDefeatedOpponents(defeated);
  }
}

function clearDefeatedOpponents() {
  saveDefeatedOpponents([]);
}

// Quirk persistence helper functions
function loadSelectedQuirk() {
  try {
    return localStorage.getItem(QUIRK_KEY);
  } catch (e) {
    console.warn('Failed to load selected quirk:', e);
    return null;
  }
}

function saveSelectedQuirk(quirkId) {
  try {
    if (quirkId) {
      localStorage.setItem(QUIRK_KEY, quirkId);
    } else {
      localStorage.removeItem(QUIRK_KEY);
    }
  } catch (e) {
    console.warn('Failed to save selected quirk:', e);
  }
}

function setupDefeatedOpponents() {
  const defeatedModal = document.getElementById('defeatedModal');
  const defeatedCloseBtn = document.getElementById('defeatedCloseBtn');
  const defeatedClearBtn = document.getElementById('defeatedClearBtn');

  // Defeated button click handler
  defeatedBtn.addEventListener('click', () => {
    renderDefeatedOpponents();
    defeatedModal.hidden = false;
  });

  // Close button handler
  defeatedCloseBtn.addEventListener('click', () => {
    defeatedModal.hidden = true;
  });

  // Clear button handler
  defeatedClearBtn.addEventListener('click', () => {
    const confirmed = confirm('Clear defeated opponents history? This cannot be undone.');
    if (confirmed) {
      clearDefeatedOpponents();
      renderDefeatedOpponents();
    }
  });

  // Telemetry modal setup
  const telemetryModal = document.getElementById('telemetryModal');
  const telemetryCloseBtn = document.getElementById('telemetryCloseBtn');
  const telemetryResetBtn = document.getElementById('telemetryResetBtn');

  // Telemetry button click handler
  telemetryBtn.addEventListener('click', () => {
    renderTelemetryData();
    telemetryModal.hidden = false;
  });

  // Telemetry close button handler
  telemetryCloseBtn.addEventListener('click', () => {
    telemetryModal.hidden = true;
  });

  // Telemetry reset button handler
  telemetryResetBtn.addEventListener('click', () => {
    const confirmed = confirm('Reset all analytics data? This cannot be undone.');
    if (confirmed) {
      resetTelemetry();
      renderTelemetryData();
    }
  });

  function renderTelemetryData() {
    const analytics = getAnalytics();
    
    // Battle Statistics
    const battleStatsEl = document.getElementById('telemetryBattleStats');
    battleStatsEl.innerHTML = `
      <div><strong>Total Games:</strong> ${analytics.battles.totalGames}</div>
      <div><strong>Record:</strong> ${analytics.battles.wins}W - ${analytics.battles.losses}L (${analytics.battles.winRate})</div>
      <div><strong>Current Streak:</strong> ${analytics.battles.currentStreak} | <strong>Best Streak:</strong> ${analytics.battles.bestStreak}</div>
      <div><strong>Perfect Wins:</strong> ${analytics.battles.perfectWins} | <strong>Quick Wins:</strong> ${analytics.battles.quickWins}</div>
    `;
    
    // Card Usage Analysis
    const cardStatsEl = document.getElementById('telemetryCardStats');
    const favoriteCardName = analytics.cards.favoriteCard ? 
      CARDS.find(c => c.id === analytics.cards.favoriteCard)?.name || analytics.cards.favoriteCard : 'None';
    
    cardStatsEl.innerHTML = `
      <div><strong>Cards Played:</strong> ${analytics.cards.totalPlayed} (${analytics.cards.uniqueCards} unique)</div>
      <div><strong>Favorite Card:</strong> ${favoriteCardName} (${analytics.cards.favoriteCount} times)</div>
      <div><strong>Type Distribution:</strong> ⚔${analytics.cards.typeDistribution.attack} 🛠${analytics.cards.typeDistribution.skill} 💎${analytics.cards.typeDistribution.power}</div>
    `;
    
    // Gameplay Patterns
    const patternsEl = document.getElementById('telemetryPatterns');
    patternsEl.innerHTML = `
      <div><strong>Combat Efficiency:</strong> ${analytics.combat.efficiency} damage per energy</div>
      <div><strong>Total Damage:</strong> ${analytics.combat.totalDamage} dealt | ${analytics.combat.damageTaken} taken</div>
      <div><strong>Healing/Shield:</strong> ${analytics.combat.healingReceived || 0} healed | ${analytics.combat.shieldGained || 0} shield</div>
      <div><strong>Max Single Hit:</strong> ${analytics.combat.maxSingleHit} | <strong>Max Energy:</strong> ${analytics.combat.maxEnergyReached}</div>
      <div><strong>Turn Efficiency:</strong> ${analytics.turns.avgCardsPerTurn} cards, ${analytics.turns.avgEnergyPerTurn} energy per turn</div>
      <div><strong>Echo Uses:</strong> ${analytics.turns.echoUses} | <strong>All-Energy Turns:</strong> ${analytics.turns.efficiencyTurns}</div>
    `;
    
    // Achievement Progress  
    const achievementsEl = document.getElementById('telemetryAchievements');
    const quirkName = analytics.quirks.favorite || 'None';
    const targetName = analytics.opponents.favoriteTarget || 'None';
    
    achievementsEl.innerHTML = `
      <div><strong>Achievements Unlocked:</strong> ${analytics.achievements.unlockedCount}</div>
      <div><strong>Favorite Quirk:</strong> ${quirkName} (${analytics.quirks.favoriteCount} times)</div>
      <div><strong>Opponents Defeated:</strong> ${analytics.opponents.uniqueDefeated} types | <strong>Favorite Target:</strong> ${targetName}</div>
      <div><strong>Easter Eggs Seen:</strong> ${analytics.opponents.easterEggsSeen} | <strong>Play Time:</strong> ${analytics.session.playTime}</div>
      <div><strong>First Played:</strong> ${analytics.session.firstPlayed}</div>
    `;
  }

  function renderDefeatedOpponents() {
    const defeatedList = document.getElementById('defeatedList');
    const defeated = loadDefeatedOpponents();
    
    if (defeated.length === 0) {
      defeatedList.innerHTML = '<div style="text-align:center; color:var(--ink); opacity:0.7; padding:20px;">No opponents defeated yet.</div>';
      return;
    }
    
    defeated.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first
    
    defeatedList.innerHTML = defeated.map(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      return `<div style="border:1px solid var(--border); padding:8px; margin-bottom:8px; background:black;">
        <div style="color:var(--accent); font-weight:bold;">${entry.name}</div>
        <div style="color:var(--ink); opacity:0.8; font-size:10px;">${entry.persona} • ${date}</div>
      </div>`;
    }).join('');
  }
}

function setupMusic() {
  music = new Audio(MUSIC_FILE);
  window.music = music; // Make music accessible globally
  music.loop = true;
  music.volume = 0.7;
  // Restore mute state from localStorage
  const muted = localStorage.getItem(LS_KEY) === '1';
  music.muted = muted;
  updateMuteBtn(muted);

  // Play after user gesture (browser policy)
  const tryPlay = () => {
    if (music.paused) music.play().catch(()=>{});
    window.removeEventListener('pointerdown', tryPlay);
    window.removeEventListener('keydown', tryPlay);
  };
  window.addEventListener('pointerdown', tryPlay);
  window.addEventListener('keydown', tryPlay);

  muteBtn.addEventListener('click', () => {
    const nowMuted = !music.muted;
    music.muted = nowMuted;
    localStorage.setItem(LS_KEY, nowMuted ? '1' : '0');
    updateMuteBtn(nowMuted);
  });
}

function updateMuteBtn(muted) {
  muteBtn.textContent = muted ? '🔇' : '🔊';
  muteBtn.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
}

// Create and play a bell sound for achievement unlocks
window.playUnlockSound = function() {
  try {
    // Create a simple bell-like tone using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure the bell sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // High pitch
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3); // Decay
    
    // Volume envelope for bell-like sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8); // Slow decay
    
    // Play the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
    
    // Respect music mute setting
    if (window.music && window.music.muted) {
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    }
  } catch (e) {
    // Fallback: create a simple beep if Web Audio API fails
    console.warn('Could not create bell sound:', e);
  }
};

function setupHelp() {
  const helpModal = document.getElementById('helpModal');
  const helpCloseBtn = document.getElementById('helpCloseBtn');
  
  // Tab switching functionality
  function setupHelpTabs() {
    const tabs = helpModal.querySelectorAll('.help-tab');
    const panels = helpModal.querySelectorAll('.help-panel');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Remove active class from all tabs and hide all panels
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.style.display = 'none');
        
        // Activate clicked tab and show corresponding panel
        tab.classList.add('active');
        const targetPanel = helpModal.querySelector(`[data-panel="${targetTab}"]`);
        if (targetPanel) {
          targetPanel.style.display = 'block';
        }
      });
    });
  }

  // Help button click handler
  helpBtn.addEventListener('click', () => {
    helpModal.hidden = false;
    // Initialize tabs if not already done
    if (!helpModal.dataset.tabsInitialized) {
      setupHelpTabs();
      helpModal.dataset.tabsInitialized = 'true';
    }
  });

  // Close button handler
  helpCloseBtn.addEventListener('click', () => {
    helpModal.hidden = true;
    // Mark help as shown for future visits
    localStorage.setItem(HELP_SHOWN_KEY, '1');
  });

  // Global ESC key handler for modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close any open modals
      const modals = [
        'helpModal',
        'deckModal', 
        'quirkModal',
        'unlocksModal',
        'glossaryModal',
        'victoryModal',
        'defeatedModal'
      ];
      
      modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal && !modal.hidden) {
          modal.hidden = true;
          
          // Special handling for deck builder - return to start
          if (modalId === 'deckModal' && window.showStart) {
            window.showStart();
          }
          
          // Mark help as shown if closed
          if (modalId === 'helpModal') {
            localStorage.setItem(HELP_SHOWN_KEY, '1');
          }
        }
      });
    }
  });

  // Auto-show for first-time players
  const hasSeenHelp = localStorage.getItem(HELP_SHOWN_KEY) === '1';
  if (!hasSeenHelp) {
    // Delay to ensure all modals are ready
    setTimeout(() => {
      const startModal = document.getElementById('startModal');
      // Only show if start modal is not visible
      if (startModal && startModal.hidden) {
        helpModal.hidden = false;
      }
    }, 500);
  }
}

function setupGlossary() {
  const glossaryModal = document.getElementById('glossaryModal');
  const glossaryCloseBtn = document.getElementById('glossaryCloseBtn');
  const glossaryGrid = document.getElementById('glossaryGrid');

  // Glossary button click handler
  glossaryBtn.addEventListener('click', () => {
    renderGlossary();
    glossaryModal.hidden = false;
  });

  // Close button handler
  glossaryCloseBtn.addEventListener('click', () => {
    glossaryModal.hidden = true;
  });

  function renderGlossary() {
    const cardsInfo = getUnlockableCardsInfo();
    // Get all cards including starters
    import('../data/cards.js').then(({ CARDS }) => {
      // Import renderCost for proper cost display
      import('./ui.js').then(({ renderCost }) => {
        glossaryGrid.innerHTML = '';
        
        CARDS.forEach(card => {
          const unlocked = isCardUnlocked(card.id);
          const cardMeta = cardsInfo.find(c => c.id === card.id);
          
          const div = document.createElement('div');
          div.className = 'qcard';
          if (!unlocked) {
            div.style.opacity = '0.5';
            div.style.filter = 'grayscale(1)';
          }
          
          // Use card.name without sym prefix, render sym separately  
          const cardName = card.name.startsWith(card.sym) ? card.name.substring(card.sym.length).trim() : card.name;
          const title = `${card.sym} ${cardName}`;
          const costText = ` (${renderCost(card)})`;
          const description = getCardDescription(card);
          
          div.innerHTML = `<strong>${title}${costText}</strong><br/><small>${description}</small>`;
          glossaryGrid.appendChild(div);
        });
      });
    });
  }

  function getCardDescription(card) {
    const parts = [];
    if (card.effects.damage > 0) parts.push(`${card.effects.damage} damage`);
    if (card.effects.heal > 0) parts.push(`Heal ${card.effects.heal}`);
    if (card.effects.shield > 0) parts.push(`+${card.effects.shield} shield`);
    if (card.effects.draw > 0) parts.push(`Draw ${card.effects.draw}`);
    if (card.effects.pierce) parts.push('Pierce');
    if (card.effects.reconsider) parts.push('Spend all energy. Reshuffle your deck.');
    if (card.status.target.burn) parts.push(`Burn ${card.status.target.burn.amount} for ${card.status.target.burn.turns} turns`);
    if (card.status.target.freezeEnergy > 0) parts.push(`Freeze ${card.status.target.freezeEnergy} energy`);
    if (card.status.self.nextPlus > 0) parts.push(`+${card.status.self.nextPlus} to next card`);
    if (card.status.self.maxEnergyDelta !== 0) parts.push(`${card.status.self.maxEnergyDelta > 0 ? '+' : ''}${card.status.self.maxEnergyDelta} max energy`);
    if (card.status.self.energyNowDelta !== 0) parts.push(`${card.status.self.energyNowDelta > 0 ? '+' : ''}${card.status.self.energyNowDelta} energy now`);
    
    return parts.length > 0 ? parts.join(', ') : 'Special effect';
  }
}

// --- Attach to window for modularity (if needed) ---
window.bump = bump;
window.bumpHP = bumpHP;
window.bumpShield = bumpShield;
window.openDeckBuilder = openDeckBuilder;
window.buildRandomDeck = buildRandomDeck;

// --- FX microinteraction helpers ---
window.fxBurn = fxBurn;
window.fxFreeze = fxFreeze;
window.fxZap = fxZap;
window.fxFocus = fxFocus;
window.fxSlash = fxSlash;
window.fxSurge = fxSurge;
window.fxEcho = fxEcho;
window.fxReconsider = fxReconsider;

// --- Expose unlock system for debugging ---
window.CardUnlock = {
  getUnlockedCards,
  isCardUnlocked,
  unlockCard,
  getUnlockableCardsInfo,
  getUnlockableQuirksInfo,
  isQuirkUnlocked,
  getUnlockedQuirks,
  unlockQuirk,
  resetUnlocks,
  debugUnlock,
  checkPersonaDefeatUnlocks,
  checkAchievementUnlocks,
  recordBattleResult
};

// --- Expose Game Stats for debugging ---
window.GameStats = {
  get current() {
    return window.Game ? window.Game.stats : null;
  },
  reset() {
    if (window.Game) {
      window.Game.stats = {
        maxEnergyDuringRun: 3,
        peakOverheal: 0,
        totalOverhealGained: 0,
        maxHandSizeTurn: 5,
        maxBurnAmount: 0,
        firstPerfectWin: false
      };
    }
  }
};

function clearSelectedQuirk() {
  saveSelectedQuirk(null);
}

// --- Game boot logic ---
document.addEventListener('DOMContentLoaded', () => {
  setupMusic();
  setupHelp();
  setupGlossary();
  setupDefeatedOpponents();

  // Initialize face generator
  initFaceGenerator();

  // Setup title image fallback logic
  setupTitleImage();

  // Setup clear unlocks functionality
  setupClearUnlocks();

  // Setup Campaign functionality
  setupCampaign();

  // Usual game boot
  const logFunction = function log(entry){
    const logBox = document.getElementById('log');
    if (typeof entry === 'string') {
      const p = document.createElement('div');
      
      // Make unlock notifications less prominent but add sound
      if (entry.includes('UNLOCKED')) {
        p.classList.add('unlock-notification');
        p.textContent = '> ' + entry;
        
        // Play a bell sound for achievement unlocks
        window.playUnlockSound();
      } else {
        p.textContent = '> ' + entry;
      }
      
      logBox.prepend(p);
    } else if (entry && typeof entry === 'object') {
      // actor-aware - map opponent logs to current opponent name
      let actor = entry.actor;
      if (actor === 'OPP' || actor === 'opp') {
        const oppNameEl = document.getElementById('oppName');
        if (oppNameEl && oppNameEl.textContent !== 'NAME') {
          actor = oppNameEl.textContent;
        }
      }
      const p = document.createElement('div');
      p.textContent = `[${actor}] ${entry.text}`;
      logBox.prepend(p);
    }
  };
  
  setLogFunction(logFunction);
  window.log = logFunction;

  window.render = createRenderFunction(Game);

  // Controls
  document.getElementById('endTurn').onclick = () => Game.endTurn();
  document.getElementById('restart').onclick = () => { 
    Game.clearLog();
    clearSelectedQuirk(); // Clear selected quirk on restart
    document.getElementById('startModal').hidden = false; 
  };
  document.getElementById('selfTest').onclick = () => runSelfTests(Game, logFunction, showStart);

  // Quirk selection handler
  window.onQuirkSelected = function(quirkId) {
    saveSelectedQuirk(quirkId);
    if (window.Game) {
      window.Game.selectedQuirk = quirkId;
    }
  };

  // Victory modal event handlers
  document.getElementById('nextBattleBtn').onclick = () => {
    recordCurrentDefeatedOpponent();
    
    // Check if we're in campaign mode
    if (Campaign.active) {
      // Handle campaign victory flow instead of normal next battle
      handleCampaignVictory();
    } else {
      Game.nextBattle();
    }
  };
  document.getElementById('victoryUnlocksBtn').onclick = () => {
    renderUnlocksModal();
    document.getElementById('unlocksModal').hidden = false;
  };
  document.getElementById('victoryDeckBtn').onclick = () => {
    recordCurrentDefeatedOpponent();
    document.getElementById('victoryModal').hidden = true;
    Game.init(); // Return to deck builder flow
  };
  document.getElementById('victoryRestartBtn').onclick = () => {
    recordCurrentDefeatedOpponent();
    Game.resetGameToStart();
  };

  function recordCurrentDefeatedOpponent() {
    if (Game && Game.persona) {
      const oppNameEl = document.getElementById('oppName');
      const oppName = oppNameEl ? oppNameEl.textContent : null;
      if (oppName && oppName !== 'NAME') {
        recordDefeatedOpponent(oppName, Game.persona);
      }
    }
  }

  // Unlocks modal event handlers
  document.getElementById('unlocksBtn').onclick = () => {
    renderUnlocksModal();
    document.getElementById('unlocksModal').hidden = false;
  };
  document.getElementById('unlocksCloseBtn').onclick = () => {
    document.getElementById('unlocksModal').hidden = true;
  };

  // Reroll Face button handler
  document.getElementById('rerollFace').onclick = () => {
    const faceInfo = drawOppFace();
    Game.persona = faceInfo.persona;
    Game.oppFeatures = faceInfo.features; // Store features for logging
    setOpponentName(Game.persona, Game.oppFeatures);
    // Rebuild opponent deck to match new face/persona and redraw their hand to same size
    const keepN = Game.opp.hand ? Game.opp.hand.length : 5;
    Game.opp.deck = makePersonaDeck(Game.persona);
    Game.opp.hand = [];
    Game.opp.discard = [];
    Game.opp.draw(keepN || 5);
    
    // Enhanced logging for easter eggs
    let logMessage = 'Opponent shifts to ' + Game.persona + ' persona. Deck re-tuned.';
    if (Game.oppFeatures.isEasterEgg) {
      logMessage = `✨ RARE FACE! ${Game.oppFeatures.easterEggType} ${Game.persona} appears! ✨ [${Game.oppFeatures.rarity.toUpperCase()}] Deck re-tuned.`;
    }
    if (window.log) window.log(logMessage);
    if (window.render) window.render();
  };

  // Quirk grid rendering
  function renderQuirkGrid() {
    const quirkGrid = document.getElementById('quirkGrid');
    const quirksInfo = getUnlockableQuirksInfo();
    
    quirkGrid.innerHTML = '';
    
    quirksInfo.forEach(quirk => {
      const div = document.createElement('div');
      div.className = 'qcard';
      div.setAttribute('data-quirk', quirk.id);
      
      if (!quirk.unlocked) {
        div.style.opacity = '0.5';
        div.style.filter = 'grayscale(1)';
        div.style.cursor = 'not-allowed';
      } else {
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
          if (quirk.unlocked) {
            // Set selected quirk and call the global handler
            document.querySelectorAll('.qcard').forEach(c => c.classList.remove('selected'));
            div.classList.add('selected');
            if (window.onQuirkSelected) {
              window.onQuirkSelected(quirk.id);
            }
          }
        });
      }
      
      const description = quirk.unlocked ? quirk.description : quirk.hint;
      div.innerHTML = `${quirk.name}<br/><small>${description}</small>`;
      quirkGrid.appendChild(div);
    });
  }

  // Unlocks modal rendering
  function renderUnlocksModal() {
    const cardsGrid = document.getElementById('unlocksCardsGrid');
    const quirksGrid = document.getElementById('unlocksQuirksGrid');
    
    // Render cards
    const cardsInfo = getUnlockableCardsInfo();
    cardsGrid.innerHTML = '';
    cardsInfo.forEach(card => {
      const div = document.createElement('div');
      div.className = 'qcard';
      if (!card.unlocked) {
        div.style.opacity = '0.5';
        div.style.filter = 'grayscale(1)';
      }
      
      const status = card.unlocked ? 'Unlocked' : card.progress;
      // Get the proper card name from CARDS data
      const cardData = CARDS.find(c => c.id === card.id);
      const cardName = cardData ? cardData.name.toUpperCase() : card.id.toUpperCase();
      div.innerHTML = `<strong>${cardName}</strong><br/><small>${card.description}</small><br/><em>${status}</em>`;
      cardsGrid.appendChild(div);
    });
    
    // Render quirks
    const quirksInfo = getUnlockableQuirksInfo();
    quirksGrid.innerHTML = '';
    quirksInfo.forEach(quirk => {
      const div = document.createElement('div');
      div.className = 'qcard';
      if (!quirk.unlocked) {
        div.style.opacity = '0.5';
        div.style.filter = 'grayscale(1)';
      }
      
      const status = quirk.unlocked ? 'Unlocked' : quirk.hint;
      div.innerHTML = `<strong>${quirk.name}</strong><br/><small>${quirk.description}</small><br/><em>${status}</em>`;
      quirksGrid.appendChild(div);
    });
  }

  // Setup title image with fallback logic
  function setupTitleImage() {
    const titleImg = document.getElementById('titleImg');
    const titleText = document.getElementById('titleText');
    
    if (!titleImg || !titleText) return;
    
    // Get fallback list from data-fallback attribute
    const fallbacks = titleImg.getAttribute('data-fallback')?.split(',') || [];
    let currentIndex = -1; // Start with the original src
    
    function tryNextImage() {
      currentIndex++;
      
      if (currentIndex === 0) {
        // Original src already set, just wait for load/error
        return;
      } else if (currentIndex <= fallbacks.length) {
        // Try fallback images
        const fallbackSrc = fallbacks[currentIndex - 1]?.trim();
        if (fallbackSrc) {
          titleImg.src = fallbackSrc;
        } else {
          // No more fallbacks, show text
          showTextFallback();
        }
      } else {
        // All fallbacks exhausted, show text
        showTextFallback();
      }
    }
    
    function showTextFallback() {
      titleImg.style.display = 'none';
      titleText.style.display = 'block';
    }
    
    function showImageSuccess() {
      titleImg.style.display = 'block';
      titleText.style.display = 'none';
    }
    
    // Set up event listeners
    titleImg.onload = showImageSuccess;
    titleImg.onerror = tryNextImage;
    
    // Start the fallback process
    tryNextImage();
  }

  // Setup clear unlocks functionality
  function setupClearUnlocks() {
    const unlocksClearBtn = document.getElementById('unlocksClearBtn');
    
    if (!unlocksClearBtn) return;
    
    // Clear unlocks button functionality
    unlocksClearBtn.addEventListener('click', () => {
      const confirmed = confirm('Clear ALL unlocks and achievements? This cannot be undone.');
      if (confirmed) {
        resetUnlocks(); // Reset card unlocks
        resetQuirks(); // Reset quirk unlocks  
        clearSelectedQuirk(); // Clear selected quirk
        clearDefeatedOpponents(); // Clear defeated opponents history
        renderUnlocksModal();
      }
    });
  }

  // Setup Campaign functionality
  function setupCampaign() {
    // Load existing campaign and show continue button if active
    if (Campaign.load()) {
      const continueBtn = document.getElementById('campaignContinueBtn');
      if (continueBtn) {
        continueBtn.hidden = false;
      }
    }
  }

  // Start screen logic
  function showStart() {
    const modal = document.getElementById('startModal');
    modal.hidden = false;
    
    // Append additional mottos at runtime for more variety
    const additionalMottos = [
      // Song lyric puns
      "Don't stop believin' in your deck composition!",
      "Sweet child o' mine... energy management",
      "We will, we will, VORTEKS you!",
      "Stayin' alive with 1 HP clutch plays",
      "Another one bites the... shield",
      "Bohemian Rhapsody: Is this the real life? Is this just strategy?",
      "Can't touch this! (Overhealed beyond belief)",
      "Eye of the Tiger: Rising up to the challenge of RNG",
      "We are the champions... of Unicode cards",
      "Poker Face: Keep them guessing your next move",

      // Literary and philosophical riffs  
      "To be or not to be... that is the mulligan",
      "I think, therefore I draw",
      "The pen is mightier than the sword... but cards beat both",
      "In the beginning was the Word... and the Word was VORTEKS",
      "All roads lead to victory... eventually",
      "Fortune favors the bold... and the well-constructed deck",
      "The die is cast... wait, wrong game",
      "Et tu, Brute? Et tu, energy shortage?",
      "Cogito ergo sum... cogito ergo I need more energy",
      "The unexamined deck is not worth playing",

      // More VORTEKS puns and mechanics
      "Energy efficiency: it's not just for appliances anymore",
      "Deck diversity: the spice of tactical life",
      "Mulligan decisions: harder than quantum physics",
      "RNG stands for 'Really Nice Gameplay' (citation needed)",
      "Status effects: because vanilla damage is so yesterday",
      "Card synergy: when 1+1 = VICTORY",
      "Hand management: like life management, but with more pixels",
      "Turn order: civilized combat since ancient times",
      "Resource allocation: MBA not required",
      "Meta gaming: thinking about thinking about playing",
      "Deck construction: building tomorrow's victory today",
      "Strategic depth: deeper than your average Unicode ocean",
      "Tactical brilliance: 99% preparation, 1% clicking buttons",
      "Victory conditions: clear as crystal, elusive as shadows",
      "Game balance: the eternal quest for perfect imperfection",

      // Additional classic references with VORTEKS twist
      "May the cards be with you",
      "Live long and prosper... with energy management",
      "Houston, we have a... perfect hand",
      "One small step for player, one giant leap for streak-kind",
      "That's one small mulligan for a player...",
      "Frankly my dear, I don't give a damn... about energy caps",
      "I'll be back... after this deck rebuild",
      "Show me the money... I mean, show me the energy",
      "You can't handle the truth... about optimal play",
      "Elementary, my dear Watson... always draw first"
    ];
    
    // Add the additional mottos to the existing array
    const allMottos = [...MOTTOS, ...additionalMottos];
    
    // Set random motto from expanded list
    const mottoElement = document.getElementById('motto');
    if (mottoElement && allMottos.length > 0) {
      const randomMotto = allMottos[Math.floor(Math.random() * allMottos.length)];
      mottoElement.textContent = randomMotto;
    }
    
    renderQuirkGrid(); // Render dynamic quirk grid when showing start
    document.getElementById('startBtn').onclick = ()=>{ modal.hidden=true; Game.init(); };
    document.getElementById('quickBtn').onclick = ()=>{ modal.hidden=true; Game.initQuick(); };
    
    // Campaign button handlers
    document.getElementById('campaignBtn').onclick = () => {
      modal.hidden = true;
      startNewCampaign();
    };
    
    document.getElementById('campaignContinueBtn').onclick = () => {
      modal.hidden = true;
      continueCampaign();
    };
  }
  window.showStart = showStart;

  // Expose Game functions for UI event handlers
  window.Game = Game;

  // Campaign Functions
  function startNewCampaign() {
    // Show quirk picker for campaign
    const quirkModal = document.getElementById('quirkModal');
    quirkModal.hidden = false;
    
    // Override quirk selection for campaign
    window.onQuirkSelected = (quirkId) => {
      Campaign.start(quirkId);
      quirkModal.hidden = true;
      initCampaignBattle();
    };
  }

  function continueCampaign() {
    if (Campaign.load()) {
      initCampaignBattle();
    } else {
      console.error('No campaign to continue');
      showStart();
    }
  }

  function initCampaignBattle() {
    // Initialize game with campaign settings
    Game.you = createPlayer(false);
    Game.opp = createPlayer(true);
    Game.ai = createAIPlayer(Game);
    
    // Set campaign deck
    Game.you.deck = Campaign.deck.map(cardId => ({ ...CARDS.find(c => c.id === cardId) }));
    Game.you.hand = [];
    Game.you.discard = [];
    Game.you.draw(5);
    
    // Set campaign quirk
    Game.selectedQuirk = Campaign.selectedQuirk;
    Game.you.quirk = Campaign.selectedQuirk;
    
    // Apply quirk effects
    Game.applyQuirkBattleStart(Game.you);
    
    // Generate opponent
    const faceInfo = drawOppFace();
    Game.persona = faceInfo.persona;
    Game.oppFeatures = faceInfo.features;
    setOpponentName(Game.persona, Game.oppFeatures);
    Game.opp.deck = makePersonaDeck(Game.persona, getUnlockedCards());
    
    // Initialize game state
    Game.over = false;
    Game.turn = 'you';
    Game.turnTypes = new Set();
    Game.playerTurnDamage = 0;
    
    // Show/hide appropriate UI elements
    updateCampaignUI();
    
    // Hide start modal and render
    document.getElementById('startModal').hidden = true;
    if (window.render) window.render();
    
    console.log('Campaign battle initialized');
  }

  function updateCampaignUI() {
    const streakPill = document.getElementById('streakPill');
    const boosterPill = document.getElementById('boosterPill');
    
    if (Campaign.active) {
      // Hide streak, show booster
      streakPill.hidden = true;
      boosterPill.hidden = false;
      document.getElementById('booster').textContent = Campaign.boosterLevel;
    } else {
      // Show streak, hide booster
      streakPill.hidden = false;
      boosterPill.hidden = true;
    }
  }

  // Setup Campaign modal event handlers
  setupCampaignModals();

  function setupCampaignModals() {
    // Campaign Reward Modal handlers
    document.getElementById('campaignRewardsConfirmBtn').onclick = () => {
      confirmCampaignRewards();
    };
    
    document.getElementById('campaignRewardsEditDeckBtn').onclick = () => {
      confirmCampaignRewards();
      showCampaignDeckEdit();
    };
    
    document.getElementById('campaignRewardsAbandonBtn').onclick = () => {
      if (confirm('Abandon this campaign run? All progress will be lost.')) {
        Campaign.abandon();
        document.getElementById('campaignRewardModal').hidden = true;
        showStart();
      }
    };
    
    // Campaign Deck Edit Modal handlers
    document.getElementById('campaignDeckContinueBtn').onclick = () => {
      document.getElementById('campaignDeckModal').hidden = true;
      initCampaignBattle(); // Start next battle
    };
    
    document.getElementById('campaignDeckAbandonBtn').onclick = () => {
      if (confirm('Abandon this campaign run? All progress will be lost.')) {
        Campaign.abandon();
        document.getElementById('campaignDeckModal').hidden = true;
        showStart();
      }
    };
  }

  function confirmCampaignRewards() {
    // Get reward selections from checkboxes
    const rewardElements = document.querySelectorAll('.campaign-reward-item input[type="checkbox"]');
    const selections = Array.from(rewardElements).map(el => el.checked);
    
    Campaign.acceptRewards(selections);
    document.getElementById('campaignRewardModal').hidden = true;
  }

  function showCampaignDeckEdit() {
    const modal = document.getElementById('campaignDeckModal');
    const deckList = document.getElementById('campaignDeckList');
    const deckCount = document.getElementById('campaignDeckCount');
    
    deckCount.textContent = Campaign.deck.length;
    
    // Render deck cards
    deckList.innerHTML = '';
    Campaign.deck.forEach((cardId, index) => {
      const card = CARDS.find(c => c.id === cardId);
      if (card) {
        const cardEl = document.createElement('div');
        cardEl.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px; margin:4px 0; background:rgba(255,255,255,0.1); border-radius:4px;';
        cardEl.innerHTML = `
          <span>${card.sym} ${card.name}</span>
          <button class="btn" ${Campaign.deck.length <= 10 ? 'disabled style="opacity:0.5"' : ''} onclick="removeCampaignCard(${index})">✖</button>
        `;
        deckList.appendChild(cardEl);
      }
    });
    
    modal.hidden = false;
  }

  function renderCampaignRewards(rewards) {
    const rewardsList = document.getElementById('campaignRewardsList');
    
    rewardsList.innerHTML = '';
    rewards.forEach((reward, index) => {
      const card = CARDS.find(c => c.id === reward.cardId);
      if (card) {
        const rewardEl = document.createElement('div');
        rewardEl.className = 'campaign-reward-item';
        rewardEl.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px; margin:4px 0; background:rgba(255,255,255,0.1); border-radius:4px;';
        
        const mandatoryLabel = reward.mandatory ? ' <span style="color:var(--bad)">(MANDATORY)</span>' : '';
        rewardEl.innerHTML = `
          <span>${card.sym} ${card.name}${mandatoryLabel}</span>
          <input type="checkbox" ${reward.accepted ? 'checked' : ''} ${reward.mandatory ? 'disabled' : ''}>
        `;
        rewardsList.appendChild(rewardEl);
      }
    });
  }

  // Global function for removing campaign cards
  window.removeCampaignCard = function(index) {
    if (Campaign.removeCard(index)) {
      showCampaignDeckEdit(); // Refresh the deck edit modal
    }
  };

  // Handle campaign victory flow
  function handleCampaignVictory() {
    // Hide victory modal first
    document.getElementById('victoryModal').hidden = true;
    
    // Get opponent deck for rewards
    const opponentDeck = Game.opp.deck.map(card => card.id);
    
    // Record victory and generate rewards
    const rewards = Campaign.recordVictory(opponentDeck);
    
    // Update UI
    updateCampaignUI();
    
    // Show campaign reward modal
    renderCampaignRewards(rewards);
    document.getElementById('campaignRewardModal').hidden = false;
  }

  showStart();
});
