# VORTEKS
Unicode Minimal Card Battler

A modular, browser-based card game built with vanilla JavaScript ES6 modules.

## Project Structure

```
/
├── index.html              # Main game interface
├── styles/
│   └── main.css            # Game styling and animations
├── data/
│   ├── icons.js            # Game icons and symbols
│   └── cards.js            # Card definitions and data
└── src/
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

- **Modular Architecture**: Clean separation of concerns across multiple ES6 modules
- **Unicode-based Graphics**: Retro aesthetic using Unicode symbols and pixel art
- **Card Mechanics**: Strategic card-based combat with energy management
- **AI Opponents**: Dynamic AI with persona-based deck building
- **Quirk System**: Player abilities that modify gameplay
- **Self-Tests**: Built-in testing to ensure game mechanics work correctly

## How to Play

1. Open `index.html` in a modern web browser
2. Choose "BUILD DECK" for custom deck building or "QUICK START" for immediate play
3. Select a quirk that modifies your abilities
4. Play cards to attack, defend, and use special abilities
5. Defeat the AI opponent to win!

## Development

The game uses ES6 modules for better code organization and maintainability. No build process is required - simply serve the files from a web server and open in a browser that supports ES6 modules.
