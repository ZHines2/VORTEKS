// card-unlock.js
// VORTEKS Card Unlock System
// Design goals: simplicity, declarative metadata, scalability, non-intrusive UX.

const LS_KEY = 'vorteks-card-unlocks';
const STORAGE_VERSION = 1;

// 6 starter cards (always unlocked immediately)
const STARTER_CARDS = ['swords','shield','heart','fire','bolt','star'];

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
    id: 'echo',
    kind: 'achievement',
    description: 'Play 3 different card types in a single turn (attack + skill + power).',
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
  }
];

// Persona-based unlock mapping (future expansion)
// personaName -> cardId
const PERSONA_UNLOCKS = {
  // Example future entries:
  // 'Glacier': 'snow',
  // 'Assassin': 'dagger'
};

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
    if (parsed.version !== STORAGE_VERSION) {
      const s = freshState();
      saveState(s);
      return s;
    }
    parsed.unlocked ||= {};
    parsed.progress ||= {};
    parsed.personaDefeats ||= {};
    parsed.stats ||= {};
    return parsed;
  } catch {
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
  const cardName = id; // Placeholder: could map id->pretty name later
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

function debugUnlock(id) { unlockCard(id, 'debug'); }

function checkPersonaDefeatUnlocks(personaName) {
  if (!personaName) return;
  _state.personaDefeats[personaName] = (_state.personaDefeats[personaName] || 0) + 1;
  const cardId = PERSONA_UNLOCKS[personaName];
  if (cardId && !isCardUnlocked(cardId)) unlockCard(cardId, 'Defeated persona: ' + personaName);
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
  getUnlockedCards,
  isCardUnlocked,
  unlockCard,
  getUnlockableCardsInfo,
  resetUnlocks,
  debugUnlock,
  checkPersonaDefeatUnlocks,
  checkAchievementUnlocks,
  recordBattleResult
};