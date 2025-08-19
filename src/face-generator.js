import { rng, $ } from './utils.js';

// Face generation for opponents
let faceCanvas = null;
let fctx = null;
let nameEl = null;

export function initFaceGenerator() {
  faceCanvas = document.getElementById('oppFace');
  fctx = faceCanvas.getContext('2d');
  nameEl = $('#oppName');
}

function rngInt(n) {
  return Math.floor(Math.random() * n);
}

export function randomName() {
  // Dramatically expanded syllable arrays for much higher variety
  // First syllables - fantasy/sci-fi inspired prefixes (80+ options)
  const syllA = [
    // Original syllables (preserved for compatibility)
    "Bo","Cha","Mo","Lu","Pe","Za","Ti","Gro","Mi","Lo","Ka","Quo","Fi","Ra","Sn","We","Zo","Do","Ni","Ju","Ro","Ta","Zu",
    // Fantasy-inspired additions
    "Aer","Bla","Cri","Dra","Elf","Fae","Grim","Hex","Ith","Jax","Kry","Lum","Myr","Nyx","Orb","Pix","Qua","Rune","Syl","Tho","Urk","Vex","Wyr","Xen","Yth","Zep",
    // Sci-fi inspired additions  
    "Ast","Byt","Cyb","Dat","Eon","Flux","Gal","Hyp","Ion","Jet","Kin","Lab","Mag","Neo","Oxi","Pla","Qbit","Ray","Syn","Tek","Uni","Vec","Wav","Xyr","Zer",
    // Mystical/ancient additions
    "Ahn","Bel","Cth","Dae","Eth","Fel","Gho","Hal","Ilm","Jor","Kel","Lyn","Mor","Nar","Oth","Pyr","Qin","Ral","Sab","Tul","Ulm","Vol","Wil","Xal","Yor","Zul"
  ];
  
  // Second syllables - diverse endings and suffixes (100+ options)
  const syllB = [
    // Original syllables (preserved for compatibility)
    "bby","nky","bbit","mp","ggle","rk","zzle","mmy","nk","cko","ff","zz","bo","ppy","x","tron","floo","puff","dle","zzo","bug","snax","mancer","tune",
    // Fantasy creature endings
    "wing","claw","fang","horn","tail","eye","maw","scale","fur","hide","bone","tooth","spike","blade","shard","gem","stone","flame","ice","storm",
    // Mystical/magical endings
    "spell","ward","hex","curse","charm","rune","glyph","sigil","mark","seal","bind","weave","craft","lore","sage","witch","mage","lord","king","queen",
    // Sci-fi/tech endings
    "byte","code","chip","core","link","node","port","sync","beam","wave","grid","net","web","bot","droid","mech","tech","cyber","nano","mega",
    // Action/personality endings
    "rage","fury","wrath","joy","glee","hope","fear","dread","pain","bliss","wild","calm","bold","shy","quick","slow","wise","fool","strong","weak",
    // Size/appearance endings
    "tiny","huge","vast","small","grand","micro","macro","mini","maxi","slim","wide","tall","short","thick","thin","round","sharp","smooth","rough","soft"
  ];
  
  return syllA[rngInt(syllA.length)] + syllB[rngInt(syllB.length)];
}

// Easter egg face definitions
const EASTER_EGG_FACES = [
  { 
    name: 'Duck', 
    persona: 'Quacker', 
    rarity: 'legendary'
  },
  { 
    name: 'Robot', 
    persona: 'Automaton', 
    rarity: 'epic'
  },
  { 
    name: 'Cat', 
    persona: 'Feline', 
    rarity: 'rare'
  },
  { 
    name: 'Dragon', 
    persona: 'Wyrm', 
    rarity: 'legendary'
  },
  { 
    name: 'Ghost', 
    persona: 'Specter', 
    rarity: 'epic'
  }
];

// Easter egg chance (5% for any special face)
const EASTER_EGG_CHANCE = 0.05;

// Dedicated ghost chance (separate from easter eggs, higher frequency)
const GHOST_CHANCE = 0.12; // 12% chance for ghosts specifically

export function drawOppFace() {
  if (!faceCanvas || !fctx) {
    console.error('Face generator not initialized');
    return { persona: 'Bruiser', features: {} };
  }

  // Check for Ghost generation first (12% chance)
  if (Math.random() < GHOST_CHANCE) {
    return buildGhostFace();
  }

  // Check for Cat generation (9% chance)
  if (Math.random() < 0.09) {
    return buildCatFace();
  }

  // Check for Robot generation (5.55% chance)
  if (Math.random() < 0.0555) {
    return buildRobotFace();
  }

  // Check for easter egg generation (5% chance, excluding ghosts since they have their own frequency)
  if (Math.random() < EASTER_EGG_CHANCE) {
    const nonGhostEasterEggs = EASTER_EGG_FACES.filter(e => e.name !== 'Ghost');
    const easterEgg = nonGhostEasterEggs[rngInt(nonGhostEasterEggs.length)];
    return drawEasterEggFace(easterEgg);
  }

  // Generate regular face
  return drawRegularFace();
}

// Build Cat face with variants as specified in requirements
export function buildCatFace() {
  const S = 6;
  fctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  const px = (x, y, c) => { fctx.fillStyle = c; fctx.fillRect(x * S, y * S, S, S); };

  // Cat variants
  const coats = ['black', 'white', 'ginger', 'tabby', 'calico', 'grey'];
  const eyes = ['green', 'amber', 'blue', 'odd'];
  const accessories = [null, 'collar', 'bell', 'bandana', 'visor'];
  
  const coat = coats[rngInt(coats.length)];
  const eyeColor = eyes[rngInt(eyes.length)];
  const accessory = Math.random() < 0.12 ? accessories[1 + rngInt(accessories.length - 1)] : null;

  // Cat color mapping
  const coatColors = {
    black: '#2c2c2c',
    white: '#f5f5f5', 
    ginger: '#d2691e',
    tabby: '#8b7355',
    calico: '#d2691e', // Will add patches
    grey: '#808080'
  };

  const eyeColors = {
    green: '#00ff00',
    amber: '#ffbf00',
    blue: '#4169e1',
    odd: ['#00ff00', '#4169e1'] // Different colors for each eye
  };

  const mainColor = coatColors[coat];
  const black = '#000000';
  const pink = '#ffb3d9';
  const white = '#ffffff';

  // background
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      px(x, y, black);
    }
  }

  // Cat head 
  for (let y = 5; y <= 11; y++) { 
    for (let x = 5; x <= 10; x++) {
      px(x, y, mainColor); 
    } 
  }
  
  // Ears
  px(5, 4, mainColor);
  px(6, 4, mainColor);
  px(9, 4, mainColor);
  px(10, 4, mainColor);
  px(5, 5, pink);
  px(10, 5, pink);
  
  // Calico patches if calico coat
  if (coat === 'calico') {
    px(6, 6, '#2c2c2c'); // black patch
    px(9, 9, '#ffffff');  // white patch
  }

  // Tabby stripes if tabby coat
  if (coat === 'tabby') {
    px(6, 6, '#654321');
    px(8, 8, '#654321');
    px(7, 10, '#654321');
  }

  // Eyes
  const leftEyeColor = eyeColor === 'odd' ? eyeColors.odd[0] : eyeColors[eyeColor];
  const rightEyeColor = eyeColor === 'odd' ? eyeColors.odd[1] : eyeColors[eyeColor];
  px(6, 7, leftEyeColor);
  px(9, 7, rightEyeColor);
  
  // Nose (pink)
  px(7, 8, pink);
  px(8, 8, pink);
  
  // Mouth
  px(7, 9, black);
  px(8, 9, black);
  px(6, 10, black);
  px(9, 10, black);
  
  // Whiskers
  px(4, 8, black);
  px(3, 9, black);
  px(11, 8, black);
  px(12, 9, black);

  // Accessories
  if (accessory === 'collar') {
    for (let x = 5; x <= 10; x++) {
      px(x, 12, '#ff0000'); // Red collar
    }
  } else if (accessory === 'bell') {
    for (let x = 5; x <= 10; x++) {
      px(x, 12, '#ff0000'); // Red collar
    }
    px(7, 13, '#ffff00'); // Yellow bell
    px(8, 13, '#ffff00');
  } else if (accessory === 'bandana') {
    px(5, 3, '#0000ff'); // Blue bandana
    px(6, 3, '#0000ff');
    px(9, 3, '#0000ff');
    px(10, 3, '#0000ff');
  } else if (accessory === 'visor') {
    for (let x = 5; x <= 10; x++) {
      px(x, 6, '#404040'); // Dark visor
    }
  }
  
  // Border
  for (let x = 5; x <= 10; x++) { 
    px(x, 5, black); 
    px(x, 11, black); 
  }
  for (let y = 5; y <= 11; y++) { 
    px(5, y, black); 
    px(10, y, black); 
  }

  // Log appearance
  let logMessage = `A Cat appears (${coat} / ${eyeColor} eyes).`;
  if (accessory) {
    logMessage = `✨ A Fancy Cat appears (${accessory}).`;
  }
  if (window.log) window.log(logMessage);

  return { 
    persona: 'cat',
    features: { 
      isCat: true,
      coat,
      eyes: eyeColor,
      accessory,
      isEasterEgg: false
    }
  };
}

// Build Robot face with variants as specified in requirements
export function buildRobotFace() {
  const S = 6;
  fctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  const px = (x, y, c) => { fctx.fillStyle = c; fctx.fillRect(x * S, y * S, S, S); };

  // Robot variants
  const chassis = ['steel', 'gunmetal', 'copper', 'midnight'];
  const eyeLeds = ['red', 'blue', 'green', 'amber'];
  const antennas = ['none', 'single', 'twin'];
  const accessories = [null, 'visor', 'shoulder panel'];
  
  const chassisType = chassis[rngInt(chassis.length)];
  const ledColor = eyeLeds[rngInt(eyeLeds.length)];
  const antenna = antennas[rngInt(antennas.length)];
  const accessory = Math.random() < 0.12 ? accessories[1 + rngInt(accessories.length - 1)] : null;

  // Robot color mapping
  const chassisColors = {
    steel: '#c0c0c0',
    gunmetal: '#2f4f4f', 
    copper: '#b87333',
    midnight: '#2c2c54'
  };

  const ledColors = {
    red: '#ff0000',
    blue: '#0066ff',
    green: '#00ff00',
    amber: '#ffbf00'
  };

  const mainColor = chassisColors[chassisType];
  const eyeColor = ledColors[ledColor];
  const black = '#000000';
  const darkGray = '#404040';
  const white = '#ffffff';

  // background
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      px(x, y, black);
    }
  }

  // Robot head 
  for (let y = 5; y <= 11; y++) { 
    for (let x = 5; x <= 10; x++) {
      px(x, y, mainColor); 
    } 
  }
  
  // Eyes (LED style)
  px(6, 7, eyeColor);
  px(9, 7, eyeColor);
  
  // Mouth (speaker grille)
  for (let x = 6; x <= 9; x++) {
    px(x, 10, darkGray);
  }
  px(7, 9, darkGray);
  px(8, 9, darkGray);

  // Antenna variants
  if (antenna === 'single') {
    px(7, 4, darkGray);
    px(7, 3, eyeColor); // LED tip
  } else if (antenna === 'twin') {
    px(6, 4, darkGray);
    px(9, 4, darkGray);
    px(6, 3, eyeColor); // LED tips
    px(9, 3, eyeColor);
  }

  // Accessories
  if (accessory === 'visor') {
    for (let x = 5; x <= 10; x++) {
      px(x, 6, darkGray); // Dark visor over eyes
    }
  } else if (accessory === 'shoulder panel') {
    px(4, 8, eyeColor); // Side panel with LED
    px(11, 8, eyeColor);
  }
  
  // Border
  for (let x = 5; x <= 10; x++) { 
    px(x, 5, black); 
    px(x, 11, black); 
  }
  for (let y = 5; y <= 11; y++) { 
    px(5, y, black); 
    px(10, y, black); 
  }

  // Log appearance
  let logMessage = `A Robot appears (${chassisType} / ${ledColor} LED).`;
  if (accessory) {
    logMessage = `✨ A Fancy Robot appears (${accessory}).`;
  }
  if (window.log) window.log(logMessage);

  return { 
    persona: 'robot',
    features: { 
      isRobot: true,
      chassis: chassisType,
      eyeLeds: ledColor,
      antenna,
      accessory,
      isEasterEgg: false
    }
  };
}

// Build Ghost face with variants
export function buildGhostFace() {
  const S = 6;
  fctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  const px = (x, y, c) => { fctx.fillStyle = c; fctx.fillRect(x * S, y * S, S, S); };

  // Ghost variants
  const spectralTypes = ['wisp', 'shade', 'phantom', 'spirit', 'wraith'];
  const eyeGlows = ['blue', 'green', 'red', 'purple', 'white'];
  const manifestations = ['translucent', 'ethereal', 'misty', 'solid'];
  const accessories = [null, 'chains', 'crown', 'aura', 'ectoplasm'];
  
  const spectralType = spectralTypes[rngInt(spectralTypes.length)];
  const eyeGlow = eyeGlows[rngInt(eyeGlows.length)];
  const manifestation = manifestations[rngInt(manifestations.length)];
  const accessory = Math.random() < 0.15 ? accessories[1 + rngInt(accessories.length - 1)] : null;

  // Ghost color mapping
  const spectralColors = {
    wisp: '#f8f8ff',     // Ghost white
    shade: '#d3d3d3',    // Light gray
    phantom: '#e6e6fa',  // Lavender
    spirit: '#f0f8ff',   // Alice blue
    wraith: '#dcdcdc'    // Gainsboro
  };

  const eyeGlowColors = {
    blue: '#4169e1',
    green: '#32cd32',
    red: '#ff4500',
    purple: '#8a2be2',
    white: '#ffffff'
  };

  const mainColor = spectralColors[spectralType];
  const eyeColor = eyeGlowColors[eyeGlow];
  const black = '#000000';
  const darkGray = '#404040';
  const lightGray = '#d0d0d0';

  // background
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      px(x, y, black);
    }
  }

  // Ghost body based on manifestation
  if (manifestation === 'translucent') {
    // Translucent ghost with scattered pixels
    for (let y = 4; y <= 10; y++) { 
      for (let x = 5; x <= 10; x++) {
        if (Math.random() < 0.8) px(x, y, mainColor); 
      } 
    }
  } else {
    // Solid manifestation
    for (let y = 4; y <= 10; y++) { 
      for (let x = 5; x <= 10; x++) {
        px(x, y, mainColor); 
      } 
    }
  }
  
  // Wavy bottom edge (characteristic ghost shape)
  if (manifestation !== 'misty') {
    px(5, 11, mainColor);
    px(7, 11, mainColor);
    px(9, 11, mainColor);
    if (manifestation === 'solid') {
      px(6, 12, mainColor);
      px(8, 12, mainColor);
    }
  }

  // Eyes based on type
  if (spectralType === 'wisp') {
    // Small glowing orbs
    px(6, 6, eyeColor);
    px(9, 6, eyeColor);
  } else {
    // Larger hollow eyes with glow
    px(6, 6, black);
    px(7, 6, black);
    px(9, 6, black);
    px(10, 6, black);
    px(6, 7, eyeColor);
    px(9, 7, eyeColor);
  }
  
  // Mouth based on type
  if (spectralType === 'wraith') {
    // Menacing grin
    for (let x = 6; x <= 9; x++) {
      px(x, 9, black);
    }
    px(6, 8, black);
    px(9, 8, black);
  } else {
    // Standard hollow mouth
    px(7, 9, black);
    px(8, 9, black);
    if (manifestation === 'solid') {
      px(7, 10, black);
      px(8, 10, black);
    }
  }

  // Accessories
  if (accessory === 'chains') {
    // Spectral chains
    px(4, 7, darkGray);
    px(11, 8, darkGray);
    px(5, 12, darkGray);
    px(10, 12, darkGray);
  } else if (accessory === 'crown') {
    // Ethereal crown
    for (let x = 5; x <= 10; x++) {
      px(x, 3, eyeColor);
    }
    px(6, 2, eyeColor);
    px(8, 2, eyeColor);
  } else if (accessory === 'aura') {
    // Glowing aura
    px(4, 5, eyeColor);
    px(11, 6, eyeColor);
    px(4, 9, eyeColor);
    px(11, 10, eyeColor);
  } else if (accessory === 'ectoplasm') {
    // Dripping ectoplasm
    px(6, 13, lightGray);
    px(8, 13, lightGray);
    px(7, 14, lightGray);
  }

  // Transparency effects for ethereal/misty types
  if (manifestation === 'ethereal' || manifestation === 'misty') {
    // Add some transparency pixels
    px(6, 5, lightGray);
    px(9, 8, lightGray);
    px(7, 10, lightGray);
  }
  
  // Border (partial for ethereal effect)
  if (manifestation === 'solid') {
    for (let x = 5; x <= 10; x++) { 
      px(x, 4, black); 
      px(x, 11, black); 
    }
    for (let y = 4; y <= 11; y++) { 
      px(5, y, black); 
      px(10, y, black); 
    }
  } else {
    // Partial border for ethereal effect
    for (let x = 6; x <= 9; x++) { 
      px(x, 4, black); 
    }
    px(5, 5, black); 
    px(10, 5, black);
  }

  // Log appearance
  let logMessage = `A Ghost appears (${spectralType} / ${eyeGlow} glow).`;
  if (accessory) {
    logMessage = `✨ A Fancy Ghost appears (${accessory}).`;
  }
  if (window.log) window.log(logMessage);

  return { 
    persona: 'ghost',
    features: { 
      isGhost: true,
      spectralType,
      eyeGlow,
      manifestation,
      accessory,
      isEasterEgg: false
    }
  };
}

// Draw special easter egg faces
function drawEasterEggFace(easterEgg) {
  const S = 6;
  fctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  const px = (x, y, c) => { fctx.fillStyle = c; fctx.fillRect(x * S, y * S, S, S); };

  // background
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      px(x, y, '#000000');
    }
  }

  // Draw specific easter egg face based on type
  switch (easterEgg.name) {
    case 'Duck':
      drawDuckFace(px);
      break;
    case 'Robot':
      drawRobotFace(px);
      break;
    case 'Cat':
      drawCatFace(px);
      break;
    case 'Dragon':
      drawDragonFace(px);
      break;
    case 'Ghost':
      drawGhostFace(px);
      break;
    default:
      // Fallback to regular face if something goes wrong
      return drawRegularFace();
  }

  return { 
    persona: easterEgg.persona,
    features: { 
      isEasterEgg: true,
      easterEggType: easterEgg.name,
      rarity: easterEgg.rarity
    }
  };
}

// Individual easter egg drawing functions
function drawDuckFace(px) {
  const yellow = '#ffdb4d';
  const orange = '#ff8c1a';
  const black = '#000000';
  const white = '#ffffff';

  // Duck head (yellow)
  for (let y = 4; y <= 11; y++) { 
    for (let x = 5; x <= 10; x++) {
      px(x, y, yellow); 
    } 
  }
  
  // Beak (orange)
  px(6, 9, orange);
  px(7, 9, orange);
  px(5, 10, orange);
  px(6, 10, orange);
  px(7, 10, orange);
  
  // Eyes
  px(6, 7, black);
  px(9, 7, black);
  
  // Border
  for (let x = 5; x <= 10; x++) { 
    px(x, 4, black); 
    px(x, 11, black); 
  }
  for (let y = 4; y <= 11; y++) { 
    px(5, y, black); 
    px(10, y, black); 
  }
}

function drawRobotFace(px) {
  const silver = '#c0c0c0';
  const darkGray = '#404040';
  const red = '#ff0000';
  const blue = '#0066ff';
  const black = '#000000';

  // Robot head (silver)
  for (let y = 4; y <= 11; y++) { 
    for (let x = 5; x <= 10; x++) {
      px(x, y, silver); 
    } 
  }
  
  // Eyes (red LEDs)
  px(6, 7, red);
  px(9, 7, red);
  
  // Mouth (speaker grille)
  for (let x = 6; x <= 9; x++) {
    px(x, 10, darkGray);
  }
  px(7, 9, darkGray);
  px(8, 9, darkGray);
  
  // Antenna
  px(7, 3, darkGray);
  px(8, 3, darkGray);
  px(7, 2, blue);
  px(8, 2, blue);
  
  // Border
  for (let x = 5; x <= 10; x++) { 
    px(x, 4, black); 
    px(x, 11, black); 
  }
  for (let y = 4; y <= 11; y++) { 
    px(5, y, black); 
    px(10, y, black); 
  }
}

function drawCatFace(px) {
  const gray = '#808080';
  const pink = '#ffb3d9';
  const black = '#000000';
  const white = '#ffffff';
  const green = '#00ff00';

  // Cat head (gray)
  for (let y = 5; y <= 11; y++) { 
    for (let x = 5; x <= 10; x++) {
      px(x, y, gray); 
    } 
  }
  
  // Ears
  px(5, 4, gray);
  px(6, 4, gray);
  px(9, 4, gray);
  px(10, 4, gray);
  px(5, 5, pink);
  px(10, 5, pink);
  
  // Eyes (green)
  px(6, 7, green);
  px(9, 7, green);
  
  // Nose (pink)
  px(7, 8, pink);
  px(8, 8, pink);
  
  // Mouth
  px(7, 9, black);
  px(8, 9, black);
  px(6, 10, black);
  px(9, 10, black);
  
  // Whiskers
  px(4, 8, black);
  px(3, 9, black);
  px(11, 8, black);
  px(12, 9, black);
  
  // Border
  for (let x = 5; x <= 10; x++) { 
    px(x, 5, black); 
    px(x, 11, black); 
  }
  for (let y = 5; y <= 11; y++) { 
    px(5, y, black); 
    px(10, y, black); 
  }
}

function drawDragonFace(px) {
  const darkGreen = '#2d5a2d';
  const lightGreen = '#4d804d';
  const red = '#ff0000';
  const yellow = '#ffff00';
  const black = '#000000';

  // Dragon head (dark green)
  for (let y = 4; y <= 11; y++) { 
    for (let x = 5; x <= 10; x++) {
      px(x, y, darkGreen); 
    } 
  }
  
  // Snout extension
  px(4, 9, darkGreen);
  px(4, 10, darkGreen);
  px(3, 10, darkGreen);
  
  // Eyes (red)
  px(6, 6, red);
  px(9, 6, red);
  px(6, 7, red);
  px(9, 7, red);
  
  // Nostrils
  px(5, 9, black);
  px(5, 10, black);
  
  // Scales (light green highlights)
  px(6, 5, lightGreen);
  px(8, 5, lightGreen);
  px(7, 8, lightGreen);
  px(9, 8, lightGreen);
  
  // Fire breath hint
  px(2, 10, yellow);
  px(1, 11, red);
  px(2, 11, yellow);
  
  // Border
  for (let x = 5; x <= 10; x++) { 
    px(x, 4, black); 
    px(x, 11, black); 
  }
  for (let y = 4; y <= 11; y++) { 
    px(5, y, black); 
    px(10, y, black); 
  }
}

function drawGhostFace(px) {
  const paleWhite = '#f0f0f0';
  const lightGray = '#d0d0d0';
  const black = '#000000';
  const darkBlue = '#000080';

  // Ghost body (pale white with wavy bottom)
  for (let y = 4; y <= 10; y++) { 
    for (let x = 5; x <= 10; x++) {
      px(x, y, paleWhite); 
    } 
  }
  
  // Wavy bottom edge
  px(5, 11, paleWhite);
  px(7, 11, paleWhite);
  px(9, 11, paleWhite);
  px(6, 12, paleWhite);
  px(8, 12, paleWhite);
  
  // Eyes (dark blue, hollow)
  px(6, 6, black);
  px(7, 6, black);
  px(9, 6, black);
  px(10, 6, black);
  px(6, 7, darkBlue);
  px(9, 7, darkBlue);
  
  // Mouth (dark)
  px(7, 9, black);
  px(8, 9, black);
  px(7, 10, black);
  px(8, 10, black);
  
  // Transparency effect (some gray pixels)
  px(6, 5, lightGray);
  px(9, 8, lightGray);
  px(7, 11, lightGray);
  
  // Border (partial, since ghosts are ethereal)
  for (let x = 5; x <= 10; x++) { 
    px(x, 4, black); 
  }
  px(5, 5, black); 
  px(10, 5, black);
}

// Regular face generation (extracted from original drawOppFace)
function drawRegularFace() {
  const S = 6; 
  fctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  // Expanded diverse skin tone palette - readable and distinguishable
  const palSkin = [
    '#ffcc99', '#f6c19a', '#eeb290', // Original light tones
    '#d4a574', '#c89666', '#b8855a', // Medium tones
    '#9c6d42', '#7a5439', '#5d4037', // Darker tones
    '#f4c2a1', '#e6a87c', '#d49c6b', // Warm tones
    '#f2d2a9', '#e8c5a0', '#deb887'  // Additional variety
  ];
  const palHair = ['#2b1a12','#47311f','#6e3d1a','#111111','#6b2f8a','#0d3b66'];
  const skin = palSkin[rngInt(palSkin.length)];
  const hair = palHair[rngInt(palHair.length)];
  const white = '#ffffff';
  const black = '#000000';
  const blush = ['#ff7799','#ff88aa','#ff6f7d'][rngInt(3)];
  const mouthPal = ['#990000','#aa1133','#551122'];
  const mouth = mouthPal[rngInt(3)];
  const px = (x, y, c) => { fctx.fillStyle = c; fctx.fillRect(x * S, y * S, S, S); };

  // background
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      px(x, y, '#000000');
    }
  }
  
  // head
  for (let y = 3; y <= 12; y++) { 
    for (let x = 4; x <= 11; x++) {
      px(x, y, skin); 
    } 
  }
  for (let x = 4; x <= 11; x++) { 
    px(x, 3, black); 
    px(x, 12, black); 
  }
  for (let y = 3; y <= 12; y++) { 
    px(4, y, black); 
    px(11, y, black); 
  }
  
  // hair
  const bangs = 3 + rngInt(3);
  for (let y = 2; y <= 4; y++) { 
    for (let x = 4; x <= 11; x++) {
      px(x, y, hair); 
    } 
  }
  for (let i = 0; i < bangs; i++) { 
    px(4 + 2 * i, 5, hair); 
    px(5 + 2 * i, 5, hair); 
  }
  
  // eyes
  const eyeY = 7; 
  const eyeLx = 6 - rngInt(1); 
  const eyeRx = 9 + rngInt(1);
  px(eyeLx, eyeY, white); 
  px(eyeLx + 1, eyeY, white); 
  px(eyeRx, eyeY, white); 
  px(eyeRx + 1, eyeY, white);
  px(eyeLx + rngInt(2), eyeY, black); 
  px(eyeRx + rngInt(2), eyeY, black);
  const browL = Math.random() < 0.8; 
  const browR = Math.random() < 0.8;
  if (browL) { 
    px(eyeLx, eyeY - 1, black); 
    px(eyeLx + 1, eyeY - 1, black); 
  }
  if (browR) { 
    px(eyeRx, eyeY - 1, black); 
    px(eyeRx + 1, eyeY - 1, black); 
  }
  
  // blush
  const hasBlushL = Math.random() < 0.7; 
  const hasBlushR = Math.random() < 0.7;
  if (hasBlushL) { 
    px(5, 9, blush); 
  } 
  if (hasBlushR) { 
    px(10, 9, blush); 
  }
  
  // nose
  px(8, 9, black);
  
  // mouth style
  const style = rngInt(3);
  if (style === 0) { 
    for (let x = 6; x <= 9; x++) {
      px(x, 11, mouth); 
    }
    px(6, 10, mouth); 
    px(9, 10, mouth); 
  } else if (style === 1) { 
    px(7, 11, mouth); 
    px(8, 11, mouth); 
    px(7, 10, mouth); 
    px(8, 10, mouth); 
  } else { 
    for (let x = 6; x <= 9; x++) {
      px(x, 11, black); 
    }
    px(7, 11, white); 
    px(8, 11, white); 
  }
  
  // mustache
  const hasStache = Math.random() < 0.35; 
  if (hasStache) { 
    for (let x = 6; x <= 9; x++) {
      px(x, 10, hair); 
    } 
  }
  
  // hat stripe
  const hasHat = Math.random() < 0.5; 
  if (hasHat) { 
    for (let x = 5; x <= 10; x++) {
      px(x, 2, white); 
    } 
  }
  
  // mole
  const hasMole = Math.random() < 0.4; 
  if (hasMole) { 
    px(10, 8, black); 
  }

  // Derive persona from features
  let persona = 'Bruiser';
  if (style === 1) persona = 'Doctor';
  if (style === 2) persona = 'Trickster';
  if (hasHat && persona !== 'Trickster') persona = 'Trickster';
  if (hasStache && persona !== 'Doctor' && style !== 2) persona = 'Doctor';
  
  // Sicko persona: combination of mole + specific features for disease theme
  if (hasMole && style === 0 && !hasHat && !hasStache) {
    persona = 'Sicko';
  }

  return { 
    persona, 
    features: { style, hasHat, hasStache, browL, browR, hasBlushL, hasBlushR, hair } 
  };
}

export function setOpponentName(persona, features = {}) {
  if (nameEl) {
    if (features.isEasterEgg) {
      // Special naming for easter egg faces
      nameEl.textContent = `${randomName()} the ${persona}`;
      nameEl.style.color = getRarityColor(features.rarity);
      nameEl.title = `Special ${features.easterEggType} opponent! Rarity: ${features.rarity}`;
    } else {
      // Regular naming
      nameEl.textContent = randomName() + (persona ? ' the ' + persona : '');
      nameEl.style.color = '';
      nameEl.title = '';
    }
  }
}

// Get color based on rarity for visual indication
function getRarityColor(rarity) {
  switch (rarity) {
    case 'legendary': return '#ffd700'; // Gold
    case 'epic': return '#a335ee';     // Purple
    case 'rare': return '#0070dd';     // Blue
    default: return '#ffffff';         // White
  }
}