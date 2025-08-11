import { Game, setLogFunction } from './game.js';
import { createRenderFunction, bump, bumpHP, bumpShield } from './ui.js';
import { openDeckBuilder, buildRandomDeck } from './deck-builder.js';
import { runSelfTests } from './tests.js';
import { initFaceGenerator, drawOppFace, setOpponentName } from './face-generator.js';
import { makePersonaDeck } from './ai.js';

const MUSIC_FILE = 'VORTEKS.mp3';
const LS_KEY = 'vorteks-muted';
const HELP_SHOWN_KEY = 'vorteks-help-shown';

let music;
const muteBtn = document.getElementById('muteBtn');
const helpBtn = document.getElementById('helpBtn');

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

  // Close modal on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !helpModal.hidden) {
      helpModal.hidden = true;
      localStorage.setItem(HELP_SHOWN_KEY, '1');
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

// --- Attach to window for modularity (if needed) ---
window.bump = bump;
window.bumpHP = bumpHP;
window.bumpShield = bumpShield;
window.openDeckBuilder = openDeckBuilder;
window.buildRandomDeck = buildRandomDeck;

// --- Game boot logic ---
document.addEventListener('DOMContentLoaded', () => {
  setupMusic();
  setupHelp();

  // Initialize face generator
  initFaceGenerator();

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
  document.getElementById('restart').onclick = () => { document.getElementById('startModal').hidden = false; };
  document.getElementById('selfTest').onclick = () => runSelfTests(Game, window.log, showStart);

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

  // Start screen logic
  function showStart() {
    const modal = document.getElementById('startModal');
    modal.hidden = false;
    document.getElementById('startBtn').onclick = ()=>{ modal.hidden=true; Game.init(); };
    document.getElementById('quickBtn').onclick = ()=>{ modal.hidden=true; Game.initQuick(); };
  }
  window.showStart = showStart;

  showStart();
});
