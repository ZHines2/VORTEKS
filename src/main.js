import { Game, setLogFunction } from './game.js';
import { initFaceGenerator, drawOppFace, setOpponentName } from './face-generator.js';
import { createRenderFunction, bump, bumpHP, bumpShield } from './ui.js';
import { openDeckBuilder, buildRandomDeck } from './deck-builder.js';
import { runSelfTests } from './tests.js';
import { makePersonaDeck } from './ai.js';
import { $ } from './utils.js';

// Log setup
const logBox = $('#log');

function getOppName() {
  const el = document.getElementById('oppName');
  return (el?.textContent || 'OPP').trim();
}

// Backward-compatible log renderer with actor support.
// Accepts either a string, or an object: { actor: 'you' | 'opp' | string, text: string }
function log(entry) {
  // Normalize
  let actor, text;
  if (typeof entry === 'string') {
    text = entry;
  } else if (entry && typeof entry === 'object') {
    actor = entry.actor;
    text = entry.text ?? '';
  } else {
    text = String(entry ?? '');
  }

  const row = document.createElement('div');
  row.className = 'log-entry';

  if (actor) {
    const label = document.createElement('span');
    const you = actor === 'you';
    const opp = actor === 'opp';
    const name = you ? 'YOU' : (opp ? getOppName() : String(actor));

    label.className = 'actor ' + (you ? 'you' : (opp ? 'opp' : 'other'));
    label.textContent = name + ' — ';
    row.appendChild(label);

    const msg = document.createElement('span');
    msg.textContent = text;
    row.appendChild(msg);
  } else {
    // Fallback: old simple lines
    row.textContent = '> ' + text;
  }

  logBox.prepend(row);

  // Cap log length to keep DOM lean
  const MAX = 150;
  while (logBox.children.length > MAX) {
    logBox.removeChild(logBox.lastChild);
  }
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
  log({ actor: 'opp', text: 'shifts persona. Deck re-tuned.' });
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
