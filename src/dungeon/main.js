// VORTEKS — The First Descent (v0.1 prototype entry point).
// Wires navigation, renderer, encounter bridge and card UI together.

import { Navigator } from './navigation.js';
import { CameraRig, DungeonRenderer } from './renderer.js';
import { Encounter, createActor, PLAYER_DECK, getCard, canAfford, draw } from './encounter.js';
import { HandView } from './cards-ui.js';

const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, reduce ? Math.min(ms, 60) : ms));

let reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let nav, rig, renderer, hand, player, encounter;
let mode = 'title'; // title | explore | combat | end
let busy = false;
let pendingEncounterCheck = false;
let rewardTaken = false;

const ENEMY = { name: 'WARDEN', hp: 14, deckIds: ['swords', 'swords', 'swords', 'shield', 'shield', 'bolt', 'fire', 'swords'] };

function newRun() {
  nav = new Navigator();
  rig = new CameraRig(nav);
  rig.reduceMotion = reduce;
  renderer.nav = nav;
  renderer.rig = rig;
  renderer.reduceMotion = reduce;
  renderer.enemyFx = { hitAt: -1e9, shieldAt: -1e9, burn: false, frozen: false, dead: false, deadAt: 0 };
  player = createActor({ name: 'YOU', hp: 20, deckIds: PLAYER_DECK });
  encounter = null;
  rewardTaken = false;
  busy = false;
  pendingEncounterCheck = false;
  setMode('explore');
  updateHud();
  toast('Find the way down.');
}

function setMode(m) {
  mode = m;
  document.body.classList.toggle('in-combat', m === 'combat');
  $('combat').hidden = m !== 'combat';
  $('enemy-panel').hidden = m !== 'combat';
}

let toastTimer;
function toast(msg, ms = 2200) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

function updateHud() {
  $('hp').textContent = player.hp + '/' + player.maxHP;
  $('sh').textContent = player.shield;
  $('en').textContent = mode === 'combat' ? player.energy + '/' + player.maxEnergy : '-';
  if (encounter) {
    const e = encounter.enemy;
    $('enemy-name').textContent = e.name + '  ❤ ' + e.hp + (e.shield ? '  🛡 ' + e.shield : '');
    $('enemy-hp-fill').style.width = Math.max(0, e.hp / e.maxHP * 100) + '%';
    $('enemy-status').textContent = [e.burn ? '🔥 burn ' + e.burn.amount + '×' + e.burn.turns : '', e.frozen ? '❄ frozen' : ''].filter(Boolean).join('  ');
    renderer.enemyFx.burn = !!e.burn;
    renderer.enemyFx.frozen = e.frozen > 0;
  }
}

// ---------- exploration ----------
function act(name) {
  if (mode !== 'explore' || busy) return;
  if (rig.moving && rig.t < 0.6) return;
  let changed = false;
  if (name === 'fwd') changed = nav.move(1);
  else if (name === 'back') changed = nav.move(-1);
  else if (name === 'left') { nav.turn(-1); changed = true; }
  else if (name === 'right') { nav.turn(1); changed = true; }
  else if (name === 'use') interact();
  if (changed) {
    rig.moveTo(nav);
    pendingEncounterCheck = true;
  } else if (name === 'fwd' || name === 'back') {
    toast('Blocked.', 700);
  }
}

function interact() {
  const what = nav.interact();
  if (what === 'door') toast('The door grinds open.');
  else if (what === 'chest') takeReward();
  else toast('Nothing to use here.', 900);
}

function takeReward() {
  rewardTaken = true;
  const wallop = getCard('wallop');
  player.discard.push(wallop);
  player.hp = Math.min(player.maxHP, player.hp + 6);
  updateHud();
  toast(wallop.sym + ' Found Wallop and a restorative glow (+6 HP). Added to your deck.', 3500);
}

function checkEncounter() {
  if (nav.atExit()) return finish(true);
  if (!encounter && nav.enemyAlive) {
    const d = nav.enemyInRange(3);
    if (d >= 0) {
      nav.dir = d;
      rig.moveTo(nav);
      busy = true;
      toast('◉ The Warden stirs.', 1500);
      const wait = () => rig.moving ? requestAnimationFrame(wait) : startCombat();
      wait();
    }
  }
}

// ---------- combat ----------
function startCombat() {
  player.deck = [...player.deck, ...player.hand, ...player.discard].sort(() => Math.random() - 0.5);
  player.hand = []; player.discard = []; player.burn = null; player.frozen = 0; player.nextPlus = 0; player.shield = 0;
  encounter = new Encounter(player, ENEMY);
  setMode('combat');
  busy = false;
  renderHand();
  updateHud();
  toast('Your move. Tap a card to inspect, tap again to play.', 2800);
}

function renderHand() {
  hand.reduceMotion = reduce;
  hand.render(player, canAfford, playCard);
  updateHud();
}

function flashCard(card) {
  const p = $('played');
  p.hidden = false;
  p.textContent = card.sym;
  p.style.animation = 'none'; void p.offsetWidth; p.style.animation = '';
  setTimeout(() => { p.hidden = true; }, reduce ? 500 : 900);
}

function presentEvents(events, mine) {
  const fx = renderer.enemyFx;
  for (const ev of events) {
    const onEnemy = ev.who === encounter.enemy;
    if (ev.type === 'damage' && onEnemy) { fx.hitAt = renderer.time; toast('−' + ev.amount + (ev.blocked ? ' (' + ev.blocked + ' blocked)' : ''), 800); }
    else if (ev.type === 'damage') { document.body.animate && !reduce && $('app').animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], 220); toast('You take −' + ev.amount + (ev.blocked ? ' (' + ev.blocked + ' blocked)' : ''), 900); }
    else if (ev.type === 'shield' && onEnemy) { fx.shieldAt = renderer.time; }
    else if (ev.type === 'shield') toast('🛡 +' + ev.amount, 800);
    else if (ev.type === 'heal') toast('♥ +' + ev.amount, 800);
    else if (ev.type === 'burn') { fx.hitAt = renderer.time; toast('🔥 Burn ' + ev.amount + ' for ' + ev.turns + ' turns', 1000); }
    else if (ev.type === 'freeze') toast('❄ Freeze: −' + ev.amount + ' energy next turn', 1000);
    else if (ev.type === 'focus') toast('✨ Next attack +' + ev.amount, 1000);
    else if (ev.type === 'burnTick' && onEnemy) fx.hitAt = renderer.time;
  }
}

async function playCard(i) {
  if (mode !== 'combat' || busy || encounter.turn !== 'player') return;
  const card = player.hand[i];
  if (!card || !canAfford(player, card)) { hand.reject(i); toast('Not enough energy.', 900); return; }
  busy = true;
  await hand.activate(i);
  flashCard(card);
  const res = encounter.play(player, i);
  if (res) presentEvents(res.events, true);
  renderHand();
  busy = false;
  if (encounter.over) await endCombat();
}

async function endTurn() {
  if (mode !== 'combat' || busy || encounter.turn !== 'player') return;
  busy = true;
  hand.clear();
  const ticks = encounter.endPlayerTurn();
  presentEvents(ticks || [], false);
  updateHud();
  await sleep(600);
  let guard = 0;
  while (!encounter.over && guard++ < 12) {
    const res = encounter.enemyStep();
    if (!res) break;
    toast(encounter.enemy.name + ' plays ' + res.card.sym + ' ' + res.card.name, 900);
    flashCard(res.card);
    presentEvents(res.events, false);
    updateHud();
    await sleep(900);
  }
  if (!encounter.over) {
    presentEvents(encounter.endEnemyTurn() || [], false);
    busy = false;
    renderHand();
  }
  if (encounter.over) { busy = false; await endCombat(); }
}

async function endCombat() {
  busy = true;
  updateHud();
  hand.clear();
  if (encounter.winner === 'player') {
    renderer.enemyFx.dead = true;
    renderer.enemyFx.deadAt = renderer.time;
    toast('The Warden unravels. The way is open.', 2500);
    await sleep(1000);
    nav.enemyAlive = false;
    player.shield = 0; player.burn = null; player.frozen = 0;
    encounter = null;
    setMode('explore');
    busy = false;
    updateHud();
  } else {
    setMode('end');
    showOverlay('YOU FELL', 'THE FIRST DESCENT', 'The corridor is quiet again.', 'TRY AGAIN');
  }
}

function finish(won) {
  setMode('end');
  showOverlay('DESCENT COMPLETE', 'THE FIRST DESCENT',
    'You passed the Warden and reached the exit.' + (rewardTaken ? ' You carried Wallop out of the dark.' : ' The hidden cache was left behind.'),
    'DESCEND AGAIN');
}

function showOverlay(title, sub, text, btn) {
  $('ov-title').textContent = title;
  $('ov-sub').textContent = sub;
  $('ov-text').textContent = text;
  $('ov-btn').textContent = btn;
  $('overlay').classList.remove('hidden');
}

// ---------- boot ----------
function frame(now) {
  const dt = Math.min(50, now - (frame.last || now));
  frame.last = now;
  rig.update(dt);
  renderer.render(dt);
  renderer.drawMap($('map'));
  if (pendingEncounterCheck && !rig.moving && mode === 'explore') {
    pendingEncounterCheck = false;
    checkEncounter();
  }
  requestAnimationFrame(frame);
}

function init() {
  const canvas = $('view');
  nav = new Navigator();
  rig = new CameraRig(nav);
  renderer = new DungeonRenderer(canvas, nav, rig);
  hand = new HandView($('hand'), { reduceMotion: reduce });
  player = createActor({ name: 'YOU', hp: 20, deckIds: PLAYER_DECK });
  renderer.resize();
  window.addEventListener('resize', () => renderer.resize());

  $('reduceMotion').checked = reduce;
  document.body.classList.toggle('reduce-motion', reduce);
  $('reduceMotion').addEventListener('change', e => {
    reduce = e.target.checked;
    rig.reduceMotion = renderer.reduceMotion = reduce;
    document.body.classList.toggle('reduce-motion', reduce);
    if (mode === 'combat') renderHand();
  });

  document.querySelectorAll('#controls button').forEach(b =>
    b.addEventListener('click', () => act(b.dataset.act)));
  $('endTurn').addEventListener('click', endTurn);
  $('ov-btn').addEventListener('click', () => { $('overlay').classList.add('hidden'); newRun(); });

  const keys = { ArrowUp: 'fwd', w: 'fwd', W: 'fwd', ArrowDown: 'back', s: 'back', S: 'back',
    ArrowLeft: 'left', a: 'left', A: 'left', q: 'left', Q: 'left',
    ArrowRight: 'right', d: 'right', D: 'right', e: 'right', E: 'right', ' ': 'use', f: 'use', F: 'use' };
  window.addEventListener('keydown', ev => {
    if (mode === 'combat') {
      if (/^[1-9]$/.test(ev.key)) { const i = +ev.key - 1; if (player.hand[i]) playCard(i); ev.preventDefault(); }
      else if (ev.key === 'Enter') { endTurn(); ev.preventDefault(); }
      return;
    }
    if (mode === 'title' || mode === 'end') {
      if (ev.key === 'Enter') $('ov-btn').click();
      return;
    }
    const a = keys[ev.key];
    if (a) { ev.preventDefault(); act(a); }
  });

  // swipe gestures on the view for touch
  let sx, sy;
  canvas.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  canvas.addEventListener('touchend', e => {
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return act('use');
    if (Math.abs(dx) > Math.abs(dy)) act(dx > 0 ? 'right' : 'left');
    else act(dy < 0 ? 'fwd' : 'back');
  }, { passive: true });

  requestAnimationFrame(frame);
}

init();
