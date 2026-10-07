# Codebase Status Note

This document records features visible in the current source tree. It is not a runtime health report: it does not verify performance, memory use, browser compatibility, or whether every feature works in a live session.

## Source-backed inventory

- `data/cards.js` defines 28 cards: 22 standard battle cards and 6 cards tagged for Maze Explorer.
- `src/ai.js` builds decks for seven named variants: Bruiser, Doctor, Trickster, Sicko, Cat, Robot, and Ghost.
- `src/card-unlock.js` defines 8 quirks and implements card, quirk, and flavor progression.
- `data/flavors.js` defines 40 color flavors.
- The start screen in `index.html` exposes Quick Start, Build Deck, Campaign, Tournament, Maze Explorer, and GHÏS entry points.
- `src/campaign.js`, `src/game.js`, `src/metroidvania.js`, and `src/ghis.js` contain the corresponding mode implementations.

## Testing

The built-in self-test runner is `src/tests.js` and is launched by the start screen's DEBUG control in `src/main.js`. It logs individual assertions, and some browser-dependent checks can be skipped when their required environment is unavailable. There is no fixed test count recorded here, and this note does not claim that all checks pass.

No `package.json` or package-based test command is present in the repository root. Run the game in a browser to exercise its interface and built-in checks.

## Maintenance

Treat the source files listed above as the source of truth for card, persona, quirk, flavor, and mode counts. Update this note when those definitions or the available mode entry points change.
