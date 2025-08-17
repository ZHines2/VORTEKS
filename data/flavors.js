// flavors.js
// VORTEKS Color Flavor System
// Different UI color schemes with thematic names and unlock requirements

export const FLAVORS = [
  {
    id: 'origin',
    name: 'Origin',
    description: 'The original VORTEKS aesthetic. Purple depths and golden light.',
    unlocked: true, // Default flavor is always unlocked
    colors: {
      bg: '#1b0f2f',
      panel: '#4b2366',
      border: '#ffdd77',
      ink: '#ffffff',
      accent: '#77ffdd',
      good: '#00ff99',
      bad: '#ff4477'
    }
  },
  {
    id: 'crimson',
    name: 'Crimson',
    description: 'Blood red and iron. For those who embrace the warrior\'s path.',
    unlocked: false,
    colors: {
      bg: '#2f0f0f',
      panel: '#661b1b',
      border: '#ff7777',
      ink: '#ffffff',
      accent: '#ffaaaa',
      good: '#ff9999',
      bad: '#cc0000'
    }
  },
  {
    id: 'azure',
    name: 'Azure',
    description: 'Deep ocean blues and crystal clarity. Wisdom flows like water.',
    unlocked: false,
    colors: {
      bg: '#0f1b2f',
      panel: '#1b3366',
      border: '#77ddff',
      ink: '#ffffff',
      accent: '#aaddff',
      good: '#99ddff',
      bad: '#ff6666'
    }
  },
  {
    id: 'verdant',
    name: 'Verdant',
    description: 'Living green and earth tones. Nature\'s power courses through you.',
    unlocked: false,
    colors: {
      bg: '#0f2f0f',
      panel: '#1b4d1b',
      border: '#77ff77',
      ink: '#ffffff',
      accent: '#aaffaa',
      good: '#99ff99',
      bad: '#ff6666'
    }
  },
  {
    id: 'amber',
    name: 'Amber',
    description: 'Warm orange glow and burnished copper. Solar energy incarnate.',
    unlocked: false,
    colors: {
      bg: '#2f1b0f',
      panel: '#663d1b',
      border: '#ffaa33',
      ink: '#ffffff',
      accent: '#ffcc77',
      good: '#ffbb66',
      bad: '#ff4444'
    }
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'Rich purples and magenta highlights. Arcane mysteries unveiled.',
    unlocked: false,
    colors: {
      bg: '#2f0f2f',
      panel: '#5c1a5c',
      border: '#cc77ff',
      ink: '#ffffff',
      accent: '#ddaaff',
      good: '#cc99ff',
      bad: '#ff4477'
    }
  },
  {
    id: 'frost',
    name: 'Frost',
    description: 'Ice blues and silver gleam. Cold precision cuts through chaos.',
    unlocked: false,
    colors: {
      bg: '#0f1f2f',
      panel: '#224466',
      border: '#aaeeff',
      ink: '#ffffff',
      accent: '#ccffff',
      good: '#bbeeee',
      bad: '#ff6688'
    }
  },
  {
    id: 'shadow',
    name: 'Shadow',
    description: 'Darkness and steel gray. Move unseen, strike from the void.',
    unlocked: false,
    colors: {
      bg: '#0f0f0f',
      panel: '#2a2a2a',
      border: '#888888',
      ink: '#ffffff',
      accent: '#cccccc',
      good: '#aaaaaa',
      bad: '#ff6666'
    }
  },
  {
    id: 'solar',
    name: 'Solar',
    description: 'Brilliant gold and sunfire yellow. Let there be light.',
    unlocked: false,
    colors: {
      bg: '#2f2f0f',
      panel: '#666633',
      border: '#ffff77',
      ink: '#ffffff',
      accent: '#ffffaa',
      good: '#ffff99',
      bad: '#ff4444'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep teal and seafoam. Waves of power crash against your foes.',
    unlocked: false,
    colors: {
      bg: '#0f2f2a',
      panel: '#1b5c52',
      border: '#77ffcc',
      ink: '#ffffff',
      accent: '#aaffdd',
      good: '#99ffcc',
      bad: '#ff6666'
    }
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Soft pinks and cherry blossoms. Beauty hides deadly thorns.',
    unlocked: false,
    colors: {
      bg: '#2f1b2a',
      panel: '#663355',
      border: '#ffaacc',
      ink: '#ffffff',
      accent: '#ffccdd',
      good: '#ffbbcc',
      bad: '#dd4477'
    }
  },
  {
    id: 'copper',
    name: 'Copper',
    description: 'Bronze patina and ancient metals. Old wisdom, new battles.',
    unlocked: false,
    colors: {
      bg: '#2a1f0f',
      panel: '#5c4422',
      border: '#cc9955',
      ink: '#ffffff',
      accent: '#ddaa77',
      good: '#ccaa66',
      bad: '#ff5555'
    }
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Electric cyan and hot pink. Cyberpunk energy surges.',
    unlocked: false,
    colors: {
      bg: '#1a0033',
      panel: '#330066',
      border: '#00ffff',
      ink: '#ffffff',
      accent: '#ff00ff',
      good: '#00ff99',
      bad: '#ff0066'
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Deep woodland green and moss. Ancient trees whisper secrets.',
    unlocked: false,
    colors: {
      bg: '#1a2a0f',
      panel: '#334d22',
      border: '#88cc44',
      ink: '#ffffff',
      accent: '#aaddaa',
      good: '#99cc99',
      bad: '#ff6666'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange and gentle pink. Day\'s end brings new beginnings.',
    unlocked: false,
    colors: {
      bg: '#2f1a0f',
      panel: '#663322',
      border: '#ff9966',
      ink: '#ffffff',
      accent: '#ffbb99',
      good: '#ffaa88',
      bad: '#ff4455'
    }
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark navy and starlight. When the world sleeps, you dominate.',
    unlocked: false,
    colors: {
      bg: '#0a0a2a',
      panel: '#1a1a44',
      border: '#6666bb',
      ink: '#ffffff',
      accent: '#9999dd',
      good: '#8888cc',
      bad: '#ff5577'
    }
  },
  {
    id: 'cherry',
    name: 'Cherry',
    description: 'Rich red-pink and burgundy. Sweet flavor with a bitter edge.',
    unlocked: false,
    colors: {
      bg: '#2a0a1a',
      panel: '#551133',
      border: '#ee7799',
      ink: '#ffffff',
      accent: '#ffaabb',
      good: '#ee99aa',
      bad: '#cc2255'
    }
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Muted gray-green and silver. Quiet contemplation breeds strength.',
    unlocked: false,
    colors: {
      bg: '#1a2a1a',
      panel: '#334433',
      border: '#99aa99',
      ink: '#ffffff',
      accent: '#bbccbb',
      good: '#aabbaa',
      bad: '#ff6666'
    }
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Glowing red-orange and charcoal. From ashes, power rises.',
    unlocked: false,
    colors: {
      bg: '#2a1a0a',
      panel: '#553322',
      border: '#ff7733',
      ink: '#ffffff',
      accent: '#ffaa66',
      good: '#ff9955',
      bad: '#cc3311'
    }
  },
  {
    id: 'lunar',
    name: 'Lunar',
    description: 'Silver-blue and moonbeam white. Night\'s cold beauty illuminates all.',
    unlocked: false,
    colors: {
      bg: '#1a1a2a',
      panel: '#333355',
      border: '#aabbdd',
      ink: '#ffffff',
      accent: '#ccddff',
      good: '#bbccee',
      bad: '#ff6677'
    }
  }
];

// Unlock conditions for each flavor
export const FLAVOR_UNLOCKS = [
  {
    id: 'crimson',
    description: 'Win 3 battles using life-cost cards (Wallop/Presto).',
    check: (ctx, state) => {
      if (ctx.event === 'cardPlayed' && ctx.card && (ctx.card.effects?.lifeCost > 0)) {
        state.progress.crimsonLifeCostCards = (state.progress.crimsonLifeCostCards || 0) + 1;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win' && state.progress.crimsonLifeCostCards > 0) {
        state.progress.crimsonBattlesWithLifeCost = (state.progress.crimsonBattlesWithLifeCost || 0) + 1;
        state.progress.crimsonLifeCostCards = 0; // Reset for next battle
        return state.progress.crimsonBattlesWithLifeCost >= 3;
      }
      return false;
    },
    progressHint: s => `Battles won using life-cost cards: ${s.progress?.crimsonBattlesWithLifeCost || 0}/3`,
    resetBattleFlags: (state) => {
      state.progress.crimsonLifeCostCards = 0;
    }
  },
  {
    id: 'azure',
    description: 'Defeat any Robot opponent.',
    check: (ctx, state) => {
      if (ctx.event === 'battleEnd' && ctx.result === 'win' && ctx.oppPersona === 'robot') {
        return true;
      }
      return false;
    },
    progressHint: () => 'Defeat a Robot opponent.'
  },
  {
    id: 'verdant',
    description: 'Use Echo 5 times in a single battle and win.',
    check: (ctx, state) => {
      if (ctx.event === 'cardPlayed' && ctx.card && ctx.card.id === 'echo') {
        state.progress.verdantEchoCount = (state.progress.verdantEchoCount || 0) + 1;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        const count = state.progress.verdantEchoCount || 0;
        return count >= 5;
      }
      return false;
    },
    progressHint: s => `Echo uses this battle: ${s.progress?.verdantEchoCount || 0}/5`,
    resetBattleFlags: (state) => {
      state.progress.verdantEchoCount = 0;
    }
  },
  {
    id: 'amber',
    description: 'Win a battle with 15+ energy in a single turn.',
    check: (ctx, state) => {
      if (ctx.event === 'turnStart' && ctx.youEnergy >= 15) {
        state.progress.amberHighEnergyFlag = true;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        return !!state.progress.amberHighEnergyFlag;
      }
      return false;
    },
    progressHint: () => 'Win with 15+ energy in one turn.',
    resetBattleFlags: (state) => {
      delete state.progress.amberHighEnergyFlag;
    }
  },
  {
    id: 'violet',
    description: 'Defeat any Trickster opponent.',
    check: (ctx, state) => {
      if (ctx.event === 'battleEnd' && ctx.result === 'win' && ctx.oppPersona === 'trickster') {
        return true;
      }
      return false;
    },
    progressHint: () => 'Defeat a Trickster opponent.'
  },
  {
    id: 'frost',
    description: 'Use Freeze 3 times in a single battle and win.',
    check: (ctx, state) => {
      if (ctx.event === 'cardPlayed' && ctx.card && ctx.card.id === 'snow') {
        state.progress.frostFreezeCount = (state.progress.frostFreezeCount || 0) + 1;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        const count = state.progress.frostFreezeCount || 0;
        return count >= 3;
      }
      return false;
    },
    progressHint: s => `Freeze uses this battle: ${s.progress?.frostFreezeCount || 0}/3`,
    resetBattleFlags: (state) => {
      state.progress.frostFreezeCount = 0;
    }
  },
  {
    id: 'shadow',
    description: 'Win 5 battles with perfect health (no damage taken).',
    check: (ctx, state) => {
      if (ctx.event === 'damage' && ctx.target === 'you' && ctx.amount > 0) {
        state.progress.shadowTookDamage = true;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        if (!state.progress.shadowTookDamage) {
          state.progress.shadowPerfectWins = (state.progress.shadowPerfectWins || 0) + 1;
          return state.progress.shadowPerfectWins >= 5;
        }
      }
      return false;
    },
    progressHint: s => `Perfect wins: ${s.progress?.shadowPerfectWins || 0}/5`,
    resetBattleFlags: (state) => {
      delete state.progress.shadowTookDamage;
    }
  },
  {
    id: 'solar',
    description: 'Use Focus 4 times in a single turn.',
    check: (ctx, state) => {
      if (ctx.event === 'turnStart') {
        state.progress.solarFocusThisTurn = 0;
      }
      if (ctx.event === 'cardPlayed' && ctx.card && ctx.card.id === 'star') {
        state.progress.solarFocusThisTurn = (state.progress.solarFocusThisTurn || 0) + 1;
        return state.progress.solarFocusThisTurn >= 4;
      }
      return false;
    },
    progressHint: s => `Max Focus in one turn: ${s.progress?.solarMaxFocusTurn || 0}/4`,
    resetBattleFlags: (state) => {
      if (state.progress.solarFocusThisTurn > (state.progress.solarMaxFocusTurn || 0)) {
        state.progress.solarMaxFocusTurn = state.progress.solarFocusThisTurn;
      }
      state.progress.solarFocusThisTurn = 0;
    }
  },
  {
    id: 'ocean',
    description: 'Defeat any Doctor opponent.',
    check: (ctx, state) => {
      if (ctx.event === 'battleEnd' && ctx.result === 'win' && ctx.oppPersona === 'doctor') {
        return true;
      }
      return false;
    },
    progressHint: () => 'Defeat a Doctor opponent.'
  },
  {
    id: 'rose',
    description: 'Defeat any Cat opponent.',
    check: (ctx, state) => {
      if (ctx.event === 'battleEnd' && ctx.result === 'win' && ctx.oppPersona === 'cat') {
        return true;
      }
      return false;
    },
    progressHint: () => 'Defeat a Cat opponent.'
  },
  {
    id: 'copper',
    description: 'Win a 10-win streak.',
    check: (ctx, state) => {
      if (ctx.event === 'battleEnd' && ctx.result === 'win' && ctx.streak >= 10) {
        return true;
      }
      return false;
    },
    progressHint: () => 'Reach a 10-win streak.'
  },
  {
    id: 'neon',
    description: 'Use Reap successfully and win the battle.',
    check: (ctx, state) => {
      if (ctx.event === 'cardPlayed' && ctx.card && ctx.card.id === 'reap') {
        state.progress.neonUsedReap = true;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        return !!state.progress.neonUsedReap;
      }
      return false;
    },
    progressHint: () => 'Use Reap and win the battle.',
    resetBattleFlags: (state) => {
      delete state.progress.neonUsedReap;
    }
  },
  {
    id: 'forest',
    description: 'Win 15 total battles.',
    check: (ctx, state) => {
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        state.progress.forestTotalWins = (state.progress.forestTotalWins || 0) + 1;
        return state.progress.forestTotalWins >= 15;
      }
      return false;
    },
    progressHint: s => `Total wins: ${s.progress?.forestTotalWins || 0}/15`
  },
  {
    id: 'sunset',
    description: 'Defeat any Bruiser opponent.',
    check: (ctx, state) => {
      if (ctx.event === 'battleEnd' && ctx.result === 'win' && ctx.oppPersona === 'bruiser') {
        return true;
      }
      return false;
    },
    progressHint: () => 'Defeat a Bruiser opponent.'
  },
  {
    id: 'midnight',
    description: 'Defeat any Ghost opponent.',
    check: (ctx, state) => {
      if (ctx.event === 'battleEnd' && ctx.result === 'win' && ctx.oppPersona && ctx.oppPersona.startsWith('ghost_')) {
        return true;
      }
      return false;
    },
    progressHint: () => 'Defeat a Ghost opponent.'
  },
  {
    id: 'cherry',
    description: 'Use burn effects to deal 20+ total damage in one battle.',
    check: (ctx, state) => {
      if (ctx.event === 'burnDamage' && ctx.target === 'opponent') {
        state.progress.cherryBurnDamage = (state.progress.cherryBurnDamage || 0) + ctx.amount;
      }
      if (ctx.event === 'battleEnd') {
        const damage = state.progress.cherryBurnDamage || 0;
        if (ctx.result === 'win' && damage >= 20) {
          return true;
        }
      }
      return false;
    },
    progressHint: s => `Burn damage this battle: ${s.progress?.cherryBurnDamage || 0}/20`,
    resetBattleFlags: (state) => {
      state.progress.cherryBurnDamage = 0;
    }
  },
  {
    id: 'sage',
    description: 'Win a battle using only skill cards (no attacks or powers).',
    check: (ctx, state) => {
      if (ctx.event === 'cardPlayed' && ctx.card) {
        if (ctx.card.type !== 'skill') {
          state.progress.sageUsedNonSkill = true;
        }
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        return !state.progress.sageUsedNonSkill;
      }
      return false;
    },
    progressHint: () => 'Win using only skill cards.',
    resetBattleFlags: (state) => {
      delete state.progress.sageUsedNonSkill;
    }
  },
  {
    id: 'ember',
    description: 'Deal 30+ damage in a single turn.',
    check: (ctx, state) => {
      if (ctx.event === 'damage' && ctx.source === 'you') {
        state.progress.emberTurnDamage = (state.progress.emberTurnDamage || 0) + ctx.amount;
      }
      if (ctx.event === 'turnEnd') {
        const damage = state.progress.emberTurnDamage || 0;
        state.progress.emberTurnDamage = 0;
        return damage >= 30;
      }
      return false;
    },
    progressHint: s => `Best single-turn damage: ${s.progress?.emberMaxTurnDamage || 0}/30`,
    resetBattleFlags: (state) => {
      if (state.progress.emberTurnDamage > (state.progress.emberMaxTurnDamage || 0)) {
        state.progress.emberMaxTurnDamage = state.progress.emberTurnDamage;
      }
      state.progress.emberTurnDamage = 0;
    }
  },
  {
    id: 'lunar',
    description: 'Win 25 total battles.',
    check: (ctx, state) => {
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        state.progress.lunarTotalWins = (state.progress.lunarTotalWins || 0) + 1;
        return state.progress.lunarTotalWins >= 25;
      }
      return false;
    },
    progressHint: s => `Total wins: ${s.progress?.lunarTotalWins || 0}/25`
  }
];