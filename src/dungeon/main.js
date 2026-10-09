// VORTEKS — The First Descent (v0.1 prototype entry point).
// Wires navigation, renderer, encounter bridge and card UI together.

import { Navigator } from './navigation.js';
import { CameraRig, DungeonRenderer, setPalette } from './renderer.js';
import { Encounter, createActor, makeEnemyConfig, getCard, canAfford } from './encounter.js';
import { HandView, cardFace } from './cards-ui.js';
import { LOCATIONS } from './levels.js';
import { Run } from './run.js';

const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, reduce ? Math.min(ms, 60) : ms));

let reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let nav, rig, renderer, hand, player, encounter, run, currentEnemy;
let mode = 'title'; // title | explore | combat | end
let busy = false;
let pendingEncounterCheck = false;


function newRun() {
  run = new Run();
  loadLocation();
}

function loadLocation() {
  const loc = run.location;
  setPalette(loc.palette);
  nav = new Navigator(loc);
  rig = new CameraRig(nav);
  rig.reduceMotion = reduce;
  renderer.nav = nav;
  renderer.rig = rig;
  renderer.reduceMotion = reduce;
  renderer.fxTarget = null;
  renderer.enemyFx = { hitAt: -1e9, shieldAt: -1e9, burn: false, frozen: false, dead: false, deadAt: 0 };
  player = createActor({ name: 'YOU', hp: run.hp, maxHP: run.maxHP, deckIds: run.deckIds });
  encounter = null;
  currentEnemy = null;
  busy = false;
  pendingEncounterCheck = false;
  setMode('explore');
  updateHud();
  toast(loc.name + ' — ' + loc.blurb, 3000);
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

function renderIntent() {
  const box = $('intent');
  box.innerHTML = '';
  for (const c of encounter.enemy.intent) {
    const fx = c.effects || {};
    const bits = [];
    if (fx.damage) bits.push('⚔' + fx.damage);
    if (fx.shield) bits.push('🛡' + fx.shield);
    if (fx.heal) bits.push('♥' + fx.heal);
    if (c.status?.target?.burn) bits.push('🔥');
    if (c.status?.target?.freezeEnergy) bits.push('❄');
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.title = c.name + ': ' + c.description;
    chip.innerHTML = c.sym + '<small>' + bits.join(' ') + '</small>';
    box.appendChild(chip);
  }
}

function updateHud() {
  $('hp').textContent = player.hp + '/' + player.maxHP;
  $('sh').textContent = player.shield;
  $('en').textContent = mode === 'combat' ? player.energy + '/' + player.maxEnergy : '-';
  if (nav) $('loc').textContent = run.location.name + '  ' + nav.defeated + '/' + nav.quota + (nav.remaining ? '' : '  ✓ EXIT OPEN');
  if (encounter) {
    $('pile-deck').textContent = 'DECK ' + player.deck.length;
    $('pile-discard').textContent = 'DISCARD ' + player.discard.length;
    renderIntent();
  }
  if (encounter) {
    const e = encounter.enemy;
    $('enemy-name').textContent = e.glyph + ' ' + e.name + '  ❤ ' + e.hp + (e.shield ? '  🛡 ' + e.shield : '');
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
  else if (what === 'locked') toast('Sealed. Defeat ' + nav.remaining + ' more opponent' + (nav.remaining > 1 ? 's' : '') + '.', 1800);
  else toast('Nothing to use here.', 900);
}

function takeReward() {
  const wallop = getCard('wallop');
  run.addCard('wallop');
  player.discard.push(wallop);
  player.hp = Math.min(player.maxHP, player.hp + 6);
  run.hp = player.hp;
  updateHud();
  toast(wallop.sym + ' Found Wallop and a restorative glow (+6 HP). Added to your deck.', 3500);
}

function checkEncounter() {
  if (nav.atExit()) return completeLocation();
  const hit = nav.enemyInRange(3);
  if (hit) {
    currentEnemy = hit.enemy;
    renderer.fxTarget = hit.enemy;
    nav.dir = hit.dir;
    rig.moveTo(nav);
    busy = true;
    toast(hit.enemy.spec.kind.toUpperCase() + ' stirs.', 1500);
    const wait = () => rig.moving ? requestAnimationFrame(wait) : startCombat();
    wait();
  }
}

// ---------- combat ----------
function startCombat() {
  player.deck = [...player.deck, ...player.hand, ...player.discard].sort(() => Math.random() - 0.5);
  player.hand = []; player.discard = []; player.burn = null; player.frozen = 0; player.nextPlus = 0; player.shield = 0;
  renderer.enemyFx = { hitAt: -1e9, shieldAt: -1e9, burn: false, frozen: false, dead: false, deadAt: 0 };
  const cfg = makeEnemyConfig(currentEnemy.spec, run.location);
  currentEnemy.glyph = cfg.glyph;
  encounter = new Encounter(player, cfg);
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

function flashCard(card, enemy = false) {
  const t = $('table');
  t.hidden = false;
  t.innerHTML = '';
  const el = cardFace(card, enemy ? 'enemy' : '');
  t.appendChild(el);
  clearTimeout(flashCard.timer);
  flashCard.timer = setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => { t.hidden = true; }, reduce ? 0 : 400);
  }, reduce ? 500 : 800);
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
    flashCard(res.card, true);
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
  $('intent').innerHTML = '';
  if (encounter.winner === 'player') {
    renderer.enemyFx.dead = true;
    renderer.enemyFx.deadAt = renderer.time;
    toast('Opponent defeated.', 2000);
    await sleep(1000);
    currentEnemy.alive = false;
    run.hp = player.hp;
    player.shield = 0; player.burn = null; player.frozen = 0;
    encounter = null;
    currentEnemy = null;
    setMode('explore');
    busy = false;
    updateHud();
    if (nav.remaining === 0) toast('The exit unseals.', 2500);
  } else {
    setMode('end');
    showOverlay('YOU FELL', LOCATIONS[run.loc].name, 'The corridor is quiet again.', 'TRY AGAIN');
    ov.mode = 'restart';
  }
}

function completeLocation() {
  setMode('end');
  run.hp = player.hp;
  const doneIndex = run.loc;
  run.completeLocation();
  if (run.finished) {
    showOverlay('DESCENT COMPLETE', 'THE FIRST DESCENT',
      'The Core falls silent. ' + run.rewards.length + ' card' + (run.rewards.length === 1 ? '' : 's') + ' carried out of the dark.', 'DESCEND AGAIN');
    ov.mode = 'restart';
    renderPath();
    return;
  }
  run.heal(5);
  showOverlay(LOCATIONS[doneIndex].name + ' CLEARED', 'CHOOSE A REWARD', 'Take a card for your deck (you also recover 5 HP).', 'CONTINUE');
  ov.mode = 'reward';
  renderPath();
  const box = $('rewards');
  box.innerHTML = '';
  $('ov-btn').hidden = true;
  run.rewardChoices().forEach(id => {
    const card = getCard(id);
    const el = cardFace(card);
    el.setAttribute('role', 'button');
    el.tabIndex = 0;
    const pick = () => {
      run.addCard(id);
      box.innerHTML = '';
      $('ov-btn').hidden = false;
      $('ov-text').textContent = card.name + ' added. Next: ' + run.location.name + '.';
      ov.mode = 'next';
      $('ov-btn').textContent = 'DESCEND';
    };
    el.addEventListener('click', pick);
    el.addEventListener('keydown', e => { if (e.key === 'Enter') pick(); });
    box.appendChild(el);
  });
}

function renderPath() {
  const box = $('path');
  box.innerHTML = '';
  LOCATIONS.forEach((l, i) => {
    if (i) box.append('→');
    const n = document.createElement('span');
    const cleared = run.cleared.includes(l.id);
    n.className = 'node' + (cleared ? ' cleared' : (i === run.loc && !run.finished ? ' current' : ''));
    n.innerHTML = l.name + '<small>' + (cleared ? '✓ cleared' : l.opponents.length + ' opponent' + (l.opponents.length > 1 ? 's' : '')) + '</small>';
    box.appendChild(n);
  });
}

const ov = { mode: 'start' };

function showOverlay(title, sub, text, btn) {
  $('ov-title').textContent = title;
  $('ov-sub').textContent = sub;
  $('ov-text').textContent = text;
  $('ov-btn').textContent = btn;
  $('ov-btn').hidden = false;
  $('rewards').innerHTML = '';
  $('overlay').classList.remove('hidden');
}

function overlayButton() {
  $('overlay').classList.add('hidden');
  if (ov.mode === 'next') loadLocation();
  else if (ov.mode === 'restart') { renderer.fxTarget = null; newRun(); }
  else newRun();
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
  run = new Run();
  nav = new Navigator(run.location);
  rig = new CameraRig(nav);
  renderer = new DungeonRenderer(canvas, nav, rig);
  hand = new HandView($('hand'), { reduceMotion: reduce });
  player = createActor({ name: 'YOU', hp: run.hp, maxHP: run.maxHP, deckIds: run.deckIds });
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
  $('ov-btn').addEventListener('click', overlayButton);

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
      if (ev.key === 'Enter' && !$('ov-btn').hidden) $('ov-btn').click();
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
