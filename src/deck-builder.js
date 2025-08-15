import { CARDS } from '../data/cards.js';
import { shuffle, $ } from './utils.js';
import { cardText, renderCost } from './ui.js';
import { getUnlockedCards, getUnlockableCardsInfo } from './card-unlock.js';

// Deck building functionality
export function openDeckBuilder(done) {
  const modal = $('#deckModal');
  const grid = $('#deckGrid');
  const cntEl = $('#deckCount');
  const need = 20; 
  $('#deckNeed').textContent = need;
  
  // Get unlock status for all cards
  const unlockedCardIds = getUnlockedCards();
  const unlockableCardsInfo = getUnlockableCardsInfo();
  
  // Create a map for quick lookup of unlock info
  const unlockInfoMap = {};
  unlockableCardsInfo.forEach(info => {
    unlockInfoMap[info.id] = info;
  });
  
  // Show ALL cards in the deck builder (both unlocked and locked)
  const availableCards = CARDS;
  
  // Initialize counts for all cards, but only unlocked cards can have non-zero counts
  const counts = {}; 
  availableCards.forEach(c => counts[c.id] = 0);
  
  function deckSize() { 
    return Object.values(counts).reduce((a, b) => a + b, 0); 
  }
  
  function rebuild() {
    grid.innerHTML = '';
    availableCards.forEach(c => {
      const isUnlocked = unlockedCardIds.includes(c.id);
      const unlockInfo = unlockInfoMap[c.id];
      
      const card = document.createElement('div'); 
      card.className = 'qcard';
      
      // Apply visual styling for locked cards
      if (!isUnlocked) {
        card.style.opacity = '0.5';
        card.style.filter = 'grayscale(1)';
        card.style.position = 'relative';
      }
      
      // Build the card content
      let cardContent = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><span style="margin-right:6px">${c.sym}</span>${c.name}</div>
          <div class="cost">${renderCost(c)}</div>
        </div>
        <div style="margin-top:6px;font-size:10px">${cardText(c)}</div>
      `;
      
      // Add unlock hint for locked cards
      if (!isUnlocked && unlockInfo) {
        cardContent += `<div style="margin-top:4px;font-size:9px;color:var(--accent);font-style:italic">${unlockInfo.description}</div>`;
        if (unlockInfo.progress) {
          cardContent += `<div style="margin-top:2px;font-size:8px;color:var(--good)">${unlockInfo.progress}</div>`;
        }
      }
      
      // Add controls (buttons will be disabled for locked cards)
      const addDisabled = !isUnlocked;
      const subDisabled = !isUnlocked || counts[c.id] === 0;
      
      cardContent += `
        <div style="display:flex;gap:6px;margin-top:6px;align-items:center">
          <button class="btn" data-act="sub" data-id="${c.id}" ${subDisabled ? 'disabled' : ''}>-</button>
          <div>${counts[c.id]}</div>
          <button class="btn" data-act="add" data-id="${c.id}" ${addDisabled ? 'disabled' : ''}>+</button>
        </div>
      `;
      
      card.innerHTML = cardContent;
      
      // Add LOCKED badge overlay for locked cards
      if (!isUnlocked) {
        const lockedBadge = document.createElement('div');
        lockedBadge.style.cssText = `
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(255, 100, 100, 0.9);
          color: white;
          padding: 2px 4px;
          font-size: 8px;
          font-weight: bold;
          border-radius: 2px;
          z-index: 1;
        `;
        lockedBadge.textContent = 'LOCKED';
        card.appendChild(lockedBadge);
      }
      
      grid.appendChild(card);
    });
    cntEl.textContent = deckSize();
    $('#deckConfirm').disabled = deckSize() !== need;
  }
  
  grid.onclick = (e) => {
    const b = e.target.closest('button.btn'); 
    if (!b || b.disabled) return; // Ignore clicks on disabled buttons
    const id = b.getAttribute('data-id'); 
    const act = b.getAttribute('data-act');
    
    // Double-check that the card is unlocked before allowing modifications
    const isUnlocked = unlockedCardIds.includes(id);
    if (!isUnlocked) return;
    
    if (act === 'add') { 
      if (counts[id] < 4 && deckSize() < need) counts[id]++; 
    }
    if (act === 'sub') { 
      if (counts[id] > 0) counts[id]--; 
    }
    rebuild();
  };
  
  $('#deckCancel').onclick = () => {
    modal.hidden = true;
    // Return to start screen without progressing to quirk selection
    if (window.showStart) {
      window.showStart();
    }
  };

  $('#deckClear').onclick = () => { 
    // Only clear counts for unlocked cards
    Object.keys(counts).forEach(k => {
      if (unlockedCardIds.includes(k)) {
        counts[k] = 0;
      }
    }); 
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
  // Get only unlocked cards for random deck building
  const unlockedCardIds = getUnlockedCards();
  const pool = unlockedCardIds;
  
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