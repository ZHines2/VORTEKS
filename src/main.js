import { Game, setLogFunction } from './game.js';
import { createRenderFunction, bump, bumpHP, bumpShield } from './ui.js';
import { openDeckBuilder, buildRandomDeck } from './deck-builder.js';
import { runSelfTests } from './tests.js';
import { initFaceGenerator, drawOppFace, setOpponentName } from './face-generator.js';
import { makePersonaDeck } from './ai.js';
import { MOTTOS } from './mottos.js';
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
  debugUnlock,
  checkPersonaDefeatUnlocks,
  checkAchievementUnlocks,
  recordBattleResult
} from './card-unlock.js';

const MUSIC_FILE = 'VORTEKS.mp3';
const LS_KEY = 'vorteks-muted';
const HELP_SHOWN_KEY = 'vorteks-help-shown';

let music;
const muteBtn = document.getElementById('muteBtn');
const helpBtn = document.getElementById('helpBtn');
const unlocksBtn = document.getElementById('unlocksBtn');
const glossaryBtn = document.getElementById('glossaryBtn');

function setupMusic() {
  music = new Audio(MUSIC_FILE);
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

function setupHelp() {
  const helpModal = document.getElementById('helpModal');
  const helpCloseBtn = document.getElementById('helpCloseBtn');

  // Help button click handler
  helpBtn.addEventListener('click', () => {
    helpModal.hidden = false;
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
        'victoryModal'
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
          const costText = ` (${renderCost(card)}⚡)`;
          const description = unlocked ? getCardDescription(card) : (cardMeta?.progress || 'Locked');
          
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

// --- Game boot logic ---
document.addEventListener('DOMContentLoaded', () => {
  setupMusic();
  setupHelp();
  setupGlossary();

  // Initialize face generator
  initFaceGenerator();

  // Setup title image fallback logic
  setupTitleImage();

  // Setup clear unlocks functionality
  setupClearUnlocks();

  // Usual game boot
  setLogFunction(function log(entry){
    const logBox = document.getElementById('log');
    if (typeof entry === 'string') {
      const p = document.createElement('div');
      p.textContent = '> ' + entry;
      logBox.prepend(p);
    } else if (entry && typeof entry === 'object') {
      // actor-aware
      const p = document.createElement('div');
      p.textContent = `[${entry.actor}] ${entry.text}`;
      logBox.prepend(p);
    }
  });

  window.render = createRenderFunction(Game);

  // Controls
  document.getElementById('endTurn').onclick = () => Game.endTurn();
  document.getElementById('restart').onclick = () => { 
    Game.clearLog();
    document.getElementById('startModal').hidden = false; 
  };
  document.getElementById('selfTest').onclick = () => runSelfTests(Game, window.log, showStart);

  // Victory modal event handlers
  document.getElementById('nextBattleBtn').onclick = () => Game.nextBattle();
  document.getElementById('victoryUnlocksBtn').onclick = () => {
    renderUnlocksModal();
    document.getElementById('unlocksModal').hidden = false;
  };
  document.getElementById('victoryDeckBtn').onclick = () => {
    document.getElementById('victoryModal').hidden = true;
    Game.init(); // Return to deck builder flow
  };
  document.getElementById('victoryRestartBtn').onclick = () => Game.resetGameToStart();

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
      Game.activateEasterEggMechanic(Game.oppFeatures.placeholderMechanic);
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
      div.innerHTML = `<strong>${card.id.toUpperCase()}</strong><br/><small>${card.description}</small><br/><em>${status}</em>`;
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
        resetUnlocks();
        renderUnlocksModal();
      }
    });
  }

  // Start screen logic
  function showStart() {
    const modal = document.getElementById('startModal');
    modal.hidden = false;
    
    // Set random motto
    const mottoElement = document.getElementById('motto');
    if (mottoElement && MOTTOS.length > 0) {
      const randomMotto = MOTTOS[Math.floor(Math.random() * MOTTOS.length)];
      mottoElement.textContent = randomMotto;
    }
    
    renderQuirkGrid(); // Render dynamic quirk grid when showing start
    document.getElementById('startBtn').onclick = ()=>{ modal.hidden=true; Game.init(); };
    document.getElementById('quickBtn').onclick = ()=>{ modal.hidden=true; Game.initQuick(); };
  }
  window.showStart = showStart;

  // Expose Game functions for UI event handlers
  window.Game = Game;

  showStart();
});
