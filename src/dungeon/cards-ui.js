// Card hand presentation: draw / idle / select / activate / discard animations.
// Pure presentation - rules live in encounter.js and the shared card data.

const TYPE_HINT = { attack: 'ATTACK', skill: 'SKILL', power: 'POWER' };

export function describeCost(card) {
  return card.cost + '🔆' + (card.effects?.lifeCost ? ' +' + card.effects.lifeCost + '❤' : '');
}

function makeCardEl(card, index, total, affordable, reduceMotion) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'dcard type-' + card.type + (affordable ? '' : ' dim') + (reduceMotion ? ' no-motion' : '');
  el.dataset.index = index;
  // Fan arrangement
  const mid = (total - 1) / 2;
  const off = index - mid;
  el.style.setProperty('--rot', (off * 6) + 'deg');
  el.style.setProperty('--lift', (Math.abs(off) * Math.abs(off) * 3) + 'px');
  el.style.setProperty('--delay', (index * 70) + 'ms');
  el.style.setProperty('--phase', (index * -0.7) + 's');
  el.innerHTML =
    '<span class="dcard-cost">' + describeCost(card) + '</span>' +
    '<span class="dcard-sym">' + card.sym + '</span>' +
    '<span class="dcard-name">' + card.name + '</span>' +
    '<span class="dcard-type">' + (TYPE_HINT[card.type] || card.type) + '</span>' +
    '<span class="dcard-desc">' + card.description + '</span>';
  el.setAttribute('aria-label', card.name + ', cost ' + card.cost + '. ' + card.description);
  return el;
}

export class HandView {
  constructor(container, { reduceMotion = false } = {}) {
    this.container = container;
    this.reduceMotion = reduceMotion;
    this.selected = -1;
  }

  // onPick(index) is called when a card is confirmed (second tap/click on a
  // selected card, or Enter). First tap only selects, so descriptions stay readable.
  render(actor, canAfford, onPick) {
    this.container.innerHTML = '';
    this.selected = -1;
    actor.hand.forEach((card, i) => {
      const el = makeCardEl(card, i, actor.hand.length, canAfford(actor, card), this.reduceMotion);
      el.classList.add('drawing');
      el.addEventListener('click', () => {
        if (this.selected === i) onPick(i);
        else this.select(i);
      });
      el.addEventListener('mouseenter', () => this.select(i));
      el.addEventListener('focus', () => this.select(i));
      this.container.appendChild(el);
    });
  }

  select(i) {
    this.selected = i;
    [...this.container.children].forEach((el, k) => el.classList.toggle('selected', k === i));
  }

  el(i) { return this.container.children[i]; }

  // Animate the card leaving the hand into the scene. Resolves when finished.
  activate(i) {
    const el = this.el(i);
    return new Promise(resolve => {
      if (!el) return resolve();
      el.classList.remove('drawing');
      el.classList.add('activating');
      setTimeout(resolve, this.reduceMotion ? 0 : 480);
    });
  }

  reject(i) {
    const el = this.el(i);
    if (!el || this.reduceMotion) return;
    el.classList.remove('rejected');
    void el.offsetWidth;
    el.classList.add('rejected');
  }

  clear() { this.container.innerHTML = ''; this.selected = -1; }
}
