# VORTEKS Architecture Documentation

## 🏗️ Dual System Architecture

VORTEKS implements a **dual-architecture design** with two completely separate game systems that must remain isolated to prevent cross-contamination and "unnecessary recursion."

### System Overview

```
VORTEKS
├── Base Game System (Primary)
│   ├── Energy: Regular energy (3-6 per turn)
│   ├── Cards: 22 core cards (heart, swords, shield, etc.)
│   ├── Mechanics: Turn-based combat, AI opponents
│   └── Files: game.js, main.js, ui.js, ai.js
└── Maze Explorer System (Isolated)
    ├── Energy: Ghïs energy (collection-based)
    ├── Cards: 5 maze cards (mazehope, mazezap, etc.)
    ├── Mechanics: Exploration, scaling collection
    └── Files: metroidvania.js
```

## 🚨 Critical Separation Rules

### 1. Card ID Isolation
**NEVER create duplicate IDs between systems**

```javascript
// ❌ WRONG - Creates conflicts
{ id: 'hope', ... }     // Base game
{ id: 'hope', ... }     // Maze - CONFLICT!

// ✅ CORRECT - Proper separation  
{ id: 'hope', ... }     // Base game
{ id: 'mazehope', ... } // Maze - isolated
```

### 2. Import/Reference Rules
**NEVER cross-reference between systems**

```javascript
// ❌ WRONG - Cross-contamination
import { MAZE_CARDS } from './metroidvania.js'; // In game.js
const card = CARDS.find(c => c.id === 'hope'); // In metroidvania.js referencing base card

// ✅ CORRECT - Proper isolation
// metroidvania.js only references maze cards
// game.js only references base cards
```

### 3. Naming Conventions
- **Base Game Cards**: Standard IDs (`heart`, `swords`, `shield`, etc.)
- **Maze Cards**: Always use `maze` prefix (`mazehope`, `mazezap`, `mazeignite`, etc.)

## 📁 File Responsibilities

### Base Game System Files
- `src/game.js` - Core battle mechanics, regular energy system
- `src/main.js` - UI integration for standard card battles  
- `src/ai.js` - AI opponents using base game cards only
- `src/ui.js` - UI rendering for base game mechanics
- `data/cards.js` - Contains both systems but clearly separated

### Maze Explorer System Files
- `src/metroidvania.js` - Complete maze exploration system
- Self-contained ghïs energy system
- Self-contained maze card mechanics
- No dependencies on base game logic

## 🔧 Development Workflows

### Adding Base Game Cards
1. Add card definition to `data/cards.js` (base game section)
2. Use standard ID (no 'maze' prefix)
3. Add to unlock system in `card-unlock.js`
4. Update AI decks in `ai.js` if applicable
5. Test with base game combat system

### Adding Maze Cards  
1. Add card definition to `data/cards.js` (maze section)
2. **ALWAYS** use 'maze' prefix in ID
3. Add mechanics to `metroidvania.js`
4. Add to maze loot generation
5. Test in maze exploration mode ONLY

### Modifying Existing Cards
- **Base Cards**: Only modify in base game context
- **Maze Cards**: Only modify in maze context
- **NEVER** change a card to work in both systems

## 🧪 Testing Guidelines

### Before Any Card Changes
1. Run base game self-tests: `debug panel → run tests`
2. Test maze exploration: launch metroidvania mode
3. Verify no ID conflicts in card database
4. Ensure proper separation is maintained

### After Changes
1. Re-run all base game tests
2. Test affected game mode thoroughly  
3. Verify other system remains unaffected
4. Check for any new ID conflicts

## 🚨 Common Pitfalls

### 1. "Fixing" Cards Across Systems
```javascript
// ❌ WRONG - Attempting to unify systems
if (gameMode === 'maze') {
  // Different behavior for maze
} else {
  // Base game behavior  
}

// ✅ CORRECT - Keep systems separate
// Separate cards for separate systems
```

### 2. Sharing Mechanics
```javascript
// ❌ WRONG - Shared energy systems
function useEnergy(amount, type) {
  if (type === 'ghis') { /* maze logic */ }
  else { /* base logic */ }
}

// ✅ CORRECT - Separate implementations
// Base game: energy handled in game.js
// Maze: ghïs handled in metroidvania.js
```

### 3. Mixed Card References
```javascript
// ❌ WRONG - Mixed references
const allCards = [...BASE_CARDS, ...MAZE_CARDS];

// ✅ CORRECT - Isolated references  
// Each system imports only its own cards
```

## 📋 Checklist for New Features

Before adding any card-related feature:

- [ ] Does this belong to base game or maze explorer?
- [ ] Are all card IDs unique across both systems?
- [ ] Does this create any cross-dependencies?
- [ ] Will this change affect the other system?
- [ ] Have I tested both systems after changes?
- [ ] Are proper prefixes used for maze cards?

## 🎯 Benefits of This Architecture

1. **Stability**: Changes to maze mode cannot break base game
2. **Scalability**: Each system can evolve independently
3. **Modularity**: Clear separation of concerns
4. **Testing**: Isolated testing reduces regression risk
5. **Maintenance**: Easier debugging and feature development

---

**Remember**: This architectural separation prevents "unnecessary recursion" and ensures long-term stability of both game systems.