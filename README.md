# VORTEKS

VORTEKS is a browser-based game built with vanilla JavaScript ES modules. Its main mode is a turn-based card battler with AI opponents, deck building, energy management, and unlockable content. The repository also contains several separate game modes and companion systems.

## Modes

- **Quick Start** and **Build Deck** start standard card battles, with a random deck or a player-built deck.
- **Campaign** adds persistent deck progression and increasingly challenging opponents.
- **Tournament** runs a series of battles against AI opponents.
- **Maze Explorer** is a maze exploration mode with enemy encounters and collectible card abilities.
- **Dungeon (β)** (`dungeon.html`) is an experimental first-person wireframe dungeon crawl that reuses the shared card data. See [`DUNGEON.md`](DUNGEON.md).
- **GHÏS** is a separate arcade-style space survival mode with card-based powerups.

## Card and opponent data

[`data/cards.js`](data/cards.js) defines 28 cards: 22 standard battle cards and 6 cards tagged for Maze Explorer. Some card definitions are shared in the data file; the Maze Explorer cards have distinct IDs prefixed with `maze`.

The AI deck builder in [`src/ai.js`](src/ai.js) supports seven named variants: Bruiser, Doctor, Trickster, Sicko, Cat, Robot, and Ghost. Opponent appearances and names are generated separately.

The repository also defines 8 quirks in `src/card-unlock.js` and 40 color flavors in [`data/flavors.js`](data/flavors.js). Unlock and progression behavior is implemented in `src/card-unlock.js`.

## Project layout

- `index.html` — game interface and mode entry points
- `index-original.html` — earlier monolithic version
- `src/` — game logic, mode implementations, UI, progression, and self-tests
- `data/` — card, icon, and flavor definitions
- `styles/` — application styles

The app uses browser ES modules and does not require a build step. To run it locally, serve the repository root with a static HTTP server:

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080` in a modern browser.

## Testing

The start screen's **DEBUG** button runs the built-in self-tests in `src/tests.js`. The checks log individual results; some browser-dependent checks are skipped when their required environment is unavailable. The repository does not define a package-based test command or maintain a fixed test-count claim.
