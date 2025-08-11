import { Game, setLogFunction } from './game.js';
import { createRenderFunction, bump, bumpHP, bumpShield } from './ui.js';
import { openDeckBuilder, buildRandomDeck } from './deck-builder.js';
import { runSelfTests } from './tests.js';

const MUSIC_FILE = 'VORTEKS.mp3';
const LS_KEY = 'vorteks-muted';

let music;
const muteBtn = document.getElementById('muteBtn');

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

// --- Attach to window for modularity (if needed) ---
window.bump = bump;
window.bumpHP = bumpHP;
window.bumpShield = bumpShield;
window.openDeckBuilder = openDeckBuilder;
window.buildRandomDeck = buildRandomDeck;

// --- Game boot logic ---
document.addEventListener('DOMContentLoaded', () => {
  setupMusic();

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
