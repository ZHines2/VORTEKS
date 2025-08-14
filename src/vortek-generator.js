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

// Placeholder functions for other stages
function generateJuvenileVariant(creature) {
  // For now, return a simple placeholder
  const S = 6;
  vctx.clearRect(0, 0, vortekCanvas.width, vortekCanvas.height);
  const px = (x, y, c) => { vctx.fillStyle = c; vctx.fillRect(x * S, y * S, S, S); };
  
  // Draw a more mature looking creature
  for (let y = 4; y <= 12; y++) {
    for (let x = 5; x <= 10; x++) {
      px(x, y, '#6c5ce7');
    }
  }
  
  return { type: 'juvenile' };
}

function generateAdultVariant(creature) {
  // Placeholder for adult variant
  const S = 6;
  vctx.clearRect(0, 0, vortekCanvas.width, vortekCanvas.height);
  const px = (x, y, c) => { vctx.fillStyle = c; vctx.fillRect(x * S, y * S, S, S); };
  
  for (let y = 3; y <= 13; y++) {
    for (let x = 4; x <= 11; x++) {
      px(x, y, '#a29bfe');
    }
  }
  
  return { type: 'adult' };
}

function generateElderVariant(creature) {
  // Placeholder for elder variant
  const S = 6;
  vctx.clearRect(0, 0, vortekCanvas.width, vortekCanvas.height);
  const px = (x, y, c) => { vctx.fillStyle = c; vctx.fillRect(x * S, y * S, S, S); };
  
  for (let y = 2; y <= 14; y++) {
    for (let x = 3; x <= 12; x++) {
      px(x, y, '#fd79a8');
    }
  }
  
  return { type: 'elder' };
}

// Helper functions
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