// lore.js
// VORTEKS Chronicles - Procedural lore generation based on player data

import { getTelemetry } from './telemetry.js';
import { getCreature, getCreatureInfo } from './idle-game.js';

// Chronicle themes based on player progression
const CHRONICLE_THEMES = {
  beginner: {
    titles: [
      "The First Stirrings of Power",
      "Awakening in the Void",
      "The Nascent Journey Begins",
      "First Steps in Infinite Realms"
    ],
    opening_lines: [
      "In the beginning, there was only the Void and the faint pulse of possibility...",
      "From the cosmic silence, a new consciousness began to stir...",
      "The first card was drawn from the infinite deck of destiny...",
      "In dimensions beyond counting, a spark of awareness flickered to life..."
    ]
  },
  intermediate: {
    titles: [
      "The Awakening Storm",
      "Echoes of Growing Power",
      "The Path of Endless Battles",
      "Chronicles of the Rising Warrior"
    ],
    opening_lines: [
      "The battles had taught {name} much about the nature of conflict...",
      "With each victory, the fabric of reality bent slightly to their will...",
      "The cards whispered secrets of ancient tactics and forgotten strategies...",
      "Through {battles} conflicts, wisdom and power had begun to crystallize..."
    ]
  },
  advanced: {
    titles: [
      "Legend of the Card Master",
      "The Eternal Dance of Victory",
      "Sovereign of the Infinite Duel",
      "Master of the Cosmic Game"
    ],
    opening_lines: [
      "The legend of {name} had begun to echo across dimensional boundaries...",
      "Through {battles} battles, a master had emerged from the crucible of combat...",
      "The cards themselves seemed to sing in harmony with their chosen wielder...",
      "In the annals of VORTEKS history, few had achieved such mastery..."
    ]
  }
};

// Story fragments for different aspects of the journey
const STORY_FRAGMENTS = {
  vortek_bond: {
    low_loyalty: [
      "The VORTEK companion watched with cautious curiosity, still learning to trust.",
      "Between battles, the bond with their otherworldly companion slowly deepened.",
      "The VORTEK's eyes held mysteries yet unrevealed, loyalty still building."
    ],
    high_loyalty: [
      "The VORTEK companion had become an extension of their very soul.",
      "In perfect harmony, fighter and VORTEK moved as one through the cosmic dance.",
      "The bond transcended mere partnership—they had become eternal allies."
    ]
  },
  
  battle_style: {
    aggressive: [
      "Their approach to battle was fierce and uncompromising, striking with the fury of colliding stars.",
      "Each engagement was a storm of devastating attacks, leaving opponents overwhelmed.",
      "The battlefield trembled under the weight of their relentless assault."
    ],
    strategic: [
      "Every move was calculated with the precision of a cosmic clockmaker.",
      "They fought not with brute force, but with the elegance of pure strategy.",
      "Each battle was a chess match played across infinite dimensions."
    ],
    balanced: [
      "Their fighting style flowed like water—sometimes gentle, sometimes torrential.",
      "They had learned the ancient art of adaptation, meeting each challenge with perfect response.",
      "Balance had become their greatest weapon in the eternal dance of combat."
    ]
  },
  
  card_mastery: {
    few_cards: [
      "Though their arsenal was focused, each card was wielded with masterful precision.",
      "Quality over quantity—every card in their deck was a trusted companion.",
      "With minimal tools but maximum skill, they carved their path through adversity."
    ],
    many_cards: [
      "Their vast arsenal spoke of endless exploration and boundless curiosity.",
      "From the infinite deck of possibility, they had gathered a rainbow of options.",
      "Each card they had mastered added another color to their tactical palette."
    ]
  },
  
  achievements: {
    perfect_victories: [
      "In the annals of VORTEKS, perfection was rare—yet they had achieved it {count} times.",
      "Their flawless victories had become the stuff of legend among the cosmic warriors.",
      "To emerge unscathed from battle {count} times marked them as truly exceptional."
    ],
    quick_victories: [
      "Speed was their ally—{count} times they had ended conflicts before they truly began.",
      "The swift resolution of {count} battles spoke of tactical brilliance.",
      "Their enemies learned to fear the lightning-fast precision of their attacks."
    ],
    long_streaks: [
      "A winning streak of {streak} battles had elevated them beyond mortal concerns.",
      "The momentum of {streak} consecutive victories carried them ever forward.",
      "For {streak} battles, defeat had been merely a distant memory."
    ]
  }
};

// Philosophical endings that reflect VORTEKS mysticism
const CHRONICLE_ENDINGS = [
  "And so the tale continues, each battle a new verse in the infinite song of existence.",
  "In the cosmic tapestry, their thread shone brighter with each passing moment.",
  "The VORTEKS universe trembled with anticipation for the chapters yet unwritten.",
  "Their legend would echo through dimensions, inspiring warriors yet to come.",
  "The journey had no end, only endless evolution toward greater understanding.",
  "In the dance between void and form, they had found their eternal rhythm.",
  "The cards whispered of futures bright with possibility and power.",
  "Among the infinite players of the cosmic game, they had found their unique voice."
];

// Generate a complete chronicle based on player data
export function generateChronicle() {
  const telemetry = getTelemetry();
  const creature = getCreature();
  const creatureInfo = getCreatureInfo();
  
  // Determine progression level
  const battleCount = telemetry.battles.total;
  const winRate = battleCount > 0 ? telemetry.battles.wins / battleCount : 0;
  let progressionLevel = 'beginner';
  
  if (battleCount >= 50 || telemetry.battles.maxStreak >= 10) {
    progressionLevel = 'advanced';
  } else if (battleCount >= 20 || telemetry.battles.maxStreak >= 5) {
    progressionLevel = 'intermediate';
  }
  
  // Select theme
  const theme = CHRONICLE_THEMES[progressionLevel];
  const title = selectRandom(theme.titles);
  const opening = selectRandom(theme.opening_lines);
  
  // Build the chronicle
  let chronicle = '';
  
  // Opening paragraph
  chronicle += opening.replace('{name}', creature.name)
    .replace('{battles}', battleCount) + '\n\n';
  
  // VORTEK bond section
  const loyaltyLevel = creature.loyalty >= 70 ? 'high_loyalty' : 'low_loyalty';
  chronicle += selectRandom(STORY_FRAGMENTS.vortek_bond[loyaltyLevel]) + ' ';
  chronicle += generateVortekPersonalityInsight(creature) + '\n\n';
  
  // Battle style analysis
  const battleStyle = analyzeBattleStyle(telemetry);
  chronicle += selectRandom(STORY_FRAGMENTS.battle_style[battleStyle]) + ' ';
  chronicle += generateBattleInsight(telemetry) + '\n\n';
  
  // Card mastery section
  const cardCount = Object.keys(telemetry.cards.played).length;
  const cardMasteryLevel = cardCount >= 15 ? 'many_cards' : 'few_cards';
  chronicle += selectRandom(STORY_FRAGMENTS.card_mastery[cardMasteryLevel]) + ' ';
  chronicle += generateCardInsight(telemetry) + '\n\n';
  
  // Achievement highlights
  if (telemetry.battles.perfectWins > 0 || telemetry.battles.quickWins > 0 || telemetry.battles.maxStreak >= 3) {
    chronicle += generateAchievementNarrative(telemetry) + '\n\n';
  }
  
  // VORTEK evolution narrative
  chronicle += generateEvolutionNarrative(creature, creatureInfo) + '\n\n';
  
  // Philosophical ending
  chronicle += selectRandom(CHRONICLE_ENDINGS);
  
  return {
    title: title,
    content: chronicle,
    insights: generateChronicleInsights(telemetry, creature),
    dataUsed: {
      battles: battleCount,
      winRate: Math.round(winRate * 100),
      vortekLevel: creature.level,
      vortekStage: creature.stage,
      uniqueCards: cardCount,
      maxStreak: telemetry.battles.maxStreak
    }
  };
}

// Analyze battle style from telemetry data
function analyzeBattleStyle(telemetry) {
  const total = telemetry.turns.total;
  if (total === 0) return 'balanced';
  
  const avgCardsPerTurn = telemetry.turns.averageCardsPerTurn;
  const avgEnergyPerTurn = telemetry.turns.averageEnergyPerTurn;
  const quickWinRatio = telemetry.battles.quickWins / Math.max(telemetry.battles.total, 1);
  
  if (avgEnergyPerTurn >= 3.5 && quickWinRatio >= 0.3) {
    return 'aggressive';
  } else if (avgCardsPerTurn <= 1.5 && telemetry.turns.echoActivations > total * 0.1) {
    return 'strategic';
  } else {
    return 'balanced';
  }
}

// Generate VORTEK personality insight
function generateVortekPersonalityInsight(creature) {
  const dominantTrait = getDominantPersonalityTrait(creature);
  
  const insights = {
    curiosity: `The VORTEK's insatiable curiosity had led them to discover ${creature.roomElements ? Object.values(creature.roomElements).filter(e => e.unlocked).length : 1} secrets of their mystical chamber.`,
    creativity: `With an artist's soul, the VORTEK painted visions in the spaces between reality.`,
    loyalty: `The depth of trust between them had transcended the boundaries of species and dimension.`,
    playfulness: `Joy emanated from the VORTEK like starlight, turning even the gravest moments into cosmic play.`,
    focus: `With laser-like concentration, the VORTEK had become a living meditation on perfection.`,
    courage: `The VORTEK's fearless spirit burned like a beacon in the darkest corners of the multiverse.`
  };
  
  return insights[dominantTrait] || "The VORTEK's unique personality defied simple categorization.";
}

// Get dominant personality trait
function getDominantPersonalityTrait(creature) {
  const traits = {
    curiosity: creature.curiosity,
    creativity: creature.creativity,
    loyalty: creature.loyalty,
    playfulness: creature.playfulness,
    focus: creature.focus,
    courage: creature.courage
  };
  
  return Object.keys(traits).reduce((a, b) => traits[a] > traits[b] ? a : b);
}

// Generate battle insight
function generateBattleInsight(telemetry) {
  const battles = telemetry.battles;
  const combat = telemetry.combat;
  
  if (battles.total === 0) {
    return "The true test of battle still awaited them in the infinite arena.";
  }
  
  const winRate = battles.wins / battles.total;
  const avgDamagePerBattle = combat.totalDamageDealt / battles.total;
  
  if (winRate >= 0.8) {
    return `With a ${Math.round(winRate * 100)}% victory rate, they had proven themselves a force of nature.`;
  } else if (avgDamagePerBattle >= 25) {
    return `Each battle left their opponents reeling from an average of ${Math.round(avgDamagePerBattle)} devastating damage.`;
  } else {
    return "Through victory and defeat alike, they learned the deeper truths of combat.";
  }
}

// Generate card insight
function generateCardInsight(telemetry) {
  const cardData = telemetry.cards;
  const favoriteCard = cardData.favorite;
  const totalPlayed = Object.values(cardData.played).reduce((sum, count) => sum + count, 0);
  
  if (favoriteCard && totalPlayed > 0) {
    const favoriteCount = cardData.played[favoriteCard] || 0;
    const favoritePercentage = Math.round((favoriteCount / totalPlayed) * 100);
    return `Their signature card, ${favoriteCard}, had become an extension of their will, used in ${favoritePercentage}% of their strategic decisions.`;
  } else if (totalPlayed > 50) {
    return `Through ${totalPlayed} card plays, they had woven a complex tapestry of tactical knowledge.`;
  } else {
    return "Each card was a word in the language of power they were still learning to speak.";
  }
}

// Generate achievement narrative
function generateAchievementNarrative(telemetry) {
  const achievements = [];
  
  if (telemetry.battles.perfectWins > 0) {
    achievements.push(selectRandom(STORY_FRAGMENTS.achievements.perfect_victories)
      .replace('{count}', telemetry.battles.perfectWins));
  }
  
  if (telemetry.battles.quickWins > 0) {
    achievements.push(selectRandom(STORY_FRAGMENTS.achievements.quick_victories)
      .replace('{count}', telemetry.battles.quickWins));
  }
  
  if (telemetry.battles.maxStreak >= 3) {
    achievements.push(selectRandom(STORY_FRAGMENTS.achievements.long_streaks)
      .replace('{streak}', telemetry.battles.maxStreak));
  }
  
  return achievements.length > 0 ? achievements[0] : "Their greatest achievements were yet to come.";
}

// Generate evolution narrative
function generateEvolutionNarrative(creature, creatureInfo) {
  const stage = creature.stage;
  const level = creature.level;
  
  const stageNarratives = {
    EGG: "Within the cosmic egg, infinite potential stirred, waiting for the right moment to emerge into the light of consciousness.",
    HATCHLING: `At level ${level}, the VORTEK had burst forth as a Sprite of pure energy, its form crackling with newfound power.`,
    JUVENILE: `The Echo Beast phase at level ${level} marked their transformation into a creature of tactical awareness and growing strength.`,
    ADULT: `As a Card Master at level ${level}, the VORTEK had achieved a perfect synthesis of power and wisdom.`,
    ELDER: `The VORTEKS Avatar at level ${level} represented the pinnacle of evolution—a being of transcendent understanding.`
  };
  
  return stageNarratives[stage] || `At level ${level}, the VORTEK continued its mysterious evolution through stages yet unknown.`;
}

// Generate chronicle insights summary
function generateChronicleInsights(telemetry, creature) {
  const insights = [];
  
  insights.push(`Based on ${telemetry.battles.total} battles and ${creature.level} levels of VORTEK growth`);
  
  if (telemetry.battles.maxStreak > 0) {
    insights.push(`Maximum victory streak: ${telemetry.battles.maxStreak}`);
  }
  
  const dominantTrait = getDominantPersonalityTrait(creature);
  insights.push(`VORTEK personality: ${dominantTrait.charAt(0).toUpperCase() + dominantTrait.slice(1)}-dominant`);
  
  const cardCount = Object.keys(telemetry.cards.played).length;
  if (cardCount > 0) {
    insights.push(`Combat style derived from ${cardCount} unique card types mastered`);
  }
  
  return insights.join(' • ');
}

// Utility function to select random element
function selectRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Get a pre-generated chronicle for display
export function getCurrentChronicle() {
  const stored = localStorage.getItem('vorteks-current-chronicle');
  return stored ? JSON.parse(stored) : null;
}

// Save a chronicle for later reference
export function saveCurrentChronicle(chronicle) {
  localStorage.setItem('vorteks-current-chronicle', JSON.stringify(chronicle));
}

// Clear the current chronicle
export function clearCurrentChronicle() {
  localStorage.removeItem('vorteks-current-chronicle');
}