# VORTEKS — The First Descent (v0.1 prototype)

An experimental first-person, wireframe dungeon crawl. Open `dungeon.html` (or the **DUNGEON (β)** button on the main menu) from a static server. The original game is unchanged apart from that menu link.

## Playthrough
Enter → explore → open the door (interact) → optional chest (grants the Wallop card and +6 HP) → meet the Warden → play cards → defeat it → reach the exit tile.

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
| `main.js` | Input, mode state machine (explore/combat/end), HUD |

Styles: `styles/dungeon.css`.

## Assumptions and limitations
- **No Three.js / build step**: rendering is a dependency-free Canvas 2D projection, keeping the project's static-ES-module setup.
- **Combat reuses card data, not `Game`**: `Game.applyCard` is coupled to the main battle DOM, so `encounter.js` interprets the data-driven fields (`effects`, `status`, `scaling`, `ai.pri`) for a subset of cards: Strike, Guard, Heart, Zap, Ignite, Freeze, Focus, Pierce, Wallop. Special-logic cards (Echo, Presto, quirks, etc.) are not supported yet. The enemy is a Bruiser-style Warden using `ai.pri` ordering rather than `makePersonaDeck`.
- Hand/deck state is local to the prototype; it does not touch unlocks, campaign or telemetry.
- One handcrafted level, one enemy, no persistence. Layout is defined in `LEVEL_ROWS`.
- Verified in headless Chromium (desktop viewport) with a scripted playthrough; not tested on iOS Safari or real touch hardware. No repo test suite covers this module.
