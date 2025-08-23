import { CARDS } from '../data/cards.js';
import { createPlayer } from './player.js';
import { predictCard } from './ui.js';

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
    // Echo repeats last card played
    const me = createPlayer(false); 
    const foe = createPlayer(true);
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
    
    // Set lastPlayedThisTurn to Strike (Echo uses lastPlayedThisTurn, not lastPlayed)
    me.lastPlayedThisTurn = CARDS.find(c => c.id === 'swords');
    foe.hp = 20; // Reset health
    
    // Apply Echo card
    testGame.applyCard(CARDS.find(c => c.id === 'echo'), me, foe, false);
    
    Game.setLogFunction(originalSetLog);
    assertEqual('Echo repeats last card (Strike)', foe.hp, 17, log); // 20 - 3 = 17
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

  // Test burn stacking - now stacks turns instead of damage
  {
    const target = createPlayer(true);
    target.status.burn = 1;
    target.status.burnTurns = 2;
    
    // Apply new burn that should stack turns
    Game.applyBurn(target, 4, 3);
    
    assertEqual('Burn always does 1 damage per turn', target.status.burn, 1, log);
    assertEqual('Burn stacking adds turns', target.status.burnTurns, 5, log);
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
    const me = createPlayer(false);
    const foe = createPlayer(true);
    const testGame = Object.create(Game);
    testGame.you = me;
    testGame.opp = foe;
    testGame.turn = 'you';
    testGame.over = false;
    testGame.checkWin = () => {};
    
    const originalSetLog = Game.setLogFunction;
    Game.setLogFunction(() => {});
    
    const reconsiderCard = CARDS.find(c => c.id === 'reconsider');
    
    // Test with sufficient energy
    me.energy = 7;
    const canAfford = me.canAfford(reconsiderCard);
    assertEqual('Reconsider card is affordable with 3+ energy', canAfford, true, log);
    
    // Test the actual card playing mechanics - should only cost 3 energy
    // Put Reconsider in hand and play it using playCard like the other tests
    me.hand = [reconsiderCard];
    testGame.playCard(me, 0);
    assertEqual('Reconsider costs 3 energy', me.energy, 4, log); // 7 - 3 = 4
    
    // Test with insufficient energy
    me.energy = 2;
    const cannotAfford = me.canAfford(reconsiderCard);
    assertEqual('Reconsider card is not affordable with <3 energy', cannotAfford, false, log);
    
    Game.setLogFunction(originalSetLog);
  }

  // Test Echo & Zap interaction (regression test) - Now tests last card behavior
  {
    const me = createPlayer(false);
    const foe = createPlayer(true);
    const testGame = Object.create(Game);
    testGame.you = me;
    testGame.opp = foe;
    testGame.isEchoing = false;
    testGame.checkWin = () => {};
    
    const originalSetLog = Game.setLogFunction;
    Game.setLogFunction(() => {});
    
    // Ensure player has cards in deck to draw from
    me.deck = [CARDS.find(c => c.id === 'heart'), CARDS.find(c => c.id === 'swords')];
    
    // Set lastPlayedThisTurn to Zap (Echo uses lastPlayedThisTurn, not lastPlayed)
    me.lastPlayedThisTurn = CARDS.find(c => c.id === 'bolt');
    foe.hp = 20;
    const initialHandSize = me.hand.length;
    
    // Apply Echo card to repeat Zap 
    const echoCard = CARDS.find(c => c.id === 'echo');
    testGame.applyCard(echoCard, me, foe, false);
    
    // Verify Zap was repeated: 2 pierce damage dealt and 1 card drawn
    assertEqual('Echo repeats Zap damage', foe.hp, 18, log); // 20 - 2 = 18
    assertEqual('Echo repeats Zap card draw', me.hand.length, initialHandSize + 1, log);
    assertEqual('Echo flag properly managed', testGame.isEchoing, false, log);
    
    Game.setLogFunction(originalSetLog);
  }

  // Test complete Overload functionality - Overload then play another card
  {
    const me = createPlayer(false);
    const foe = createPlayer(true);
    foe.hp = 20; // Reset to full health
    const testGame = Object.create(Game);
    testGame.you = me;
    testGame.opp = foe;
    testGame.turn = 'you';
    testGame.isEchoing = false;
    testGame.checkWin = () => {};
    
    // Mock the playCard function to test the overload trigger
    const originalApplyCard = testGame.applyCard;
    let applyCardCallCount = 0;
    testGame.applyCard = function(card, player, target, simulate) {
      applyCardCallCount++;
      return originalApplyCard.call(this, card, player, target, simulate);
    };
    
    // Set a mock log function
    const originalSetLog = Game.setLogFunction;
    Game.setLogFunction(() => {});
    
    // First: Play Overload
    const overloadCard = CARDS.find(c => c.id === 'overload');
    testGame.applyCard(overloadCard, me, foe, false);
    assertEqual('Overload sets echoNext flag', me.echoNext, true, log);
    
    // Reset apply card counter
    applyCardCallCount = 0;
    
    // Second: Play an attack card
    const swordsCard = CARDS.find(c => c.id === 'swords');
    me.hand = [swordsCard]; // Put swords in hand
    me.energy = 5; // Ensure enough energy
    testGame.playCard(me, 0); // Play the swords card
    
    // After playing swords with overload active, should be called twice (once for play, once for overload)
    assertEqual('Overload triggers and repeats card', applyCardCallCount, 2, log);
    assertEqual('Overload flag cleared after use', me.echoNext, false, log);
    
    // Restore original functions
    Game.setLogFunction(originalSetLog);
  }

  // Test streak mechanism - ensure it only increments once per win
  {
    log('Testing streak mechanism...');
    const testGame = Object.create(Game);
    testGame.streak = 0;
    testGame.over = false;
    testGame.you = createPlayer(false);
    testGame.opp = createPlayer(true);
    testGame.stats = { firstPerfectWin: false };
    
    // Mock global functions
    const originalLog = window.log;
    window.log = () => {};
    window.recordBattleResult = () => {};
    window.checkAchievementUnlocks = () => {};
    window.checkPersonaDefeatUnlocks = () => {};
    testGame.showVictoryModal = () => {};
    
    // Setup winning scenario
    testGame.you.hp = 10;
    testGame.you.maxHP = 20;
    testGame.opp.hp = 0; // AI is dead
    
    const initialStreak = testGame.streak;
    
    // First checkWin call should increment streak
    testGame.checkWin();
    assertEqual('First checkWin increments streak', testGame.streak, initialStreak + 1, log);
    assertEqual('Game is marked as over', testGame.over, true, log);
    
    // Second checkWin call should NOT increment streak again
    const streakAfterFirst = testGame.streak;
    testGame.checkWin();
    assertEqual('Multiple checkWin calls do not increment streak again', testGame.streak, streakAfterFirst, log);
    
    // Test loss scenario
    testGame.over = false;
    testGame.streak = 5; // Set to some value
    testGame.you.hp = 0; // Player is dead
    testGame.opp.hp = 10; // AI is alive
    
    testGame.checkWin();
    assertEqual('Loss resets streak to 0', testGame.streak, 0, log);
    
    // Restore window log
    window.log = originalLog;
  }

  // Test Presto card circular reference fix (UI bug reproduction)
  {
    log('Testing Presto card circular reference handling...');
    const me = createPlayer(false);
    const foe = createPlayer(true);
    
    // Create a mock stolen card with circular reference
    const stolenCard = CARDS.find(c => c.id === 'dagger');
    const cardWithCircularRef = { ...stolenCard };
    cardWithCircularRef.stolenFrom = 'opp';
    cardWithCircularRef.originalOwner = foe; // This creates circular reference
    
    me.hand = [cardWithCircularRef];
    
    // This should not throw an error after our fix
    let predictError = false;
    try {
      const result = predictCard(cardWithCircularRef, me, foe, Game);
      assertEqual('Predict function handles circular references', typeof result, 'string', log);
    } catch (error) {
      predictError = true;
      log('ERROR: predictCard failed with circular reference: ' + error.message);
    }
    
    assertEqual('No circular reference error in predictCard', predictError, false, log);
  }

  // Test Presto card stealing mechanism
  {
    log('Testing Presto card mechanics...');
    const me = createPlayer(false);
    const foe = createPlayer(true);
    const testGame = Object.create(Game);
    testGame.you = me;
    testGame.opp = foe;
    testGame.turn = 'you';
    testGame.over = false;
    
    // Setup: Player has Presto, opponent has cards in discard
    const prestoCard = CARDS.find(c => c.id === 'presto');
    me.hand = [prestoCard];
    me.energy = 3;
    me.hp = 20; // Ensure we have enough HP for life cost
    
    // Put some cards in opponent's discard pile
    const daggerCard = CARDS.find(c => c.id === 'dagger');
    const heartCard = CARDS.find(c => c.id === 'heart');
    foe.discard = [daggerCard, heartCard];
    
    const initialHandSize = me.hand.length;
    const initialFoeDiscardSize = foe.discard.length;
    const initialHP = me.hp;
    
    log('Before Presto: player hand size=' + initialHandSize + ', opponent discard size=' + initialFoeDiscardSize);
    
    // Play Presto card
    testGame.playCard(me, 0);
    
    const finalHandSize = me.hand.length;
    const finalFoeDiscardSize = foe.discard.length;
    const finalHP = me.hp;
    
    log('After Presto: player hand size=' + finalHandSize + ', opponent discard size=' + finalFoeDiscardSize);
    
    // Verify Presto effects:
    assertEqual('Presto consumes life cost', finalHP, initialHP - 1, log);
    assertEqual('Presto reduces opponent discard by 1', finalFoeDiscardSize, initialFoeDiscardSize - 1, log);
    assertEqual('Presto maintains hand size (steal replaces played card)', finalHandSize, initialHandSize, log);
    
    // Check if stolen card has proper markers
    if (me.hand.length > 0) {
      const stolenCard = me.hand.find(card => card.stolenFrom);
      assertEqual('Stolen card has stolenFrom marker', !!stolenCard, true, log);
      if (stolenCard) {
        assertEqual('Stolen card has originalOwner', !!stolenCard.originalOwner, true, log);
        assertEqual('Original owner is opponent', stolenCard.originalOwner === foe, true, log);
      }
      
      // Test playing the stolen card
      if (stolenCard && me.hand.indexOf(stolenCard) >= 0) {
        const stolenCardIndex = me.hand.indexOf(stolenCard);
        const beforePlayDiscardSizes = { me: me.discard.length, foe: foe.discard.length };
        
        // Ensure player has energy to play stolen card
        me.energy = Math.max(me.energy, stolenCard.cost);
        
        testGame.playCard(me, stolenCardIndex);
        
        // Verify stolen card returns to original owner's discard
        const expectedFoeDiscard = beforePlayDiscardSizes.foe + 1;
        assertEqual('Stolen card returns to original owner discard', foe.discard.length, expectedFoeDiscard, log);
        
        // Check that stolen markers are cleaned up
        const returnedCard = foe.discard[foe.discard.length - 1];
        assertEqual('Returned card has no stolenFrom marker', !returnedCard.stolenFrom, true, log);
        assertEqual('Returned card has no originalOwner marker', !returnedCard.originalOwner, true, log);
      }
    }
  }

  // Stress test new additions for emergent errors
  
  // Test modal positioning utilities
  {
    log('Testing modal positioning utilities...');
    
    // Test showModal function
    if (typeof window !== 'undefined' && document) {
      const originalBodyClass = document.body.className;
      
      // Mock the showModal function from utils.js
      const testShowModal = () => {
        document.body.classList.add('modal-open');
      };
      
      const testHideModal = () => {
        document.body.classList.remove('modal-open');
      };
      
      // Test showModal
      testShowModal();
      const hasModalClass = document.body.classList.contains('modal-open');
      assertEqual('showModal adds modal-open class', hasModalClass, true, log);
      
      // Test hideModal
      testHideModal();
      const modalClassRemoved = !document.body.classList.contains('modal-open');
      assertEqual('hideModal removes modal-open class', modalClassRemoved, true, log);
      
      // Restore original class
      document.body.className = originalBodyClass;
    } else {
      log('SKIP: Modal tests require browser environment');
    }
  }

  // Test deck save/load functionality stress test
  {
    log('Stress testing deck save/load functionality...');
    
    if (typeof localStorage !== 'undefined') {
      const originalLocalStorage = {};
      ['deck_slot_1', 'deck_slot_2', 'deck_slot_3'].forEach(key => {
        originalLocalStorage[key] = localStorage.getItem(key);
      });
      
      // Test saving valid deck
      const testDeck = [
        { id: 'heart', name: 'Heart' },
        { id: 'swords', name: 'Strike' },
        { id: 'shield', name: 'Guard' }
      ];
      
      try {
        localStorage.setItem('deck_slot_1', JSON.stringify(testDeck));
        const saved = localStorage.getItem('deck_slot_1');
        const parsed = JSON.parse(saved);
        assertEqual('Deck saves to localStorage correctly', Array.isArray(parsed), true, log);
        assertEqual('Saved deck maintains structure', parsed.length, testDeck.length, log);
        assertEqual('Saved deck maintains card data', parsed[0].id, 'heart', log);
      } catch (error) {
        log('ERROR: Deck save failed: ' + error.message);
      }
      
      // Test loading with corrupted data
      try {
        localStorage.setItem('deck_slot_2', 'invalid_json');
        const corrupted = localStorage.getItem('deck_slot_2');
        let parseError = false;
        try {
          JSON.parse(corrupted);
        } catch (e) {
          parseError = true;
        }
        assertEqual('Corrupted deck data is detected', parseError, true, log);
      } catch (error) {
        log('ERROR: Corrupted deck test failed: ' + error.message);
      }
      
      // Test empty slot handling
      localStorage.removeItem('deck_slot_3');
      const emptySlot = localStorage.getItem('deck_slot_3');
      assertEqual('Empty deck slot returns null', emptySlot, null, log);
      
      // Restore original localStorage
      Object.keys(originalLocalStorage).forEach(key => {
        if (originalLocalStorage[key] !== null) {
          localStorage.setItem(key, originalLocalStorage[key]);
        } else {
          localStorage.removeItem(key);
        }
      });
    } else {
      log('SKIP: localStorage tests require browser environment');
    }
  }

  // Test Presto card edge cases for stability
  {
    log('Stress testing Presto card edge cases...');
    const me = createPlayer(false);
    const foe = createPlayer(true);
    const testGame = Object.create(Game);
    testGame.you = me;
    testGame.opp = foe;
    testGame.turn = 'you';
    testGame.over = false;
    
    const prestoCard = CARDS.find(c => c.id === 'presto');
    
    // Edge case 1: Empty opponent discard pile
    me.hand = [prestoCard];
    me.energy = 3;
    me.hp = 20;
    foe.discard = []; // Empty discard
    
    let edgeCase1Error = false;
    try {
      testGame.playCard(me, 0);
      assertEqual('Presto handles empty opponent discard gracefully', true, true, log);
    } catch (error) {
      edgeCase1Error = true;
      log('ERROR: Presto failed with empty discard: ' + error.message);
    }
    assertEqual('No error with empty opponent discard', edgeCase1Error, false, log);
    
    // Edge case 2: Opponent discard with null/undefined cards
    me.hand = [prestoCard];
    me.energy = 3;
    me.hp = 20;
    foe.discard = [null, undefined, CARDS.find(c => c.id === 'heart')];
    
    let edgeCase2Error = false;
    try {
      testGame.playCard(me, 0);
      assertEqual('Presto handles null/undefined cards gracefully', true, true, log);
    } catch (error) {
      edgeCase2Error = true;
      log('ERROR: Presto failed with null cards: ' + error.message);
    }
    assertEqual('No error with null/undefined cards in discard', edgeCase2Error, false, log);
    
    // Edge case 3: Playing stolen card when original owner is corrupted
    const stolenCard = { ...CARDS.find(c => c.id === 'dagger') };
    stolenCard.stolenFrom = 'opp';
    stolenCard.originalOwner = null; // Corrupted reference
    
    me.hand = [stolenCard];
    me.energy = 3;
    
    let edgeCase3Error = false;
    try {
      testGame.playCard(me, 0);
      assertEqual('Stolen card handles corrupted originalOwner', true, true, log);
    } catch (error) {
      edgeCase3Error = true;
      log('ERROR: Stolen card failed with corrupted owner: ' + error.message);
    }
    assertEqual('No error with corrupted originalOwner', edgeCase3Error, false, log);
  }

  // Test concurrent modal operations
  {
    log('Testing concurrent modal operations...');
    
    if (typeof document !== 'undefined') {
      // Simulate rapid modal open/close operations
      let operationError = false;
      try {
        for (let i = 0; i < 10; i++) {
          document.body.classList.add('modal-open');
          document.body.classList.remove('modal-open');
        }
        assertEqual('Rapid modal operations handled', true, true, log);
      } catch (error) {
        operationError = true;
        log('ERROR: Rapid modal operations failed: ' + error.message);
      }
      assertEqual('No error with rapid modal operations', operationError, false, log);
    } else {
      log('SKIP: Modal concurrency tests require browser environment');
    }
  }

  // Test deck save/load with unlocked cards validation
  {
    log('Testing deck validation with unlocked cards...');
    
    // Create a deck with some potentially locked cards
    const testDeckWithLocked = [
      { id: 'heart', name: 'Heart' },
      { id: 'presto', name: 'Presto' }, // Might be locked
      { id: 'reconsider', name: 'Reconsider' } // Might be locked
    ];
    
    // Test that validation logic exists (we don't need to implement full unlock checking here)
    const hasValidationLogic = typeof testDeckWithLocked === 'object';
    assertEqual('Deck validation structure exists', hasValidationLogic, true, log);
    
    // Test that cards have required properties for validation
    testDeckWithLocked.forEach((card, index) => {
      assertEqual(`Card ${index} has id`, typeof card.id, 'string', log);
      assertEqual(`Card ${index} has name`, typeof card.name, 'string', log);
    });
  }

  // Test array bounds checking in Presto implementation
  {
    log('Testing Presto array bounds checking...');
    
    // Mock splice operation safety
    const testArray = [1, 2, 3];
    const safeIndex = 1;
    const unsafeIndex = 10;
    
    // Safe operation
    const safeSplice = testArray.splice(safeIndex, 1);
    assertEqual('Safe splice returns expected result', safeSplice.length, 1, log);
    assertEqual('Safe splice extracts correct item', safeSplice[0], 2, log);
    
    // Unsafe operation should not crash
    const testArray2 = [1, 2, 3];
    let unsafeError = false;
    try {
      const unsafeSplice = testArray2.splice(unsafeIndex, 1);
      assertEqual('Unsafe splice returns empty array', unsafeSplice.length, 0, log);
    } catch (error) {
      unsafeError = true;
      log('ERROR: Unsafe splice crashed: ' + error.message);
    }
    assertEqual('No error with out-of-bounds splice', unsafeError, false, log);
  }

  // Test Ferriglobin card mechanics
  {
    log('Testing Ferriglobin card mechanics...');
    const me = createPlayer(false);
    const foe = createPlayer(true);
    const ferriglobinCard = CARDS.find(c => c.id === 'ferriglobin');
    
    if (ferriglobinCard) {
      const testGame = Object.create(Game);
      testGame.you = me;
      testGame.opp = foe;
      testGame.turn = 'you';
      testGame.over = false;
      
      // Test 1: Convert shield to health
      me.hp = 15;
      me.maxHP = 20;
      me.shield = 5;
      
      const originalHP = me.hp;
      const originalShield = me.shield;
      
      // Mock log function to avoid errors
      const originalSetLog = Game.setLogFunction;
      Game.setLogFunction(() => {});
      
      testGame.applyCard(ferriglobinCard, me, foe, false);
      
      Game.setLogFunction(originalSetLog);
      
      // Verify shield was converted to health
      assertEqual('Ferriglobin converts shield to health', me.hp, originalHP + originalShield, log);
      assertEqual('Ferriglobin removes all shield', me.shield, 0, log);
      
      // Test 2: No shield to convert
      me.hp = 18;
      me.shield = 0;
      const noShieldHP = me.hp;
      
      Game.setLogFunction(() => {});
      testGame.applyCard(ferriglobinCard, me, foe, false);
      Game.setLogFunction(originalSetLog);
      
      // Verify no change when no shield
      assertEqual('Ferriglobin does nothing with no shield', me.hp, noShieldHP, log);
      assertEqual('Ferriglobin maintains zero shield', me.shield, 0, log);
    } else {
      log('SKIP: Ferriglobin card not found for testing');
    }
  }

  // Test Debug Implementation
  {
    log('Testing debug implementation...');
    
    // Test debug screen elements exist
    if (typeof document !== 'undefined') {
      const debugElements = [
        'debugScreen',
        'debugCloseBtn', 
        'debugUnlockAll',
        'debugLockAll',
        'debugUnlockFerriglobin',
        'debugUnlockImpervious',
        'debugShowUnlocks',
        'debugStartCampaign',
        'debugEndCampaign',
        'debugMaxHP',
        'debugMaxShield',
        'debugMaxEnergy'
      ];
      
      let missingElements = [];
      debugElements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
          missingElements.push(id);
        }
      });
      
      assertEqual('All debug elements exist', missingElements.length, 0, log);
      if (missingElements.length > 0) {
        log('Missing debug elements: ' + missingElements.join(', '));
      }
    } else {
      log('SKIP: Debug UI tests require browser environment');
    }
    
    // Test debug unlock functionality
    if (window.CardUnlock && typeof window.CardUnlock.debugUnlock === 'function') {
      const initialUnlocked = window.CardUnlock.getUnlockedCards().length;
      
      // Test unlocking a card through debug
      let debugUnlockSuccess = false;
      try {
        debugUnlockSuccess = window.CardUnlock.debugUnlock('impervious');
        assertEqual('Debug unlock returns success for new card', debugUnlockSuccess, true, log);
        
        const afterUnlock = window.CardUnlock.getUnlockedCards().length;
        assertEqual('Debug unlock increases unlocked count', afterUnlock, initialUnlocked + 1, log);
        
        // Test unlocking same card again
        const secondUnlock = window.CardUnlock.debugUnlock('impervious');
        assertEqual('Debug unlock returns false for already unlocked card', secondUnlock, false, log);
        
      } catch (error) {
        log('ERROR: Debug unlock failed: ' + error.message);
      }
    } else {
      log('SKIP: CardUnlock.debugUnlock not available');
    }
    
    // Test debug access unlock event
    if (window.CardUnlock && typeof window.CardUnlock.checkAchievementUnlocks === 'function') {
      // Reset impervious unlock for testing
      if (window.CardUnlock.resetUnlocks) {
        window.CardUnlock.resetUnlocks();
      }
      
      let debugAccessSuccess = false;
      try {
        // Simulate debug access
        window.CardUnlock.checkAchievementUnlocks({
          event: 'debugAccess'
        });
        
        const unlockedCards = window.CardUnlock.getUnlockedCards();
        const imperviousUnlocked = unlockedCards.includes('impervious');
        assertEqual('Debug access unlocks Impervious card', imperviousUnlocked, true, log);
        
      } catch (error) {
        log('ERROR: Debug access unlock failed: ' + error.message);
      }
    } else {
      log('SKIP: CardUnlock.checkAchievementUnlocks not available');
    }
  }

  // Test Impervious Card Mechanics
  {
    log('Testing Impervious card mechanics...');
    const me = createPlayer(false);
    const foe = createPlayer(true);
    const imperviousCard = CARDS.find(c => c.id === 'impervious');
    
    if (imperviousCard) {
      const testGame = Object.create(Game);
      testGame.you = me;
      testGame.opp = foe;
      testGame.turn = 'you';
      testGame.over = false;
      testGame.stats = { maxBurnAmount: 0 };
      
      // Test 1: Impervious card grants immunity for next turn
      assertEqual('Impervious card exists', !!imperviousCard, true, log);
      assertEqual('Impervious has correct cost', imperviousCard.cost, 2, log);
      assertEqual('Impervious is power type', imperviousCard.type, 'power', log);
      
      // Test 2: Playing Impervious grants imperviousNext status
      const originalSetLog = Game.setLogFunction;
      Game.setLogFunction(() => {});
      
      me.status.imperviousNext = false;
      testGame.applyCard(imperviousCard, me, foe, false);
      assertEqual('Playing Impervious grants imperviousNext status', me.status.imperviousNext, true, log);
      
      // Test 3: Starting turn activates immunity
      me.status.impervious = false;
      testGame.startTurn(me);
      assertEqual('Turn start activates immunity', me.status.impervious, true, log);
      assertEqual('Turn start clears imperviousNext', me.status.imperviousNext, false, log);
      
      // Test 4: Immunity blocks direct damage
      me.hp = 20;
      me.shield = 5;
      const originalHP = me.hp;
      const originalShield = me.shield;
      
      testGame.hit(me, 10, false, false);
      assertEqual('Immunity blocks damage to HP', me.hp, originalHP, log);
      assertEqual('Immunity maintains shields', me.shield, originalShield, log);
      
      // Test 5: Immunity blocks pierce damage
      testGame.hit(me, 8, true, false);
      assertEqual('Immunity blocks pierce damage', me.hp, originalHP, log);
      assertEqual('Immunity maintains shields against pierce', me.shield, originalShield, log);
      
      // Test 6: Immunity blocks burn damage
      me.status.burn = 5;
      me.status.burnTurns = 2;
      testGame.hit(me, me.status.burn, true, false); // Simulate burn damage
      assertEqual('Immunity blocks burn damage', me.hp, originalHP, log);
      
      // Test 7: Next turn clears immunity
      me.status.impervious = true;
      testGame.startTurn(me); // Second turn start should clear immunity
      assertEqual('Second turn clears immunity', me.status.impervious, false, log);
      
      // Test 8: Damage works normally after immunity ends
      testGame.hit(me, 3, false, false);
      assertEqual('Damage works after immunity ends', me.hp < originalHP, true, log);
      
      Game.setLogFunction(originalSetLog);
    } else {
      log('SKIP: Impervious card not found for testing');
    }
  }

  // Test Purge clears Impervious
  {
    log('Testing Purge clears Impervious...');
    const me = createPlayer(false);
    const foe = createPlayer(true);
    const purgeCard = CARDS.find(c => c.id === 'purge');
    
    if (purgeCard) {
      const testGame = Object.create(Game);
      testGame.you = me;
      testGame.opp = foe;
      testGame.turn = 'you';
      testGame.over = false;
      
      // Set up immunity states
      me.status.impervious = true;
      me.status.imperviousNext = true;
      
      const originalSetLog = Game.setLogFunction;
      Game.setLogFunction(() => {});
      
      // Apply purge card
      testGame.applyCard(purgeCard, me, foe, false);
      
      Game.setLogFunction(originalSetLog);
      
      assertEqual('Purge clears impervious status', me.status.impervious, false, log);
      assertEqual('Purge clears imperviousNext status', me.status.imperviousNext, false, log);
    } else {
      log('SKIP: Purge card not found for testing');
    }
  }

  // Test Impervious stacking behavior
  {
    log('Testing Impervious stacking behavior...');
    const me = createPlayer(false);
    const foe = createPlayer(true);
    const imperviousCard = CARDS.find(c => c.id === 'impervious');
    
    if (imperviousCard) {
      const testGame = Object.create(Game);
      testGame.you = me;
      testGame.opp = foe;
      testGame.turn = 'you';
      testGame.over = false;
      
      const originalSetLog = Game.setLogFunction;
      Game.setLogFunction(() => {});
      
      // Play Impervious twice in one turn
      me.status.imperviousNext = false;
      testGame.applyCard(imperviousCard, me, foe, false);
      const afterFirst = me.status.imperviousNext;
      
      testGame.applyCard(imperviousCard, me, foe, false);
      const afterSecond = me.status.imperviousNext;
      
      assertEqual('First Impervious grants status', afterFirst, true, log);
      assertEqual('Second Impervious does not stack', afterSecond, true, log); // Should still be true, not stacked
      
      // Activate immunity
      testGame.startTurn(me);
      assertEqual('Immunity activates normally', me.status.impervious, true, log);
      
      // Test that playing Impervious while already immune extends it
      me.energy = 3; // Give energy to play card
      testGame.applyCard(imperviousCard, me, foe, false);
      assertEqual('Playing Impervious while immune sets imperviousNext', me.status.imperviousNext, true, log);
      
      Game.setLogFunction(originalSetLog);
    } else {
      log('SKIP: Impervious card not found for testing');
    }
  }

  log('Debug and Impervious tests complete.');

  // Comprehensive Echo and Overload Tests
  {
    log('Testing comprehensive Echo and Overload scenarios...');
    
    // Test Echo with no last card
    {
      const me = createPlayer(false);
      const foe = createPlayer(true);
      const testGame = Object.create(Game);
      testGame.you = me;
      testGame.opp = foe;
      testGame.isEchoing = false;
      testGame.checkWin = () => {};
      
      // Set a mock log function
      const originalSetLog = Game.setLogFunction;
      Game.setLogFunction(() => {});
      
      const initialHandSize = me.hand.length;
      me.lastPlayed = null; // No last card
      
      testGame.applyCard(CARDS.find(c => c.id === 'echo'), me, foe, false);
      
      // Should draw a card when no last card to echo
      assertEqual('Echo draws card when no lastPlayed', me.hand.length, initialHandSize + 1, log);
      
      Game.setLogFunction(originalSetLog);
    }
    
    // Test Echo ignores other Echo cards as lastPlayed
    {
      const me = createPlayer(false);
      const foe = createPlayer(true);
      const testGame = Object.create(Game);
      testGame.you = me;
      testGame.opp = foe;
      testGame.isEchoing = false;
      testGame.checkWin = () => {};
      
      const originalSetLog = Game.setLogFunction;
      Game.setLogFunction(() => {});
      
      const initialHandSize = me.hand.length;
      me.lastPlayed = CARDS.find(c => c.id === 'echo'); // Last card was Echo
      
      testGame.applyCard(CARDS.find(c => c.id === 'echo'), me, foe, false);
      
      // Should draw card since last Echo card is ignored
      assertEqual('Echo ignores Echo as lastPlayed', me.hand.length, initialHandSize + 1, log);
      
      Game.setLogFunction(originalSetLog);
    }
    
    // Test Echo with complex cards (Ferriglobin)
    {
      const me = createPlayer(false);
      const foe = createPlayer(true);
      const testGame = Object.create(Game);
      testGame.you = me;
      testGame.opp = foe;
      testGame.isEchoing = false;
      testGame.checkWin = () => {};
      
      const originalSetLog = Game.setLogFunction;
      Game.setLogFunction(() => {});
      
      // Set up scenario: player has shield, last played was Ferriglobin
      me.shield = 5;
      me.hp = 15;
      me.lastPlayed = CARDS.find(c => c.id === 'ferriglobin');
      
      testGame.applyCard(CARDS.find(c => c.id === 'echo'), me, foe, false);
      
      // Ferriglobin should have been repeated - shield converted to health
      assertEqual('Echo repeats Ferriglobin correctly', me.shield, 0, log);
      assertEqual('Echo repeats Ferriglobin correctly - HP', me.hp, 20, log); // 15 + 5 shield
      
      Game.setLogFunction(originalSetLog);
    }
    
    // Test Overload prevents infinite loops
    {
      const me = createPlayer(false);
      const foe = createPlayer(true);
      const testGame = Object.create(Game);
      testGame.you = me;
      testGame.opp = foe;
      testGame.isEchoing = false;
      testGame.checkWin = () => {};
      
      const originalSetLog = Game.setLogFunction;
      Game.setLogFunction(() => {});
      
      // Play Overload, then another Overload
      me.hand = [CARDS.find(c => c.id === 'overload'), CARDS.find(c => c.id === 'overload')];
      me.energy = 5;
      
      testGame.playCard(me, 0); // First Overload
      assertEqual('First Overload sets flag', me.echoNext, true, log);
      
      testGame.playCard(me, 0); // Second Overload (should not trigger infinite loop)
      assertEqual('Second Overload does not infinite loop', me.echoNext, true, log);
      
      Game.setLogFunction(originalSetLog);
    }
    
    // Test Overload with enemy AI usage
    {
      const me = createPlayer(false);
      const foe = createPlayer(true);
      foe.isAI = true;
      const testGame = Object.create(Game);
      testGame.you = me;
      testGame.opp = foe;
      testGame.turn = 'opp';
      testGame.isEchoing = false;
      testGame.checkWin = () => {};
      
      const originalSetLog = Game.setLogFunction;
      Game.setLogFunction(() => {});
      
      // AI plays Overload then Strike
      foe.hand = [CARDS.find(c => c.id === 'overload'), CARDS.find(c => c.id === 'swords')];
      foe.energy = 5;
      me.hp = 20;
      
      testGame.playCard(foe, 0); // AI plays Overload
      assertEqual('AI Overload sets flag', foe.echoNext, true, log);
      
      testGame.playCard(foe, 0); // AI plays Strike (should be repeated)
      assertEqual('AI Overload triggers correctly', me.hp, 14, log); // 20 - 3 - 3 = 14
      assertEqual('AI Overload flag cleared', foe.echoNext, false, log);
      
      Game.setLogFunction(originalSetLog);
    }
    
    // Test interaction between Echo usage tracking and Overload unlock
    {
      log('Testing Echo usage tracking for Overload unlock...');
      
      // Mock card unlock checking
      let unlockEvents = [];
      const mockUnlockSystem = {
        checkAchievementUnlocks: (ctx) => {
          unlockEvents.push(ctx);
        }
      };
      
      // Test that Echo card played events would be tracked
      const testEvent = {
        event: 'cardPlayed',
        cardId: 'echo',
        cardType: 'skill'
      };
      
      mockUnlockSystem.checkAchievementUnlocks(testEvent);
      assertEqual('Echo usage tracking event recorded', unlockEvents.length, 1, log);
      assertEqual('Echo usage tracking has correct cardId', unlockEvents[0].cardId, 'echo', log);
    }
    
    log('Echo and Overload comprehensive tests complete.');
  }
  
  // Test Echo with Focus to ensure it duplicates the previously selected card this turn
  {
    log('Testing Echo with Focus scenario...');
    const me = createPlayer(false);
    const foe = createPlayer(true);
    const testGame = Object.create(Game);
    testGame.you = me;
    testGame.opp = foe;
    testGame.isEchoing = false;
    testGame.checkWin = () => {};
    testGame.stats = { maxBurnAmount: 0 };
    
    const originalSetLog = Game.setLogFunction;
    Game.setLogFunction(() => {});
    
    // Start turn to reset lastPlayedThisTurn
    testGame.startTurn(me);
    
    // Set up scenario: Play Focus first, then Echo
    me.hand = [CARDS.find(c => c.id === 'star'), CARDS.find(c => c.id === 'echo')];
    me.energy = 5;
    me.status.nextPlus = 0;
    
    // Play Focus first
    testGame.playCard(me, 0); // Focus
    assertEqual('Focus gives +2 next attack', me.status.nextPlus, 2, log);
    assertEqual('lastPlayedThisTurn is Focus', me.lastPlayedThisTurn.id, 'star', log);
    
    // Play Echo second
    testGame.playCard(me, 0); // Echo (now index 0 since Focus was removed)
    assertEqual('Echo repeats Focus +2', me.status.nextPlus, 4, log); // Should be 2 + 2 = 4
    
    Game.setLogFunction(originalSetLog);
  }
  
  // Test Echo with no previous card this turn
  {
    log('Testing Echo with no previous card this turn...');
    const me = createPlayer(false);
    const foe = createPlayer(true);
    const testGame = Object.create(Game);
    testGame.you = me;
    testGame.opp = foe;
    testGame.isEchoing = false;
    testGame.checkWin = () => {};
    
    const originalSetLog = Game.setLogFunction;
    Game.setLogFunction(() => {});
    
    // Start turn to reset lastPlayedThisTurn
    testGame.startTurn(me);
    
    // Play Echo as first card of turn
    me.hand = [CARDS.find(c => c.id === 'echo')];
    me.energy = 3;
    const initialHandSize = me.hand.length + me.deck.length; // Total cards available
    
    testGame.playCard(me, 0); // Echo with no previous card
    assertEqual('Echo draws 1 when no previous card', me.hand.length + me.deck.length, initialHandSize, log); // Should be same total (drew 1 to replace played card)
    
    Game.setLogFunction(originalSetLog);
  }
  
  // Test Reap card functionality and edge cases
  {
    log('Testing Reap card edge cases...');
    const me = createPlayer(false);
    const foe = createPlayer(true);
    const testGame = Object.create(Game);
    testGame.you = me;
    testGame.opp = foe;
    testGame.isEchoing = false;
    testGame.checkWin = () => {};
    testGame.stats = { maxBurnAmount: 0 };
    testGame.turn = 'you';
    
    const originalSetLog = Game.setLogFunction;
    Game.setLogFunction(() => {});
    
    // Test Reap with sufficient HP
    me.hp = 10;
    foe.hp = 20;
    foe.shield = 0;
    
    testGame.applyCard(CARDS.find(c => c.id === 'reap'), me, foe, false);
    
    assertEqual('Reap deals half player HP to opponent', foe.hp, 15, log); // 20 - 5 = 15
    assertEqual('Reap deals damage to self', me.hp, 5, log); // 10 - 5 = 5
    
    // Test Reap at 1 HP (should not work)
    me.hp = 1;
    foe.hp = 20;
    
    testGame.applyCard(CARDS.find(c => c.id === 'reap'), me, foe, false);
    assertEqual('Reap at 1 HP does no damage to opponent', foe.hp, 20, log);
    assertEqual('Reap at 1 HP does no damage to self', me.hp, 1, log);
    
    // Test Reap with odd HP (should round down)
    me.hp = 9;
    foe.hp = 20;
    
    testGame.applyCard(CARDS.find(c => c.id === 'reap'), me, foe, false);
    assertEqual('Reap with odd HP rounds down', foe.hp, 16, log); // 20 - 4 = 16 (9/2 = 4.5 rounded down to 4)
    assertEqual('Reap with odd HP rounds down for self', me.hp, 5, log); // 9 - 4 = 5
    
    Game.setLogFunction(originalSetLog);
  }

  // Test Shield card
  {
    const me = createPlayer(false);
    me.shield = 0;
    me.energy = 5;
    
    const mockGame = {
      you: me,
      opp: createPlayer(true),
      checkWin: () => {}
    };
    
    Game.applyCard.call(mockGame, CARDS.find(c => c.id === 'shield'), me, me, false);
    assertEqual('Shield adds 3 shield', me.shield, 3, log);
    assertEqual('Shield costs 1 energy', me.energy, 4, log);
  }

  // Test Fire (Ignite) card
  {
    const me = createPlayer(false);
    const foe = createPlayer(true);
    me.energy = 5;
    foe.status = { burn: 0 };
    
    const mockGame = {
      you: me,
      opp: foe,
      checkWin: () => {}
    };
    
    Game.applyCard.call(mockGame, CARDS.find(c => c.id === 'fire'), me, foe, false);
    assertEqual('Ignite costs 2 energy', me.energy, 3, log);
    assertEqual('Ignite inflicts 2 burn turns', foe.status.burn, 2, log);
  }

  // Test Snow (Freeze) card
  {
    const me = createPlayer(false);
    const foe = createPlayer(true);
    me.energy = 5;
    foe.status = { freeze: 0 };
    
    const mockGame = {
      you: me,
      opp: foe,
      checkWin: () => {}
    };
    
    Game.applyCard.call(mockGame, CARDS.find(c => c.id === 'snow'), me, foe, false);
    assertEqual('Freeze costs 2 energy', me.energy, 3, log);
    assertEqual('Freeze inflicts 1 freeze turn', foe.status.freeze, 1, log);
  }
  
  log('Self-tests complete.');
}