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
  const syllA = ["Bo","Cha","Mo","Lu","Pe","Za","Ti","Gro","Mi","Lo","Ka","Quo","Fi","Ra","Sn","We","Zo","Do","Ni","Ju","Pe","Ro","Ta","Zu"];
  const syllB = ["bby","nky","bbit","mp","ggle","rk","zzle","mmy","nk","cko","ff","zz","bo","ppy","x","tron","floo","puff","dle","zzo","bug","snax","mancer","tune"];
  return syllA[rngInt(syllA.length)] + syllB[rngInt(syllB.length)];
}

export function drawOppFace() {
  if (!faceCanvas || !fctx) {
    console.error('Face generator not initialized');
    return { persona: 'Bruiser', features: {} };
  }

  const S = 6; 
  fctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  const palSkin = ['#ffcc99','#f6c19a','#eeb290'];
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

  return { 
    persona, 
    features: { style, hasHat, hasStache, browL, browR, hasBlushL, hasBlushR, hair } 
  };
}

export function setOpponentName(persona) {
  if (nameEl) {
    nameEl.textContent = randomName() + (persona ? ' the ' + persona : '');
  }
}