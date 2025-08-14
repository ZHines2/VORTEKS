// vortek-generator.js
// Pixel art generator for VORTEK companions with multiple variants

import { rng } from './utils.js';

let vortekCanvas = null;
let vctx = null;

// Initialize the VORTEK generator with its own canvas
export function initVortekGenerator() {
  // Create canvas if it doesn't exist
  vortekCanvas = document.getElementById('vortekCanvas');
  if (!vortekCanvas) {
    vortekCanvas = document.createElement('canvas');
    vortekCanvas.id = 'vortekCanvas';
    vortekCanvas.width = 96; // 16x16 at 6px scale
    vortekCanvas.height = 96;
    vortekCanvas.style.imageRendering = 'pixelated';
    vortekCanvas.style.width = '64px';
    vortekCanvas.style.height = '64px';
  }
  vctx = vortekCanvas.getContext('2d');
}

function rngInt(n) {
  return Math.floor(Math.random() * n);
}

// Generate unique sound for VORTEK using random word combinations
export function generateVortekSound() {
  const soundPrefixes = ["Vort", "Zap", "Spark", "Echo", "Flux", "Beam", "Wave", "Pulse", "Glow", "Shift"];
  const soundSuffixes = ["eek", "oom", "izz", "urr", "ipp", "ing", "ash", "oop", "ett", "uzz", "elf", "ork", "imp"];
  const soundModifiers = ["", "i", "o", "a", "e", "y", "ie", "er"];
  
  const prefix = soundPrefixes[rngInt(soundPrefixes.length)];
  const suffix = soundSuffixes[rngInt(soundSuffixes.length)];
  const modifier = Math.random() < 0.3 ? soundModifiers[1 + rngInt(soundModifiers.length - 1)] : "";
  
  return prefix + modifier + suffix;
}

// Main function to generate VORTEK appearance based on stats and stage
export function generateVortekAppearance(creature) {
  if (!vctx) initVortekGenerator();
  
  const stage = creature.stage;
  let appearance = {};
  
  if (stage === 'EGG') {
    appearance = generateEggVariant(creature);
  } else if (stage === 'HATCHLING') {
    appearance = generateBabyVariant(creature);
  } else if (stage === 'JUVENILE') {
    appearance = generateJuvenileVariant(creature);
  } else if (stage === 'ADULT') {
    appearance = generateAdultVariant(creature);
  } else if (stage === 'ELDER') {
    appearance = generateElderVariant(creature);
  }
  
  // Generate unique sound if not already set
  if (!creature.uniqueSound) {
    creature.uniqueSound = generateVortekSound();
  }
  
  return {
    canvas: vortekCanvas,
    sound: creature.uniqueSound,
    variant: appearance
  };
}

// Generate egg variants based on developing personality
function generateEggVariant(creature) {
  const S = 6;
  vctx.clearRect(0, 0, vortekCanvas.width, vortekCanvas.height);
  const px = (x, y, c) => { vctx.fillStyle = c; vctx.fillRect(x * S, y * S, S, S); };
  
  // Base egg colors
  const eggColors = ['#fff8dc', '#f5f5dc', '#ffeaa7', '#fdcb6e', '#e17055'];
  const baseColor = eggColors[rngInt(eggColors.length)];
  
  // Determine dominant developing trait
  const traits = {
    creativity: creature.creativity,
    curiosity: creature.curiosity,
    playfulness: creature.playfulness,
    courage: creature.courage,
    loyalty: creature.loyalty,
    focus: creature.focus
  };
  
  const dominantTrait = Object.keys(traits).reduce((a, b) => traits[a] > traits[b] ? a : b);
  
  // Clear background
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      px(x, y, '#2c1810');
    }
  }
  
  // Draw basic egg shape
  const eggCoords = [
    {x: 7, y: 4}, {x: 8, y: 4},
    {x: 6, y: 5}, {x: 7, y: 5}, {x: 8, y: 5}, {x: 9, y: 5},
    {x: 5, y: 6}, {x: 6, y: 6}, {x: 7, y: 6}, {x: 8, y: 6}, {x: 9, y: 6}, {x: 10, y: 6},
    {x: 5, y: 7}, {x: 6, y: 7}, {x: 7, y: 7}, {x: 8, y: 7}, {x: 9, y: 7}, {x: 10, y: 7},
    {x: 5, y: 8}, {x: 6, y: 8}, {x: 7, y: 8}, {x: 8, y: 8}, {x: 9, y: 8}, {x: 10, y: 7},
    {x: 5, y: 9}, {x: 6, y: 9}, {x: 7, y: 9}, {x: 8, y: 9}, {x: 9, y: 9}, {x: 10, y: 9},
    {x: 6, y: 10}, {x: 7, y: 10}, {x: 8, y: 10}, {x: 9, y: 10},
    {x: 7, y: 11}, {x: 8, y: 11}
  ];
  
  eggCoords.forEach(coord => px(coord.x, coord.y, baseColor));
  
  // Add personality hints based on dominant trait
  const accentColor = getTraitColor(dominantTrait);
  
  if (dominantTrait === 'creativity') {
    // Artistic swirls
    px(6, 7, accentColor);
    px(9, 8, accentColor);
    px(7, 9, accentColor);
  } else if (dominantTrait === 'curiosity') {
    // Question mark pattern
    px(7, 6, accentColor);
    px(8, 6, accentColor);
    px(8, 7, accentColor);
    px(7, 9, accentColor);
  } else if (dominantTrait === 'playfulness') {
    // Bouncy dots
    px(6, 6, accentColor);
    px(9, 6, accentColor);
    px(7, 8, accentColor);
    px(8, 8, accentColor);
  } else if (dominantTrait === 'courage') {
    // Bold stripes
    px(6, 7, accentColor);
    px(7, 7, accentColor);
    px(8, 8, accentColor);
    px(9, 8, accentColor);
  } else if (dominantTrait === 'loyalty') {
    // Heart shape
    px(6, 7, accentColor);
    px(8, 7, accentColor);
    px(7, 8, accentColor);
  } else if (dominantTrait === 'focus') {
    // Zen circle
    px(7, 7, accentColor);
    px(8, 7, accentColor);
    px(7, 8, accentColor);
    px(8, 8, accentColor);
  }
  
  // Add crack if close to hatching (high level)
  if (creature.level >= 4) {
    px(8, 5, '#8b4513');
    px(9, 6, '#8b4513');
    px(8, 7, '#8b4513');
  }
  
  return {
    type: 'egg',
    dominantTrait: dominantTrait,
    baseColor: baseColor,
    accentColor: accentColor,
    readyToHatch: creature.level >= 4
  };
}

// Generate baby VORTEK variants with extensive RNG
function generateBabyVariant(creature) {
  const S = 6;
  vctx.clearRect(0, 0, vortekCanvas.width, vortekCanvas.height);
  const px = (x, y, c) => { vctx.fillStyle = c; vctx.fillRect(x * S, y * S, S, S); };
  
  // Generate variant characteristics
  const bodyTypes = ['round', 'tall', 'wide', 'compact'];
  const bodyColors = ['#ff6b9d', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
  const eyeTypes = ['round', 'oval', 'star', 'diamond'];
  const eyeColors = ['#2d3436', '#fd79a8', '#00b894', '#0984e3', '#e17055', '#fdcb6e'];
  const markingTypes = ['spots', 'stripes', 'swirls', 'hearts', 'stars', 'none'];
  const accessories = ['none', 'bow', 'hat', 'collar', 'gem'];
  
  const bodyType = bodyTypes[rngInt(bodyTypes.length)];
  const bodyColor = bodyColors[rngInt(bodyColors.length)];
  const eyeType = eyeTypes[rngInt(eyeTypes.length)];
  const eyeColor = eyeColors[rngInt(eyeColors.length)];
  const markingType = markingTypes[rngInt(markingTypes.length)];
  const accessory = Math.random() < 0.3 ? accessories[1 + rngInt(accessories.length - 1)] : 'none';
  
  // Clear background
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      px(x, y, '#2c1810');
    }
  }
  
  // Draw body based on type
  drawBabyBody(px, bodyType, bodyColor);
  
  // Draw eyes based on type
  drawBabyEyes(px, eyeType, eyeColor);
  
  // Draw markings
  if (markingType !== 'none') {
    drawBabyMarkings(px, markingType, bodyColor);
  }
  
  // Draw accessories
  if (accessory !== 'none') {
    drawBabyAccessory(px, accessory);
  }
  
  // Add personality glow effects
  addPersonalityEffects(px, creature);
  
  return {
    type: 'baby',
    bodyType: bodyType,
    bodyColor: bodyColor,
    eyeType: eyeType,
    eyeColor: eyeColor,
    markingType: markingType,
    accessory: accessory
  };
}

function drawBabyBody(px, bodyType, bodyColor) {
  const darkerColor = adjustBrightness(bodyColor, -30);
  
  if (bodyType === 'round') {
    // Round body
    const bodyCoords = [
      {x: 7, y: 5}, {x: 8, y: 5},
      {x: 6, y: 6}, {x: 7, y: 6}, {x: 8, y: 6}, {x: 9, y: 6},
      {x: 5, y: 7}, {x: 6, y: 7}, {x: 7, y: 7}, {x: 8, y: 7}, {x: 9, y: 7}, {x: 10, y: 7},
      {x: 5, y: 8}, {x: 6, y: 8}, {x: 7, y: 8}, {x: 8, y: 8}, {x: 9, y: 8}, {x: 10, y: 8},
      {x: 5, y: 9}, {x: 6, y: 9}, {x: 7, y: 9}, {x: 8, y: 9}, {x: 9, y: 9}, {x: 10, y: 9},
      {x: 6, y: 10}, {x: 7, y: 10}, {x: 8, y: 10}, {x: 9, y: 10},
      {x: 7, y: 11}, {x: 8, y: 11}
    ];
    bodyCoords.forEach(coord => px(coord.x, coord.y, bodyColor));
    
    // Add shading
    px(9, 7, darkerColor);
    px(10, 8, darkerColor);
    px(9, 10, darkerColor);
    
  } else if (bodyType === 'tall') {
    // Tall thin body
    for (let y = 4; y <= 12; y++) {
      for (let x = 6; x <= 9; x++) {
        px(x, y, bodyColor);
      }
    }
    // Shading
    px(9, 4, darkerColor);
    px(9, 5, darkerColor);
    px(9, 6, darkerColor);
    
  } else if (bodyType === 'wide') {
    // Wide short body
    for (let y = 6; y <= 10; y++) {
      for (let x = 4; x <= 11; x++) {
        px(x, y, bodyColor);
      }
    }
    // Shading
    for (let x = 10; x <= 11; x++) {
      px(x, 6, darkerColor);
      px(x, 7, darkerColor);
    }
    
  } else { // compact
    // Compact square body
    for (let y = 6; y <= 10; y++) {
      for (let x = 6; x <= 9; x++) {
        px(x, y, bodyColor);
      }
    }
    // Shading
    px(9, 6, darkerColor);
    px(9, 7, darkerColor);
  }
}

function drawBabyEyes(px, eyeType, eyeColor) {
  const white = '#ffffff';
  const black = '#000000';
  
  if (eyeType === 'round') {
    // Round eyes
    px(6, 7, white);
    px(9, 7, white);
    px(6, 7, eyeColor);
    px(9, 7, eyeColor);
    
  } else if (eyeType === 'oval') {
    // Oval eyes
    px(6, 7, white);
    px(7, 7, white);
    px(8, 7, white);
    px(9, 7, white);
    px(6, 7, eyeColor);
    px(9, 7, eyeColor);
    
  } else if (eyeType === 'star') {
    // Star shaped eyes
    px(6, 7, eyeColor);
    px(5, 7, eyeColor);
    px(7, 6, eyeColor);
    px(7, 8, eyeColor);
    px(9, 7, eyeColor);
    px(10, 7, eyeColor);
    px(8, 6, eyeColor);
    px(8, 8, eyeColor);
    
  } else { // diamond
    // Diamond eyes
    px(6, 6, eyeColor);
    px(5, 7, eyeColor);
    px(6, 8, eyeColor);
    px(9, 6, eyeColor);
    px(10, 7, eyeColor);
    px(9, 8, eyeColor);
  }
}

function drawBabyMarkings(px, markingType, bodyColor) {
  const markingColor = adjustBrightness(bodyColor, -50);
  
  if (markingType === 'spots') {
    px(6, 8, markingColor);
    px(8, 6, markingColor);
    px(9, 9, markingColor);
    
  } else if (markingType === 'stripes') {
    px(5, 8, markingColor);
    px(6, 8, markingColor);
    px(8, 9, markingColor);
    px(9, 9, markingColor);
    
  } else if (markingType === 'swirls') {
    px(7, 8, markingColor);
    px(8, 8, markingColor);
    px(8, 9, markingColor);
    
  } else if (markingType === 'hearts') {
    px(6, 8, '#ff6b9d');
    px(8, 8, '#ff6b9d');
    px(7, 9, '#ff6b9d');
    
  } else if (markingType === 'stars') {
    px(7, 8, '#feca57');
    px(6, 8, '#feca57');
    px(8, 8, '#feca57');
    px(7, 7, '#feca57');
    px(7, 9, '#feca57');
  }
}

function drawBabyAccessory(px, accessory) {
  if (accessory === 'bow') {
    px(6, 5, '#e84393');
    px(7, 5, '#e84393');
    px(8, 5, '#e84393');
    px(9, 5, '#e84393');
    px(7, 4, '#e84393');
    px(8, 4, '#e84393');
    
  } else if (accessory === 'hat') {
    for (let x = 5; x <= 10; x++) {
      px(x, 4, '#2d3436');
    }
    for (let x = 6; x <= 9; x++) {
      px(x, 3, '#2d3436');
    }
    
  } else if (accessory === 'collar') {
    px(5, 10, '#e17055');
    px(6, 10, '#e17055');
    px(7, 10, '#e17055');
    px(8, 10, '#e17055');
    px(9, 10, '#e17055');
    px(10, 10, '#e17055');
    
  } else if (accessory === 'gem') {
    px(7, 6, '#74b9ff');
    px(8, 6, '#74b9ff');
  }
}

function addPersonalityEffects(px, creature) {
  // Add glowing effects based on high stats
  if (creature.happiness >= 80) {
    // Happy sparkles
    px(4, 6, '#feca57');
    px(11, 8, '#feca57');
    px(5, 11, '#feca57');
  }
  
  if (creature.energy >= 90) {
    // Energy bolts
    px(3, 7, '#00b894');
    px(12, 7, '#00b894');
  }
  
  if (creature.creativity >= 70) {
    // Rainbow pixel
    px(4, 5, '#fd79a8');
    px(11, 5, '#74b9ff');
  }
}

// Generate juvenile VORTEK variants - more complex and stat-driven
function generateJuvenileVariant(creature) {
  const S = 6;
  vctx.clearRect(0, 0, vortekCanvas.width, vortekCanvas.height);
  const px = (x, y, c) => { vctx.fillStyle = c; vctx.fillRect(x * S, y * S, S, S); };
  
  // Advanced variant characteristics for juveniles
  const bodyShapes = ['athletic', 'scholarly', 'artistic', 'guardian'];
  const primaryColors = ['#6c5ce7', '#00b894', '#fd79a8', '#fdcb6e', '#e17055', '#74b9ff'];
  const featureTypes = ['fins', 'spikes', 'crystals', 'aura', 'wings'];
  
  // Determine characteristics based on highest stats
  const dominantStat = getDominantStat(creature);
  const secondaryStat = getSecondaryStat(creature);
  
  let bodyShape = bodyShapes[rngInt(bodyShapes.length)];
  let primaryColor = primaryColors[rngInt(primaryColors.length)];
  let featureType = featureTypes[rngInt(featureTypes.length)];
  
  // Stat-driven modifications
  if (creature.power >= 70) {
    bodyShape = 'athletic';
    featureType = 'spikes';
  } else if (creature.wisdom >= 70) {
    bodyShape = 'scholarly';
    featureType = 'crystals';
  } else if (creature.creativity >= 70) {
    bodyShape = 'artistic';
    featureType = 'aura';
  } else if (creature.courage >= 70) {
    bodyShape = 'guardian';
    featureType = 'fins';
  }
  
  // Clear background
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      px(x, y, '#1a1a2e');
    }
  }
  
  // Draw main body based on shape
  drawJuvenileBody(px, bodyShape, primaryColor, creature);
  
  // Draw stat-based features
  drawJuvenileFeatures(px, featureType, creature);
  
  // Draw advanced eyes with personality reflection
  drawJuvenileEyes(px, creature);
  
  // Add stat-based aura effects
  addJuvenileAuraEffects(px, creature);
  
  return {
    type: 'juvenile',
    bodyShape: bodyShape,
    primaryColor: primaryColor,
    featureType: featureType,
    dominantStat: dominantStat,
    secondaryStat: secondaryStat
  };
}

// Generate adult VORTEK variants - sophisticated and battle-ready
function generateAdultVariant(creature) {
  const S = 6;
  vctx.clearRect(0, 0, vortekCanvas.width, vortekCanvas.height);
  const px = (x, y, c) => { vctx.fillStyle = c; vctx.fillRect(x * S, y * S, S, S); };
  
  // Advanced adult characteristics
  const adultForms = ['warrior', 'mage', 'guardian', 'berserker', 'sage'];
  const armorTypes = ['none', 'light', 'medium', 'heavy', 'mystical'];
  const weaponTypes = ['none', 'sword', 'staff', 'claws', 'energy'];
  const elemTypes = ['fire', 'ice', 'lightning', 'nature', 'void', 'light'];
  
  // Determine form based on stat combinations
  let adultForm = getAdultForm(creature);
  let armorType = getArmorType(creature);
  let weaponType = getWeaponType(creature);
  let elementType = elemTypes[rngInt(elemTypes.length)];
  
  // Stat-driven element assignment
  if (creature.power >= 80) elementType = 'fire';
  else if (creature.wisdom >= 80) elementType = 'light';
  else if (creature.courage >= 80) elementType = 'lightning';
  else if (creature.creativity >= 80) elementType = 'nature';
  else if (creature.focus >= 80) elementType = 'ice';
  
  // Clear background with mystical space
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      px(x, y, '#0a0a23');
    }
  }
  
  // Draw powerful adult body
  drawAdultBody(px, adultForm, elementType, creature);
  
  // Draw armor and equipment
  drawAdultArmor(px, armorType, creature);
  drawAdultWeapon(px, weaponType, creature);
  
  // Draw commanding eyes
  drawAdultEyes(px, creature);
  
  // Add powerful elemental effects
  addAdultElementalEffects(px, elementType, creature);
  
  // Add mastery indicators
  addAdultMasteryEffects(px, creature);
  
  return {
    type: 'adult',
    adultForm: adultForm,
    armorType: armorType,
    weaponType: weaponType,
    elementType: elementType
  };
}

// Generate elder VORTEK variants - legendary and transcendent
function generateElderVariant(creature) {
  const S = 6;
  vctx.clearRect(0, 0, vortekCanvas.width, vortekCanvas.height);
  const px = (x, y, c) => { vctx.fillStyle = c; vctx.fillRect(x * S, y * S, S, S); };
  
  // Legendary elder characteristics
  const elderForms = ['ascended', 'cosmic', 'ethereal', 'primordial', 'transcendent'];
  const crownTypes = ['stars', 'crystals', 'fire', 'void', 'rainbow'];
  const aureoles = ['solar', 'lunar', 'stellar', 'prismatic', 'quantum'];
  
  // Determine legendary form based on lifetime achievements
  let elderForm = getElderForm(creature);
  let crownType = getCrownType(creature);
  let aureole = aureoles[rngInt(aureoles.length)];
  
  // Stat-driven aureole assignment
  if (creature.power >= 90 && creature.courage >= 90) aureole = 'solar';
  else if (creature.wisdom >= 90 && creature.focus >= 90) aureole = 'lunar';
  else if (creature.creativity >= 90) aureole = 'prismatic';
  else if (creature.loyalty >= 95) aureole = 'stellar';
  
  // Clear background with cosmic void
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      px(x, y, '#000011');
    }
  }
  
  // Add cosmic background effects
  addCosmicBackground(px, creature);
  
  // Draw majestic elder body
  drawElderBody(px, elderForm, creature);
  
  // Draw legendary crown
  drawElderCrown(px, crownType, creature);
  
  // Draw transcendent eyes
  drawElderEyes(px, creature);
  
  // Add aureole/halo effects
  addElderAureole(px, aureole, creature);
  
  // Add legendary mastery effects
  addElderLegendaryEffects(px, creature);
  
  return {
    type: 'elder',
    elderForm: elderForm,
    crownType: crownType,
    aureole: aureole,
    powerLevel: calculateElderPowerLevel(creature)
  };
}

// Helper functions
function getDominantStat(creature) {
  const stats = {
    power: creature.power,
    wisdom: creature.wisdom,
    creativity: creature.creativity,
    courage: creature.courage,
    loyalty: creature.loyalty,
    focus: creature.focus,
    curiosity: creature.curiosity,
    playfulness: creature.playfulness
  };
  return Object.keys(stats).reduce((a, b) => stats[a] > stats[b] ? a : b);
}

function getSecondaryStat(creature) {
  const stats = {
    power: creature.power,
    wisdom: creature.wisdom,
    creativity: creature.creativity,
    courage: creature.courage,
    loyalty: creature.loyalty,
    focus: creature.focus,
    curiosity: creature.curiosity,
    playfulness: creature.playfulness
  };
  const dominantStat = getDominantStat(creature);
  delete stats[dominantStat];
  return Object.keys(stats).reduce((a, b) => stats[a] > stats[b] ? a : b);
}

// Juvenile helper functions
function drawJuvenileBody(px, bodyShape, primaryColor, creature) {
  const shadowColor = adjustBrightness(primaryColor, -40);
  const highlightColor = adjustBrightness(primaryColor, 20);
  
  if (bodyShape === 'athletic') {
    // Muscular, powerful build
    const coords = [
      {x: 7, y: 3}, {x: 8, y: 3},
      {x: 6, y: 4}, {x: 7, y: 4}, {x: 8, y: 4}, {x: 9, y: 4},
      {x: 5, y: 5}, {x: 6, y: 5}, {x: 7, y: 5}, {x: 8, y: 5}, {x: 9, y: 5}, {x: 10, y: 5},
      {x: 4, y: 6}, {x: 5, y: 6}, {x: 6, y: 6}, {x: 7, y: 6}, {x: 8, y: 6}, {x: 9, y: 6}, {x: 10, y: 6}, {x: 11, y: 6},
      {x: 4, y: 7}, {x: 5, y: 7}, {x: 6, y: 7}, {x: 7, y: 7}, {x: 8, y: 7}, {x: 9, y: 7}, {x: 10, y: 7}, {x: 11, y: 7},
      {x: 4, y: 8}, {x: 5, y: 8}, {x: 6, y: 8}, {x: 7, y: 8}, {x: 8, y: 8}, {x: 9, y: 8}, {x: 10, y: 8}, {x: 11, y: 8},
      {x: 5, y: 9}, {x: 6, y: 9}, {x: 7, y: 9}, {x: 8, y: 9}, {x: 9, y: 9}, {x: 10, y: 9},
      {x: 6, y: 10}, {x: 7, y: 10}, {x: 8, y: 10}, {x: 9, y: 10},
      {x: 6, y: 11}, {x: 7, y: 11}, {x: 8, y: 11}, {x: 9, y: 11},
      {x: 7, y: 12}, {x: 8, y: 12}
    ];
    coords.forEach(coord => px(coord.x, coord.y, primaryColor));
    // Muscle definition
    px(10, 6, shadowColor);
    px(11, 7, shadowColor);
    px(5, 6, highlightColor);
    px(4, 7, highlightColor);
    
  } else if (bodyShape === 'scholarly') {
    // Tall, slender, intellectual build
    for (let y = 3; y <= 12; y++) {
      for (let x = 6; x <= 9; x++) {
        px(x, y, primaryColor);
      }
    }
    // Add robes
    px(5, 8, shadowColor);
    px(10, 8, shadowColor);
    px(5, 9, shadowColor);
    px(10, 9, shadowColor);
    
  } else if (bodyShape === 'artistic') {
    // Graceful, flowing form
    const coords = [
      {x: 7, y: 4}, {x: 8, y: 4},
      {x: 6, y: 5}, {x: 7, y: 5}, {x: 8, y: 5}, {x: 9, y: 5},
      {x: 5, y: 6}, {x: 6, y: 6}, {x: 7, y: 6}, {x: 8, y: 6}, {x: 9, y: 6}, {x: 10, y: 6},
      {x: 5, y: 7}, {x: 6, y: 7}, {x: 7, y: 7}, {x: 8, y: 7}, {x: 9, y: 7}, {x: 10, y: 7},
      {x: 6, y: 8}, {x: 7, y: 8}, {x: 8, y: 8}, {x: 9, y: 8},
      {x: 6, y: 9}, {x: 7, y: 9}, {x: 8, y: 9}, {x: 9, y: 9},
      {x: 7, y: 10}, {x: 8, y: 10},
      {x: 7, y: 11}, {x: 8, y: 11}
    ];
    coords.forEach(coord => px(coord.x, coord.y, primaryColor));
    // Flowing curves
    px(4, 7, highlightColor);
    px(11, 7, highlightColor);
    
  } else { // guardian
    // Solid, protective build
    for (let y = 4; y <= 11; y++) {
      for (let x = 5; x <= 10; x++) {
        px(x, y, primaryColor);
      }
    }
    // Armor plating
    px(5, 5, shadowColor);
    px(10, 5, shadowColor);
    px(5, 6, shadowColor);
    px(10, 6, shadowColor);
  }
}

function drawJuvenileFeatures(px, featureType, creature) {
  const featureColor = getFeatureColor(featureType, creature);
  
  if (featureType === 'fins') {
    // Side fins
    px(3, 6, featureColor);
    px(3, 7, featureColor);
    px(12, 6, featureColor);
    px(12, 7, featureColor);
    px(2, 7, adjustBrightness(featureColor, -30));
    px(13, 7, adjustBrightness(featureColor, -30));
    
  } else if (featureType === 'spikes') {
    // Back spikes
    px(6, 2, featureColor);
    px(7, 1, featureColor);
    px(8, 1, featureColor);
    px(9, 2, featureColor);
    px(6, 3, adjustBrightness(featureColor, -30));
    px(9, 3, adjustBrightness(featureColor, -30));
    
  } else if (featureType === 'crystals') {
    // Crystal formations
    px(5, 4, featureColor);
    px(10, 4, featureColor);
    px(4, 5, featureColor);
    px(11, 5, featureColor);
    px(5, 5, adjustBrightness(featureColor, 30));
    px(10, 5, adjustBrightness(featureColor, 30));
    
  } else if (featureType === 'wings') {
    // Energy wings
    px(3, 5, featureColor);
    px(2, 6, featureColor);
    px(3, 7, featureColor);
    px(12, 5, featureColor);
    px(13, 6, featureColor);
    px(12, 7, featureColor);
    
  } else if (featureType === 'aura') {
    // Glowing aura
    px(4, 4, featureColor);
    px(11, 4, featureColor);
    px(3, 8, featureColor);
    px(12, 8, featureColor);
  }
}

function drawJuvenileEyes(px, creature) {
  const eyeColor = getStatBasedEyeColor(creature);
  const glowColor = adjustBrightness(eyeColor, 50);
  
  // Base eyes
  px(6, 6, '#ffffff');
  px(9, 6, '#ffffff');
  px(6, 6, eyeColor);
  px(9, 6, eyeColor);
  
  // Personality-based eye effects
  if (creature.wisdom >= 70) {
    // Wise eyes glow
    px(5, 5, glowColor);
    px(10, 5, glowColor);
  }
  if (creature.courage >= 70) {
    // Fierce eyes
    px(6, 5, eyeColor);
    px(9, 5, eyeColor);
  }
  if (creature.creativity >= 70) {
    // Sparkling eyes
    px(5, 6, glowColor);
    px(10, 6, glowColor);
  }
}

function addJuvenileAuraEffects(px, creature) {
  // Stat-based environmental effects
  if (creature.happiness >= 85) {
    // Joy sparkles
    px(2, 3, '#feca57');
    px(13, 3, '#feca57');
    px(1, 9, '#feca57');
    px(14, 9, '#feca57');
  }
  
  if (creature.energy >= 90) {
    // Energy crackles
    px(1, 5, '#00b894');
    px(14, 5, '#00b894');
    px(2, 10, '#00b894');
    px(13, 10, '#00b894');
  }
  
  if (creature.power >= 80) {
    // Power aura
    px(0, 7, '#e17055');
    px(15, 7, '#e17055');
  }
}

// Adult helper functions
function getAdultForm(creature) {
  const totalCombat = creature.power + creature.courage;
  const totalWisdom = creature.wisdom + creature.focus;
  const totalCreative = creature.creativity + creature.playfulness;
  
  if (totalCombat >= 140) return 'warrior';
  if (totalWisdom >= 140) return 'sage';
  if (totalCreative >= 140) return 'mage';
  if (creature.loyalty >= 80) return 'guardian';
  return 'berserker';
}

function getArmorType(creature) {
  if (creature.power >= 80 && creature.courage >= 80) return 'heavy';
  if (creature.wisdom >= 80) return 'mystical';
  if (creature.focus >= 70) return 'medium';
  if (creature.playfulness >= 70) return 'light';
  return 'none';
}

function getWeaponType(creature) {
  if (creature.power >= 85) return 'sword';
  if (creature.wisdom >= 85) return 'staff';
  if (creature.courage >= 85) return 'claws';
  if (creature.creativity >= 85) return 'energy';
  return 'none';
}

function drawAdultBody(px, adultForm, elementType, creature) {
  const bodyColor = getElementalColor(elementType);
  const shadowColor = adjustBrightness(bodyColor, -40);
  const highlightColor = adjustBrightness(bodyColor, 30);
  
  // Large, imposing body structure
  for (let y = 2; y <= 13; y++) {
    for (let x = 4; x <= 11; x++) {
      px(x, y, bodyColor);
    }
  }
  
  // Form-specific modifications
  if (adultForm === 'warrior') {
    // Broad shoulders
    px(3, 4, bodyColor);
    px(12, 4, bodyColor);
    px(3, 5, bodyColor);
    px(12, 5, bodyColor);
  } else if (adultForm === 'mage') {
    // Flowing robes
    px(3, 8, shadowColor);
    px(12, 8, shadowColor);
    px(3, 9, shadowColor);
    px(12, 9, shadowColor);
    px(2, 10, shadowColor);
    px(13, 10, shadowColor);
  } else if (adultForm === 'sage') {
    // Meditation posture
    px(5, 12, bodyColor);
    px(6, 13, bodyColor);
    px(9, 13, bodyColor);
    px(10, 12, bodyColor);
  }
  
  // Add definition
  px(11, 3, shadowColor);
  px(11, 4, shadowColor);
  px(4, 3, highlightColor);
  px(4, 4, highlightColor);
}

function drawAdultArmor(px, armorType, creature) {
  if (armorType === 'none') return;
  
  const armorColor = getArmorColor(armorType, creature);
  const metalColor = adjustBrightness(armorColor, -20);
  
  if (armorType === 'heavy') {
    // Full plate armor
    px(5, 4, armorColor);
    px(6, 4, armorColor);
    px(9, 4, armorColor);
    px(10, 4, armorColor);
    px(5, 5, metalColor);
    px(10, 5, metalColor);
    px(6, 6, armorColor);
    px(9, 6, armorColor);
    
  } else if (armorType === 'mystical') {
    // Glowing mystical armor
    px(5, 3, '#74b9ff');
    px(10, 3, '#74b9ff');
    px(6, 4, '#a29bfe');
    px(9, 4, '#a29bfe');
    
  } else if (armorType === 'medium') {
    // Scale mail
    px(6, 5, armorColor);
    px(7, 5, metalColor);
    px(8, 5, armorColor);
    px(9, 5, metalColor);
    
  } else if (armorType === 'light') {
    // Leather armor
    px(5, 6, '#8b4513');
    px(10, 6, '#8b4513');
  }
}

function drawAdultWeapon(px, weaponType, creature) {
  if (weaponType === 'none') return;
  
  const weaponColor = getWeaponColor(weaponType);
  
  if (weaponType === 'sword') {
    // Mighty sword
    px(2, 2, weaponColor);
    px(2, 3, weaponColor);
    px(2, 4, weaponColor);
    px(1, 4, adjustBrightness(weaponColor, -30));
    px(3, 4, adjustBrightness(weaponColor, 30));
    
  } else if (weaponType === 'staff') {
    // Magical staff
    px(13, 1, '#8b4513');
    px(13, 2, '#8b4513');
    px(13, 3, '#8b4513');
    px(13, 0, '#74b9ff');
    px(12, 0, '#a29bfe');
    px(14, 0, '#a29bfe');
    
  } else if (weaponType === 'claws') {
    // Extended claws
    px(3, 7, weaponColor);
    px(2, 7, weaponColor);
    px(13, 7, weaponColor);
    px(14, 7, weaponColor);
    
  } else if (weaponType === 'energy') {
    // Energy emanations
    px(1, 6, '#00b894');
    px(14, 6, '#00b894');
    px(0, 7, '#fd79a8');
    px(15, 7, '#fd79a8');
  }
}

function drawAdultEyes(px, creature) {
  const eyeColor = getStatBasedEyeColor(creature);
  const intensity = Math.max(creature.power, creature.wisdom, creature.courage);
  
  // Powerful, commanding eyes
  px(6, 5, '#ffffff');
  px(9, 5, '#ffffff');
  px(6, 5, eyeColor);
  px(9, 5, eyeColor);
  
  if (intensity >= 85) {
    // Glowing intense eyes
    px(5, 4, adjustBrightness(eyeColor, 60));
    px(10, 4, adjustBrightness(eyeColor, 60));
    px(5, 5, adjustBrightness(eyeColor, 30));
    px(10, 5, adjustBrightness(eyeColor, 30));
  }
}

function addAdultElementalEffects(px, elementType, creature) {
  const elementColor = getElementalColor(elementType);
  const intensity = (creature.power + creature.wisdom + creature.courage) / 3;
  
  if (intensity >= 70) {
    // Elemental aura surrounding the VORTEK
    if (elementType === 'fire') {
      px(2, 5, '#e17055');
      px(13, 5, '#e17055');
      px(1, 8, '#fd79a8');
      px(14, 8, '#fd79a8');
    } else if (elementType === 'ice') {
      px(2, 4, '#74b9ff');
      px(13, 4, '#74b9ff');
      px(1, 9, '#a29bfe');
      px(14, 9, '#a29bfe');
    } else if (elementType === 'lightning') {
      px(1, 6, '#feca57');
      px(14, 6, '#feca57');
      px(0, 8, '#fdcb6e');
      px(15, 8, '#fdcb6e');
    } else if (elementType === 'nature') {
      px(2, 6, '#00b894');
      px(13, 6, '#00b894');
      px(1, 7, '#55a3ff');
      px(14, 7, '#55a3ff');
    }
  }
}

function addAdultMasteryEffects(px, creature) {
  // Show mastery through special effects
  if (creature.level >= 35) {
    // Master-level glow
    px(0, 0, '#feca57');
    px(15, 0, '#feca57');
    px(0, 15, '#feca57');
    px(15, 15, '#feca57');
  }
}

// Elder helper functions
function getElderForm(creature) {
  const totalStats = creature.power + creature.wisdom + creature.creativity + 
                    creature.courage + creature.loyalty + creature.focus;
  
  if (totalStats >= 800) return 'transcendent';
  if (creature.wisdom >= 95) return 'cosmic';
  if (creature.creativity >= 95) return 'ethereal';
  if (creature.power >= 95) return 'primordial';
  return 'ascended';
}

function getCrownType(creature) {
  if (creature.wisdom >= 95) return 'stars';
  if (creature.creativity >= 95) return 'rainbow';
  if (creature.power >= 95) return 'fire';
  if (creature.focus >= 95) return 'crystals';
  return 'void';
}

function addCosmicBackground(px, creature) {
  // Cosmic background based on power level
  const starCount = Math.floor(creature.level / 10);
  for (let i = 0; i < starCount; i++) {
    const x = rngInt(16);
    const y = rngInt(16);
    px(x, y, '#ffffff');
  }
}

function drawElderBody(px, elderForm, creature) {
  const bodyColor = getElderBodyColor(elderForm);
  const glowColor = adjustBrightness(bodyColor, 40);
  
  // Massive, transcendent form
  for (let y = 1; y <= 14; y++) {
    for (let x = 2; x <= 13; x++) {
      px(x, y, bodyColor);
    }
  }
  
  // Form-specific characteristics
  if (elderForm === 'transcendent') {
    // Extends beyond physical bounds
    px(1, 7, glowColor);
    px(14, 7, glowColor);
    px(1, 8, glowColor);
    px(14, 8, glowColor);
  } else if (elderForm === 'cosmic') {
    // Star-filled body
    px(5, 5, '#ffffff');
    px(8, 7, '#ffffff');
    px(10, 9, '#ffffff');
  } else if (elderForm === 'ethereal') {
    // Semi-transparent, flowing
    px(3, 6, glowColor);
    px(12, 6, glowColor);
    px(3, 9, glowColor);
    px(12, 9, glowColor);
  }
}

function drawElderCrown(px, crownType, creature) {
  const crownColor = getCrownColor(crownType);
  
  if (crownType === 'stars') {
    px(7, 0, crownColor);
    px(8, 0, crownColor);
    px(6, 1, crownColor);
    px(9, 1, crownColor);
    px(5, 1, adjustBrightness(crownColor, 30));
    px(10, 1, adjustBrightness(crownColor, 30));
    
  } else if (crownType === 'fire') {
    px(6, 0, '#e17055');
    px(7, 0, '#fd79a8');
    px(8, 0, '#e17055');
    px(9, 0, '#fd79a8');
    
  } else if (crownType === 'crystals') {
    px(6, 0, '#74b9ff');
    px(7, 0, '#a29bfe');
    px(8, 0, '#74b9ff');
    px(9, 0, '#a29bfe');
    
  } else if (crownType === 'rainbow') {
    px(5, 0, '#e17055');
    px(6, 0, '#feca57');
    px(7, 0, '#00b894');
    px(8, 0, '#74b9ff');
    px(9, 0, '#fd79a8');
    px(10, 0, '#a29bfe');
  }
}

function drawElderEyes(px, creature) {
  const powerLevel = calculateElderPowerLevel(creature);
  
  // Transcendent eyes
  px(6, 4, '#ffffff');
  px(9, 4, '#ffffff');
  
  if (powerLevel >= 90) {
    // Universe-seeing eyes
    px(6, 4, '#feca57');
    px(9, 4, '#feca57');
    px(5, 3, '#fd79a8');
    px(10, 3, '#fd79a8');
    px(5, 4, '#74b9ff');
    px(10, 4, '#74b9ff');
  } else {
    px(6, 4, '#74b9ff');
    px(9, 4, '#74b9ff');
  }
}

function addElderAureole(px, aureole, creature) {
  const aureoleColor = getAureoleColor(aureole);
  
  // Halo/aureole effect
  const haloCoords = [
    {x: 6, y: 0}, {x: 7, y: 0}, {x: 8, y: 0}, {x: 9, y: 0},
    {x: 5, y: 1}, {x: 10, y: 1},
    {x: 4, y: 2}, {x: 11, y: 2},
    {x: 3, y: 3}, {x: 12, y: 3}
  ];
  
  haloCoords.forEach(coord => px(coord.x, coord.y, aureoleColor));
  
  if (aureole === 'prismatic') {
    // Rainbow effect
    px(5, 1, '#e17055');
    px(6, 1, '#feca57');
    px(7, 1, '#00b894');
    px(8, 1, '#74b9ff');
    px(9, 1, '#fd79a8');
    px(10, 1, '#a29bfe');
  }
}

function addElderLegendaryEffects(px, creature) {
  const powerLevel = calculateElderPowerLevel(creature);
  
  // Reality-bending effects
  if (powerLevel >= 95) {
    // Dimensional rifts
    px(0, 7, '#fd79a8');
    px(15, 7, '#fd79a8');
    px(0, 8, '#74b9ff');
    px(15, 8, '#74b9ff');
  }
  
  if (creature.loyalty >= 98) {
    // Perfect bond aura
    px(1, 1, '#feca57');
    px(14, 1, '#feca57');
    px(1, 14, '#feca57');
    px(14, 14, '#feca57');
  }
}

function calculateElderPowerLevel(creature) {
  return Math.floor((creature.power + creature.wisdom + creature.courage + 
                   creature.creativity + creature.loyalty + creature.focus) / 6);
}

// Color helper functions
function getFeatureColor(featureType, creature) {
  const colors = {
    fins: '#74b9ff',
    spikes: '#e17055', 
    crystals: '#a29bfe',
    aura: '#fd79a8',
    wings: '#00b894'
  };
  return colors[featureType] || '#ddd';
}

function getStatBasedEyeColor(creature) {
  const dominantStat = getDominantStat(creature);
  const colors = {
    power: '#e17055',
    wisdom: '#74b9ff',
    creativity: '#fd79a8',
    courage: '#feca57',
    loyalty: '#00b894',
    focus: '#a29bfe',
    curiosity: '#55a3ff',
    playfulness: '#ff6b9d'
  };
  return colors[dominantStat] || '#2d3436';
}

function getElementalColor(elementType) {
  const colors = {
    fire: '#e17055',
    ice: '#74b9ff',
    lightning: '#feca57',
    nature: '#00b894',
    void: '#2d3436',
    light: '#ffffff'
  };
  return colors[elementType] || '#a29bfe';
}

function getArmorColor(armorType, creature) {
  if (armorType === 'heavy') return '#636e72';
  if (armorType === 'mystical') return '#74b9ff';
  if (armorType === 'medium') return '#8b4513';
  if (armorType === 'light') return '#d63031';
  return '#ddd';
}

function getWeaponColor(weaponType) {
  const colors = {
    sword: '#636e72',
    staff: '#8b4513',
    claws: '#2d3436',
    energy: '#00b894'
  };
  return colors[weaponType] || '#ddd';
}

function getElderBodyColor(elderForm) {
  const colors = {
    ascended: '#a29bfe',
    cosmic: '#2d3436',
    ethereal: '#fd79a8',
    primordial: '#e17055',
    transcendent: '#feca57'
  };
  return colors[elderForm] || '#74b9ff';
}

function getCrownColor(crownType) {
  const colors = {
    stars: '#feca57',
    crystals: '#74b9ff',
    fire: '#e17055',
    void: '#2d3436',
    rainbow: '#fd79a8'
  };
  return colors[crownType] || '#ddd';
}

function getAureoleColor(aureole) {
  const colors = {
    solar: '#feca57',
    lunar: '#74b9ff',
    stellar: '#ffffff',
    prismatic: '#fd79a8',
    quantum: '#a29bfe'
  };
  return colors[aureole] || '#ddd';
}

function getTraitColor(trait) {
  const colors = {
    creativity: '#fd79a8',
    curiosity: '#00b894',
    playfulness: '#feca57',
    courage: '#e17055',
    loyalty: '#74b9ff',
    focus: '#a29bfe'
  };
  return colors[trait] || '#ddd';
}

function adjustBrightness(hex, percent) {
  // Remove the hash symbol if present
  hex = hex.replace('#', '');
  
  // Parse r, g, b values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  const newR = Math.max(0, Math.min(255, r + (r * percent / 100)));
  const newG = Math.max(0, Math.min(255, g + (g * percent / 100)));
  const newB = Math.max(0, Math.min(255, b + (b * percent / 100)));
  
  // Convert back to hex
  const toHex = (c) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return '#' + toHex(newR) + toHex(newG) + toHex(newB);
}

// Function to play VORTEK sound
export function playVortekSound(sound) {
  // For now, just log the sound. In a full implementation,
  // this would use Web Audio API to generate unique tones
  console.log(`🔊 ${sound}!`);
  
  // You could extend this with actual audio generation:
  // const audioContext = new AudioContext();
  // Generate tones based on the sound string
}