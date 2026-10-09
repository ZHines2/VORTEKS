// Descent run state: current location, player deck/HP, rewards.
import { LOCATIONS } from './levels.js';
import { PLAYER_DECK, SUPPORTED_CARDS } from './encounter.js';

export class Run {
  constructor() {
    this.loc = 0;
    this.deckIds = [...PLAYER_DECK];
    this.hp = 20;
    this.maxHP = 20;
    this.cleared = [];
    this.rewards = [];
  }

  get location() { return LOCATIONS[this.loc]; }
  get finished() { return this.cleared.length >= LOCATIONS.length; }

  // Called when a location's quota is met and its exit reached.
  completeLocation() {
    this.cleared.push(this.location.id);
    if (this.loc < LOCATIONS.length - 1) this.loc++;
  }

  rewardChoices(n = 3, rng = Math.random) {
    const pool = [...SUPPORTED_CARDS];
    const out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    return out;
  }

  addCard(id) { this.deckIds.push(id); this.rewards.push(id); }
  heal(n) { this.hp = Math.min(this.maxHP, this.hp + n); }
}
