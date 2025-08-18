# VORTEKS
Unicode Minimal Card Battler

A modular, browser-based card game built with vanilla JavaScript ES6 modules.

## Project Structure

```
/
├── index.html              # Main game interface (modular bootstrap)
├── index-original.html     # Legacy monolithic version (kept for reference)
├── styles/
│   └── main.css            # Game styling and animations
├── data/
│   ├── icons.js            # Game icons and symbols
│   └── cards.js            # Card definitions and data
└── src/
    ├── main.js             # App bootstrap: wires modules to DOM and window
    ├── utils.js            # Utility functions (shuffle, clamp, etc.)
    ├── player.js           # Player creation and management
    ├── face-generator.js   # Opponent face generation
    ├── ai.js               # AI opponent logic and deck building
    ├── game.js             # Core game logic and state management
    ├── ui.js               # UI rendering and card display
    ├── deck-builder.js     # Deck building functionality
    └── tests.js            # Self-test functionality
```

## Features

- Modular Architecture: Clean separation of concerns across ES modules
- Unicode-based Graphics: Retro aesthetic using Unicode symbols and pixel art
- Card Mechanics: Strategic card-based combat with energy management
- AI Opponents: Dynamic AI with persona-based deck building
- Quirk System: Player abilities that modify gameplay
- Self-Tests: Built-in testing to ensure mechanics work correctly

## How to Play

1. Open `index.html` in a modern web browser (or serve the folder via a simple static server)
2. Click BUILD DECK for a custom deck or QUICK START to jump in
3. Pick a quirk
4. Play cards to attack, defend, and combo
5. Defeat the AI opponent to win

## Notes

- The previous monolithic file (`index-original.html`) is preserved for reference but the modular entry point is `index.html`.
- No build step required; ES modules run directly in modern browsers.
