// barcode-scanner.js
// Camera-based barcode scanning for unique opponent generation in VORTEKS

import { randomName } from './face-generator.js';
import { $ } from './utils.js';

let scanning = false;
let stream = null;
let scannerWorker = null;

// Barcode scanner configuration
const SCANNER_CONFIG = {
  width: 640,
  height: 480,
  frameRate: 10,
  timeout: 30000, // 30 seconds timeout
};

// Initialize barcode scanner
export function initBarcodeScanner() {
  console.log('Barcode scanner initialized');
}

// Check if camera is available
export async function isCameraAvailable() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch (error) {
    console.warn('Camera not available:', error);
    return false;
  }
}

// Start camera stream
async function startCamera(videoElement) {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: SCANNER_CONFIG.width },
        height: { ideal: SCANNER_CONFIG.height },
        frameRate: { ideal: SCANNER_CONFIG.frameRate },
        facingMode: 'environment' // Use back camera if available
      }
    });
    
    videoElement.srcObject = stream;
    return new Promise((resolve, reject) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        resolve(true);
      };
      videoElement.onerror = reject;
    });
  } catch (error) {
    console.error('Error accessing camera:', error);
    throw new Error('Could not access camera. Please check permissions.');
  }
}

// Stop camera stream
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

// Simple barcode detection using image analysis
// This is a basic implementation - in a real scenario you'd use a proper barcode library
function detectBarcode(canvas, ctx) {
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Simple horizontal line detection for barcodes
  // This is a very basic approach - real barcode detection is much more complex
  let consecutiveBlackPixels = 0;
  let consecutiveWhitePixels = 0;
  let patterns = [];
  
  // Scan middle horizontal line for barcode-like patterns
  const y = Math.floor(canvas.height / 2);
  const startIdx = y * canvas.width * 4;
  
  for (let x = 0; x < canvas.width; x++) {
    const idx = startIdx + x * 4;
    const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    const isBlack = brightness < 128;
    
    if (isBlack) {
      if (consecutiveWhitePixels > 0) {
        patterns.push('W' + consecutiveWhitePixels);
        consecutiveWhitePixels = 0;
      }
      consecutiveBlackPixels++;
    } else {
      if (consecutiveBlackPixels > 0) {
        patterns.push('B' + consecutiveBlackPixels);
        consecutiveBlackPixels = 0;
      }
      consecutiveWhitePixels++;
    }
  }
  
  // Check if we have a barcode-like pattern (alternating black/white with varying widths)
  if (patterns.length >= 10) {
    return patterns.join('');
  }
  
  return null;
}

// Generate barcode hash from detected pattern
function generateBarcodeHash(pattern) {
  if (!pattern) return null;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16);
}

// Create opponent data from barcode hash
export function createOpponentFromBarcode(barcodeData) {
  if (!barcodeData) return null;
  
  // Use barcode data as seed for deterministic generation
  const hash = typeof barcodeData === 'string' ? generateBarcodeHash(barcodeData) : barcodeData;
  if (!hash) return null;
  
  // Create deterministic pseudo-random generator from hash
  let seed = parseInt(hash.substring(0, 8), 16);
  
  function seededRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  
  // Generate deterministic opponent characteristics
  const personas = ['Bruiser', 'Doctor', 'Trickster', 'Sicko', 'cat', 'robot', 'ghost'];
  const persona = personas[Math.floor(seededRandom() * personas.length)];
  
  // Generate unique name based on hash
  const nameSeeds = hash.split('').map(c => parseInt(c, 16)).filter(n => !isNaN(n));
  const syllableA = ['Scan', 'Code', 'Bar', 'Digi', 'Byte', 'Hex', 'Qr', 'Pix', 'Data', 'Bin'];
  const syllableB = ['bot', 'oid', 'hex', 'bit', 'ton', 'zar', 'nyx', 'dex', 'ron', 'mor'];
  
  const nameA = syllableA[nameSeeds[0] % syllableA.length] || syllableA[0];
  const nameB = syllableB[nameSeeds[1] % syllableB.length] || syllableB[0];
  const uniqueName = nameA + nameB;
  
  // Generate unique visual features
  const hue = Math.floor(seededRandom() * 360);
  const saturation = Math.floor(50 + seededRandom() * 50); // 50-100%
  const lightness = Math.floor(30 + seededRandom() * 40); // 30-70%
  
  return {
    persona,
    name: uniqueName,
    hash,
    barcodeData,
    isScanned: true,
    features: {
      hue,
      saturation,
      lightness,
      pattern: hash.substring(0, 6),
      isEasterEgg: false,
      isScanned: true
    }
  };
}

// Main barcode scanning function
export async function scanBarcode() {
  return new Promise((resolve, reject) => {
    if (scanning) {
      reject(new Error('Scanning already in progress'));
      return;
    }
    
    if (!navigator.mediaDevices) {
      reject(new Error('Camera access not supported in this browser'));
      return;
    }
    
    scanning = true;
    let timeoutId;
    
    // Create scanning modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
      <div class="box" style="width:min(96vw, 600px); text-align:center;">
        <div style="font-size:18px; color:var(--accent); margin:8px 0 16px;"><strong>📷 Scan Barcode</strong></div>
        <div style="margin-bottom:16px;">
          <video id="barcodeVideo" width="${SCANNER_CONFIG.width}" height="${SCANNER_CONFIG.height}" 
                 style="max-width:100%; border:2px solid var(--border); border-radius:8px; background:#000;"></video>
          <canvas id="barcodeCanvas" width="${SCANNER_CONFIG.width}" height="${SCANNER_CONFIG.height}" 
                  style="display:none;"></canvas>
        </div>
        <div style="margin-bottom:16px; color:var(--ink);">
          Point your camera at a barcode to create a unique opponent
        </div>
        <div id="scanStatus" style="margin-bottom:16px; color:var(--accent); min-height:20px;">
          Starting camera...
        </div>
        <div style="display:flex; gap:8px; justify-content:center;">
          <button id="cancelScan" class="btn">CANCEL</button>
          <button id="manualInput" class="btn">MANUAL INPUT</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const video = modal.querySelector('#barcodeVideo');
    const canvas = modal.querySelector('#barcodeCanvas');
    const ctx = canvas.getContext('2d');
    const status = modal.querySelector('#scanStatus');
    const cancelBtn = modal.querySelector('#cancelScan');
    const manualBtn = modal.querySelector('#manualInput');
    
    // Cancel scanning
    function cleanup(result = null, error = null) {
      scanning = false;
      stopCamera();
      if (timeoutId) clearTimeout(timeoutId);
      document.body.removeChild(modal);
      
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }
    
    cancelBtn.addEventListener('click', () => {
      cleanup(null, new Error('Scanning cancelled by user'));
    });
    
    // Manual barcode input
    manualBtn.addEventListener('click', () => {
      const input = prompt('Enter barcode data manually (numbers/letters):');
      if (input && input.trim()) {
        const opponent = createOpponentFromBarcode(input.trim());
        cleanup(opponent);
      } else {
        cleanup(null, new Error('No barcode data provided'));
      }
    });
    
    // Set scanning timeout
    timeoutId = setTimeout(() => {
      cleanup(null, new Error('Scanning timeout - no barcode detected'));
    }, SCANNER_CONFIG.timeout);
    
    // Start scanning process
    startCamera(video)
      .then(() => {
        status.textContent = 'Scanning for barcode... Point camera at barcode';
        
        // Start scanning loop
        const scanInterval = setInterval(() => {
          if (!scanning) {
            clearInterval(scanInterval);
            return;
          }
          
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Try to detect barcode
          const pattern = detectBarcode(canvas, ctx);
          if (pattern) {
            clearInterval(scanInterval);
            const opponent = createOpponentFromBarcode(pattern);
            if (opponent) {
              status.textContent = `Barcode detected! Creating ${opponent.name}...`;
              setTimeout(() => cleanup(opponent), 1000);
            } else {
              status.textContent = 'Invalid barcode detected, continuing scan...';
            }
          }
        }, 100); // Scan every 100ms
        
      })
      .catch(error => {
        status.textContent = 'Camera error: ' + error.message;
        setTimeout(() => cleanup(null, error), 2000);
      });
  });
}

// Save scanned opponent to localStorage
export function saveScannedOpponent(opponent) {
  if (!opponent || !opponent.isScanned) return;
  
  const saved = JSON.parse(localStorage.getItem('vorteks-scanned-opponents') || '[]');
  
  // Check if already saved (by hash)
  const existing = saved.find(o => o.hash === opponent.hash);
  if (existing) {
    existing.lastUsed = Date.now();
  } else {
    saved.push({
      ...opponent,
      createdAt: Date.now(),
      lastUsed: Date.now()
    });
  }
  
  // Limit to 20 saved opponents
  saved.sort((a, b) => b.lastUsed - a.lastUsed);
  const limited = saved.slice(0, 20);
  
  localStorage.setItem('vorteks-scanned-opponents', JSON.stringify(limited));
}

// Get saved scanned opponents
export function getSavedOpponents() {
  const saved = JSON.parse(localStorage.getItem('vorteks-scanned-opponents') || '[]');
  return saved.sort((a, b) => b.lastUsed - a.lastUsed);
}

// Clear saved opponents
export function clearSavedOpponents() {
  localStorage.removeItem('vorteks-scanned-opponents');
}