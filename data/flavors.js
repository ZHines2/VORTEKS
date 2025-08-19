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
  },
  {
    id: 'prism',
    name: 'Prism',
    description: 'Rainbow spectrum and crystal clarity. All colors bend to your will.',
    unlocked: false,
    colors: {
      bg: '#1a1a1a',
      panel: '#333333',
      border: '#ffffff',
      ink: '#ffffff',
      accent: '#ff77ff',
      good: '#77ff77',
      bad: '#ff7777'
    }
  },
  {
    id: 'bone',
    name: 'Bone',
    description: 'Pale ivory and ash gray. Death is but another beginning.',
    unlocked: false,
    colors: {
      bg: '#2a2520',
      panel: '#4d453d',
      border: '#e6dcc4',
      ink: '#ffffff',
      accent: '#f0e6d6',
      good: '#d4c9b8',
      bad: '#cc5555'
    }
  },
  {
    id: 'storm',
    name: 'Storm',
    description: 'Thunder gray and lightning white. Tempest power courses through you.',
    unlocked: false,
    colors: {
      bg: '#1a1f2a',
      panel: '#3d4455',
      border: '#ccddff',
      ink: '#ffffff',
      accent: '#e6f0ff',
      good: '#aaccee',
      bad: '#ff6699'
    }
  },
  {
    id: 'molten',
    name: 'Molten',
    description: 'Lava red and molten gold. The earth\'s heart burns within you.',
    unlocked: false,
    colors: {
      bg: '#2a1a0a',
      panel: '#5c3311',
      border: '#ff8833',
      ink: '#ffffff',
      accent: '#ffaa55',
      good: '#ff9944',
      bad: '#cc2211'
    }
  },
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Pure white and glacier blue. Cold as winter, sharp as ice.',
    unlocked: false,
    colors: {
      bg: '#1a2a2a',
      panel: '#335555',
      border: '#aaffff',
      ink: '#ffffff',
      accent: '#ccffff',
      good: '#88dddd',
      bad: '#ff6688'
    }
  },
  {
    id: 'venom',
    name: 'Venom',
    description: 'Toxic green and acid yellow. Poison flows through your veins.',
    unlocked: false,
    colors: {
      bg: '#1a2a1a',
      panel: '#335533',
      border: '#88ff44',
      ink: '#ffffff',
      accent: '#aaff66',
      good: '#77dd33',
      bad: '#ff4466'
    }
  },
  {
    id: 'royal',
    name: 'Royal',
    description: 'Deep purple and gold trim. Command with regal authority.',
    unlocked: false,
    colors: {
      bg: '#2a1a2a',
      panel: '#553355',
      border: '#ffcc44',
      ink: '#ffffff',
      accent: '#ccaaff',
      good: '#ddbb66',
      bad: '#ff5577'
    }
  },
  {
    id: 'plasma',
    name: 'Plasma',
    description: 'Electric blue and fusion white. Pure energy made manifest.',
    unlocked: false,
    colors: {
      bg: '#0a1a2a',
      panel: '#224466',
      border: '#44aaff',
      ink: '#ffffff',
      accent: '#77ccff',
      good: '#55bbee',
      bad: '#ff5599'
    }
  },
  {
    id: 'mystic',
    name: 'Mystic',
    description: 'Ethereal teal and spirit glow. Ancient magic flows through you.',
    unlocked: false,
    colors: {
      bg: '#1a2a2a',
      panel: '#225555',
      border: '#55ffaa',
      ink: '#ffffff',
      accent: '#88ffcc',
      good: '#66ddaa',
      bad: '#ff6677'
    }
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    description: 'Deep space and starfire. The universe bends to your will.',
    unlocked: false,
    colors: {
      bg: '#0f0f2a',
      panel: '#2a2a55',
      border: '#cc88ff',
      ink: '#ffffff',
      accent: '#ddaaff',
      good: '#bb99ee',
      bad: '#ff6699'
    }
  },
  {
    id: 'siphon',
    name: 'Siphon',
    description: 'Blood red and dark bronze. Power drawn from sacrifice and pain.',
    unlocked: false,
    colors: {
      bg: '#2a0f0f',
      panel: '#4d1a1a',
      border: '#cc6644',
      ink: '#ffffff',
      accent: '#ff9977',
      good: '#dd7766',
      bad: '#aa1111'
    }
  },
  {
    id: 'echochamber',
    name: 'Echo Chamber',
    description: 'Resonant silver and harmonic blue. Your actions reverberate endlessly.',
    unlocked: false,
    colors: {
      bg: '#1a1a2a',
      panel: '#333355',
      border: '#88aadd',
      ink: '#ffffff',
      accent: '#aaccff',
      good: '#99bbee',
      bad: '#ff6677'
    }
  },
  {
    id: 'inferno',
    name: 'Inferno',
    description: 'Blazing orange and molten core. Endless fire consumes all.',
    unlocked: false,
    colors: {
      bg: '#2a1500',
      panel: '#554400',
      border: '#ffaa00',
      ink: '#ffffff',
      accent: '#ffcc33',
      good: '#ffbb22',
      bad: '#cc2211'
    }
  },
  {
    id: 'glacier',
    name: 'Glacier',
    description: 'Crystalline ice and arctic wind. Time itself freezes in your presence.',
    unlocked: false,
    colors: {
      bg: '#0f2222',
      panel: '#224444',
      border: '#66ccdd',
      ink: '#ffffff',
      accent: '#aaeeff',
      good: '#88ddee',
      bad: '#ff5588'
    }
  },
  {
    id: 'fortress',
    name: 'Fortress',
    description: 'Granite gray and iron might. Impenetrable walls guard your domain.',
    unlocked: false,
    colors: {
      bg: '#222222',
      panel: '#444444',
      border: '#999999',
      ink: '#ffffff',
      accent: '#bbbbbb',
      good: '#aaaaaa',
      bad: '#ff6666'
    }
  },
  {
    id: 'crescendo',
    name: 'Crescendo',
    description: 'Golden scales and harmonic progression. Power builds with each note.',
    unlocked: false,
    colors: {
      bg: '#2a2200',
      panel: '#554400',
      border: '#ddcc00',
      ink: '#ffffff',
      accent: '#ffee33',
      good: '#eedd22',
      bad: '#cc4444'
    }
  },
  {
    id: 'flux',
    name: 'Flux',
    description: 'Electric purple and energy streams. Raw power flows at your command.',
    unlocked: false,
    colors: {
      bg: '#1a1a2a',
      panel: '#442266',
      border: '#aa66ff',
      ink: '#ffffff',
      accent: '#cc88ff',
      good: '#bb77ee',
      bad: '#ff4488'
    }
  },
  {
    id: 'synthesis',
    name: 'Synthesis',
    description: 'Wisdom teal and knowledge gold. Cards flow like water, endless and pure.',
    unlocked: false,
    colors: {
      bg: '#0f2a22',
      panel: '#225544',
      border: '#44ccaa',
      ink: '#ffffff',
      accent: '#66ffcc',
      good: '#55eebb',
      bad: '#ff5577'
    }
  },
  {
    id: 'vitality',
    name: 'Vitality',
    description: 'Life green and healing light. Renewal flows through every breath.',
    unlocked: false,
    colors: {
      bg: '#1a2a0f',
      panel: '#336622',
      border: '#66dd44',
      ink: '#ffffff',
      accent: '#88ff66',
      good: '#77ee55',
      bad: '#dd4444'
    }
  },
  {
    id: 'chaos',
    name: 'Chaos',
    description: 'Shifting rainbow and wild energy. Order bends before infinite possibility.',
    unlocked: false,
    colors: {
      bg: '#1a1a1a',
      panel: '#333333',
      border: '#ff88cc',
      ink: '#ffffff',
      accent: '#88ffcc',
      good: '#ccff88',
      bad: '#ff8888'
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
  },
  {
    id: 'prism',
    description: 'Use 5 different card types in a single battle (attack, skill, power, life-cost, unique).',
    check: (ctx, state) => {
      if (ctx.event === 'cardPlayed' && ctx.card) {
        if (!state.progress.prismCardTypesThisBattle) {
          state.progress.prismCardTypesThisBattle = [];
        }
        
        let cardType = ctx.card.type;
        if (ctx.card.effects?.lifeCost > 0) cardType = 'life-cost';
        if (['echo', 'curiosity', 'droid', 'reap'].includes(ctx.card.id)) cardType = 'unique';
        
        if (!state.progress.prismCardTypesThisBattle.includes(cardType)) {
          state.progress.prismCardTypesThisBattle.push(cardType);
        }
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        const types = state.progress.prismCardTypesThisBattle;
        return types && types.length >= 5;
      }
      return false;
    },
    progressHint: s => {
      const types = s.progress?.prismCardTypesThisBattle;
      return `Card types this battle: ${types ? types.length : 0}/5`;
    },
    resetBattleFlags: (state) => {
      delete state.progress.prismCardTypesThisBattle;
    }
  },
  {
    id: 'bone',
    description: 'Win a battle at exactly 1 HP.',
    check: (ctx, state) => {
      if (ctx.event === 'battleEnd' && ctx.result === 'win' && ctx.youHP === 1) {
        return true;
      }
      return false;
    },
    progressHint: () => 'Win a battle at exactly 1 HP.'
  },
  {
    id: 'storm',
    description: 'Deal 50+ damage in a single turn.',
    check: (ctx, state) => {
      if (ctx.event === 'damage' && ctx.source === 'you') {
        state.progress.stormTurnDamage = (state.progress.stormTurnDamage || 0) + ctx.amount;
      }
      if (ctx.event === 'turnEnd') {
        const damage = state.progress.stormTurnDamage || 0;
        state.progress.stormTurnDamage = 0;
        return damage >= 50;
      }
      return false;
    },
    progressHint: s => `Best single-turn damage: ${s.progress?.stormMaxTurnDamage || 0}/50`,
    resetBattleFlags: (state) => {
      if (state.progress.stormTurnDamage > (state.progress.stormMaxTurnDamage || 0)) {
        state.progress.stormMaxTurnDamage = state.progress.stormTurnDamage;
      }
      state.progress.stormTurnDamage = 0;
    }
  },
  {
    id: 'molten',
    description: 'Use burn effects to deal 35+ total damage in one battle.',
    check: (ctx, state) => {
      if (ctx.event === 'burnDamage' && ctx.target === 'opponent') {
        state.progress.moltenBurnDamage = (state.progress.moltenBurnDamage || 0) + ctx.amount;
      }
      if (ctx.event === 'battleEnd') {
        const damage = state.progress.moltenBurnDamage || 0;
        if (ctx.result === 'win' && damage >= 35) {
          return true;
        }
      }
      return false;
    },
    progressHint: s => `Burn damage this battle: ${s.progress?.moltenBurnDamage || 0}/35`,
    resetBattleFlags: (state) => {
      state.progress.moltenBurnDamage = 0;
    }
  },
  {
    id: 'arctic',
    description: 'Use Freeze 5 times in a single battle and win.',
    check: (ctx, state) => {
      if (ctx.event === 'cardPlayed' && ctx.card && ctx.card.id === 'snow') {
        state.progress.arcticFreezeCount = (state.progress.arcticFreezeCount || 0) + 1;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        const count = state.progress.arcticFreezeCount || 0;
        return count >= 5;
      }
      return false;
    },
    progressHint: s => `Freeze uses this battle: ${s.progress?.arcticFreezeCount || 0}/5`,
    resetBattleFlags: (state) => {
      state.progress.arcticFreezeCount = 0;
    }
  },
  {
    id: 'venom',
    description: 'Win a battle with 20+ shield accumulated.',
    check: (ctx, state) => {
      if (ctx.event === 'turnEnd' && ctx.youShield >= 20) {
        state.progress.venomHighShieldFlag = true;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        return !!state.progress.venomHighShieldFlag;
      }
      return false;
    },
    progressHint: () => 'Win with 20+ shield accumulated.',
    resetBattleFlags: (state) => {
      delete state.progress.venomHighShieldFlag;
    }
  },
  {
    id: 'royal',
    description: 'Win 50 total battles.',
    check: (ctx, state) => {
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        state.progress.royalTotalWins = (state.progress.royalTotalWins || 0) + 1;
        return state.progress.royalTotalWins >= 50;
      }
      return false;
    },
    progressHint: s => `Total wins: ${s.progress?.royalTotalWins || 0}/50`
  },
  {
    id: 'plasma',
    description: 'Have 20+ energy in a single turn.',
    check: (ctx, state) => {
      if (ctx.event === 'turnStart' && ctx.youEnergy >= 20) {
        return true;
      }
      return false;
    },
    progressHint: () => 'Reach 20+ energy in one turn.'
  },
  {
    id: 'mystic',
    description: 'Use Echo 10 times in a single battle and win.',
    check: (ctx, state) => {
      if (ctx.event === 'cardPlayed' && ctx.card && ctx.card.id === 'echo') {
        state.progress.mysticEchoCount = (state.progress.mysticEchoCount || 0) + 1;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        const count = state.progress.mysticEchoCount || 0;
        return count >= 10;
      }
      return false;
    },
    progressHint: s => `Echo uses this battle: ${s.progress?.mysticEchoCount || 0}/10`,
    resetBattleFlags: (state) => {
      state.progress.mysticEchoCount = 0;
    }
  },
  {
    id: 'cosmic',
    description: 'Win a 15-win streak.',
    check: (ctx, state) => {
      if (ctx.event === 'battleEnd' && ctx.result === 'win' && ctx.streak >= 15) {
        return true;
      }
      return false;
    },
    progressHint: () => 'Reach a 15-win streak.'
  },
  {
    id: 'siphon',
    description: 'Win 5 battles using only life-cost cards (Wallop/Presto).',
    check: (ctx, state) => {
      if (ctx.event === 'cardPlayed' && ctx.card) {
        if (ctx.card.effects?.lifeCost > 0) {
          state.progress.siphonUsedLifeCost = true;
        } else {
          state.progress.siphonUsedNonLifeCost = true;
        }
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        if (state.progress.siphonUsedLifeCost && !state.progress.siphonUsedNonLifeCost) {
          state.progress.siphonLifeCostOnlyWins = (state.progress.siphonLifeCostOnlyWins || 0) + 1;
          return state.progress.siphonLifeCostOnlyWins >= 5;
        }
      }
      return false;
    },
    progressHint: s => `Life-cost only wins: ${s.progress?.siphonLifeCostOnlyWins || 0}/5`,
    resetBattleFlags: (state) => {
      delete state.progress.siphonUsedLifeCost;
      delete state.progress.siphonUsedNonLifeCost;
    }
  },
  {
    id: 'echochamber',
    description: 'Use Echo 20 times cumulatively.',
    check: (ctx, state) => {
      if (ctx.event === 'cardPlayed' && ctx.card && ctx.card.id === 'echo') {
        state.progress.echochamberEchoCount = (state.progress.echochamberEchoCount || 0) + 1;
        return state.progress.echochamberEchoCount >= 20;
      }
      return false;
    },
    progressHint: s => `Echo uses: ${s.progress?.echochamberEchoCount || 0}/20`
  },
  {
    id: 'inferno',
    description: 'Deal 50+ burn damage in a single battle.',
    check: (ctx, state) => {
      if (ctx.event === 'burnDamage' && ctx.target === 'opponent') {
        state.progress.infernoBurnDamage = (state.progress.infernoBurnDamage || 0) + ctx.amount;
      }
      if (ctx.event === 'battleEnd') {
        const damage = state.progress.infernoBurnDamage || 0;
        if (ctx.result === 'win' && damage >= 50) {
          return true;
        }
      }
      return false;
    },
    progressHint: s => `Burn damage this battle: ${s.progress?.infernoBurnDamage || 0}/50`,
    resetBattleFlags: (state) => {
      state.progress.infernoBurnDamage = 0;
    }
  },
  {
    id: 'glacier',
    description: 'Use Freeze 10 times in a single battle and win.',
    check: (ctx, state) => {
      if (ctx.event === 'cardPlayed' && ctx.card && ctx.card.id === 'snow') {
        state.progress.glacierFreezeCount = (state.progress.glacierFreezeCount || 0) + 1;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        const count = state.progress.glacierFreezeCount || 0;
        return count >= 10;
      }
      return false;
    },
    progressHint: s => `Freeze uses this battle: ${s.progress?.glacierFreezeCount || 0}/10`,
    resetBattleFlags: (state) => {
      state.progress.glacierFreezeCount = 0;
    }
  },
  {
    id: 'fortress',
    description: 'Win a battle with 30+ shield accumulated.',
    check: (ctx, state) => {
      if (ctx.event === 'turnEnd' && ctx.youShield >= 30) {
        state.progress.fortressHighShieldFlag = true;
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        return !!state.progress.fortressHighShieldFlag;
      }
      return false;
    },
    progressHint: () => 'Win with 30+ shield accumulated.',
    resetBattleFlags: (state) => {
      delete state.progress.fortressHighShieldFlag;
    }
  },
  {
    id: 'crescendo',
    description: 'Use Focus 15 times cumulatively.',
    check: (ctx, state) => {
      if (ctx.event === 'cardPlayed' && ctx.card && ctx.card.id === 'star') {
        state.progress.crescendoFocusCount = (state.progress.crescendoFocusCount || 0) + 1;
        return state.progress.crescendoFocusCount >= 15;
      }
      return false;
    },
    progressHint: s => `Focus uses: ${s.progress?.crescendoFocusCount || 0}/15`
  },
  {
    id: 'flux',
    description: 'Have 25+ energy in a single turn.',
    check: (ctx, state) => {
      if (ctx.event === 'turnStart' && ctx.youEnergy >= 25) {
        return true;
      }
      return false;
    },
    progressHint: () => 'Reach 25+ energy in one turn.'
  },
  {
    id: 'synthesis',
    description: 'Use Loop 10 times cumulatively.',
    check: (ctx, state) => {
      if (ctx.event === 'cardPlayed' && ctx.card && ctx.card.id === 'loop') {
        state.progress.synthesisLoopCount = (state.progress.synthesisLoopCount || 0) + 1;
        return state.progress.synthesisLoopCount >= 10;
      }
      return false;
    },
    progressHint: s => `Loop uses: ${s.progress?.synthesisLoopCount || 0}/10`
  },
  {
    id: 'vitality',
    description: 'Heal 50+ HP cumulatively across all battles.',
    check: (ctx, state) => {
      if (ctx.event === 'heal' && ctx.amount > 0) {
        state.progress.vitalityTotalHealing = (state.progress.vitalityTotalHealing || 0) + ctx.amount;
        return state.progress.vitalityTotalHealing >= 50;
      }
      return false;
    },
    progressHint: s => `Total healing: ${s.progress?.vitalityTotalHealing || 0}/50`
  },
  {
    id: 'chaos',
    description: 'Use 10 different card types in a single battle and win.',
    check: (ctx, state) => {
      if (ctx.event === 'cardPlayed' && ctx.card) {
        if (!state.progress.chaosCardTypesThisBattle) {
          state.progress.chaosCardTypesThisBattle = [];
        }
        
        // Get unique identifier for each card
        const cardId = ctx.card.id;
        if (!state.progress.chaosCardTypesThisBattle.includes(cardId)) {
          state.progress.chaosCardTypesThisBattle.push(cardId);
        }
      }
      if (ctx.event === 'battleEnd' && ctx.result === 'win') {
        const types = state.progress.chaosCardTypesThisBattle;
        return types && types.length >= 10;
      }
      return false;
    },
    progressHint: s => {
      const types = s.progress?.chaosCardTypesThisBattle;
      return `Different cards this battle: ${types ? types.length : 0}/10`;
    },
    resetBattleFlags: (state) => {
      delete state.progress.chaosCardTypesThisBattle;
    }
  }
];