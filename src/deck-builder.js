import { CARDS } from '../data/cards.js';
import { shuffle, $ } from './utils.js';
import { cardText } from './ui.js';

// Deck building functionality
export function openDeckBuilder(done) {
  const modal = $('#deckModal');
  const grid = $('#deckGrid');
  const cntEl = $('#deckCount');
  const need = 20; 
  $('#deckNeed').textContent = need;
  const counts = {}; 
  CARDS.forEach(c => counts[c.id] = 0);
  
  function deckSize() { 
    return Object.values(counts).reduce((a, b) => a + b, 0); 
  }
  
  function rebuild() {
    grid.innerHTML = '';
    CARDS.forEach(c => {
      const card = document.createElement('div'); 
      card.className = 'qcard';
      card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><span style="margin-right:6px">${c.sym}</span>${c.name}</div><div class="cost">${c.cost}</div></div><div style="margin-top:6px;font-size:10px">${cardText(c)}</div><div style="display:flex;gap:6px;margin-top:6px;align-items:center"><button class="btn" data-act="sub" data-id="${c.id}">-</button><div>${counts[c.id]}</div><button class="btn" data-act="add" data-id="${c.id}">+</button></div>`;
      grid.appendChild(card);
    });
    cntEl.textContent = deckSize();
    $('#deckConfirm').disabled = deckSize() !== need;
  }
  
  grid.onclick = (e) => {
    const b = e.target.closest('button.btn'); 
    if (!b) return; 
    const id = b.getAttribute('data-id'); 
    const act = b.getAttribute('data-act');
    if (act === 'add') { 
      if (counts[id] < 4 && deckSize() < need) counts[id]++; 
    }
    if (act === 'sub') { 
      if (counts[id] > 0) counts[id]--; 
    }
    rebuild();
  };
  
  $('#deckClear').onclick = () => { 
    Object.keys(counts).forEach(k => counts[k] = 0); 
    rebuild(); 
  };
  
  $('#deckConfirm').onclick = () => {
    const deck = []; 
    for (const id in counts) { 
      for (let i = 0; i < counts[id]; i++) { 
        deck.push(CARDS.find(c => c.id === id)); 
      } 
    }
    modal.hidden = true; 
    done(shuffle(deck));
  };
  
  $('#deckQuick').onclick = () => { 
    modal.hidden = true; 
    done(buildRandomDeck(20, 4)); 
  };
  
  modal.hidden = false; 
  rebuild();
}

export function buildRandomDeck(size = 20, maxCopies = 4) {
  const pool = CARDS.map(c => c.id);
  const counts = {}; 
  pool.forEach(id => counts[id] = 0);
  const deck = [];
  while (deck.length < size) {
    const id = pool[Math.floor(Math.random() * pool.length)];
    if (counts[id] < maxCopies) { 
      counts[id]++; 
      deck.push(CARDS.find(c => c.id === id)); 
    }
  }
  return shuffle(deck);
}