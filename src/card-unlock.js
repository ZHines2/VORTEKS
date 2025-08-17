import { ACHIEVEMENTS, MIGRATION_VERSION, DEBUG } from './config.js';
import { CARDS } from '../data/cards.js';

// card-unlock.js
// VORTEKS Card Unlock System
// Design goals: simplicity, declarative metadata, scalability, non-intrusive UX.

const LS_KEY = 'vorteks-card-unlocks';
const LS_QUIRKS_KEY = 'vorteks-quirks';
const STORAGE_VERSION = MIGRATION_VERSION;

// 6 starter cards (always unlocked immediately)
const STARTER_CARDS = ['swords','shield','heart','fire','bolt','star'];

// Create mapping from card ID to pretty name for announcements
const CARD_NAME_MAP = Object.fromEntries(CARDS.map(c => [c.id, c.name]));

// Unlock metadata for NON-starter existing/future cards.
// Each entry:
//  id: card id
//  kind: 'achievement' | 'persona'
//  description: appears in UI / future unlocks panel
//  check(ctx, state): returns true if achievement just satisfied; may mutate state.progress
//  progressHint: optional progress string
//  resetBattleFlags(state): optional cleanup at battle end
const UNLOCK_META = [
  {
    id: 'reconsider',
    kind: 'achievement',
    description: 'Reach a 5-win streak.',
    progressHint: s => `Win streak best: ${s.progress.reconsiderBestStreak || 0}/5`,
    check: (ctx, state) => {
      if (ctx.event === 'battleEnd' && ctx.result === 'win' && ctx.streak != null) {
        if (!state.progress.reconsiderBestStreak || ctx.streak > state.progress.reconsiderBestStreak) {
          state.progress.reconsiderBestStreak = ctx.streak;
        }
        return ctx.streak >= 5;
      }
      return false;
    }
  },
  {
    id: 'echo',
    kind: 'achievement',
    description: 'Play 3 different card types in one turn: attack (⚔), skill (🛠), and power (💎).',
    progressHint: s => `Turn type diversity best: ${s.progress.echoMaxTurnTypes || 0}/3`,
    check: (ctx, state) => {
      if (ctx.event === 'turnEnd' && ctx.turnTypes) {
        const size = ctx.turnTypes.size;
        if (!state.progress.echoMaxTurnTypes || size > state.progress.echoMaxTurnTypes) {
          state.progress.echoMaxTurnTypes = size;
        }
        return size >= 3;
      }
      return false;
    }
  },
  {
    id: 'snow',
    kind: 'achievement',
    description: 'Win a battle while you have 10+ shield at any end-of-turn.',
    progressHint: () => 'Accumulate ≥10 shield then win.',
    check: (ctx, state) => {
      if (ctx.event === 'turnEnd' && ctx.youShield != null) {
        if (ctx.youShield >= 10) state.progress.snowFlagThisBattle = true;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        return !!state.progress.snowFlagThisBattle;
      }
      return false;
    },
    resetBattleFlags: (state) => {
      delete state.progress.snowFlagThisBattle;
    }
  },
  {
    id: 'dagger',
    kind: 'achievement',
    description: 'Deal 7 or more total damage in a single turn.',
    progressHint: s => `Best burst: ${s.progress.daggerBurst || 0}/7`,
    check: (ctx, state) => {
      if (ctx.event === 'damage' && ctx.source === 'you') {
        state.progress.tempTurnDamage = (state.progress.tempTurnDamage || 0) + ctx.amount;
      }
      if (ctx.event === 'turnEnd') {
        const burst = state.progress.tempTurnDamage || 0;
        if (!state.progress.daggerBurst || burst > state.progress.daggerBurst) {
          state.progress.daggerBurst = burst;
        }
        state.progress.tempTurnDamage = 0;
        return burst >= 7;
      }
      return false;
    }
  },
  {
    id: 'loop',
    kind: 'achievement',
    description: 'End 3 different turns in one battle with ≥2 unspent energy, then win.',
    progressHint: s => `Banked turns best: ${s.progress.loopBestBanked || 0}/3`,
    check: (ctx, state) => {
      if (ctx.event === 'turnEnd' && ctx.youUnspentEnergy != null) {
        if (ctx.youUnspentEnergy >= 2) {
          state.progress.loopBankedThisBattle = (state.progress.loopBankedThisBattle || 0) + 1;
          if (!state.progress.loopBestBanked || state.progress.loopBankedThisBattle > state.progress.loopBestBanked) {
            state.progress.loopBestBanked = state.progress.loopBankedThisBattle;
          }
        }
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        return (state.progress.loopBankedThisBattle || 0) >= 3;
      }
      return false;
    },
    resetBattleFlags: (state) => {
      delete state.progress.loopBankedThisBattle;
    }
  },
  {
    id: 'curiosity',
    kind: 'persona',
    description: 'Defeat a Cat opponent.',
    progressHint: () => 'Find and defeat any Cat opponent.',
    check: () => false // Handled by persona defeat system
  },
  {
    id: 'droid',
    kind: 'persona',
    description: 'Defeat any Robot opponent.',
    progressHint: () => 'Find and defeat any Robot opponent.',
    check: () => false // Handled by persona defeat system
  },
  {
    id: 'purge',
    kind: 'persona',
    description: 'Defeat a Doctor opponent.',
    progressHint: () => 'Find and defeat a Doctor opponent.',
    check: () => false // Handled by persona defeat system
  },
  {
    id: 'wallop',
    kind: 'persona',
    description: 'Defeat any Bruiser opponent.',
    progressHint: () => 'Find and defeat any Bruiser opponent.',
    check: () => false // Handled by persona defeat system
  },
  {
    id: 'presto',
    kind: 'persona',
    description: 'Defeat any Trickster opponent.',
    progressHint: () => 'Find and defeat any Trickster opponent.',
    check: () => false // Handled by persona defeat system
  },
  {
    id: 'ferriglobin',
    kind: 'achievement',
    description: 'Reach booster level 5 in campaign mode.',
    progressHint: () => {
      try {
        // Import Campaign module to check booster level
        const Campaign = window.Campaign || {};
        const boosterLevel = Campaign.boosterLevel || 0;
        return `Campaign booster level: ${boosterLevel}/5`;
      } catch {
        return 'Campaign booster level: 0/5';
      }
    },
    check: (ctx, state) => {
      if (ctx.event === 'campaignVictory' && ctx.boosterLevel != null) {
        return ctx.boosterLevel >= 5;
      }
      return false;
    }
  }
];

// Quirks metadata
const QUIRKS_META = [
  {
    id: 'myfirst',
    name: 'MY FIRST QUIRK',
    description: '+1 opening hand card at battle start.',
    unlockedByDefault: true,
    effect: 'opening_hand_plus_one'
  },
  {
    id: 'minty',
    name: 'MINTY',
    description: 'Start with +1 max 🔆 (and +1 now).',
    unlockedByDefault: false,
    hint: `Spend ${ACHIEVEMENTS.MINTY_ENERGY_THRESHOLD}+ 🔆 in a single turn.`,
    effect: 'start_energy_plus_one',
    check: (ctx, state) => {
      if (ctx.event === 'turnEnd' && ctx.energySpentThisTurn != null) {
        if (!state.progress.mintyMaxEnergySpent || ctx.energySpentThisTurn > state.progress.mintyMaxEnergySpent) {
          state.progress.mintyMaxEnergySpent = ctx.energySpentThisTurn;
        }
        return ctx.energySpentThisTurn >= ACHIEVEMENTS.MINTY_ENERGY_THRESHOLD;
      }
      return false;
    }
  },
  {
    id: 'spicy',
    name: 'SPICY',
    description: 'Your Burns deal +1.',
    unlockedByDefault: false,
    hint: `Deal ${ACHIEVEMENTS.SPICY_BURN_THRESHOLD}+ Burn damage in one battle.`,
    effect: 'burn_plus_one',
    check: (ctx, state) => {
      if (ctx.event === 'burnDamage' && ctx.source === 'you') {
        state.progress.spicyBurnThisBattle = (state.progress.spicyBurnThisBattle || 0) + ctx.amount;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        return (state.progress.spicyBurnThisBattle || 0) >= ACHIEVEMENTS.SPICY_BURN_THRESHOLD;
      }
      return false;
    },
    resetBattleFlags: (state) => {
      delete state.progress.spicyBurnThisBattle;
    }
  },
  {
    id: 'piercer',
    name: 'PIERCER',
    description: 'Your first attack each turn pierces 1.',
    unlockedByDefault: false,
    hint: `Deal ${ACHIEVEMENTS.PIERCER_DAMAGE_THRESHOLD}+ pierce damage in one battle.`,
    effect: 'first_attack_pierce',
    check: (ctx, state) => {
      if (ctx.event === 'pierceDamage' && ctx.source === 'you') {
        state.progress.piercerDamageThisBattle = (state.progress.piercerDamageThisBattle || 0) + ctx.amount;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        return (state.progress.piercerDamageThisBattle || 0) >= ACHIEVEMENTS.PIERCER_DAMAGE_THRESHOLD;
      }
      return false;
    },
    resetBattleFlags: (state) => {
      delete state.progress.piercerDamageThisBattle;
    }
  },
  {
    id: 'guardian',
    name: 'GUARDIAN',
    description: 'Gain +1 shield at the start of each of your turns.',
    unlockedByDefault: false,
    hint: 'Win a battle without losing HP (perfect block).',
    effect: 'turn_start_shield',
    check: (ctx, state) => {
      if (ctx.event === 'damage' && ctx.target === 'you' && ctx.amount > 0) {
        state.progress.guardianTookDamageThisBattle = true;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        return !state.progress.guardianTookDamageThisBattle;
      }
      return false;
    },
    resetBattleFlags: (state) => {
      delete state.progress.guardianTookDamageThisBattle;
    }
  },
  {
    id: 'scholar',
    name: 'SCHOLAR',
    description: '25% chance at the start of each of your turns to draw +1 card.',
    unlockedByDefault: false,
    hint: `Draw ${ACHIEVEMENTS.SCHOLAR_DRAW_THRESHOLD}+ cards in a single turn.`,
    effect: 'turn_start_draw_chance',
    check: (ctx, state) => {
      if (ctx.event === 'cardDrawn' && ctx.source === 'you') {
        state.progress.scholarCardsThisTurn = (state.progress.scholarCardsThisTurn || 0) + 1;
      }
      if (ctx.event === 'turnEnd') {
        const drawn = state.progress.scholarCardsThisTurn || 0;
        if (!state.progress.scholarMaxDrawnInTurn || drawn > state.progress.scholarMaxDrawnInTurn) {
          state.progress.scholarMaxDrawnInTurn = drawn;
        }
        state.progress.scholarCardsThisTurn = 0;
        return drawn >= ACHIEVEMENTS.SCHOLAR_DRAW_THRESHOLD;
      }
      return false;
    }
  },
  {
    id: 'hearty',
    name: 'HEARTY',
    description: '+5 HP at the start of each battle.',
    unlockedByDefault: false,
    hint: `Win a battle at ${ACHIEVEMENTS.HEARTY_HP_THRESHOLD} HP or less.`,
    effect: 'battle_start_hp',
    check: (ctx, state) => {
      if (ctx.event === 'battleEnd' && ctx.result === 'win' && ctx.youHP != null) {
        return ctx.youHP <= ACHIEVEMENTS.HEARTY_HP_THRESHOLD;
      }
      return false;
    }
  }
];

// Persona-based unlock mapping (future expansion)
// personaName -> cardId
const PERSONA_UNLOCKS = {
  // Cat persona unlocks Curiosity card
  'cat': 'curiosity',
  'feline': 'curiosity',
  // Robot persona unlocks Droid Protocol card
  'robot': 'droid',
  'automaton': 'droid',
  // Doctor persona unlocks Purge card
  'doctor': 'purge',
  // Bruiser persona unlocks Wallop card
  'bruiser': 'wallop',
  // Trickster persona unlocks Presto card
  'trickster': 'presto'
  // Example future entries:
  // 'Glacier': 'snow',  // would unlock Freeze card
  // 'Assassin': 'dagger'  // would unlock Pierce card
};

// Quirks state management
function freshQuirksState() {
  const base = { version: STORAGE_VERSION, unlocked: {} };
  // Unlock default quirks
  QUIRKS_META.forEach(quirk => {
    if (quirk.unlockedByDefault) {
      base.unlocked[quirk.id] = true;
    }
  });
  return base;
}

function loadQuirksState() {
  try {
    const raw = localStorage.getItem(LS_QUIRKS_KEY);
    if (!raw) {
      const s = freshQuirksState();
      saveQuirksState(s);
      return s;
    }
    const parsed = JSON.parse(raw);
    
    // Handle migration from older versions
    if (parsed.version !== STORAGE_VERSION) {
      if (DEBUG.LOG_MIGRATIONS) {
        console.log(`Migrating quirks storage from version ${parsed.version || 'undefined'} to ${STORAGE_VERSION}`);
      }
      
      // Preserve unlocked quirks where possible
      const migrated = freshQuirksState();
      if (parsed.unlocked) {
        migrated.unlocked = { ...migrated.unlocked, ...parsed.unlocked };
      }
      if (parsed.progress) {
        migrated.progress = { ...parsed.progress };
      }
      
      saveQuirksState(migrated);
      return migrated;
    }
    
    parsed.unlocked ||= {};
    return parsed;
  } catch (error) {
    if (DEBUG.LOG_MIGRATIONS) {
      console.warn('Failed to parse quirks storage, reinitializing:', error);
    }
    const s = freshQuirksState();
    saveQuirksState(s);
    return s;
  }
}

function saveQuirksState(state) {
  try { localStorage.setItem(LS_QUIRKS_KEY, JSON.stringify(state)); } catch {}
}

let _quirksState = loadQuirksState();

function freshState() {
  const base = {
    version: STORAGE_VERSION,
    unlocked: {},
    progress: {},
    personaDefeats: {},
    stats: {}
  };
  STARTER_CARDS.forEach(id => { base.unlocked[id] = true; });
  return base;
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      const s = freshState();
      saveState(s);
      return s;
    }
    const parsed = JSON.parse(raw);
    
    // Handle migration from older versions
    if (parsed.version !== STORAGE_VERSION) {
      if (DEBUG.LOG_MIGRATIONS) {
        console.log(`Migrating storage from version ${parsed.version || 'undefined'} to ${STORAGE_VERSION}`);
      }
      
      // Preserve unlocked cards and progress where possible
      const migrated = freshState();
      if (parsed.unlocked) {
        migrated.unlocked = { ...migrated.unlocked, ...parsed.unlocked };
      }
      if (parsed.progress) {
        migrated.progress = { ...parsed.progress };
      }
      if (parsed.personaDefeats) {
        migrated.personaDefeats = { ...parsed.personaDefeats };
      }
      if (parsed.stats) {
        migrated.stats = { ...parsed.stats };
      }
      
      saveState(migrated);
      return migrated;
    }
    
    parsed.unlocked ||= {};
    parsed.progress ||= {};
    parsed.personaDefeats ||= {};
    parsed.stats ||= {};
    return parsed;
  } catch (error) {
    if (DEBUG.LOG_MIGRATIONS) {
      console.warn('Failed to parse storage, reinitializing:', error);
    }
    const s = freshState();
    saveState(s);
    return s;
  }
}

function saveState(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}

let _state = loadState();

function isCardUnlocked(id) { return !!_state.unlocked[id]; }
function getUnlockedCards() { return Object.keys(_state.unlocked).filter(k => _state.unlocked[k]); }

function unlockCard(id, cause = '') {
  if (isCardUnlocked(id)) return false;
  _state.unlocked[id] = true;
  saveState(_state);
  announceUnlock(id, cause);
  return true;
}

function announceUnlock(id, cause) {
  const cardName = CARD_NAME_MAP[id] || id;
  const msg = `CARD UNLOCKED: ${cardName}${cause ? ' (' + cause + ')' : ''}`;
  if (window.log) window.log(msg);
  // Lightweight toast
  try {
    const existing = document.getElementById('unlockToast');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.id = 'unlockToast';
    div.textContent = msg;
    Object.assign(div.style, {
      position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--accent)', color: 'black', padding: '6px 12px', fontSize: '12px',
      fontWeight: 'bold', borderRadius: '6px', zIndex: 9999, boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
    });
    document.body.appendChild(div);
    setTimeout(()=>div.remove(), 4000);
  } catch {}
}

function getUnlockableCardsInfo() {
  return UNLOCK_META.map(m => ({
    id: m.id,
    unlocked: isCardUnlocked(m.id),
    kind: m.kind,
    description: m.description,
    progress: m.progressHint ? m.progressHint(_state) : ''
  }));
}

function resetUnlocks() {
  _state = freshState();
  saveState(_state);
}

function resetQuirks() {
  _quirksState = freshQuirksState();
  saveQuirksState(_quirksState);
}

function debugUnlock(id) { unlockCard(id, 'debug'); }

// Quirks functions
function isQuirkUnlocked(id) { return !!_quirksState.unlocked[id]; }
function getUnlockedQuirks() { return Object.keys(_quirksState.unlocked).filter(k => _quirksState.unlocked[k]); }

function unlockQuirk(id, cause = '') {
  if (isQuirkUnlocked(id)) return false;
  _quirksState.unlocked[id] = true;
  saveQuirksState(_quirksState);
  announceQuirkUnlock(id, cause);
  return true;
}

function announceQuirkUnlock(id, cause) {
  const quirkMeta = QUIRKS_META.find(q => q.id === id);
  const quirkName = quirkMeta ? quirkMeta.name : id;
  const msg = `QUIRK UNLOCKED: ${quirkName}${cause ? ' (' + cause + ')' : ''}`;
  if (window.log) window.log(msg);
  // Lightweight toast
  try {
    const existing = document.getElementById('unlockToast');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.id = 'unlockToast';
    div.textContent = msg;
    Object.assign(div.style, {
      position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--good)', color: 'black', padding: '6px 12px', fontSize: '12px',
      fontWeight: 'bold', borderRadius: '6px', zIndex: 9999, boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
    });
    document.body.appendChild(div);
    setTimeout(()=>div.remove(), 4000);
  } catch {}
}

function getUnlockableQuirksInfo() {
  return QUIRKS_META.map(q => ({
    id: q.id,
    name: q.name,
    description: q.description,
    unlocked: isQuirkUnlocked(q.id),
    hint: q.hint || '',
    effect: q.effect
  }));
}

function checkQuirkUnlocks(ctx) {
  let unlockedAny = false;
  for (const quirk of QUIRKS_META) {
    if (isQuirkUnlocked(quirk.id) || !quirk.check) continue;
    const before = JSON.stringify(_state.progress);
    const success = quirk.check(ctx, _state);
    const after = JSON.stringify(_state.progress);
    if (success) {
      unlockQuirk(quirk.id, 'Achievement');
      unlockedAny = true;
    } else if (before !== after) {
      saveState(_state); // progress changed
    }
    if (ctx.event === 'battleEnd' && quirk.resetBattleFlags) quirk.resetBattleFlags(_state);
  }
  if (unlockedAny) saveState(_state);
}

function checkPersonaDefeatUnlocks(personaName, oppFeatures = null) {
  if (!personaName) return;
  _state.personaDefeats[personaName] = (_state.personaDefeats[personaName] || 0) + 1;
  
  // Standard persona unlocks
  const cardId = PERSONA_UNLOCKS[personaName.toLowerCase()];
  if (cardId && !isCardUnlocked(cardId)) {
    unlockCard(cardId, 'Defeated persona: ' + personaName);
  }
  saveState(_state);
}

// ctx shapes:
// { event: 'cardPlayed', cardId, cardType, youEnergyAfter }
// { event: 'turnEnd', turnTypes:Set<string>, youShield, youUnspentEnergy }
// { event: 'damage', source:'you'|'opp', amount }
// { event: 'battleEnd', result:'win'|'loss' }
function checkAchievementUnlocks(ctx) {
  let unlockedAny = false;
  for (const meta of UNLOCK_META) {
    if (isCardUnlocked(meta.id)) continue;
    const before = JSON.stringify(_state.progress);
    const success = meta.check(ctx, _state);
    const after = JSON.stringify(_state.progress);
    if (success) {
      unlockCard(meta.id, 'Achievement');
      unlockedAny = true;
    } else if (before !== after) {
      saveState(_state); // progress changed
    }
    if (ctx.event === 'battleEnd' && meta.resetBattleFlags) meta.resetBattleFlags(_state);
  }
  
  // Also check quirk unlocks
  checkQuirkUnlocks(ctx);
  
  if (unlockedAny) saveState(_state);
}

function recordBattleResult(result) {
  _state.stats.totalBattles = (_state.stats.totalBattles || 0) + 1;
  if (result === 'win') _state.stats.totalWins = (_state.stats.totalWins || 0) + 1;
  saveState(_state);
}

// TODO (future): expose richer API for a dedicated Unlocks UI panel.

export {
  STARTER_CARDS,
  UNLOCK_META,
  QUIRKS_META,
  getUnlockedCards,
  isCardUnlocked,
  unlockCard,
  getUnlockableCardsInfo,
  getUnlockableQuirksInfo,
  isQuirkUnlocked,
  getUnlockedQuirks,
  unlockQuirk,
  resetUnlocks,
  resetQuirks,
  debugUnlock,
  checkPersonaDefeatUnlocks,
  checkAchievementUnlocks,
  recordBattleResult
};