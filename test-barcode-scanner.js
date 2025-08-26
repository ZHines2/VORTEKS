// test-barcode-scanner.js
// Simple test script for barcode scanning functionality

// Test the barcode opponent creation system
function testBarcodeOpponentCreation() {
  console.log('Testing barcode opponent creation...');
  
  const testCases = [
    '123456789',
    'ABCDEF123456',
    '987654321',
    'QWERTY123',
    '555-1234567890',
    'UPC123456789012',
    'ISBN9781234567890',
    'PRODUCTCODE12345'
  ];
  
  const results = [];
  
  testCases.forEach((barcodeData, index) => {
    console.log(`\nTest ${index + 1}: Testing barcode "${barcodeData}"`);
    
    try {
      // This would normally use the imported function
      // For testing, we simulate the opponent creation logic
      const opponent = createTestOpponent(barcodeData);
      
      console.log(`✅ Created: ${opponent.name}`);
      console.log(`   Persona: ${opponent.persona}`);
      console.log(`   Hash: ${opponent.hash}`);
      console.log(`   Colors: HSL(${opponent.features.hue}, ${opponent.features.saturation}%, ${opponent.features.lightness}%)`);
      
      results.push({
        barcode: barcodeData,
        success: true,
        opponent: opponent
      });
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      results.push({
        barcode: barcodeData,
        success: false,
        error: error.message
      });
    }
  });
  
  console.log('\n=== Test Summary ===');
  const successful = results.filter(r => r.success).length;
  console.log(`${successful}/${results.length} tests passed`);
  
  return results;
}

// Simulated opponent creation for testing
function createTestOpponent(barcodeData) {
  // Generate hash (simplified version)
  let hash = 0;
  for (let i = 0; i < barcodeData.length; i++) {
    const char = barcodeData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  hash = Math.abs(hash).toString(16);
  
  // Deterministic pseudo-random generator
  let seed = parseInt(hash.substring(0, 8), 16);
  function seededRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  
  // Generate characteristics
  const personas = ['Bruiser', 'Doctor', 'Trickster', 'Sicko', 'cat', 'robot', 'ghost'];
  const persona = personas[Math.floor(seededRandom() * personas.length)];
  
  const hue = Math.floor(seededRandom() * 360);
  const saturation = Math.floor(50 + seededRandom() * 50);
  const lightness = Math.floor(30 + seededRandom() * 40);
  
  // Generate name
  const syllableA = ['Scan', 'Code', 'Bar', 'Digi', 'Byte', 'Hex', 'Qr', 'Pix', 'Data', 'Bin'];
  const syllableB = ['bot', 'oid', 'hex', 'bit', 'ton', 'zar', 'nyx', 'dex', 'ron', 'mor'];
  
  const nameSeeds = hash.split('').map(c => parseInt(c, 16)).filter(n => !isNaN(n));
  const nameA = syllableA[nameSeeds[0] % syllableA.length] || syllableA[0];
  const nameB = syllableB[nameSeeds[1] % syllableB.length] || syllableB[0];
  const name = nameA + nameB;
  
  return {
    persona,
    name,
    hash: hash.substring(0, 6),
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

// Test if running in browser
if (typeof window !== 'undefined') {
  window.testBarcodeOpponentCreation = testBarcodeOpponentCreation;
  console.log('Barcode testing functions loaded. Run testBarcodeOpponentCreation() to test.');
} else if (typeof module !== 'undefined') {
  module.exports = { testBarcodeOpponentCreation, createTestOpponent };
}

// Auto-run if in Node.js environment
if (typeof require !== 'undefined' && require.main === module) {
  testBarcodeOpponentCreation();
}