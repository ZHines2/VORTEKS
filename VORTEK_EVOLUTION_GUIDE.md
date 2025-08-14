# VORTEK Companion Evolution Guide

## Overview
The VORTEK companion is a sophisticated tamagotchi-like system that evolves based on player gameplay, interactions, and time. This guide explains all the mechanics, formulas, and "rigging" behind the evolution system.

## Evolution Stages

### Stage Requirements and Bonuses

| Stage | Level Req | Emoji | Size | Evolution Bonuses |
|-------|-----------|-------|------|-------------------|
| **Egg** | 0 | 🥚 | tiny | Starting stage |
| **VORTEK Sprite** | 5 | 🌟 | small | +10 Wisdom, +15 Curiosity, +10 Playfulness |
| **Echo Beast** | 15 | ⚡ | medium | +15 Power, +20 Courage, +10 Focus |
| **Card Master** | 30 | 🔮 | large | +15 Wisdom, +10 Power, +20 Creativity, +15 Loyalty |
| **VORTEKS Avatar** | 50 | 🌌 | massive | +20 Wisdom, +20 Power, +25 Courage, +20 Focus, +15 Creativity, Loyalty=100 |

### Evolution Triggers
- **Level-based**: Must reach minimum level for each stage
- **Automatic**: Evolution happens during level-up if requirements are met
- **Immediate bonuses**: Full energy and happiness restoration
- **Stat caps**: All stats are capped at 100 after evolution bonuses

## Stats System

### Core Stats (0-100)
1. **❤️ Happiness** - Overall mood and contentment
2. **⚡ Energy** - Physical stamina for activities
3. **🧠 Wisdom** - Knowledge and battle understanding
4. **💪 Power** - Combat effectiveness and strength

### Personality Stats (0-100)
1. **🔍 Curiosity** - Drives exploration and room discovery
2. **🎨 Creativity** - Artistic expression and decoration preferences
3. **💝 Loyalty** - Bond strength with the player
4. **🎮 Playfulness** - Toy interactions and fun activities
5. **🎯 Focus** - Concentration ability and learning efficiency
6. **⚔️ Courage** - Battle confidence and risk-taking behavior

## Experience and Leveling

### Experience Sources
- **Battles**: 1 exp per battle lost, 3 exp per battle won
- **Idle Time**: Floor(hoursIdle / 2) exp for 6+ hour idle periods
- **Activities**: 30% chance for 1 exp from play, 1 exp from meditation, 40% chance for 1 exp from exploration

### Level Requirements
- **Formula**: `expNeeded = level * 10`
- **Example**: Level 5 requires 50 total experience points
- **Overflow**: Excess experience carries over to next level

### Level-up Bonuses
- **Happiness**: +10
- **Energy**: +15
- **Evolution check** triggered

## Room Environment System

### Room Elements and Unlock Conditions

| Element | Level Req | Stat Req | Unlock Condition | Interaction Effects |
|---------|-----------|----------|------------------|-------------------|
| **🛏️ Bed** | 0 | None | Always available | +15 Energy, +3 Happiness |
| **🪞 Mirror** | 5 | 30+ Curiosity | Level 5 + Curiosity | +2 Curiosity, +2 Happiness |
| **📚 Bookshelf** | 10 | 40+ Wisdom | Level 10 + Wisdom | +4 Wisdom, +2 Focus, -5 Energy |
| **🧸 Toybox** | 8 | 50+ Playfulness | Level 8 + Playfulness | +5 Playfulness, +5 Happiness, -3 Energy |
| **🪴 Plant** | 15 | 45+ Focus | Level 15 + Focus | +3 Focus, +2 Wisdom, -2 Energy |
| **🎨 Art Easel** | 20 | 50+ Creativity | Level 20 + Creativity | +6 Creativity, +4 Happiness, -8 Energy |

### Room Interaction Rules
- **Bed**: Can use when Energy < 90
- **Other elements**: Must have minimum energy requirements
- **Cooldowns**: No specific cooldowns for room interactions
- **Unlock bonuses**: +10 Happiness when new elements unlock

## Telemetry Integration

### Real-time Stat Updates from Gameplay

#### Battle Events
- **Card Played**: +0.5 Happiness, +0.3 Curiosity, -0.2 Energy
- **Battle Won**: +8 Happiness, +2 Courage, +1 Loyalty, +3 Experience
- **Battle Lost**: -3 Happiness, +2 Wisdom, +1 Focus, +1 Experience
- **Damage Dealt** (5+ damage): +1 Power, +0.5 Courage
- **Strategic Play** (5+ energy): +1 Wisdom, +1.5 Focus
- **Creative Combo**: +2 Creativity, +1 Playfulness

#### Telemetry-Based Calculations
```javascript
// Battle Influence (0-100)
battleInfluence = (wins / total) * 100

// Card Mastery (0-100) 
cardMastery = min(100, uniqueCardsPlayed * 3)

// Strategic Depth (0-100)
strategicDepth = min(100, avgEnergyPerTurn * 20)

// Power Calculation
power = min(100, floor(
  (battleInfluence * 0.4) + 
  (cardMastery * 0.3) + 
  (level * 0.3)
))
```

## Idle Progression System

### Time-Based Changes

#### Short Idle (30+ minutes)
- **Energy**: Decreases by min(10, hoursIdle * 2)
- **Happiness**: Decreases by min(15, hoursIdle) if not played for 2+ hours
- **Wisdom**: Increases by min(5, hoursIdle * 0.5) - passive learning
- **Focus**: Increases by min(3, hoursIdle * 0.3)
- **Curiosity**: Decreases by min(5, hoursIdle * 0.4)
- **Playfulness**: Decreases by min(8, hoursIdle * 0.6)

#### Long Idle (4+ hours)
- **Loyalty**: Increases by min(2, hoursIdle * 0.1) - missing player

#### Extended Idle (6+ hours)
- **Needs Attention**: Flag set to true
- **Experience**: Floor(hoursIdle / 2) bonus experience

## Player Activities

### Activity Cooldowns and Effects

| Activity | Cooldown | Energy Cost | Effects |
|----------|----------|-------------|---------|
| **🍼 Feed** | 1 hour | 0 | +20 Energy, +10 Happiness |
| **🎮 Play** | 30 minutes | -5 | +15 Happiness, +8 Playfulness, +3 Loyalty |
| **🧘 Meditate** | None | -10 | +5 Wisdom, +7 Focus, +2 Loyalty, +5 Happiness, +1 exp |
| **🔍 Explore** | 15 minutes | -3 | +3 Curiosity, +2 Happiness, 40% chance +1 exp |

### Activity Restrictions
- **Feed**: Can't feed if last fed < 1 hour ago
- **Play**: Can't play if last played < 30 minutes ago
- **Meditate**: Requires 10+ energy
- **Explore**: Can't explore if last explored < 15 minutes ago

## Status Messages

### Status Conditions (Priority Order)
1. **"Needs attention!"** - needsAttention = true
2. **"Feeling tired..."** - energy < 20
3. **"Feeling sad..."** - happiness < 30
4. **"Very happy!"** - happiness > 80 AND energy > 60
5. **"Deep in thought..."** - wisdom > 80
6. **"Content"** - Default state

### Mood Messages (Level-Based)
- **Level 50+**: "A legendary VORTEKS master!"
- **Level 30-49**: "Mastering the art of card combat..."
- **Level 15-29**: "Growing stronger with each battle!"
- **Level 5-14**: "Learning your battle strategies..."

### Room Activity Messages
- **1 element**: "Exploring the basic room setup..."
- **2-3 elements**: "Getting comfortable in the room..."
- **4-5 elements**: "Making the room feel like home..."
- **6 elements**: "Living happily in a fully furnished room!"

## Testing Scenarios

### Quick Evolution Test
1. **Spawn at Level 50**: Set level to 50 in localStorage
2. **Max Stats**: Set all stats to 100
3. **Instant Evolution**: Trigger checkEvolution() function
4. **Room Unlock**: All elements should unlock immediately

### Stat Manipulation
```javascript
// Console commands for testing
const creature = getCreature();
creature.level = 50;           // Set level
creature.experience = 0;       // Reset experience
creature.happiness = 100;      // Max happiness
creature.energy = 0;           // No energy
saveIdleGame();               // Save changes
```

### Telemetry Testing
```javascript
// Manipulate battle influence
const telemetry = getTelemetry();
telemetry.battles.wins = 100;
telemetry.battles.total = 100;  // 100% win rate
saveTelemetry();
updateCreatureFromTelemetry();
```

## Data Migration

### Version Compatibility
- **Version 2**: Current version with extended stats
- **Migration**: Automatically adds missing personality stats
- **Name Update**: "Vortex" → "VORTEK" conversion
- **Backwards Compatible**: Handles missing room elements

### Save Data Location
- **Key**: `vorteks-idle-creature`
- **Format**: JSON in localStorage
- **Reset**: Use `resetCreature()` function

## Formulas Quick Reference

```javascript
// Experience needed per level
expNeeded = level * 10

// Idle energy loss (30+ min)
energyLoss = min(10, hoursIdle * 2)

// Power calculation from telemetry
power = min(100, floor(
  (winRatio * 100 * 0.4) + 
  (uniqueCards * 3 * 0.3) + 
  (level * 0.3)
))

// Battle influence
battleInfluence = (wins / totalBattles) * 100

// Card mastery  
cardMastery = min(100, uniqueCardsPlayed * 3)

// Strategic depth
strategicDepth = min(100, avgEnergyPerTurn * 20)
```

## Known Behaviors

### "Rigged" Mechanics
1. **Evolution is guaranteed** at level thresholds regardless of other stats
2. **Stats are hard-capped** at 100, preventing overflow
3. **Experience always carries over** between levels
4. **Room unlocks are permanent** once achieved
5. **Idle progression favors wisdom/focus** over happiness/energy
6. **Battle wins have 2.67x more impact** than losses on experience
7. **Telemetry updates are throttled** to prevent stat spam
8. **Energy cost activities can't be spammed** due to energy requirements

### Edge Cases
- **Negative stats**: All stats have Math.max(0, value) protection
- **Time manipulation**: System uses Date.now(), vulnerable to system clock changes
- **Rapid interactions**: Cooldowns prevent exploitation
- **Data corruption**: Migration system handles missing/invalid data