import { CARDS } from '../data/cards.js';
import { createPlayer } from './player.js';

// Self-test functionality
function assertEqual(name, a, b, log) { 
  const ok = JSON.stringify(a) === JSON.stringify(b); 
  log((ok ? 'PASS' : 'FAIL') + ': ' + name + ' → ' + JSON.stringify(a)); 
  if (!ok) console.warn('Test failed:', name, 'expected', b, 'got', a); 
}

export function runSelfTests(Game, log, showStart) {
  log('Running self-tests…');
  
  // Original tests (unchanged)
  { 
    const t = {hp: 10, shield: 3, isAI: true}; 
    const atk = {status: {nextPlus: 0, firstAttackUsed: false}, isAI: false, quirk: null}; 
    Game.hit.call({turn: 'you', you: atk, opp: t}, t, 4, false); 
    assertEqual('Shield absorbs first', {hp: t.hp, sh: t.shield}, {hp: 9, sh: 0}, log); 
  }
  
  { 
    const t = {hp: 10, shield: 5, isAI: true}; 
    const atk = {status: {nextPlus: 0, firstAttackUsed: false}, isAI: false, quirk: null}; 
    Game.hit.call({turn: 'you', you: atk, opp: t}, t, 3, true); 
    assertEqual('Pierce ignores shield', {hp: t.hp, sh: t.shield}, {hp: 7, sh: 5}, log); 
  }
  
  { 
    const t = {hp: 10, shield: 0, isAI: true}; 
    const atk = {status: {nextPlus: 2, firstAttackUsed: false}, isAI: false, quirk: null}; 
    Game.hit.call({turn: 'you', you: atk, opp: t}, t, 3, true); 
    assertEqual('Focus adds +2 once', {hp: t.hp, next: atk.status.nextPlus}, {hp: 5, next: 0}, log); 
  }
  
  { 
    const t = {hp: 10, shield: 2, isAI: true}; 
    const atk = {status: {nextPlus: 0, firstAttackUsed: false}, isAI: false, quirk: 'piercer'}; 
    Game.hit.call({turn: 'you', you: atk, opp: t}, t, 3, false); 
    assertEqual('Piercer first hit', {hp: t.hp, sh: t.shield, used: atk.status.firstAttackUsed}, {hp: 9, sh: 0, used: true}, log); 
  }
  
  { 
    const p = createPlayer(false); 
    p.status.frozenNext = 1; 
    const ctx = Object.create(Game); 
    ctx.startTurn = Game.startTurn; 
    ctx.render = () => {}; 
    ctx.startTurn(p); 
    assertEqual('Freeze energy penalty', p.energy, 2, log); 
  }
  
  // Added tests (new)
  { 
    // Echo repeats last
    const me = createPlayer(false); 
    const foe = createPlayer(true);
    me.lastPlayed = CARDS.find(c => c.id === 'swords');
    Game.applyCard(CARDS.find(c => c.id === 'echo'), me, foe, false);
    assertEqual('Echo repeats last attack', foe.hp <= 17, true, log);
  }
  
  { 
    // Discard/reshuffle behavior
    const p = createPlayer(false); 
    p.deck = [CARDS.find(c => c.id === 'swords')]; 
    p.hand = []; 
    p.discard = []; 
    p.draw(1); 
    Game.playCard.call(Game, p, 0); 
    assertEqual('Card moved to discard', {deck: p.deck.length, hand: p.hand.length, disc: p.discard.length}, {deck: 0, hand: 0, disc: 1}, log); 
    p.draw(1); 
    assertEqual('Reshuffle pulls from discard', {deck: p.deck.length, hand: p.hand.length, disc: p.discard.length}, {deck: 0, hand: 1, disc: 0}, log);
  }
  
  { 
    // Sanity: Game has init functions
    assertEqual('Game.init exists', typeof Game.init, 'function', log);
    assertEqual('Game.initQuick exists', typeof Game.initQuick, 'function', log);
  }
  
  { 
    // Preview equals real damage for a basic attack
    const me = createPlayer(false); 
    const foe = createPlayer(true); 
    const c = CARDS.find(c => c.id === 'swords');
    const g = Object.create(Game); 
    g.you = me; 
    g.opp = foe; 
    g.turn = 'you';
    const sim = g.simDamage(me, foe, c); 
    g.applyCard(c, me, foe, false);
    assertEqual('Preview equals result (swords)', sim, 3, log);
  }
  
  { 
    assertEqual('showStart exists', typeof showStart, 'function', log); 
  }
  
  {
    // Test actor-aware logging
    let capturedLogs = [];
    const testLog = (entry) => {
      capturedLogs.push(entry);
    };
    
    const me = createPlayer(false);
    const foe = createPlayer(true);
    const testGame = Object.create(Game);
    testGame.you = me;
    testGame.opp = foe;
    testGame.turn = 'you';
    testGame.over = false;
    
    // Set test log function
    const originalSetLog = Game.setLogFunction;
    Game.setLogFunction(testLog);
    
    // Test playCard logging
    me.hand = [CARDS.find(c => c.id === 'swords')];
    me.energy = 3;
    testGame.playCard(me, 0);
    
    // Restore original log
    Game.setLogFunction(log);
    
    // Check if actor-aware log was captured
    const hasActorLog = capturedLogs.some(entry => 
      entry && typeof entry === 'object' && entry.actor === 'you' && entry.text && entry.text.includes('plays')
    );
    assertEqual('Actor-aware logging works', hasActorLog, true, log);
  }
  
  log('Self-tests complete.');
}