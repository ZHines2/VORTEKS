# 📷 VORTEKS Barcode Scanning Guide

## Overview

VORTEKS now supports barcode scanning to create unique opponents! Point your camera at any barcode to generate a deterministic opponent with unique visual features, name, and characteristics based on the barcode data.

## Features

### 🎯 Unique Opponent Generation
- **Deterministic Creation**: Same barcode always generates the same opponent
- **Visual Customization**: Barcode data determines colors, patterns, and features
- **Name Generation**: Creates unique names based on barcode hash
- **Persona Selection**: Different barcode patterns result in different personas (Bruiser, Doctor, Trickster, Robot, Ghost, Cat, etc.)

### 📱 Camera Integration
- **Live Scanning**: Use your device's camera to scan real barcodes
- **Manual Input**: Enter barcode data manually if camera isn't available
- **Permission Handling**: Graceful fallback when camera access is denied

### 💾 Persistence System
- **Saved Opponents**: Automatically saves scanned opponents for later use
- **Quick Recall**: Browse and select from previously scanned opponents
- **Storage Limit**: Keeps the 20 most recently used opponents

## How to Use

### 1. Access Barcode Scanning
1. Start any game mode (Quick Start, Campaign, Tournament)
2. Look for the **📷 SCAN** button next to "REROLL FACE" in the opponent panel
3. Click the button to open the barcode scanner

### 2. Scan a Barcode
- **With Camera**: Point your camera at any barcode (UPC, QR code, etc.)
- **Manual Entry**: Click "MANUAL INPUT" to type barcode data directly
- **Saved Opponents**: If you have saved opponents, you'll be prompted to use them first

### 3. Battle Your Unique Opponent
- The generated opponent will have unique visual features based on the barcode
- Fight them like any other opponent - they use the same game mechanics
- Your scanned opponent is automatically saved for future battles

## Technical Details

### Barcode Processing
- **Hash Generation**: Converts barcode data into a deterministic hash
- **Seeded Random**: Uses hash as seed for consistent opponent generation
- **Pattern Recognition**: Barcode patterns influence visual features and persona selection

### Visual Generation
- **Color Palette**: HSL colors derived from barcode data
- **Pattern-Based Features**: Barcode digits determine facial features, accessories, and styling
- **Persona-Specific Rendering**: Different visual styles for humans, robots, cats, and ghosts

### Supported Barcode Types
- **UPC/EAN**: Standard product barcodes
- **Code 128**: Industrial barcodes
- **QR Codes**: 2D barcodes (basic detection)
- **Manual Data**: Any alphanumeric string

## Examples

### Sample Barcode Outcomes
- `123456789`: Might generate "Scanbot the Robot" with blue-silver coloring
- `ABCDEF123`: Could create "Codehex the Trickster" with purple-gold features  
- `987654321`: May produce "Datamorph the Ghost" with translucent green appearance

### Persona Distribution
Barcode data influences persona selection:
- **Robot**: Tech-themed barcodes (product codes with lots of digits)
- **Ghost**: Sparse or pattern-heavy barcodes
- **Cat**: Barcodes with alternating patterns
- **Human Types**: Standard barcodes default to Bruiser, Doctor, Trickster, or Sicko

## Privacy & Security

### Local Storage Only
- Barcode data is processed locally in your browser
- No data is sent to external servers
- Saved opponents are stored in browser localStorage

### Camera Permissions
- Camera access is requested only when scanning
- Permission can be denied - manual input remains available
- No images or video are stored or transmitted

## Troubleshooting

### Camera Issues
- **"Camera not available"**: Check browser permissions or use manual input
- **Scanner not detecting**: Ensure good lighting and clear barcode visibility
- **Permission denied**: Use "MANUAL INPUT" option instead

### Manual Input Tips
- Enter any alphanumeric string (letters and numbers)
- Longer strings provide more unique characteristics
- Product codes, serial numbers, or even random text work fine

## Advanced Features

### Saved Opponents Management
- View all saved opponents with creation dates
- Last used date tracking for automatic cleanup
- 20 opponent limit (oldest unused opponents are removed)

### Barcode Hash System
- Each opponent shows a shortened hash (e.g., "ABC123")
- Hash appears in opponent name as visual indicator
- Same hash always generates identical opponent

## Tips for Best Results

### Scanning Tips
1. **Good Lighting**: Ensure barcode is well-lit and clearly visible
2. **Steady Hold**: Keep camera steady while scanning
3. **Clean Barcodes**: Scan unblemished, clear barcodes for best detection

### Creative Uses
- Scan product barcodes for themed opponents (food items, books, etc.)
- Use library book barcodes for "scholarly" opponents
- Try different types of codes for variety

## Integration with Game Modes

### All Game Modes
- **Quick Start**: Scan opponents for immediate battles
- **Campaign**: Use scanned opponents in campaign progression
- **Tournament**: Include scanned opponents in tournament pools

### Future Enhancements
- Tournament modes with all-scanned opponents
- Barcode-based deck modifications
- Community sharing of interesting barcode opponents (planned)

---

*The barcode scanning feature adds a unique physical-to-digital element to VORTEKS, allowing players to bring real-world objects into their battles through their device's camera.*