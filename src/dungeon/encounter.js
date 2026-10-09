// Lightweight encounter bridge for the dungeon prototype.
// Reuses the shared card database (data/cards.js) and re-implements only the
// simple numeric/status subset of Game.applyCard, because Game itself is tied
// to the main battle DOM. Cards outside SUPPORTED_CARDS are not used here.

import { CARDS } from '../../data/cards.js';
import { shuffle } from '../utils.js';

export const SUPPORTED_CARDS = ['swords', 'shield', 'heart', 'bolt', 'fire', 'snow', 'star', 'dagger', 'wallop'];
export const HAND_SIZE = 5;

export function getCard(id) {
  const base = CARDS.find(c => c.id === id);
  return base ? { ...base } : null;
}

export function makeDeck(ids) {
  return shuffle(ids.map(getCard).filter(Boolean));
}

export const PLAYER_DECK = [
  'swords', 'swords', 'swords', 'shield', 'shield', 'heart',
  'bolt', 'bolt', 'fire', 'star', 'dagger'
];
export const ENEMY_DECK = [
  'swords', 'swords', 'swords', 'shield', 'shield', 'bolt', 'fire', 'swords'
];

export function createActor({ name, hp, maxHP = hp, deckIds, maxEnergy = 3 }) {
  return {
    name, hp, maxHP, shield: 0, energy: 0, maxEnergy,
    nextPlus: 0, burn: null, frozen: 0,
    deck: makeDeck(deckIds), hand: [], discard: []
  };
}

export function draw(actor, n = 1) {
  while (n-- > 0) {
    if (!actor.deck.length) actor.deck = shuffle(actor.discard.splice(0));
    if (!actor.deck.length) return;
    actor.hand.push(actor.deck.pop());
  }
}

export function canAfford(actor, card) {
  const life = card.effects?.lifeCost || 0;
  return actor.energy >= card.cost && (!life || actor.hp > life);
}

function hit(target, dmg, pierce) {
  let remaining = dmg;
  if (!pierce && target.shield > 0) {
    const absorbed = Math.min(target.shield, remaining);
    target.shield -= absorbed;
    remaining -= absorbed;
  }
  target.hp = Math.max(0, target.hp - remaining);
  return remaining;
}

// Applies a card's data-driven effects. Returns events for presentation.
export function applyCard(card, me, them) {
  const events = [];
  const fx = card.effects || {};
  const st = card.status || {};

  if (fx.lifeCost) {
    me.hp = Math.max(0, me.hp - fx.lifeCost);
    events.push({ type: 'selfDamage', who: me, amount: fx.lifeCost });
  }
  let dmg = fx.damage || 0;
  if (dmg && card.scaling?.addToDamageFromSelf && me.nextPlus) {
    dmg += me.nextPlus;
    me.nextPlus = 0;
  }
  if (dmg) {
    const dealt = hit(them, dmg, !!fx.pierce);
    events.push({ type: 'damage', who: them, amount: dealt, blocked: dmg - dealt, pierce: !!fx.pierce });
  }
  if (fx.heal) {
    const before = me.hp;
    me.hp = Math.min(me.maxHP, me.hp + fx.heal);
    events.push({ type: 'heal', who: me, amount: me.hp - before });
  }
  if (fx.shield) {
    me.shield += fx.shield;
    events.push({ type: 'shield', who: me, amount: fx.shield });
  }
  if (fx.draw) draw(me, fx.draw);
  const burn = st.target?.burn;
  if (burn) {
    them.burn = { amount: burn.amount, turns: burn.turns };
    events.push({ type: 'burn', who: them, amount: burn.amount, turns: burn.turns });
  }
  if (st.target?.freezeEnergy) {
    them.frozen += st.target.freezeEnergy;
    events.push({ type: 'freeze', who: them, amount: st.target.freezeEnergy });
  }
  if (st.self?.nextPlus) {
    me.nextPlus += st.self.nextPlus;
    events.push({ type: 'focus', who: me, amount: st.self.nextPlus });
  }
  return events;
}

export class Encounter {
  constructor(player, enemyConfig) {
    this.player = player;
    this.enemy = createActor(enemyConfig);
    this.turn = 'player';
    this.over = false;
    this.winner = null;
    this.startTurn(this.player);
  }

  startTurn(actor) {
    const events = [];
    actor.shield = 0;
    if (actor.burn && actor.burn.turns > 0) {
      const dealt = hit(actor, actor.burn.amount, true);
      actor.burn.turns--;
      events.push({ type: 'burnTick', who: actor, amount: dealt });
      if (actor.burn.turns <= 0) actor.burn = null;
    }
    actor.energy = Math.max(0, actor.maxEnergy - actor.frozen);
    actor.frozen = 0;
    draw(actor, Math.max(0, HAND_SIZE - actor.hand.length));
    this.checkEnd();
    return events;
  }

  checkEnd() {
    if (this.over) return;
    if (this.enemy.hp <= 0) { this.over = true; this.winner = 'player'; }
    else if (this.player.hp <= 0) { this.over = true; this.winner = 'enemy'; }
  }

  // Play a card from `actor`'s hand by index. Returns { card, events } or null.
  play(actor, idx) {
    if (this.over) return null;
    const card = actor.hand[idx];
    if (!card || !canAfford(actor, card)) return null;
    actor.energy -= card.cost;
    actor.hand.splice(idx, 1);
    const them = actor === this.player ? this.enemy : this.player;
    const events = applyCard(card, actor, them);
    actor.discard.push(card);
    this.checkEnd();
    return { card, events };
  }

  // Choose the enemy's next card using the shared per-card AI priority.
  enemyChoice() {
    const e = this.enemy;
    const options = e.hand
      .map((card, i) => ({ card, i }))
      .filter(({ card }) => canAfford(e, card))
      .filter(({ card }) => !(card.effects?.shield && e.shield >= 3))
      .filter(({ card }) => !(card.effects?.heal && e.hp >= e.maxHP))
      .sort((a, b) => (b.card.ai?.pri || 0) - (a.card.ai?.pri || 0));
    return options.length ? options[0].i : -1;
  }

  // Ends the player's turn and begins the enemy's. Enemy cards are then
  // played one at a time by the caller via enemyStep() so they can be animated.
  endPlayerTurn() {
    if (this.over) return;
    this.player.energy = 0;
    this.turn = 'enemy';
    return this.startTurn(this.enemy);
  }

  enemyStep() {
    if (this.over || this.turn !== 'enemy') return null;
    const idx = this.enemyChoice();
    if (idx < 0) return null;
    return this.play(this.enemy, idx);
  }

  endEnemyTurn() {
    if (this.over) return [];
    this.turn = 'player';
    return this.startTurn(this.player);
  }
}
