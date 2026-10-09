# VORTEKS — The First Descent (v0.1 prototype)

An experimental first-person, wireframe dungeon crawl. Open `dungeon.html` (or the **DUNGEON (β)** button on the main menu) from a static server. The original game is unchanged apart from that menu link.

## Playthrough (v0.2: The Descent)
A run is three locations (`src/dungeon/levels.js`): **The Gate** (2 opponents), **Hall of Ash** (3) and **The Core** (1 boss). Each has its own layout and colour palette. The exit is sealed (shown as a red tile on the map) until every opponent there is defeated; the HUD shows `LOCATION defeated/quota`. After each location a travel screen shows the path (Gate → Hall → Core), you pick one of three reward cards, recover 5 HP, and descend. The Gate also has an optional chest (Wallop + 6 HP). HP and deck carry between locations (`run.js`).

Design decisions taken: battles stay in the corridor, maps are handcrafted, and the run is a separate mode (it does not touch main-game unlocks, campaign or streaks).

### Combat presentation
Opponents come from the existing persona deck builder (`makePersonaDeck`), filtered to supported cards and scaled by location HP/booster. The enemy's **intent** (cards it will play next turn) is shown as chips under its health bar, updating as you play. Played cards (yours and the enemy's) land on a table slot in the scene before being discarded; deck/discard counts sit beside the hand.

## Controls
- Keyboard: `W/S` or `↑/↓` move, `A/D`, `Q/E` or `←/→` turn, `Space`/`F` interact. In combat: click/tap a card to inspect, again to play (or `1`–`9`), `Enter` ends turn.
- Touch: on-screen buttons, or swipe on the view (up/down move, left/right turn, tap interact).
- "reduce motion" (defaults to the OS setting) disables camera tweening, bob, flicker and card animation.

## Architecture (`src/dungeon/`)
| File | Role |
| --- | --- |
| `navigation.js` | Level layout, grid movement, doors/chest, enemy range (no DOM) |
| `renderer.js` | Canvas-2D perspective wireframe renderer, camera tween, minimap |
| `encounter.js` | Encounter bridge: turn flow, enemy choice, card effect interpreter |
| `cards-ui.js` | Hand presentation: draw, idle, select, activate, reject animations |
| `levels.js` / `run.js` | Location data (layout, palette, opponents) and run state (deck, HP, rewards) |
| `main.js` | Input, mode state machine (explore/combat/end), HUD |

Styles: `styles/dungeon.css`.

## Assumptions and limitations
- **No Three.js / build step**: rendering is a dependency-free Canvas 2D projection, keeping the project's static-ES-module setup.
- **Combat reuses card data, not `Game`**: `Game.applyCard` is coupled to the main battle DOM, so `encounter.js` interprets the data-driven fields (`effects`, `status`, `scaling`, `ai.pri`) for a subset of cards: Strike, Guard, Heart, Zap, Ignite, Freeze, Focus, Pierce, Wallop. Special-logic cards (Echo, Presto, quirks, etc.) are not supported yet. Persona decks are filtered to that subset, so Echo/Loop/Infect cards are dropped from enemy decks for now. Enemies choose cards by `ai.pri`, not the full `createAIPlayer` logic. Quirks, deck building and win streaks are not brought over.
- Hand/deck state is local to the prototype; it does not touch unlocks, campaign or telemetry.
- Three handcrafted locations, no persistence.
- Verified in headless Chromium (desktop viewport) with a scripted playthrough of The Gate (two fights, reward pick, transition to Hall of Ash); Hall of Ash and The Core were only checked headlessly for map connectivity and deck generation; not tested on iOS Safari or real touch hardware. No repo test suite covers this module.
