# VORTEKS
Unicode Minimal Card Battler - **Now Available as Mobile App!**

A modular, browser-based tactical card game built with vanilla JavaScript ES6 modules. Battle AI opponents with unique personas using strategic card combinations, energy management, and powerful quirks in a retro Unicode aesthetic.

**🚀 NEW: Mobile App for iOS and Android!** - Ready for App Store submission with Capacitor hybrid app framework.

## 🎮 Current Game State Summary

**VORTEKS v2.0** features a complete card battler experience with 13 unique cards, 5 AI personas, 7 unlockable quirks, sophisticated mechanics, and extensive polish. All 34 automated tests pass, ensuring rock-solid gameplay reliability.

## 📱 Mobile App Features

- **iOS App Store Ready**: Complete Xcode project with proper app icons and launch screens
- **Google Play Store Ready**: Android Studio project with signed APK/AAB build support  
- **PWA Capabilities**: Progressive Web App features for installable web experience
- **Touch Optimized**: Mobile-friendly UI with proper touch targets and gestures
- **Offline Play**: No internet connection required - perfect for mobile gaming
- **Cross-Platform**: Same codebase runs on web, iOS, and Android

## 🏗️ Project Structure

```
./
├── index.html              # Main game interface (modular architecture)
├── index-original.html     # Legacy monolithic version (reference)
├── VORTEKS.mp3             # Background music (4.2MB orchestral theme)
├── vortexicon.png          # Game logo/icon (869KB pixel art)
├── styles/
│   └── main.css            # Complete game styling and animations
├── data/
│   ├── icons.js            # Game icons and Unicode symbols
│   └── cards.js            # 13 card definitions with full metadata
└── src/
    ├── main.js             # App bootstrap and DOM integration (692 lines)
    ├── game.js             # Core game logic and state management (881 lines)
    ├── card-unlock.js      # Progressive unlock system (569 lines)
    ├── face-generator.js   # Procedural opponent face generation (790 lines)
    ├── ai.js               # AI opponent logic and persona decks (120 lines)
    ├── ui.js               # UI rendering and visual effects (188 lines)
    ├── deck-builder.js     # Interactive deck building (104 lines)
    ├── player.js           # Player creation and management (78 lines)
    ├── tests.js            # Comprehensive self-test suite (346 lines)
    ├── mottos.js           # 42 dynamic start screen mottos (42 lines)
    ├── config.js           # Game configuration and constants (36 lines)
    └── utils.js            # Utility functions (15 lines)
```

## ✨ Core Features

### Card Battle System
- **13 Unique Cards**: From basic Strike/Guard to advanced Reconsider/Droid Protocol
- **3 Card Types**: Attack, Skill, and Power cards with distinct mechanics
- **Energy Management**: Strategic resource allocation each turn
- **Advanced Mechanics**: Pierce damage, burn stacks, echo effects, energy uncapping
- **Status Effects**: Shields, healing, freeze, and next-turn modifiers

### AI Opponents & Personas
- **5 Distinct Personas**: Doctor (healing), Bruiser (aggro), Trickster (tempo), Cat (balanced), Robot (control)
- **Procedural Faces**: 790-line face generator creates unique opponent appearances
- **Smart AI**: Context-aware decision making based on persona and deck composition
- **Persona-Based Decks**: Each AI builds specialized decks matching their strategic focus

### Progressive Unlock System
- **Achievement-Based Cards**: 7 cards unlocked via specific gameplay achievements
- **Persona Defeats**: Special cards unlocked by defeating Cat and Robot opponents
- **Quirk Unlocks**: 7 gameplay-modifying quirks earned through skilled play
- **Progress Tracking**: Detailed progress hints and achievement monitoring

### UX & Polish Features
- **Start Screen Enhancement**: 75% dim overlay, multi-layer fog effects, text shadows
- **42 Dynamic Mottos**: Mix of gaming memes and VORTEKS-specific in-jokes
- **Defeated Opponents History**: Track and review all conquered opponents with dates
- **Quirk Persistence**: Selected quirks survive page reloads until explicitly reset
- **Enhanced Logging**: Actual opponent names in combat log (e.g., "[Gronky the Trickster] hits for 3")
- **Accessibility**: Motion-sensitive user support, comprehensive ARIA labels

### Quality Assurance
- **34 Automated Tests**: Comprehensive test suite covering all major mechanics
- **Defensive Programming**: Type checking for logging system prevents runtime errors
- **Edge Case Handling**: Proper state management for complex card interactions
- **Cross-Browser Compatibility**: Vanilla ES6 modules work in all modern browsers

## 🎯 How to Play

### Quick Start
1. Open `index.html` in a modern web browser (or serve via static server for best experience)
2. Choose **QUICK START** for immediate action or **BUILD DECK** for customization
3. Select a quirk that matches your playstyle
4. Use energy (⚡) to play cards strategically
5. Balance offense, defense, and card draw to defeat AI opponents
6. Build win streaks to unlock advanced cards and quirks

### Game Mechanics
- **Energy System**: Start with 3 energy, gain 1 per turn (max 6, or more with quirks)
- **Health & Shields**: 20 HP base, shields absorb damage before health
- **Win Conditions**: Reduce opponent's HP to 0 while surviving their assault
- **Deck Management**: 20-card decks with max 4 copies of any single card

### Advanced Strategy
- **Card Synergies**: Combine different card types for maximum effect
- **Energy Banking**: Save energy for powerful multi-card turns
- **Shield Stacking**: Build defensive walls while setting up combos
- **Burn Tactics**: Apply damage-over-time for consistent pressure

## 🚀 Technical Features

### Modern Architecture
- **ES6 Modules**: Clean separation of concerns, no build step required
- **Vanilla JavaScript**: Zero dependencies, fast loading, future-proof
- **localStorage Integration**: Persistent unlocks, settings, and progress
- **Event-Driven Design**: Extensible systems for cards, achievements, and UI

### Performance
- **Lightweight**: ~4MB total (mostly music and logo), sub-second load times
- **Memory Efficient**: Smart object pooling and cleanup
- **Responsive Design**: Adapts to various screen sizes and devices

## 🔧 Installation & Setup

### Browser Play (Recommended)
```bash
# Option 1: Direct file opening
open index.html

# Option 2: Local server (for full functionality)
python3 -m http.server 8080
# Then visit http://localhost:8080
```

### Mobile App Development
```bash
# Install dependencies
npm install

# Build and sync web assets to mobile platforms
npm run sync

# Run on iOS simulator (requires macOS + Xcode)
npm run ios

# Run on Android emulator (requires Android Studio)
npm run android

# Open native projects for app store builds
npx cap open ios     # Opens Xcode project
npx cap open android # Opens Android Studio project
```

### App Store Submission
See [APP_STORE_GUIDE.md](APP_STORE_GUIDE.md) for complete instructions on building and submitting to iOS App Store and Google Play Store.

### Development
```bash
# No build step needed - edit files directly
# All source files are in src/
# Styles in styles/main.css
# Data in data/ directory
```

## 🧪 Testing & Debugging

The game includes a comprehensive self-test suite accessible via the **DEBUG** button on the start screen. All 34 tests validate:

- Core game mechanics (energy, health, shields)
- Card interactions and edge cases
- AI behavior and deck building
- Unlock system functionality
- State management and persistence

## 🎨 Customization

### Adding New Cards
1. Define card in `data/cards.js` with full metadata
2. Add unlock conditions in `src/card-unlock.js` (if needed)
3. Update AI deck building in `src/ai.js` for AI usage
4. Test with the debug suite

### Creating New Quirks
1. Add quirk metadata to `src/card-unlock.js`
2. Implement effect in game logic (`src/game.js`)
3. Add unlock achievement conditions
4. Update UI descriptions

### Customizing Personas
1. Modify persona generation in `src/face-generator.js`
2. Adjust deck building strategies in `src/ai.js`
3. Add new unlock requirements in `src/card-unlock.js`

## 📝 Recent Major Updates

### v2.0 - UX & Stability Overhaul
- **Start Screen Polish**: Enhanced visual design with improved contrast and effects
- **Logging System Fixes**: Resolved runtime errors with defensive type checking
- **Quirk Persistence**: localStorage-based quirk selection persistence
- **Defeated Opponents Tracking**: Complete history system with modal interface
- **Card Unlock Improvements**: Fixed curiosity unlock to trigger on any cat defeat
- **Enhanced Content**: 50+ new mottos and expanded in-game personality

## 🔮 Future Expansion Potential

The modular architecture supports extensive future development including new card mechanics, additional personas, campaign modes, multiplayer features, and visual/audio enhancements.

---

**VORTEKS** - *Where strategy meets the void, and every decision echoes through the digital realm.*