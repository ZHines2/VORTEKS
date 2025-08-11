import { Game, setLogFunction } from './game.js';
import { initFaceGenerator, drawOppFace, setOpponentName } from './face-generator.js';
import { createRenderFunction, bump, bumpHP, bumpShield } from './ui.js';
import { openDeckBuilder, buildRandomDeck } from './deck-builder.js';
import { runSelfTests } from './tests.js';
import { makePersonaDeck } from './ai.js';
import { $ } from './utils.js';

// Log setup
const logBox = $('#log');
function log(t) {
  const p = document.createElement('div');
  p.textContent = '> ' + t;
  logBox.prepend(p);
}
setLogFunction(log);

// Face generator must be initialized once
initFaceGenerator();

// Create render function and expose minimal window API expected by Game
const render = createRenderFunction(Game);
window.openDeckBuilder = openDeckBuilder;
window.buildRandomDeck = buildRandomDeck;
window.render = render;
window.bump = bump;
window.bumpHP = bumpHP;
window.bumpShield = bumpShield;

// Controls
$('#endTurn').onclick = () => Game.endTurn();
$('#restart').onclick = () => {
  log('—');
  showStart();
};
$('#rerollFace').onclick = () => {
  const faceInfo = drawOppFace();
  Game.persona = faceInfo.persona;
  setOpponentName(Game.persona);
  // Rebuild opponent deck to match new face/persona and redraw their hand to same size
  const keepN = Game.opp && Game.opp.hand ? Game.opp.hand.length : 5;
  if (Game.opp) {
    Game.opp.deck = makePersonaDeck(Game.persona);
    Game.opp.hand = [];
    Game.opp.discard = [];
    Game.opp.draw(keepN || 5);
  }
  log('Opponent shifts to ' + Game.persona + ' persona. Deck re-tuned.');
  if (Game.you && Game.opp) render();
};
$('#selfTest')?.addEventListener('click', () => runSelfTests(Game, log, showStart));

// Start screen
function showStart() {
  const modal = document.getElementById('startModal');
  modal.hidden = false;
  document.getElementById('startBtn').onclick = () => {
    modal.hidden = true;
    Game.init();
  };
  document.getElementById('quickBtn').onclick = () => {
    modal.hidden = true;
    Game.initQuick();
  };
}

// Boot
showStart();