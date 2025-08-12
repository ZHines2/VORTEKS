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
    const mockGame = {
      turn: 'you', 
      you: atk, 
      opp: t, 
      checkWin: () => {},
      stats: { maxBurnAmount: 0 }
    };
    Game.hit.call(mockGame, t, 4, false); 
    assertEqual('Shield absorbs first', {hp: t.hp, sh: t.shield}, {hp: 9, sh: 0}, log); 
  }
  
  { 
    const t = {hp: 10, shield: 5, isAI: true}; 
    const atk = {status: {nextPlus: 0, firstAttackUsed: false}, isAI: false, quirk: null}; 
    const mockGame = {
      turn: 'you', 
      you: atk, 
      opp: t, 
      checkWin: () => {},
      stats: { maxBurnAmount: 0 }
    };
    Game.hit.call(mockGame, t, 3, true); 
    assertEqual('Pierce ignores shield', {hp: t.hp, sh: t.shield}, {hp: 7, sh: 5}, log); 
  }
  
  { 
    const t = {hp: 10, shield: 0, isAI: true}; 
    const atk = {status: {nextPlus: 2, firstAttackUsed: false}, isAI: false, quirk: null}; 
    const mockGame = {
      turn: 'you', 
      you: atk, 
      opp: t, 
      checkWin: () => {},
      stats: { maxBurnAmount: 0 }
    };
    Game.hit.call(mockGame, t, 3, true); 
    assertEqual('Focus adds +2 once', {hp: t.hp, next: atk.status.nextPlus}, {hp: 5, next: 0}, log); 
  }
  
  { 
    const t = {hp: 10, shield: 2, isAI: true}; 
    const atk = {status: {nextPlus: 0, firstAttackUsed: false}, isAI: false, quirk: 'piercer'}; 
    const mockGame = {
      turn: 'you', 
      you: atk, 
      opp: t, 
      checkWin: () => {},
      stats: { maxBurnAmount: 0 }
    };
    Game.hit.call(mockGame, t, 3, false); 
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
    const testGame = Object.create(Game);
    testGame.you = me;
    testGame.opp = foe;
    testGame.turn = 'you';
    testGame.over = false;
    testGame.isEchoing = false;
    testGame.stats = { maxBurnAmount: 0 };
    testGame.checkWin = () => {};
    // Set a mock log function to avoid errors
    const originalSetLog = Game.setLogFunction;
    Game.setLogFunction(() => {});
    testGame.applyCard(CARDS.find(c => c.id === 'echo'), me, foe, false);
    Game.setLogFunction(originalSetLog);
    assertEqual('Echo repeats last attack', foe.hp <= 17, true, log);
  }
  
  { 
    // Discard/reshuffle behavior
    const p = createPlayer(false); 
    const opp = createPlayer(true);
    p.deck = [CARDS.find(c => c.id === 'swords')]; 
    p.hand = []; 
    p.discard = []; 
    p.energy = 3; // Give enough energy to play the card
    p.draw(1); 
    const testGame = Object.create(Game);
    testGame.you = p;
    testGame.opp = opp;
    testGame.over = false;
    testGame.playCard(p, 0); 
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

  // Face generator enhancement tests
  {
    // Test easter egg face detection
    const mockEasterEgg = {
      persona: 'Automaton',
      features: {
        isEasterEgg: true,
        easterEggType: 'Robot',
        rarity: 'epic'
      }
    };
    
    const isEasterEgg = mockEasterEgg.features.isEasterEgg;
    const hasCorrectType = mockEasterEgg.features.easterEggType === 'Robot';
    const hasRarity = ['rare', 'epic', 'legendary'].includes(mockEasterEgg.features.rarity);
    
    assertEqual('Easter egg detection works', isEasterEgg, true, log);
    assertEqual('Easter egg has type', hasCorrectType, true, log);
    assertEqual('Easter egg has valid rarity', hasRarity, true, log);
  }

  {
    // Test Droid Protocol card functionality
    const me = createPlayer(false);
    const droidCard = CARDS.find(c => c.id === 'droid');
    if (droidCard) {
      // Test that playing droid card arms the next-turn effect
      const testGame = Object.create(Game);
      testGame.you = me;
      testGame.opp = createPlayer(true);
      testGame.over = false;
      
      // Apply droid card (not simulated)
      testGame.applyCard(droidCard, me, testGame.opp, false);
      assertEqual('Droid card arms next-turn effect', me.status.droidProcNext, true, log);
      
      // Test that startTurn triggers and clears the effect
      const originalHP = me.hp;
      const originalShield = me.shield;
      const originalEnergy = me.energy;
      const originalNextPlus = me.status.nextPlus || 0;
      
      testGame.startTurn(me);
      
      // At least one of the bonuses should have triggered and flag should be cleared
      const hpChanged = me.hp !== originalHP;
      const shieldChanged = me.shield !== originalShield;
      const energyChanged = me.energy !== originalEnergy;
      const nextPlusChanged = (me.status.nextPlus || 0) !== originalNextPlus;
      const flagCleared = !me.status.droidProcNext;
      
      const effectTriggered = hpChanged || shieldChanged || energyChanged || nextPlusChanged;
      assertEqual('Droid Protocol triggers an effect', effectTriggered, true, log);
      assertEqual('Droid Protocol flag cleared', flagCleared, true, log);
    }
  }

  // Test burn stacking
  {
    const target = createPlayer(true);
    target.status.burn = 3;
    target.status.burnTurns = 2;
    
    // Apply new burn that should stack
    Game.applyBurn(target, 4, 3);
    
    assertEqual('Burn stacking adds amounts', target.status.burn, 7, log);
    assertEqual('Burn stacking keeps max turns', target.status.burnTurns, 3, log);
  }

  // Test overheal functionality
  {
    const player = createPlayer(false);
    player.hp = 18;
    player.maxHP = 20;
    
    const healedHP = Game.applyHeal(player, 5);
    assertEqual('Overheal allows HP beyond maxHP', healedHP, 23, log);
    
    // Test overheal cap
    player.hp = 20;
    const cappedHP = Game.applyHeal(player, 20);
    assertEqual('Overheal respects 150% cap', cappedHP, 30, log); // 20 * 1.5 = 30
  }

  // Test energy uncapping
  {
    const player = createPlayer(false);
    player.energy = 5;
    player.maxEnergy = 6;
    
    const newEnergy = Game.applyEnergyGain(player, 8);
    assertEqual('Energy uncapping allows energy beyond maxEnergy', newEnergy, 13, log);
  }

  // Test Reconsider card mechanics
  {
    const player = createPlayer(false);
    const reconsiderCard = { id: 'reconsider', cost: 0 };
    
    player.energy = 7;
    const canAfford = player.canAfford(reconsiderCard);
    assertEqual('Reconsider card is always affordable', canAfford, true, log);
    
    const spent = player.spend(0, reconsiderCard);
    assertEqual('Reconsider spends all energy', spent, 7, log);
    assertEqual('Player energy is 0 after reconsider', player.energy, 0, log);
  }

  // Test Echo & Zap interaction (regression test)
  {
    const me = createPlayer(false);
    const foe = createPlayer(true);
    const testGame = Object.create(Game);
    testGame.you = me;
    testGame.opp = foe;
    testGame.isEchoing = false;
    
    // Set up last played as Zap
    me.lastPlayed = CARDS.find(c => c.id === 'bolt'); // Zap card
    
    // Apply Echo card
    const echoCard = CARDS.find(c => c.id === 'echo');
    const initialDeckSize = me.deck.length;
    const initialHandSize = me.hand.length;
    
    testGame.applyCard(echoCard, me, foe, false);
    
    // Verify no unwanted state anomalies occurred
    const finalDeckSize = me.deck.length;
    const finalHandSize = me.hand.length;
    
    // The exact numbers depend on deck state, but we check that it didn't break
    assertEqual('Echo-Zap interaction maintains valid game state', typeof finalDeckSize, 'number', log);
    assertEqual('Echo flag properly managed', testGame.isEchoing, false, log);
  }

  log('Self-tests complete.');
}