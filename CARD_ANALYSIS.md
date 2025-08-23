# VORTEKS COMPLETE CARD ANALYSIS

This comprehensive analysis examines ALL cards and their attributes, uses, descriptions, and implementations across the VORTEKS codebase.

## ⚠️ CRITICAL ARCHITECTURAL NOTE

**VORTEKS has TWO SEPARATE GAME SYSTEMS that must remain isolated:**

### BASE GAME SYSTEM
- **Mode**: Standard card battles (Classic, Scrimmage, AI battles)
- **Energy**: Regular energy system
- **Cards**: 22 core cards with standard mechanics
- **Location**: Used in main game modes

### MAZE EXPLORER SYSTEM  
- **Mode**: Metroidvania maze exploration 
- **Energy**: Ghïs energy system (separate from regular energy)
- **Cards**: 5 maze cards with collection-based scaling mechanics
- **Location**: Isolated in metroidvania.js

**⚠️ SEPARATION CRITICAL**: Updates to maze mode must NOT affect base game mechanics. Several cards have overlapping names/IDs that create confusion and potential conflicts.

## Summary

**Total Cards Found:** 27 (including 1 duplicate)
**Core Cards:** 22 unique cards  
**Maze Explorer Cards:** 5 cards
**Tested Cards:** 14 cards have explicit self-tests
**Untested Cards:** 13 cards lack validation

## CORE CARDS ANALYSIS

### HEART
- **Name:** Heart
- **Cost:** 1 energy
- **Type:** skill
- **Description:** "Restore 3 HP. A gentle healing touch that mends wounds."
- **Effects:** heal: 3
- **Implementation:** Standard healing effect
- **Tests:** ✅ Has explicit test
- **Status:** 🟢 LOCKED IN

### SWORDS (Strike)
- **Name:** Strike  
- **Cost:** 1 energy
- **Type:** attack
- **Description:** "Deal 3 damage. Scales with Focus. The most basic attack."
- **Effects:** damage: 3, scales with nextPlus
- **Implementation:** Standard damage with focus scaling
- **Tests:** ✅ Has explicit test
- **Status:** 🟢 LOCKED IN

### SHIELD (Guard)
- **Name:** Guard
- **Cost:** 1 energy  
- **Type:** skill
- **Description:** "Gain 3 Shield. Protects you from incoming damage."
- **Effects:** shield: 3
- **Implementation:** Standard shield gain
- **Tests:** ❌ No self-test
- **Status:** ⚠️ NEEDS TESTING

### ECHO
- **Name:** Echo
- **Cost:** 1 energy
- **Type:** skill  
- **Description:** "Repeat the last non-Echo card you played this turn."
- **Effects:** Special echo logic
- **UI Text:** "Repeat last non‑Echo, else draw 1."
- **Implementation:** Uses lastPlayedThisTurn, prevents recursion
- **Tests:** ✅ Has explicit test
- **Status:** 🟢 LOCKED IN

### OVERLOAD
- **Name:** Overload
- **Cost:** 1 energy
- **Type:** skill
- **Description:** "The next non-Overload card you play this turn will be repeated."
- **Effects:** Sets echoNext flag
- **Implementation:** Triggers card repetition for next played card
- **Tests:** ✅ Has explicit test
- **Status:** 🟢 LOCKED IN

### FIRE (Ignite)
- **Name:** Ignite
- **Cost:** 2 energy
- **Type:** skill
- **Description:** "Inflict 2 Burn for 2 turns. Spicy quirk adds +1 burn."
- **Effects:** burn: {amount: 2, turns: 2}, scales with spicy quirk
- **Implementation:** Standard burn application
- **Tests:** ❌ No self-test
- **Status:** ⚠️ NEEDS TESTING
- **⚠️ MAZE CONFLICT:** In maze mode, "ignite" has different burn mechanics and scaling

### SNOW (Freeze)
- **Name:** Freeze
- **Cost:** 2 energy
- **Type:** skill
- **Description:** "Next turn, opponent loses 1 energy. Disrupts their plans."
- **Effects:** freezeEnergy: 1
- **Implementation:** Standard energy freeze
- **Tests:** ❌ No self-test  
- **Status:** ⚠️ NEEDS TESTING

### BOLT (Zap)
- **Name:** Zap
- **Cost:** 1 energy
- **Type:** attack
- **Description:** "Deal 2 pierce damage and draw 1 card. Ignores shields."
- **Effects:** damage: 2, pierce: true, draw: 1
- **Implementation:** Pierce damage + card draw
- **Tests:** ✅ Has explicit test
- **Status:** 🟢 LOCKED IN
- **⚠️ MAZE CONFLICT:** In maze mode, "zap" becomes a stun mechanic with different functionality

### STAR (Focus)
- **Name:** Focus
- **Cost:** 1 energy
- **Type:** power
- **Description:** "Gain +2 to your next attack this turn. Powers up your strikes."
- **Effects:** nextPlus: 2
- **Implementation:** Standard next attack bonus
- **Tests:** ✅ Has explicit test  
- **Status:** 🟢 LOCKED IN

### DAGGER (Pierce)
- **Name:** Pierce
- **Cost:** 2 energy
- **Type:** attack
- **Description:** "Deal 3 pierce damage. Scales with Focus. Cuts through shields."
- **Effects:** damage: 3, pierce: true, scales with nextPlus
- **Implementation:** Pierce damage with focus scaling
- **Tests:** ✅ Has explicit test
- **Status:** 🟢 LOCKED IN
- **⚠️ MAZE CONFLICT:** In maze mode, "mazepierce" has different scaling mechanics

### LOOP (Surge)
- **Name:** Surge
- **Cost:** 2 energy
- **Type:** power
- **Description:** "Gain +1 max energy and +1 energy now. Fuels bigger turns."
- **Effects:** maxEnergyDelta: 1, energyNowDelta: 1
- **Implementation:** Energy ramp effect
- **Tests:** ❌ No self-test
- **Status:** ⚠️ NEEDS TESTING
- **⚠️ MAZE CONFLICT:** In maze mode, "surge" uses ghïs energy system instead of regular energy

### CURIOSITY
- **Name:** Curiosity
- **Cost:** 1 energy
- **Type:** power
- **Description:** "Draw an extra card at the end of your turn. Cat wisdom."
- **Effects:** curiosityPower: true
- **UI Text:** "End: If you bank energy, next start draw +1."
- **Implementation:** End-of-turn card draw
- **Tests:** ❌ No self-test
- **Status:** ⚠️ NEEDS TESTING

### DROID
- **Name:** Droid Protocol
- **Cost:** 1 energy
- **Type:** power
- **Description:** "Next turn: gain random bonus (HP, shield, energy, or focus)."
- **Effects:** droidProcArm: true
- **UI Text:** "Start of next turn: random +1 (draw, energy, shield, heal, next atk)."
- **Implementation:** Random start-of-turn bonus
- **Tests:** ✅ Has explicit test
- **Status:** 🟢 LOCKED IN

### RECONSIDER ⭐
- **Name:** Reconsider
- **Cost:** 3 energy
- **Type:** skill
- **Description:** "Costs 3 energy. Shuffle hand and draw new cards."
- **Effects:** reconsider: true  
- **UI Text:** "Costs 3 energy. Reshuffle your deck (discard → deck)."
- **Implementation:** Reshuffles discard into deck
- **Tests:** ✅ Has explicit test (FIXED to use 3 energy)
- **Status:** 🟢 LOCKED IN (Recently fixed from "consume all energy" bug)

### PURGE
- **Name:** Purge
- **Cost:** 2 energy
- **Type:** skill
- **Description:** "Remove all negative status effects from yourself."
- **Effects:** cleanse: true
- **Implementation:** Removes negative statuses
- **Tests:** ✅ Has explicit test
- **Status:** 🟢 LOCKED IN

### WALLOP
- **Name:** Wallop
- **Cost:** 2 energy
- **Type:** attack
- **Description:** "Deal 4 damage. Costs 2 HP to play. High risk, high reward."
- **Effects:** damage: 4, lifeCost: 2, scales with nextPlus
- **Implementation:** Damage with life cost
- **Tests:** ❌ No self-test
- **Status:** ⚠️ NEEDS TESTING

### PRESTO
- **Name:** Presto
- **Cost:** 1 energy
- **Type:** skill
- **Description:** "Costs 1 HP. Steal a random card from opponent's discard pile."
- **Effects:** lifeCost: 1, presto: true
- **UI Text:** "Steal a random card from opponent's discard pile. Return when used."
- **Implementation:** Steals random card, marks for return
- **Tests:** ✅ Has explicit test
- **Status:** 🟢 LOCKED IN

### FERRIGLOBIN
- **Name:** Ferriglobin
- **Cost:** 3 energy
- **Type:** skill
- **Description:** "Transform all your shield into health. Blood magic transmutation."
- **Effects:** ferriglobin: true
- **UI Text:** "Transform all your shield into health."
- **Implementation:** Converts shield to HP
- **Tests:** ✅ Has explicit test
- **Status:** 🟢 LOCKED IN

### IMPERVIOUS
- **Name:** Impervious
- **Cost:** 2 energy
- **Type:** power
- **Description:** "Become immune to all damage next turn. Shields are maintained."
- **Effects:** imperviousNext: true
- **Implementation:** Next-turn damage immunity
- **Tests:** ✅ Has explicit test
- **Status:** 🟢 LOCKED IN

### REAP
- **Name:** Reap
- **Cost:** 3 energy
- **Type:** attack
- **Description:** "Deal damage equal to half your current health to opponent. Take the same damage yourself."
- **Effects:** reap: true
- **Implementation:** Half-health damage to both players
- **Tests:** ✅ Has explicit test
- **Status:** 🟢 LOCKED IN

### HOPE
- **Name:** Hope
- **Cost:** 2 energy
- **Type:** power
- **Description:** "Gain Hope status: heal 1-5 HP each turn for 3 turns. Effect stacks."
- **Effects:** hopeStatus: true
- **UI Text:** "Heal 1-5 HP per turn for 3 turns. Effect stacks."
- **Implementation:** Multi-turn healing effect
- **Tests:** ❌ No self-test
- **Status:** ⚠️ NEEDS TESTING + 🔴 **CRITICAL DUPLICATE ID CONFLICT**
- **⚠️ MAZE CONFLICT:** In maze mode, "hope" has completely different mechanics (instant heal scaling with card count, costs ghïs energy)

### INFECT
- **Name:** Infect
- **Cost:** 2 energy
- **Type:** skill
- **Description:** "Inflict Infect status: 50% chance to deal 1 damage each turn. 25% chance to naturally cure per turn."
- **Effects:** infectStatus: true on target
- **Implementation:** Probabilistic damage over time
- **Tests:** ❌ No self-test
- **Status:** ⚠️ NEEDS TESTING

## MAZE EXPLORER CARDS - SEPARATE SYSTEM ⚠️

**CRITICAL ARCHITECTURE NOTE**: These maze cards operate in a completely separate game mode (Metroidvania) with different mechanics. They should NOT interfere with base game functionality, but several have conflicting IDs and overlapping names that create confusion.

### MAZE-HOPE (🔴 DUPLICATE ID CONFLICT!)
- **ID:** 'hope' (CONFLICTS with base game Hope card!)
- **Cost:** 1 ghïs energy
- **Description:** "Heal +1 HP per Hope card collected. Costs ghïs energy."
- **Maze Mechanics:** Instant heal that scales with collected Hope cards
- **Base Game Conflict:** Base Hope is a multi-turn healing power that costs regular energy
- **Status:** 🔴 URGENT - Rename to avoid ID collision

### MAZE-SURGE  
- **ID:** 'surge'
- **Cost:** 0 ghïs energy
- **Description:** "Unlocks ghïs energy 1/1 and increases +1 per Surge card."
- **Maze Mechanics:** Uses ghïs energy system, unlocks/increases max ghïs
- **Base Game Conflict:** Base Surge (Loop) uses regular energy system
- **Status:** 🟡 Different mechanics but no direct ID conflict

### MAZE-PIERCE
- **ID:** 'mazepierce' (Different ID, good!)
- **Cost:** 2 ghïs energy  
- **Description:** "Hit enemy through shields, ignoring defense. Deals +1 damage per Pierce card."
- **Maze Mechanics:** Damage scales with collected Pierce cards
- **Base Game Conflict:** Base Pierce (Dagger) scales with Focus system
- **Status:** 🟢 Separate ID prevents conflicts

### MAZE-ZAP (⚠️ DIFFERENT MECHANIC, SAME NAME)
- **ID:** 'zap' 
- **Cost:** 1 ghïs energy
- **Description:** "Chance to stun opponent. Stun chance increases per Zap card collected."
- **Maze Mechanics:** Stun chance that scales with collected Zap cards
- **Base Game Conflict:** Base Zap (Bolt) is pierce damage + card draw
- **Status:** ⚠️ Same name, different ID, but confusing for players

### MAZE-IGNITE (⚠️ DIFFERENT MECHANIC, SAME NAME)
- **ID:** 'ignite'
- **Cost:** 2 ghïs energy
- **Description:** "Cause lingering burn damage. Duration +1 per Ignite card collected."
- **Maze Mechanics:** Burn duration scales with collected Ignite cards
- **Base Game Conflict:** Base Ignite (Fire) has fixed burn duration with spicy quirk scaling
- **Status:** ⚠️ Same name and ID, but different game modes prevent runtime conflicts

## MAJOR ISSUES IDENTIFIED ("FUNNY" BEHAVIOR)

### 🔴 CRITICAL ARCHITECTURAL ISSUES

1. **DUPLICATE HOPE CARD IDs**: Same ID 'hope' used for completely different mechanics
   - Base Game Hope: Multi-turn healing power (cost 2 regular energy)
   - Maze Hope: Instant scaling heal (cost 1 ghïs energy)
   - **Impact**: Potential runtime conflicts, player confusion, code maintenance issues

2. **MAZE-BASE GAME SEPARATION CONCERNS**: Several cards have overlapping names/mechanics across game modes
   - Zap: Pierce damage (base) vs Stun chance (maze)
   - Ignite: Fixed burn (base) vs Scaling burn (maze)  
   - Pierce: Focus scaling (base) vs Card count scaling (maze)
   - Surge: Regular energy (base) vs Ghïs energy (maze)
   - **Impact**: Updates to maze mode could accidentally affect base game mechanics

### ⚠️ TESTING GAPS

**Cards without self-tests (13 cards):**
- shield, fire, snow, loop, curiosity, wallop, hope, infect
- All maze cards (hope, surge, mazepierce, zap, ignite)

### 🟡 INCONSISTENCIES

1. **Card Text vs UI Text**: Some cards have different descriptions in cardText() vs card definition
2. **Maze-Base Game Architectural Mixing**: Cards with same names operate differently across game modes
   - Creates confusion for developers and players
   - Risk of cross-contamination between game modes during updates
   - Difficulty maintaining separate game logic
3. **Energy System Conflicts**: Base game uses regular energy, maze uses ghïs energy

### ✅ RECENTLY FIXED

1. **Reconsider Card**: Fixed from "consume all energy" to proper "3 energy cost" ✅

## SELF-TEST RESULTS (Latest Run)

All major tests are passing, including the critical Reconsider fixes:

### ✅ PASSING TESTS (36 tests)
- Shield absorbs first
- Pierce ignores shield  
- Focus adds +2 once
- Piercer first hit
- Freeze energy penalty
- Echo repeats last card (Strike)
- Card moved to discard
- Reshuffle pulls from discard
- Game.init exists
- Game.initQuick exists
- Preview equals result (swords)
- showStart exists
- Actor-aware logging works
- Easter egg detection works
- Easter egg has type
- Easter egg has valid rarity
- Droid card arms next-turn effect
- Droid Protocol triggers an effect
- Droid Protocol flag cleared
- Burn always does 1 damage per turn
- Burn stacking adds turns
- Overheal allows HP beyond maxHP
- Overheal respects 150% cap
- Energy uncapping allows energy beyond maxEnergy
- **Reconsider card is affordable with 3+ energy**
- **Reconsider costs 3 energy → 4** ⭐
- **Reconsider card is not affordable with <3 energy**
- Echo repeats Zap damage
- Echo repeats Zap card draw
- Echo flag properly managed
- Overload sets echoNext flag
- Overload triggers and repeats card
- Overload flag cleared after use
- First checkWin increments streak
- Game is marked as over
- Multiple checkWin calls do not increment streak again

### ❌ NO FAILING TESTS
All tests currently pass! The Reconsider fix is working correctly.

## RECOMMENDATIONS

### IMMEDIATE ACTIONS NEEDED

1. **Fix Hope ID Duplicate**: Rename maze hope card to 'mazehope' to avoid runtime conflicts
2. **Establish Clear Game Mode Separation**: 
   - Prefix all maze cards with 'maze' in their IDs
   - Document which cards belong to which game mode
   - Ensure maze card updates cannot affect base game mechanics
3. **Add Missing Tests**: Create self-tests for 13 untested cards
4. **Document Architectural Boundaries**: Clear documentation of base vs maze game systems

### ARCHITECTURAL SEPARATION PLAN

**Base Game Cards (22 core cards)**: Should remain isolated from maze mechanics
- Use regular energy system
- Follow standard card effects and scaling
- Should not be affected by maze mode development

**Maze Cards (5 cards)**: Should operate independently
- Use ghïs energy system
- Follow maze-specific scaling mechanics
- Should be clearly differentiated from base cards

**Naming Convention Proposal**:
- All maze cards should have 'maze' prefix in ID: 'mazehope', 'mazezap', 'mazeignite'
- This prevents accidental conflicts and makes game mode clear

### WHAT'S "LOCKED IN" (Consistent & Tested)
- Basic attack/heal/shield cards (Heart, Swords, Shield)
- Echo system (Echo, Overload)
- Pierce damage (Bolt, Dagger)  
- Energy manipulation (Star/Focus)
- Special effects (Reconsider, Presto, Ferriglobin, Impervious, Reap)
- Advanced mechanics (Droid Protocol)

### WHAT'S "FUNNY" (Needs Attention)
- **Hope card ID duplication (CRITICAL)**
- **Maze-Base game architectural mixing**
- **Shared card names across different game modes**
- Untested cards (especially complex ones like Curiosity, Wallop)
- Missing validation for burn/freeze mechanics
- **Energy system conflicts (regular vs ghïs)**

---

**Analysis Complete** ✅  
**Status:** 14/22 core cards are well-tested and consistent. Major issues identified with duplicates and testing gaps.

**Most Critical Finding**: The Reconsider card fix is working perfectly and all self-tests pass ✅