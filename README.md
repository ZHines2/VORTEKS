# VORTEKS
Unicode Minimal Card Battler

A modular, browser-based tactical card game built with vanilla JavaScript ES6 modules. Battle AI opponents with unique personas using strategic card combinations, energy management, and powerful quirks in a retro Unicode aesthetic.

## 🎮 Current Game State Summary

**VORTEKS v2.4** features a complete card battler experience with 20 unique cards, 5 AI personas, 8 unlockable quirks, 20 color flavor themes, sophisticated mechanics, enhanced ghost opponents, and extensive polish. Comprehensive automated test suite ensures rock-solid gameplay reliability.

## 🏗️ Project Structure

```
./
├── index.html              # Main game interface (modular architecture)
├── index-original.html     # Legacy monolithic version (reference)
├── favicon.svg             # Minimal SVG favicon (eliminates console 404 noise)
├── VORTEKS.mp3             # Background music (4.2MB orchestral theme)
├── vortexicon.png          # Game logo/icon (869KB pixel art)
├── styles/
│   └── main.css            # Complete game styling and animations
├── data/
│   ├── icons.js            # Game icons and Unicode symbols
│   └── cards.js            # 27 total cards: 22 base game + 5 maze explorer (isolated architectures)
└── src/
    ├── main.js             # App bootstrap and DOM integration (692 lines)
    ├── game.js             # Core game logic and state management (881 lines)
    ├── metroidvania.js     # Maze Explorer mode with isolated card system
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

## 📊 Feature Completion Status

### Core Systems - 100% Complete ✅
- **Card Battle Engine**: Fully implemented with all mechanics working
- **AI Opponent System**: 5 distinct personas with unique strategies
- **Energy & Resource Management**: Complete with uncapping and status effects
- **Turn-Based Combat**: Robust state management and win conditions

### Content Systems - 100% Complete ✅
- **Base Game Cards**: 22/22 planned cards implemented (100%) with architectural protection
- **Maze Explorer Cards**: 5/5 maze cards with proper 'maze' prefix isolation (100%)
- **Unlock Progression**: All achievement and unlock systems functional (100%)
- **Quirk System**: 8 quirks with diverse gameplay modifications (100%)
- **AI Personas**: Complete with procedural face generation and ghost variations (100%)
- **Color Flavor System**: 20 unique UI themes with diverse unlock requirements (100%)
- **Architectural Separation**: Complete isolation between base game and maze systems (100%)

### Polish & UX - 95% Complete ✅
- **UI/UX Design**: Clean Unicode aesthetic with responsive design (98%)
- **Audio Integration**: Background music with controls (100%)
- **Persistence**: localStorage for unlocks and settings (100%)
- **Debugging Tools**: Full-screen debug console with testing suite (100%)
- **Documentation**: Comprehensive guides and technical docs (90%)

### Advanced Features - 90% Complete ✅
- **Telemetry System**: Analytics and usage tracking (100%)
- **Leaderboard Integration**: JSONBin.io global rankings (90%)
- **VORTEK Companion**: Virtual pet system with evolution (90%)
- **Campaign Mode**: Structured progression system (85%)

### Experimental Features - 70% Complete 🟡
- **Multiplayer Foundation**: Architecture prepared but not implemented (20%)
- **Visual Effects**: Extensive animations with sophisticated keyframes and effects (80%)
- **Sound Design**: Background music only, card effects pending (30%)
- **Mobile Optimization**: Functional with comprehensive responsive design (85%)

*Note: Multiplayer Foundation reduced from 40% to 20% upon inspection - while game architecture is modular, no specific multiplayer networking code was found.*

**Overall Completion**: ~92% - Fully playable and shippable with extensive content and polish

### 📈 Recent Percentage Updates (Based on Comprehensive Testing)

**Evidence-based corrections from live functionality testing:**

- **Polish & UX**: 90% → 95% (UI highly polished, mobile optimization better than claimed)
- **Advanced Features**: 80% → 90% (VORTEK Companion fully functional, Telemetry 100% complete)
- **Experimental Features**: 60% → 70% (Visual effects have 25+ sophisticated animations, not "basic")
- **Overall**: ~88% → ~92% (Multiple systems more complete than originally documented)

**Key findings**: VORTEK Companion system includes complete stats, personality traits, evolution mechanics, and interactive features. Visual effects include extensive CSS animations with fog layers, particle-like effects, and card-specific animations. Mobile optimization includes proper viewport meta tags and comprehensive responsive CSS.

## ✨ Core Features

### Dual Game Architecture ⚠️
**VORTEKS features two completely separate game systems:**

- **Base Game System**: Standard card battles (22 core cards) using regular energy
- **Maze Explorer System**: Metroidvania exploration (5 maze cards) using ghïs energy  

**⚠️ CRITICAL ARCHITECTURAL SEPARATION**: These systems are intentionally isolated to prevent cross-contamination during development. Maze cards use 'maze' prefixes (mazehope, mazezap, etc.) to ensure complete separation from base game mechanics.

### Card Battle System (Base Game)
- **22 Unique Cards**: From basic Strike/Guard to advanced Reconsider/Droid Protocol, plus special Wallop/Overload/Ferriglobin/Impervious/Reap
- **3 Card Types**: Attack, Skill, and Power cards with distinct mechanics
- **Energy Management**: Strategic resource allocation each turn (🔆)
- **Advanced Mechanics**: Pierce damage, burn stacks, echo effects, energy uncapping, life costs, immunity effects, mutual damage
- **Status Effects**: Shields, healing, freeze, and next-turn modifiers

### AI Opponents & Personas
- **5 Distinct Personas**: Doctor (healing), Bruiser (aggro), Trickster (tempo), Cat (balanced), Robot (control)
- **Procedural Faces**: 790-line face generator creates unique opponent appearances
- **Smart AI**: Context-aware decision making based on persona and deck composition
- **Persona-Based Decks**: Each AI builds specialized decks matching their strategic focus

### Progressive Unlock System
- **Achievement-Based Cards**: 13 cards unlocked via specific gameplay achievements
- **Persona Defeats**: Special cards unlocked by defeating Cat, Robot, Doctor, Bruiser, and Ghost opponents
- **Debug Menu Exclusives**: Ultra-rare Impervious card unlocked only through debug access
- **Quirk Unlocks**: 8 gameplay-modifying quirks earned through skilled play
- **Echo Usage Tracking**: Overload card unlocked after using Echo 10+ times
- **Progress Tracking**: Detailed progress hints and achievement monitoring
- **Color Flavor Unlocks**: 20 unique UI themes unlocked through diverse gameplay achievements

### Color Flavor System
- **20 Unique Themes**: From Origin (default purple) to Neon (cyberpunk) and Shadow (monochrome)
- **Diverse Unlock Requirements**: Win streaks, persona defeats, specific card usage, perfect games, and unique challenges
- **Thematic Color Palettes**: Each flavor reflects its name with carefully chosen color schemes
- **Persistent Selection**: Your chosen flavor persists across sessions
- **Visual Preview**: Live color swatches show each theme's palette before selection
- **Achievement Integration**: Flavor unlocks tied to existing and new gameplay milestones

### UX & Polish Features
- **Start Screen Enhancement**: 75% dim overlay, multi-layer fog effects, text shadows
- **42 Dynamic Mottos**: Mix of gaming memes and VORTEKS-specific in-jokes
- **Defeated Opponents History**: Track and review all conquered opponents with dates
- **Quirk Persistence**: Selected quirks survive page reloads until explicitly reset
- **Enhanced Logging**: Actual opponent names in combat log (e.g., "[Gronky the Trickster] hits for 3")
- **Deck Builder Progression**: All cards visible with unlock hints for locked content, improving discoverability
- **Accessibility**: Motion-sensitive user support, comprehensive ARIA labels

### Quality Assurance
- **Comprehensive Testing**: Automated test suite covering all major mechanics
- **Debug Console**: Full-screen debug panel with testing tools and controls
- **Defensive Programming**: Type checking for logging system prevents runtime errors
- **Enhanced Edge Case Detection**: Advanced monitoring for game state anomalies
- **Cross-Browser Compatibility**: Vanilla ES6 modules work in all modern browsers

#### Enhanced Edge Case Monitoring
The game includes sophisticated edge case detection that monitors for:
- **Energy Management**: Overflow (>15 energy) and underflow (<0 energy) detection
- **Game State Validation**: Impossible states like negative HP or excessive healing
- **Card Interaction Monitoring**: Echo/Overload chain detection and loop prevention
- **AI Behavior Analysis**: Decision timeout and anomaly detection
- **Performance Tracking**: Rapid state changes and system stress monitoring

Edge cases are automatically categorized by severity (high/medium/low) and tracked for analysis, enabling proactive game balance and stability improvements.

## 🏗️ Architectural Guidelines

### ⚠️ CRITICAL: Maintaining System Separation

**VORTEKS uses a dual-architecture design that MUST be preserved:**

#### **Base Game System** (Primary)
- **Location**: `src/game.js`, `src/main.js`, standard UI
- **Cards**: 22 core cards with standard IDs (heart, swords, shield, etc.)
- **Energy**: Regular energy system (3-6 energy per turn)
- **Purpose**: Core card battle experience, AI opponents, multiplayer

#### **Maze Explorer System** (Isolated)  
- **Location**: `src/metroidvania.js` 
- **Cards**: 5 maze cards with 'maze' prefix (mazehope, mazezap, mazeignite, mazesurge, mazepierce)
- **Energy**: Ghïs energy system (separate from regular energy)
- **Purpose**: Metroidvania exploration, collection mechanics

### 🚨 Development Rules
1. **NEVER** create cards with duplicate IDs between systems
2. **ALWAYS** use 'maze' prefix for new maze explorer cards
3. **NEVER** modify base game cards for maze mode compatibility
4. **ALWAYS** test both systems separately after changes
5. **NEVER** import maze cards into base game systems or vice versa

### 🔧 Adding New Cards
- **Base Game**: Use standard IDs, add to main card pool, test with AI opponents
- **Maze Mode**: Use 'maze' prefix, add to maze card pool, test in metroidvania.js

This separation prevents "unnecessary recursion" and cross-contamination between game modes.

## 🎯 How to Play

### Quick Start
1. Open `index.html` in a modern web browser (or serve via static server for best experience)
2. Choose **QUICK START** for immediate action or **BUILD DECK** for customization
3. Select a quirk that matches your playstyle
4. Use the 🎨 **Flavors** button to change color themes (unlock more through gameplay)
5. Use energy (🔆) to play cards strategically
6. Balance offense, defense, and card draw to defeat AI opponents
7. Build win streaks to unlock advanced cards, quirks, and flavor themes

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

## 🎨 Color Flavor Master List

### Flavor Themes & Unlock Requirements

| Flavor | Colors | Unlock Requirement |
|--------|---------|-------------------|
| **Origin** | Purple depths, golden borders, cyan accents | *Always unlocked (default theme)* |
| **Crimson** | Blood red, iron gray, warm highlights | Win 3 battles using life-cost cards (Wallop/Presto) |
| **Azure** | Deep ocean blues, crystal clarity | Defeat any Robot opponent |
| **Verdant** | Living green, earth tones | Use Echo 5 times in a single battle and win |
| **Amber** | Warm orange glow, burnished copper | Win a battle with 15+ energy in a single turn |
| **Violet** | Rich purples, magenta highlights | Defeat any Trickster opponent |
| **Frost** | Ice blues, silver gleam | Use Freeze 3 times in a single battle and win |
| **Shadow** | Darkness, steel gray, monochrome | Win 5 battles with perfect health (no damage taken) |
| **Solar** | Brilliant gold, sunfire yellow | Use Focus 4 times in a single turn |
| **Ocean** | Deep teal, seafoam green | Defeat any Doctor opponent |
| **Rose** | Soft pinks, cherry blossoms | Defeat any Cat opponent |
| **Copper** | Bronze patina, ancient metals | Win a 10-win streak |
| **Neon** | Electric cyan, hot pink, cyberpunk | Use Reap successfully and win the battle |
| **Forest** | Deep woodland green, moss tones | Win 15 total battles |
| **Sunset** | Warm orange, gentle pink | Defeat any Bruiser opponent |
| **Midnight** | Dark navy, starlight blues | Defeat any Ghost opponent |
| **Cherry** | Rich red-pink, burgundy | Use burn effects to deal 20+ total damage in one battle |
| **Sage** | Muted gray-green, silver | Win a battle using only skill cards (no attacks or powers) |
| **Ember** | Glowing red-orange, charcoal | Deal 30+ damage in a single turn |
| **Lunar** | Silver-blue, moonbeam white | Win 25 total battles |

### Theme Categories
- **Persona-Based**: Azure, Violet, Ocean, Rose, Sunset, Midnight (defeat specific opponents)
- **Combat Achievement**: Crimson, Shadow, Cherry, Ember (combat prowess challenges)  
- **Card Mastery**: Verdant, Frost, Solar, Neon, Sage (specific card usage patterns)
- **Progression**: Copper, Forest, Lunar (win milestone achievements)
- **Energy Management**: Amber (resource management skill)

*Each flavor completely transforms the game's visual aesthetic while maintaining perfect readability and UI consistency.*

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

## 📡 JSONBin: Local Testing

The game supports JSONBin.io for global leaderboard functionality. To test locally:

### Setup JSONBin Account
1. Sign up for a free account at [jsonbin.io](https://jsonbin.io)
2. Create a new private bin in your dashboard
3. Copy your BIN_ID from the bin URL (e.g., `https://jsonbin.io/12345abcd` → BIN_ID is `12345abcd`)
4. Get your MASTER_KEY from the API Keys section

### Local Testing Configuration
**Option 1: Browser Console (Quick Testing)**
```javascript
// Set these in your browser console before playing:
window.JSONBIN_BIN_ID = 'your-bin-id-here';
window.JSONBIN_MASTER_KEY = 'your-master-key-here';

// Then initialize the leaderboard:
initializeLeaderboard();
```

**Option 2: Runtime Configuration**
```javascript
// Configure via the helper function:
configureJSONBin({
  binId: 'your-bin-id-here',
  masterKey: 'your-master-key-here'
});

// Initialize the leaderboard:
initializeLeaderboard();
```

### Quick public-read test bin
If you just want to test leaderboard reads without a master key, use the public test BIN_ID configured in the code: `689f8e49d0ea881f405a220d`. This bin is public-read so you can verify leaderboard reads from any browser. Do NOT commit or share any master keys; for writes use a server-side proxy or set window.JSONBIN_MASTER_KEY locally for dev testing only.

### JSONBin Data Schema
The leaderboard uses the following JSON structure in the bin:

```json
{
  "leaderboard": [
    {
      "playerId": "uuid-v4-or-custom-id",
      "nickname": "YourNick",
      "timestamp": 1692123456789,
      "stats": {
        "totalWins": 3,
        "winStreak": 1,
        "perfectWins": 0,
        "quickWins": 0,
        "winRate": 75.0,
        "totalGames": 4
      }
    }
  ]
}
```

**Entry Schema Details:**
- `playerId`: Unique identifier (UUID v4 format recommended)
- `nickname`: Player display name (max 20 characters, sanitized)
- `timestamp`: Unix timestamp in milliseconds for entry creation/update
- `stats`: Object containing player statistics
  - `totalWins`: Total number of games won
  - `winStreak`: Current consecutive wins
  - `perfectWins`: Wins achieved with full HP
  - `quickWins`: Wins achieved in few turns
  - `winRate`: Win percentage (0-100)
  - `totalGames`: Total games played

**Initial Bin Setup:**
To seed a new public bin, create it with this minimal structure:

```json
{ "leaderboard": [] }
```

### Testing Steps
1. Configure JSONBin credentials as shown above
2. Set up a player profile with nickname and enable stat sharing
3. Play some games to generate analytics data
4. Test the leaderboard functions:
   ```javascript
   // Submit current stats to leaderboard
   submitToLeaderboard(getAnalytics());
   
   // Sync with JSONBin
   syncLeaderboard();
   ```
5. Open the game in another browser/incognito window with the same BIN_ID to verify cross-browser functionality

### Testing Writes Locally
To test write functionality (submitting scores), you need a master key:

```javascript
// In browser console for local testing only:
window.JSONBIN_MASTER_KEY = 'your-master-key-here';

// Or use the configuration helper:
configureJSONBin({
  binId: 'your-bin-id-here',
  masterKey: 'your-master-key-here'
});
```

**Important**: The public test bin (`689f8e49d0ea881f405a220d`) is read-only. For write testing, create your own private bin with a master key.

### Security Notes
- **Never commit your MASTER_KEY to version control**
- For production deployment, implement a serverless proxy (Vercel, Netlify Functions, etc.) to handle JSONBin authentication server-side
- Move data validation and sanitization to the server side for production use
- Consider rate limiting and abuse protection for production deployments

### Fallback Behavior
- If JSONBin is not configured, the game automatically falls back to localStorage-only mode
- All existing functionality continues to work without JSONBin
- Players can still use local leaderboards and profile features

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

### v2.4 - Color Flavor System & Enhanced Content
- **Color Flavor System**: 20 unique UI themes with diverse unlock requirements
- **Reap Card Added**: High-risk mutual damage card unlocked by defeating ghost opponents
- **Enhanced Ghost Opponents**: Increased frequency (12%), rich visual variations, strategic AI
- **Reconsider Rebalance**: Fixed cost to 3 energy (previously consumed all energy)
- **Complete Documentation**: Updated README with Reap card and comprehensive flavor system guide
- **Flavor Debug Tools**: Full debug panel integration for testing and development
- **CRITICAL ARCHITECTURAL SEPARATION**: Complete isolation between base game (22 cards) and maze explorer (5 cards) systems
- **Maze Card Standardization**: All maze cards now use 'maze' prefix to prevent conflicts with base game

### v2.3 - Strategic Depth & Debug Tools
- **Echo/Overload Rework**: Echo reverted to repeat LAST card, new Overload card repeats NEXT card
- **Strategic Differentiation**: Two distinct playstyles for card repetition mechanics
- **Ferriglobin Unlock**: Campaign booster level 5 requirement for health-to-shield conversion card
- **Impervious Card**: Debug-exclusive immunity card providing complete damage protection
- **Full Debug Console**: Comprehensive testing interface replacing modal with extensive controls
- **Telemetry Integration**: Echo usage tracking for Overload unlock progression

### v2.2 - Deck Builder UX Enhancement
- **Locked Cards Visibility**: Deck builder now shows all cards (both unlocked and locked) to improve progression clarity
- **Unlock Hints**: Locked cards display grayed-out with unlock requirements and progress indicators
- **Visual Polish**: Locked cards feature reduced opacity, grayscale filter, and prominent "LOCKED" badges
- **Improved Discoverability**: Players can now see all available content and understand how to unlock it

### v2.1 - Bug Fixes & New Content
- **Zap Infinite Loop Fix**: Resolved critical issue where Zap could create infinite loops when last card in deck
- **New Wallop Card**: Added bruiser-themed attack card (2🔆, 4 damage, costs 2 life)
- **Life Cost Mechanic**: Introduced cards that cost health in addition to energy
- **Unlock System Expansion**: Added Wallop unlock for defeating any Bruiser opponent
- **Improved Unlock Descriptions**: Clarified Droid Protocol unlock requirements

### v2.0 - UX & Stability Overhaul
- **Start Screen Polish**: Enhanced visual design with improved contrast and effects
- **Logging System Fixes**: Resolved runtime errors with defensive type checking
- **Quirk Persistence**: localStorage-based quirk selection persistence
- **Defeated Opponents Tracking**: Complete history system with modal interface
- **Card Unlock Improvements**: Fixed curiosity unlock to trigger on any cat defeat
- **Enhanced Content**: 50+ new mottos and expanded in-game personality

## 🔮 Future Expansion Potential

The modular architecture supports extensive future development including new card mechanics, additional personas, campaign modes, multiplayer features, and visual/audio enhancements.

### 🗡️ Maze Explorer Mode (Metroidvania System)

**VORTEKS includes a complete Metroidvania exploration mode with its own card system:**

#### **Architectural Separation**
- **Separate Energy System**: Uses ghïs energy instead of regular energy
- **Separate Card Set**: 5 maze cards (mazehope, mazezap, mazeignite, mazesurge, mazepierce) 
- **Separate Mechanics**: Collection-based scaling instead of turn-based effects
- **Isolated Development**: Updates to maze mode cannot affect base game stability

#### **Maze Exploration Features**
- **Procedural Maze Generation**: Large 50x50 hedge maze with cellular automata
- **Card Collection System**: Defeat enemies to discover new abilities
- **Scaling Mechanics**: Cards become more powerful based on collection count
- **Judge NPC**: Guides player introduction with philosophical dialogue
- **Battle System**: Strategic combat using collected card abilities

### 🔮 Future Expansion Potential

The modular architecture supports extensive future development including new card mechanics, additional personas, campaign modes, multiplayer features, and visual/audio enhancements.

#### **Expansion Ideas**

#### **Card-as-Ability System**
- **Equipment Cards**: Transform current attack/defense cards into collectible equipment
- **Skill Trees**: Cards become abilities unlocked through exploration and progression
- **Rarity Tiers**: Common, Rare, Epic, and Legendary card discoveries in different areas
- **Combo Mechanics**: Echo/Overload chains could trigger environmental interactions

#### **Exploration Mechanics**
- **Room-Based Encounters**: Each room requires tactical card play to progress
- **Environmental Puzzles**: Use specific card combinations to unlock passages
- **Resource Management**: Energy becomes a limited exploration resource
- **Checkpoint System**: Save progress at discovered shrines or campfires

#### **Progression & Discovery**
- **Card Fragments**: Find pieces of powerful cards scattered throughout the world
- **Quirk Shrines**: Discover and activate quirks at special locations
- **Boss Encounters**: Current AI personas become unique area bosses with signature decks
- **Deck Evolution**: Starting deck grows through exploration and discovery

#### **Narrative Integration**
- **Card Lore**: Each discovered card reveals world history and character backstories
- **Environmental Storytelling**: Visual clues hint at optimal card strategies for areas
- **Character Progression**: Companion creatures evolve based on playstyle and discoveries
- **Multiple Endings**: Different card collection paths lead to varied conclusions

#### **Technical Adaptations**
- **Spatial Deck Building**: Cards have location requirements and environmental synergies
- **Real-time Elements**: Some cards could have cooldowns or timing-based effects
- **Map Integration**: Visual dungeon maps show card discovery progress
- **Atmospheric Audio**: Dynamic music responds to current deck composition and threats

The existing campaign mode, card unlock system, and telemetry tracking provide a strong foundation for this evolution, requiring primarily UI/UX adaptations rather than core mechanical overhauls.

---

**VORTEKS** - *Where strategy meets the void, and every decision echoes through the digital realm.*