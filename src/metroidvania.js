// metroidvania.js
// VORTEKS Metroidvania Mode - Procedural maze exploration with card-based abilities

import { CARDS } from '../data/cards.js';
import { shuffle, clamp } from './utils.js';
import { createAIPlayer, makePersonaDeck } from './ai.js';
import { recordBattle, recordCardPlayed } from './telemetry.js';

// Metroidvania game state
class MetroidvaniaGame {
  constructor() {
    this.player = {
      x: 0,
      y: 0,
      hp: 5,  // Start with 5 HP from first heart card
      maxHP: 5,
      ghis: 0, // Start with no ghis - will be set by surge cards
      maxGhis: 0,
      cards: [], // Player's collected cards
      abilities: new Set(), // Unlocked abilities
      stats: {
        strike: 0,
        shield: 0,
        surge: 0,
        pierce: 0,
        hope: 0,
        zap: 0,
        ignite: 0
      }
    };
    
    this.maze = null;
    this.mazeSize = 50; // Large procedural maze
    this.cellSize = 32; // Pixel size of each grid cell
    this.camera = { x: 0, y: 0 };
    this.enemies = new Map(); // Position -> enemy data
    this.loot = new Map(); // Position -> loot data
    this.discovered = new Set(); // Discovered cell positions
    
    // EXPERIMENTAL: Maze Reconstruction System
    this.mazeModifications = new Map(); // Position -> modification data
    this.reconstructionMode = false; // Whether player is in reconstruction mode
    this.selectedReconstructionCard = null; // Card selected for reconstruction
    this.reconstructionRange = 0; // Range of current reconstruction effect
    this.resonanceEffects = new Map(); // Track resonance effects by area
    
    // Check if player has seen Judge dialogue before
    const hasSeenJudge = localStorage.getItem('vorteks-judge-seen') === 'true';
    
    this.gameState = hasSeenJudge ? 'exploring' : 'judge_intro'; // Skip intro if seen before
    this.judgeDialogue = {
      visible: !hasSeenJudge,
      currentStep: 0,
      hasSeenBefore: hasSeenJudge,
      steps: [
        "The world as you know it is crumbling.",
        "Beyond this point is madness - fortunately for you, KNOWLEDGE is the legacy of mankind.",
        "I cannot betray what remnants of truth may have been left behind.",
        "But I can give you these three cards to begin your journey:",
        "Strike - to attack your foes",
        "Heart - to preserve your life force", 
        "Shield - to defend against harm",
        "Use them wisely. The maze holds many secrets..."
      ]
    };
    
    this.currentBattle = null;
    this.battleMenu = {
      visible: false,
      selectedOption: 0,
      options: []
    };
    
    this.canvas = null;
    this.ctx = null;
    
    this.keys = new Set(); // Pressed keys
    this.lastFrame = 0;
    
    // Touch/mobile support
    this.touchState = {
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      isActive: false,
      minSwipeDistance: 50, // Minimum distance for a swipe
      lastTapTime: 0, // For double-tap detection
      doubleTapDelay: 300 // Maximum time between taps for double-tap
    };
    
    // Initialize maze and spawn
    this.generateMaze();
    this.spawnPlayer();
    
    // If skipping judge intro, set up the game immediately
    if (this.judgeDialogue.hasSeenBefore) {
      this.giveStartingCards();
      this.populateEnemies();
    }
  }
  
  // Handle JUDGE introduction sequence
  advanceJudgeDialogue() {
    if (this.gameState !== 'judge_intro') return;
    
    this.judgeDialogue.currentStep++;
    
    if (this.judgeDialogue.currentStep >= this.judgeDialogue.steps.length) {
      // Dialogue finished, give player starting cards and begin game
      this.giveStartingCards();
      this.startMazeExploration();
      
      // Mark judge dialogue as seen
      localStorage.setItem('vorteks-judge-seen', 'true');
    }
  }
  
  // Skip judge dialogue entirely
  skipJudgeDialogue() {
    if (this.gameState !== 'judge_intro') return;
    
    this.giveStartingCards();
    this.startMazeExploration();
    
    // Mark judge dialogue as seen
    localStorage.setItem('vorteks-judge-seen', 'true');
  }
  
  // Give player the three starting cards from the JUDGE
  giveStartingCards() {
    // Find the basic cards in the CARDS database
    const startingCardIds = ['swords', 'heart', 'shield'];
    
    startingCardIds.forEach(cardId => {
      const card = CARDS.find(c => c.id === cardId);
      if (card) {
        this.addCardToPlayer(card);
      }
    });
    
    // EXPERIMENTAL: Give one starting reconstruction card for testing
    const reconstructionCard = CARDS.find(c => c.id === 'bridge');
    if (reconstructionCard) {
      this.addCardToPlayer(reconstructionCard);
      this.logBattleAction("🌟 EXPERIMENTAL: You also receive a Bridge card - press R to enter Reconstruction Mode!");
    }
    
    this.logBattleAction("The JUDGE grants you three essential cards to begin your journey.");
  }
  
  // Start the maze exploration after JUDGE sequence
  startMazeExploration() {
    this.gameState = 'exploring';
    this.judgeDialogue.visible = false;
    this.populateEnemies();
    this.logBattleAction("You enter the crumbling maze. Find more cards by defeating enemies.");
  }
  
  // Generate procedural maze using cellular automata
  generateMaze() {
    this.maze = Array(this.mazeSize).fill().map(() => Array(this.mazeSize).fill(1));
    
    // Generate a hedge-maze-like structure with thin corridors
    // Start with all walls, then carve corridors
    this.generateHedgeMaze();
  }
  
  // Generate hedge-maze-like corridors
  generateHedgeMaze() {
    // Initialize all as walls
    for (let x = 0; x < this.mazeSize; x++) {
      for (let y = 0; y < this.mazeSize; y++) {
        this.maze[x][y] = 1;
      }
    }
    
    // Create a grid pattern of potential paths (every other cell)
    const pathCells = [];
    for (let x = 1; x < this.mazeSize - 1; x += 2) {
      for (let y = 1; y < this.mazeSize - 1; y += 2) {
        pathCells.push({ x, y });
        this.maze[x][y] = 0; // Mark as open
      }
    }
    
    // Use a simplified maze generation algorithm to connect paths
    this.connectPaths(pathCells);
    
    // Add some random openings for more variety (but keep it sparse)
    this.addRandomOpenings();
    
    // Ensure borders are walls
    for (let x = 0; x < this.mazeSize; x++) {
      this.maze[x][0] = 1;
      this.maze[x][this.mazeSize - 1] = 1;
    }
    for (let y = 0; y < this.mazeSize; y++) {
      this.maze[0][y] = 1;
      this.maze[this.mazeSize - 1][y] = 1;
    }
  }
  
  // Connect path cells to create corridors
  connectPaths(pathCells) {
    if (pathCells.length === 0) return;
    
    // Start with a random path cell
    const visited = new Set();
    const stack = [pathCells[Math.floor(Math.random() * pathCells.length)]];
    visited.add(`${stack[0].x},${stack[0].y}`);
    
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedPathNeighbors(current, pathCells, visited);
      
      if (neighbors.length > 0) {
        // Choose a random unvisited neighbor
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Remove wall between current and next
        const wallX = (current.x + next.x) / 2;
        const wallY = (current.y + next.y) / 2;
        this.maze[wallX][wallY] = 0;
        
        visited.add(`${next.x},${next.y}`);
        stack.push(next);
      } else {
        stack.pop();
      }
    }
  }
  
  // Get unvisited path neighbors (2 cells away in cardinal directions)
  getUnvisitedPathNeighbors(cell, pathCells, visited) {
    const neighbors = [];
    const directions = [
      { x: 0, y: -2 }, // Up
      { x: 2, y: 0 },  // Right
      { x: 0, y: 2 },  // Down
      { x: -2, y: 0 }  // Left
    ];
    
    for (const dir of directions) {
      const nx = cell.x + dir.x;
      const ny = cell.y + dir.y;
      
      if (nx >= 1 && nx < this.mazeSize - 1 && ny >= 1 && ny < this.mazeSize - 1) {
        const key = `${nx},${ny}`;
        if (!visited.has(key) && pathCells.some(p => p.x === nx && p.y === ny)) {
          neighbors.push({ x: nx, y: ny });
        }
      }
    }
    
    return neighbors;
  }
  
  // Add a few random openings to make the maze less predictable
  addRandomOpenings() {
    const numOpenings = Math.floor(this.mazeSize * 0.3); // 30% chance of extra openings
    
    for (let i = 0; i < numOpenings; i++) {
      const x = Math.floor(Math.random() * (this.mazeSize - 2)) + 1;
      const y = Math.floor(Math.random() * (this.mazeSize - 2)) + 1;
      
      // Only open if it doesn't create too large an open area
      if (this.countOpenNeighbors(x, y) <= 2) {
        this.maze[x][y] = 0;
      }
    }
  }
  
  // Count open neighbors for avoiding large open areas
  countOpenNeighbors(x, y) {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.mazeSize && ny >= 0 && ny < this.mazeSize) {
          if (this.maze[nx][ny] === 0) count++;
        }
      }
    }
    return count;
  }
  
  // Discover an area around the player position
  discoverArea(centerX, centerY) {
    const discoveryRadius = 2; // How far around the player can see
    
    for (let x = centerX - discoveryRadius; x <= centerX + discoveryRadius; x++) {
      for (let y = centerY - discoveryRadius; y <= centerY + discoveryRadius; y++) {
        if (x >= 0 && x < this.mazeSize && y >= 0 && y < this.mazeSize) {
          this.discovered.add(`${x},${y}`);
        }
      }
    }
  }
  
  // Find a valid spawn position
  spawnPlayer() {
    for (let attempts = 0; attempts < 100; attempts++) {
      const x = Math.floor(Math.random() * (this.mazeSize - 2)) + 1;
      const y = Math.floor(Math.random() * (this.mazeSize - 2)) + 1;
      
      if (this.maze[x][y] === 0) {
        this.player.x = x;
        this.player.y = y;
        this.discoverArea(x, y);
        this.updateCamera();
        return;
      }
    }
    
    // Fallback: force a spawn
    this.player.x = Math.floor(this.mazeSize / 2);
    this.player.y = Math.floor(this.mazeSize / 2);
    this.maze[this.player.x][this.player.y] = 0;
    this.discoverArea(this.player.x, this.player.y);
    this.updateCamera();
  }
  
  // Populate maze with enemies and loot
  populateEnemies() {
    const enemyTypes = ['bruiser', 'doctor', 'trickster', 'cat', 'robot'];
    const numEnemies = Math.floor(this.mazeSize * this.mazeSize * 0.05); // 5% density
    
    for (let i = 0; i < numEnemies; i++) {
      let x, y;
      let attempts = 0;
      
      do {
        x = Math.floor(Math.random() * this.mazeSize);
        y = Math.floor(Math.random() * this.mazeSize);
        attempts++;
      } while ((this.maze[x][y] === 1 || this.enemies.has(`${x},${y}`) || 
                (x === this.player.x && y === this.player.y)) && attempts < 50);
      
      if (attempts < 50) {
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        this.enemies.set(`${x},${y}`, {
          type: enemyType,
          level: Math.floor(Math.random() * 3) + 1,
          defeated: false
        });
      }
    }
  }
  
  // Update camera to follow player
  updateCamera() {
    const viewportWidth = 800;
    const viewportHeight = 600;
    
    this.camera.x = this.player.x * this.cellSize - viewportWidth / 2;
    this.camera.y = this.player.y * this.cellSize - viewportHeight / 2;
    
    // Clamp camera to maze bounds
    this.camera.x = clamp(this.camera.x, 0, this.mazeSize * this.cellSize - viewportWidth);
    this.camera.y = clamp(this.camera.y, 0, this.mazeSize * this.cellSize - viewportHeight);
  }
  
  // Player movement
  movePlayer(dx, dy) {
    if (this.gameState !== 'exploring') return;
    
    const newX = this.player.x + dx;
    const newY = this.player.y + dy;
    
    // Check bounds and walls (also allow special terrain types 2, 3, 4)
    if (newX >= 0 && newX < this.mazeSize && 
        newY >= 0 && newY < this.mazeSize && 
        (this.maze[newX][newY] === 0 || this.maze[newX][newY] === 2 || 
         this.maze[newX][newY] === 3 || this.maze[newX][newY] === 4)) {
      
      this.player.x = newX;
      this.player.y = newY;
      this.discoverArea(newX, newY);
      this.updateCamera();
      
      // EXPERIMENTAL: Check for special terrain effects
      this.checkTerrainEffects();
      
      // Check for encounters
      this.checkEncounters();
    }
  }
  
  // EXPERIMENTAL: Check for special terrain effects when player moves
  checkTerrainEffects() {
    const terrainType = this.maze[this.player.x][this.player.y];
    
    switch (terrainType) {
      case 2: // Terraformed beneficial terrain
        // Small energy regeneration
        if (this.player.ghis < this.player.maxGhis) {
          this.player.ghis = Math.min(this.player.maxGhis, this.player.ghis + 1);
          this.logBattleAction("🏔️ The terraformed ground energizes you! +1 GHIS");
        }
        break;
      
      case 3: // Sanctified healing ground
        // Healing effect
        if (this.player.hp < this.player.maxHP) {
          const healAmount = 2;
          this.player.hp = Math.min(this.player.maxHP, this.player.hp + healAmount);
          this.logBattleAction(`⛪ The sanctuary's holy light heals you! +${healAmount} HP`);
        }
        break;
      
      case 4: // Vortex rift chaotic space
        // Random chaotic effect
        const chaosRoll = Math.random();
        if (chaosRoll < 0.3) {
          // Positive effect - energy burst
          this.player.ghis = Math.min(this.player.maxGhis, this.player.ghis + 2);
          this.logBattleAction("🌀 The vortex rift surges with energy! +2 GHIS");
        } else if (chaosRoll < 0.6) {
          // Neutral effect - just a visual
          this.logBattleAction("🌀 Reality warps around you... but nothing happens.");
        } else {
          // Negative effect - small damage
          if (this.player.hp > 1) {
            this.player.hp -= 1;
            this.logBattleAction("🌀 The chaotic energies burn you! -1 HP");
          } else {
            this.logBattleAction("🌀 The vortex rift crackles ominously...");
          }
        }
        break;
    }
  }
  
  // Check for enemy encounters or loot
  checkEncounters() {
    const pos = `${this.player.x},${this.player.y}`;
    
    // Enemy encounter
    if (this.enemies.has(pos)) {
      const enemy = this.enemies.get(pos);
      if (!enemy.defeated) {
        this.startBattle(enemy);
      }
    }
    
    // Loot pickup
    if (this.loot.has(pos)) {
      const loot = this.loot.get(pos);
      this.collectLoot(loot);
      this.loot.delete(pos);
    }
  }
  
  // Create enemy stats based on type and level
  createEnemyStats(type, level) {
    const baseStats = {
      bruiser: { hp: 15, persona: 'Brutal Bruiser', color: '#ff4444' },
      doctor: { hp: 12, persona: 'Mystic Doctor', color: '#44ff44' },
      trickster: { hp: 10, persona: 'Cunning Trickster', color: '#ffff44' },
      cat: { hp: 8, persona: 'Feral Cat', color: '#ff44ff' },
      robot: { hp: 18, persona: 'Steel Automaton', color: '#4444ff' }
    };
    
    const enemyBase = baseStats[type] || baseStats.bruiser;
    const hpBonus = level * 3; // Scale HP with level
    
    return {
      hp: enemyBase.hp + hpBonus,
      maxHP: enemyBase.hp + hpBonus,
      persona: enemyBase.persona,
      type: type,
      level: level,
      color: enemyBase.color,
      status: {} // For status effects like burn, stun, etc.
    };
  }

  // Start battle with enemy
  startBattle(enemy) {
    this.gameState = 'battle';
    
    // Create proper enemy with stats based on type and level
    const enemyStats = this.createEnemyStats(enemy.type, enemy.level);
    
    this.currentBattle = {
      enemy: enemyStats,
      enemyData: enemy,
      playerInitialCards: [...this.player.cards],
      battleState: 'player_turn' // 'player_turn', 'enemy_turn', 'ended'
    };
    
    // Initialize battle menu
    this.initializeBattleMenu();
    
    // Regenerate GHIS for battle
    this.player.ghis = this.player.maxGhis;
    
    recordBattle({ mode: 'metroidvania', opponent: enemy.type });
  }
  
  // Initialize battle menu options
  initializeBattleMenu() {
    this.battleMenu.selectedOption = 0;
    this.battleMenu.options = [];
    
    // Add available actions based on player abilities
    if (this.player.abilities.has('strike')) {
      this.battleMenu.options.push({
        text: `Attack (Strike)`,
        action: 'strike',
        cost: 0, // Strike costs no ghis - basic attack
        enabled: true, // Always enabled since it costs nothing
        description: `Deal ${3 + this.player.stats.strike} damage`
      });
    }
    
    if (this.player.abilities.has('shield')) {
      this.battleMenu.options.push({
        text: `Defend (Shield)`,
        action: 'shield',
        cost: 0, // Shield costs no ghis - basic defense
        enabled: true, // Always enabled since it costs nothing
        description: `Block ${5 + this.player.stats.shield} damage`
      });
    }
    
    if (this.player.abilities.has('pierce')) {
      const pierceCost = this.getResonanceEnergyCost(2); // Apply vortex rift discount
      this.battleMenu.options.push({
        text: `Pierce Attack`,
        action: 'pierce',
        cost: pierceCost,
        enabled: this.player.ghis >= pierceCost,
        description: `Deal ${1 + this.player.stats.pierce} piercing damage${pierceCost < 2 ? ' (Vortex discount!)' : ''}`
      });
    }
    
    if (this.player.abilities.has('hope')) {
      const hopeCost = this.getResonanceEnergyCost(1); // Apply vortex rift discount
      this.battleMenu.options.push({
    if (this.player.abilities.has('hope')) {
      const hopeCost = this.getResonanceEnergyCost(1); // Apply vortex rift discount
      this.battleMenu.options.push({
        text: `Hope (Heal)`,
        action: 'mazehope',
        cost: hopeCost,
        enabled: this.player.ghis >= hopeCost,
        description: `Heal ${1 + this.player.stats.hope} HP${hopeCost < 1 ? ' (Vortex discount!)' : ''}`
      });
    }
    
    if (this.player.abilities.has('zap')) {
      const zapCost = this.getResonanceEnergyCost(1); // Apply vortex rift discount
      this.battleMenu.options.push({
        text: `Zap (Stun)`,
        action: 'mazezap',
        cost: zapCost,
        enabled: this.player.ghis >= zapCost,
        description: `${10 + (this.player.stats.zap * 10)}% chance to stun enemy${zapCost < 1 ? ' (Vortex discount!)' : ''}`
      });
    }
    
    if (this.player.abilities.has('ignite')) {
      const igniteCost = this.getResonanceEnergyCost(2); // Apply vortex rift discount
      this.battleMenu.options.push({
        text: `Ignite (Burn)`,
        action: 'mazeignite',
        cost: igniteCost,
        enabled: this.player.ghis >= igniteCost,
        description: `Deal 2 damage + burn for ${2 + this.player.stats.ignite} turns${igniteCost < 2 ? ' (Vortex discount!)' : ''}`
      });
    }
    
    // Always available: Wait (regenerate GHIS)
    this.battleMenu.options.push({
      text: `Wait`,
      action: 'wait',
      cost: 0,
      enabled: true,
      description: `Regenerate 1 GHIS energy`
    });
  }
  
  // Execute selected battle action
  executeBattleAction() {
    if (this.gameState !== 'battle' || this.currentBattle.battleState !== 'player_turn') {
      return;
    }
    
    const selectedOption = this.battleMenu.options[this.battleMenu.selectedOption];
    if (!selectedOption || !selectedOption.enabled) {
      return;
    }
    
    let success = false;
    
    switch (selectedOption.action) {
      case 'strike':
        if (this.player.abilities.has('strike')) {
          let damage = 3 + this.player.stats.strike;
          
          // EXPERIMENTAL: Apply resonance effects
          const resonanceEffect = this.applyResonanceToCard({ type: 'attack' }, damage, 0, 0);
          damage = resonanceEffect.damage;
          
          this.currentBattle.enemy.hp -= damage;
          // Strike costs no ghis - removed ghis consumption
          success = true;
          
          // Show resonance bonus if applicable
          const resonance = this.getLocationResonance(this.player.x, this.player.y);
          const resonanceText = resonance && resonance.bonusDamage ? ` (+${resonance.bonusDamage} resonance)` : '';
          this.logBattleAction(`You strike for ${damage} damage!${resonanceText}`);
        }
        break;
        
      case 'shield':
        if (this.player.abilities.has('shield')) {
          let shieldAmount = 5 + this.player.stats.shield;
          
          // EXPERIMENTAL: Apply resonance effects
          const resonanceEffect = this.applyResonanceToCard({ type: 'skill' }, 0, shieldAmount, 0);
          shieldAmount = resonanceEffect.shield;
          
          this.player.shield = (this.player.shield || 0) + shieldAmount;
          // Shield costs no ghis - removed ghis consumption
          success = true;
          
          // Show resonance bonus if applicable
          const resonance = this.getLocationResonance(this.player.x, this.player.y);
          const resonanceText = resonance && resonance.bonusShield ? ` (+${resonance.bonusShield} resonance)` : '';
          this.logBattleAction(`You gain ${shieldAmount} shield!${resonanceText}`);
        }
        break;
        
      case 'pierce':
        const pierceCost = this.getResonanceEnergyCost(2);
        if (this.player.abilities.has('pierce') && this.player.ghis >= pierceCost) {
          const damage = 1 + this.player.stats.pierce;
          this.currentBattle.enemy.hp -= damage;
          this.player.ghis -= pierceCost;
          success = true;
          
          const discountText = pierceCost < 2 ? ' (Vortex discount!)' : '';
          this.logBattleAction(`You pierce for ${damage} damage (ignores armor)!${discountText}`);
        }
        break;
        
      case 'mazehope':
        const hopeCost = this.getResonanceEnergyCost(1);
        if (this.player.abilities.has('hope') && this.player.ghis >= hopeCost) {
          let healAmount = 1 + this.player.stats.hope;
          
          // EXPERIMENTAL: Apply resonance effects
          const resonanceEffect = this.applyResonanceToCard({ type: 'heal' }, 0, 0, healAmount);
          healAmount = resonanceEffect.heal;
          
          this.player.hp = Math.min(this.player.maxHP, this.player.hp + healAmount);
          this.player.ghis -= hopeCost;
          success = true;
          
          // Show resonance bonus if applicable
          const resonance = this.getLocationResonance(this.player.x, this.player.y);
          const resonanceText = resonance && resonance.bonusHeal ? ` (+${resonance.bonusHeal} resonance)` : '';
          const discountText = hopeCost < 1 ? ' (Vortex discount!)' : '';
          this.logBattleAction(`You use Hope to heal ${healAmount} HP!${resonanceText}${discountText}`);
        }
        break;
        
      case 'mazezap':
        const zapCost = this.getResonanceEnergyCost(1);
        if (this.player.abilities.has('zap') && this.player.ghis >= zapCost) {
          const stunChance = 10 + (this.player.stats.zap * 10);
          const stunSuccess = Math.random() * 100 < stunChance;
          
          if (stunSuccess) {
            // Add stun status to enemy (freeze their next turn)
            this.currentBattle.enemy.status = this.currentBattle.enemy.status || {};
            this.currentBattle.enemy.status.stunned = true;
            this.logBattleAction(`You zap the enemy! They are stunned and will lose their next turn!`);
          } else {
            this.logBattleAction(`You zap the enemy, but they resist the stun effect.`);
          }
          
          // Small damage regardless
          this.currentBattle.enemy.hp -= 1;
          this.player.ghis -= zapCost;
          success = true;
          
          const discountText = zapCost < 1 ? ' (Vortex discount!)' : '';
          if (stunSuccess) {
            this.logBattleAction(`You zap the enemy! They are stunned and will lose their next turn!${discountText}`);
          } else {
            this.logBattleAction(`You zap the enemy, but they resist the stun effect.${discountText}`);
          }
        }
        break;
        
      case 'mazeignite':
        const igniteCost = this.getResonanceEnergyCost(2);
        if (this.player.abilities.has('ignite') && this.player.ghis >= igniteCost) {
          const damage = 2;
          const burnTurns = 2 + this.player.stats.ignite;
          
          this.currentBattle.enemy.hp -= damage;
          
          // Add burn status
          this.currentBattle.enemy.status = this.currentBattle.enemy.status || {};
          this.currentBattle.enemy.status.burn = (this.currentBattle.enemy.status.burn || 0) + 1;
          this.currentBattle.enemy.status.burnTurns = (this.currentBattle.enemy.status.burnTurns || 0) + burnTurns;
          
          this.player.ghis -= igniteCost;
          success = true;
          
          const discountText = igniteCost < 2 ? ' (Vortex discount!)' : '';
          this.logBattleAction(`You ignite the enemy for ${damage} damage + burn for ${burnTurns} turns!${discountText}`);
        }
        break;
        
      case 'wait':
        this.player.ghis = Math.min(this.player.maxGhis, this.player.ghis + 1);
        success = true;
        this.logBattleAction(`You wait and regenerate 1 GHIS energy.`);
        break;
    }
    
    if (success) {
      this.checkBattleEnd();
      if (this.gameState === 'battle') {
        this.currentBattle.battleState = 'enemy_turn';
        setTimeout(() => {
          this.executeEnemyTurn();
        }, 1000); // Delay for dramatic effect
      }
    }
  }

  // Player uses ability during battle (legacy function for compatibility)
  useAbility(abilityType) {
    // This function is now handled by the menu system
    return;
  }
  
  // Execute enemy turn
  executeEnemyTurn() {
    if (this.gameState !== 'battle') return;
    
    const enemy = this.currentBattle.enemy;
    
    // Add enemy turn animation state
    this.enemyTurnPhase = 'thinking';
    this.enemyTurnTimer = 0;
    
    // Log enemy thinking message
    this.logBattleAction(`${enemy.persona || 'Enemy'} is thinking...`);
    
    // Show "Enemy is thinking..." for a brief moment
    setTimeout(() => {
      this.enemyTurnPhase = 'acting';
      this.logBattleAction(`${enemy.persona || 'Enemy'} takes their turn`);
      this.processEnemyAction(enemy);
    }, 800);
  }
  
  // Process the actual enemy action
  processEnemyAction(enemy) {
    // Check if enemy is stunned
    if (enemy.status && enemy.status.stunned) {
      this.logBattleAction(`${enemy.persona || 'Enemy'} is stunned and loses their turn!`);
      enemy.status.stunned = false; // Remove stun after one turn
      
      // Apply burn damage if present
      this.applyEnemyStatusEffects(enemy);
      
      this.endEnemyTurn();
      return;
    }
    
    // Enemy AI decision making
    const actions = this.getEnemyActions(enemy);
    const selectedAction = this.selectEnemyAction(actions, enemy);
    
    // Execute the selected action
    this.executeEnemyAction(selectedAction, enemy);
    
    // Apply status effects at end of turn
    this.applyEnemyStatusEffects(enemy);
    
    this.endEnemyTurn();
  }
  
  // Get available enemy actions based on type and status
  getEnemyActions(enemy) {
    const actions = [];
    
    // All enemies can attack
    actions.push({
      type: 'attack',
      damage: this.getEnemyAttackDamage(enemy),
      priority: 70
    });
    
    // Some enemies have special abilities based on type
    switch (enemy.type) {
      case 'doctor':
        if (enemy.hp < enemy.maxHP * 0.5) {
          actions.push({ type: 'heal', amount: 3, priority: 90 });
        }
        break;
      case 'trickster':
        actions.push({ type: 'stun_attempt', priority: 60 });
        break;
      case 'robot':
        if (Math.random() < 0.3) {
          actions.push({ type: 'power_attack', damage: this.getEnemyAttackDamage(enemy) * 1.5, priority: 80 });
        }
        break;
    }
    
    return actions;
  }
  
  // Select best enemy action based on AI logic
  selectEnemyAction(actions, enemy) {
    // Simple AI: pick highest priority action, with some randomness
    const sortedActions = actions.sort((a, b) => b.priority - a.priority);
    
    // 70% chance to pick best action, 30% chance for variety
    if (Math.random() < 0.7) {
      return sortedActions[0];
    } else {
      return sortedActions[Math.floor(Math.random() * sortedActions.length)];
    }
  }
  
  // Execute the enemy's selected action
  executeEnemyAction(action, enemy) {
    switch (action.type) {
      case 'attack':
        this.performEnemyAttack(action.damage, enemy);
        break;
      case 'power_attack':
        this.logBattleAction(`${enemy.persona} charges up for a powerful attack!`);
        this.performEnemyAttack(action.damage, enemy);
        break;
      case 'heal':
        enemy.hp = Math.min(enemy.maxHP, enemy.hp + action.amount);
        this.logBattleAction(`${enemy.persona} heals for ${action.amount} HP!`);
        break;
      case 'stun_attempt':
        if (Math.random() < 0.3) {
          this.player.stunned = true;
          this.logBattleAction(`${enemy.persona} attempts to confuse you! You feel disoriented!`);
        } else {
          this.logBattleAction(`${enemy.persona} tries to confuse you, but you resist!`);
        }
        break;
    }
  }
  
  // Perform enemy attack
  performEnemyAttack(damage, enemy) {
    let actualDamage = damage;
    
    if (this.player.shield > 0) {
      const shieldBlock = Math.min(this.player.shield, damage);
      this.player.shield -= shieldBlock;
      actualDamage -= shieldBlock;
      this.logBattleAction(`Your shield blocks ${shieldBlock} damage!`);
    }
    
    this.player.hp -= Math.max(0, actualDamage);
    this.logBattleAction(`${enemy.persona} attacks for ${actualDamage} damage!`);
  }
  
  // Get enemy attack damage based on type and level
  getEnemyAttackDamage(enemy) {
    const baseDamage = {
      bruiser: 4,
      doctor: 2,
      trickster: 3,
      cat: 2,
      robot: 5
    };
    
    const base = baseDamage[enemy.type] || 3;
    const levelBonus = Math.floor(enemy.level / 2);
    const variance = Math.floor(Math.random() * 3); // 0-2 random variance
    
    return base + levelBonus + variance;
  }
  
  // End enemy turn and transition back to player
  endEnemyTurn() {
    this.checkBattleEnd();
    if (this.gameState === 'battle') {
      this.currentBattle.battleState = 'player_turn';
      // Regenerate some GHIS
      this.player.ghis = Math.min(this.player.maxGhis, this.player.ghis + 1);
      // Reinitialize menu for next turn
      this.initializeBattleMenu();
      
      // Reset enemy turn state
      this.enemyTurnPhase = null;
    }
  }
  
  // Apply status effects to enemy at end of their turn
  applyEnemyStatusEffects(enemy) {
    if (!enemy.status) return;
    
    // Apply burn damage
    if (enemy.status.burn && enemy.status.burnTurns > 0) {
      const burnDamage = enemy.status.burn;
      enemy.hp -= burnDamage;
      enemy.status.burnTurns--;
      
      this.logBattleAction(`${enemy.persona || 'Enemy'} takes ${burnDamage} burn damage!`);
      
      // Remove burn if duration is over
      if (enemy.status.burnTurns <= 0) {
        enemy.status.burn = 0;
        enemy.status.burnTurns = 0;
      }
    }
  }
  
  // Check if battle has ended
  checkBattleEnd() {
    if (this.currentBattle.enemy.hp <= 0) {
      // Player wins
      this.winBattle();
    } else if (this.player.hp <= 0) {
      // Player loses
      this.loseBattle();
    }
  }
  
  // Player wins battle
  winBattle() {
    const enemy = this.currentBattle.enemyData;
    enemy.defeated = true;
    
    // Generate loot (cards)
    const lootCards = this.generateLoot(enemy);
    
    this.logBattleAction(`Victory! You found: ${lootCards.map(c => c.name).join(', ')}`);
    
    // Add cards to player collection
    lootCards.forEach(card => {
      this.addCardToPlayer(card);
    });
    
    this.gameState = 'exploring';
    this.currentBattle = null;
    
    // Restore some HP
    this.player.hp = Math.min(this.player.maxHP, this.player.hp + 5);
  }
  
  // Player loses battle
  loseBattle() {
    this.gameState = 'game_over';
    this.currentBattle = null;
    
    // Show Judge game over modal
    this.showJudgeGameOver();
  }
  
  // Generate loot from defeated enemy
  generateLoot(enemy) {
    const lootCards = [];
    // Include maze explorer cards in the loot pool + EXPERIMENTAL reconstruction cards
    const cardPool = CARDS.filter(card => 
      ['heart', 'swords', 'shield', 'mazesurge', 'mazepierce', 'mazehope', 'mazezap', 'mazeignite'].includes(card.id)
    );
    
    // EXPERIMENTAL: Small chance for reconstruction cards from higher level enemies
    const reconstructionPool = CARDS.filter(card => 
      ['bridge', 'terraform', 'sanctify', 'vortexrift'].includes(card.id)
    );
    
    // Number of cards based on enemy level (ensure at least 1 card drops)
    const numCards = Math.max(1, enemy.level);
    
    for (let i = 0; i < numCards; i++) {
      // Small chance for reconstruction card if enemy level 2+
      if (enemy.level >= 2 && Math.random() < 0.3) {
        const reconstructionCard = reconstructionPool[Math.floor(Math.random() * reconstructionPool.length)];
        lootCards.push(reconstructionCard);
        this.logBattleAction(`🌟 RARE DISCOVERY: You found a ${reconstructionCard.name} reconstruction card!`);
      } else {
        const card = cardPool[Math.floor(Math.random() * cardPool.length)];
        lootCards.push(card);
      }
    }
    
    return lootCards;
  }
  
  // Add card to player and update abilities
  addCardToPlayer(card) {
    this.player.cards.push(card);
    
    // Update player stats and abilities based on card type
    switch (card.id) {
      case 'swords': // Strike cards
        this.player.abilities.add('strike');
        this.player.stats.strike++;
        break;
        
      case 'shield': // Shield cards  
        this.player.abilities.add('shield');
        this.player.stats.shield++;
        break;
        
      case 'mazesurge': // Surge cards affect max GHIS
        this.player.stats.surge++;
        this.player.maxGhis = Math.max(1, this.player.stats.surge); // Start with 1 ghis per surge card
        this.player.ghis = this.player.maxGhis; // Restore ghis when gaining surge
        break;
        
      case 'mazepierce': // Pierce cards
        this.player.abilities.add('pierce');
        this.player.stats.pierce++;
        break;
        
      case 'heart': // Heart cards increase max HP by 5 (as per problem statement)
        this.player.maxHP += 5;
        this.player.hp = Math.min(this.player.maxHP, this.player.hp + 5); // Heal when gaining heart
        break;
        
      case 'mazehope': // Hope cards for healing ability
        this.player.abilities.add('hope');
        this.player.stats.hope++;
        break;
        
      case 'mazezap': // Zap cards for stunning
        this.player.abilities.add('zap');
        this.player.stats.zap++;
        break;
        
      case 'mazeignite': // Ignite cards for burn damage
        this.player.abilities.add('ignite');
        this.player.stats.ignite++;
        break;
    }
    
    recordCardPlayed(card.id);
  }
  
  // Find safe respawn location
  findSafeRespawn() {
    // Find an area without nearby enemies
    for (let attempts = 0; attempts < 50; attempts++) {
      const x = Math.floor(Math.random() * this.mazeSize);
      const y = Math.floor(Math.random() * this.mazeSize);
      
      if (this.maze[x][y] === 0 && this.isSafeArea(x, y)) {
        this.player.x = x;
        this.player.y = y;
        this.updateCamera();
        return;
      }
    }
    
    // Fallback to spawn area
    this.spawnPlayer();
  }
  
  // Check if area is safe (no enemies nearby)
  isSafeArea(x, y) {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const checkPos = `${x + dx},${y + dy}`;
        if (this.enemies.has(checkPos) && !this.enemies.get(checkPos).defeated) {
          return false;
        }
      }
    }
    return true;
  }
  
  // Log battle actions
  logBattleAction(message) {
    console.log(`[BATTLE] ${message}`);
    
    // Add to the maze log UI
    const logContent = document.getElementById('mazeLogContent');
    if (logContent) {
      const logEntry = document.createElement('div');
      logEntry.textContent = `• ${message}`;
      logContent.appendChild(logEntry);
      
      // Auto-scroll to bottom
      logContent.scrollTop = logContent.scrollHeight;
      
      // Keep only last 50 entries to prevent memory issues
      while (logContent.children.length > 50) {
        logContent.removeChild(logContent.firstChild);
      }
    }
  }
  
  // Show Judge game over modal
  showJudgeGameOver() {
    const modal = document.getElementById('judgeGameOverModal');
    const textElement = document.getElementById('judgeGameOverText');
    
    const gameOverMessages = [
      "Your journey ends here, explorer. But knowledge is eternal...",
      "The maze claims another soul. Yet wisdom persists beyond death.",
      "You have fallen, but your discoveries live on. Rise again, if you dare.",
      "Death is but a teacher. What lessons will you carry forward?",
      "The shadows consume you, but the light of understanding remains.",
      "Your path ends in darkness, but others may find the way..."
    ];
    
    const randomMessage = gameOverMessages[Math.floor(Math.random() * gameOverMessages.length)];
    textElement.textContent = `"${randomMessage}"`;
    
    if (modal) {
      modal.hidden = false;
    }
  }
  
  // Restart the maze exploration
  restartExploration() {
    // Reset player to starting state
    this.player = {
      x: 0,
      y: 0,
      hp: 5,
      maxHP: 5,
      ghis: 0,
      maxGhis: 0,
      cards: [],
      abilities: new Set(),
      stats: {
        strike: 0,
        shield: 0,
        surge: 0,
        pierce: 0,
        hope: 0,
        zap: 0,
        ignite: 0
      }
    };
    
    // Generate new maze
    this.generateMaze();
    this.spawnPlayer();
    this.populateEnemies();
    
    // Give player starting cards from the JUDGE
    this.giveStartingCards();
    
    // Reset game state
    this.gameState = 'exploring';
    this.currentBattle = null;
    this.discovered.clear();
    this.camera = { x: 0, y: 0 };
    
    // Hide game over modal
    const modal = document.getElementById('judgeGameOverModal');
    if (modal) {
      modal.hidden = true;
    }
  }
  
  // Show equipment menu
  showEquipmentMenu() {
    this.updateEquipmentModal();
    const modal = document.getElementById('mazeEquipmentModal');
    if (modal) {
      modal.hidden = false;
    }
  }
  
  // Update equipment modal content
  updateEquipmentModal() {
    // Update player stats
    document.getElementById('mazeStatsHP').textContent = `${this.player.hp}/${this.player.maxHP}`;
    document.getElementById('mazeStatsGHIS').textContent = `${this.player.ghis}/${this.player.maxGhis}`;
    document.getElementById('mazeStatsPos').textContent = `${this.player.x}, ${this.player.y}`;
    document.getElementById('mazeStatsCards').textContent = this.player.cards.length;
    
    // Separate basic actions from GHIS abilities
    const basicActions = new Set();
    const ghisAbilities = new Set();
    
    // Always include 'wait' as a basic action if player has any abilities
    if (this.player.abilities.size > 0) {
      basicActions.add('wait');
    }
    
    for (const ability of this.player.abilities) {
      const abilityInfo = this.getAbilityInfo(ability);
      if (abilityInfo.cost === 0) {
        basicActions.add(ability);
      } else {
        ghisAbilities.add(ability);
      }
    }
    
    // Update basic actions list
    const basicActionsList = document.getElementById('mazeBasicActionsList');
    if (basicActions.size === 0) {
      basicActionsList.innerHTML = '<div style="color:#888; text-align:center; padding:20px;">No basic actions unlocked yet.</div>';
    } else {
      let actionsHTML = '';
      for (const action of basicActions) {
        const stat = this.player.stats[action] || 0;
        const abilityInfo = this.getAbilityInfo(action);
        actionsHTML += `
          <div class="maze-ability-item">
            <div>
              <div class="maze-ability-name">${abilityInfo.icon} ${abilityInfo.name}</div>
              <div style="font-size:12px; color:#bbb;">${abilityInfo.description}</div>
            </div>
            <div style="text-align:right;">
              <div class="maze-ability-cost">Cost: ${abilityInfo.cost} GHIS</div>
              <div class="maze-ability-stats">Level: ${stat}</div>
            </div>
          </div>
        `;
      }
      basicActionsList.innerHTML = actionsHTML;
    }
    
    // Update GHIS abilities list
    const abilitiesList = document.getElementById('mazeAbilitiesList');
    if (ghisAbilities.size === 0) {
      abilitiesList.innerHTML = '<div style="color:#888; text-align:center; padding:20px;">No GHIS abilities unlocked yet. Defeat enemies to find cards!</div>';
    } else {
      let abilitiesHTML = '';
      for (const ability of ghisAbilities) {
        const stat = this.player.stats[ability] || 0;
        const abilityInfo = this.getAbilityInfo(ability);
        abilitiesHTML += `
          <div class="maze-ability-item">
            <div>
              <div class="maze-ability-name">${abilityInfo.icon} ${abilityInfo.name}</div>
              <div style="font-size:12px; color:#bbb;">${abilityInfo.description}</div>
            </div>
            <div style="text-align:right;">
              <div class="maze-ability-cost">Cost: ${abilityInfo.cost} GHIS</div>
              <div class="maze-ability-stats">Level: ${stat}</div>
            </div>
          </div>
        `;
      }
      abilitiesList.innerHTML = abilitiesHTML;
    }
    
    // Update cards list
    const cardsList = document.getElementById('mazeCardsList');
    if (this.player.cards.length === 0) {
      cardsList.innerHTML = '<div style="color:#888; text-align:center; padding:20px;">No cards collected yet.</div>';
    } else {
      let cardsHTML = '';
      const cardCounts = {};
      this.player.cards.forEach(card => {
        cardCounts[card.name] = (cardCounts[card.name] || 0) + 1;
      });
      
      for (const [cardName, count] of Object.entries(cardCounts)) {
        cardsHTML += `<span class="maze-card-item">${cardName} ${count > 1 ? `(x${count})` : ''}</span>`;
      }
      cardsList.innerHTML = cardsHTML;
    }
  }
  
  // Get ability information for display
  getAbilityInfo(ability) {
    const abilityData = {
      strike: { icon: '⚔️', name: 'Strike', description: 'Basic attack', cost: 0 },
      shield: { icon: '🛡️', name: 'Shield', description: 'Block incoming damage', cost: 0 },
      wait: { icon: '⏳', name: 'Wait', description: 'Regenerate 1 GHIS energy', cost: 0 },
      pierce: { icon: '🗡️', name: 'Pierce', description: 'Piercing attack', cost: 2 },
      hope: { icon: '💚', name: 'Hope', description: 'Heal HP', cost: 1 },
      zap: { icon: '⚡', name: 'Zap', description: 'Chance to stun enemy', cost: 1 },
      ignite: { icon: '🔥', name: 'Ignite', description: 'Burn damage over time', cost: 2 },
      surge: { icon: '⭐', name: 'Surge', description: 'Increase max GHIS', cost: 0 }
    };
    
    return abilityData[ability] || { icon: '❓', name: ability, description: 'Unknown ability', cost: 0 };
  }
  
  // Render the game
  render(ctx) {
    if (!ctx) return;
    
    const viewportWidth = ctx.canvas.width;
    const viewportHeight = ctx.canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    
    // Render JUDGE dialogue if in intro state
    if (this.gameState === 'judge_intro') {
      this.renderJudgeDialogue(ctx, viewportWidth, viewportHeight);
      return;
    }
    
    // Render maze
    this.renderMaze(ctx, viewportWidth, viewportHeight);
    
    // Render entities
    this.renderEntities(ctx);
    
    // Render UI
    this.renderUI(ctx, viewportWidth, viewportHeight);
    
    // Render battle UI if in battle
    if (this.gameState === 'battle') {
      this.updateCombatUI();
    } else {
      this.hideCombatUI();
    }
  }
  
  // Render JUDGE introduction dialogue
  renderJudgeDialogue(ctx, viewportWidth, viewportHeight) {
    // Dark background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    
    // JUDGE figure (centered, imposing)
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚖️', viewportWidth / 2, 150);
    
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px serif';
    ctx.fillText('THE JUDGE', viewportWidth / 2, 200);
    
    // Current dialogue text
    const currentText = this.judgeDialogue.steps[this.judgeDialogue.currentStep];
    if (currentText) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      
      // Word wrap the text
      const maxWidth = viewportWidth - 100;
      const words = currentText.split(' ');
      let line = '';
      let y = 300;
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, viewportWidth / 2, y);
          line = words[n] + ' ';
          y += 30;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, viewportWidth / 2, y);
    }
    
    // Progress indicator
    ctx.fillStyle = '#888888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.judgeDialogue.currentStep + 1} / ${this.judgeDialogue.steps.length}`, viewportWidth / 2, viewportHeight - 80);
    
    // Instructions
    ctx.fillStyle = '#4ecdc4';
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    
    // Detect touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
      ctx.fillText('Tap to continue...', viewportWidth / 2, viewportHeight - 60);
      // Show skip option if available
      if (this.judgeDialogue.hasSeenBefore) {
        ctx.fillStyle = '#ffaa00';
        ctx.font = '14px serif';
        ctx.fillText('Double-tap to skip', viewportWidth / 2, viewportHeight - 40);
      }
    } else {
      ctx.fillText('Press SPACE or ENTER to continue...', viewportWidth / 2, viewportHeight - 60);
      // Show skip option if available  
      if (this.judgeDialogue.hasSeenBefore) {
        ctx.fillStyle = '#ffaa00';
        ctx.font = '14px serif';
        ctx.fillText('Press S to skip', viewportWidth / 2, viewportHeight - 40);
      }
    }
    
    ctx.textAlign = 'left'; // Reset alignment
  }
  
  // Render maze
  renderMaze(ctx, viewportWidth, viewportHeight) {
    const startX = Math.floor(this.camera.x / this.cellSize);
    const startY = Math.floor(this.camera.y / this.cellSize);
    const endX = Math.min(this.mazeSize, startX + Math.ceil(viewportWidth / this.cellSize) + 1);
    const endY = Math.min(this.mazeSize, startY + Math.ceil(viewportHeight / this.cellSize) + 1);
    
    for (let x = Math.max(0, startX); x < endX; x++) {
      for (let y = Math.max(0, startY); y < endY; y++) {
        const screenX = x * this.cellSize - this.camera.x;
        const screenY = y * this.cellSize - this.camera.y;
        
        // Only render discovered areas
        if (this.discovered.has(`${x},${y}`)) {
          // Check for maze modifications first
          const modification = this.mazeModifications.get(`${x},${y}`);
          
          if (this.maze[x][y] === 1) {
            // Wall - more atmospheric stone texture effect
            const gradient = ctx.createLinearGradient(screenX, screenY, screenX + this.cellSize, screenY + this.cellSize);
            gradient.addColorStop(0, '#3a3a5a');
            gradient.addColorStop(0.5, '#2a2a4a');
            gradient.addColorStop(1, '#1a1a3a');
            ctx.fillStyle = gradient;
            ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
            
            // Add texture highlights
            ctx.fillStyle = 'rgba(100, 100, 120, 0.3)';
            ctx.fillRect(screenX + 2, screenY + 2, 4, 4);
            ctx.fillRect(screenX + this.cellSize - 6, screenY + this.cellSize - 6, 4, 4);
          } else if (this.maze[x][y] === 2) {
            // EXPERIMENTAL: Terraformed beneficial terrain
            const gradient = ctx.createLinearGradient(screenX, screenY, screenX + this.cellSize, screenY + this.cellSize);
            gradient.addColorStop(0, '#4a6a3a');
            gradient.addColorStop(0.5, '#3a5a2a');
            gradient.addColorStop(1, '#2a4a1a');
            ctx.fillStyle = gradient;
            ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
            
            // Glowing resonance effect
            ctx.fillStyle = 'rgba(100, 255, 100, 0.3)';
            ctx.fillRect(screenX + 4, screenY + 4, this.cellSize - 8, this.cellSize - 8);
          } else if (this.maze[x][y] === 3) {
            // EXPERIMENTAL: Sanctified healing ground
            const gradient = ctx.createRadialGradient(
              screenX + this.cellSize/2, screenY + this.cellSize/2, 0,
              screenX + this.cellSize/2, screenY + this.cellSize/2, this.cellSize/2
            );
            gradient.addColorStop(0, '#5a5aaa');
            gradient.addColorStop(0.5, '#4a4a8a');
            gradient.addColorStop(1, '#3a3a6a');
            ctx.fillStyle = gradient;
            ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
            
            // Healing aura
            ctx.fillStyle = 'rgba(100, 100, 255, 0.4)';
            ctx.fillRect(screenX + 2, screenY + 2, this.cellSize - 4, this.cellSize - 4);
          } else if (this.maze[x][y] === 4) {
            // EXPERIMENTAL: Vortex rift chaotic space
            const time = Date.now() * 0.001;
            const intensity = Math.sin(time * 2) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(${100 * intensity}, ${50 * intensity}, ${150 * intensity}, 0.8)`;
            ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
            
            // Chaotic energy swirls
            ctx.fillStyle = `rgba(200, 100, 255, ${0.5 * intensity})`;
            const swirl1X = screenX + (Math.sin(time * 3) * this.cellSize/4) + this.cellSize/2;
            const swirl1Y = screenY + (Math.cos(time * 3) * this.cellSize/4) + this.cellSize/2;
            ctx.fillRect(swirl1X - 2, swirl1Y - 2, 4, 4);
          } else {
            // Regular floor - darker, more atmospheric
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
            
            // Subtle floor pattern
            ctx.fillStyle = 'rgba(50, 50, 70, 0.5)';
            ctx.fillRect(screenX + this.cellSize/2 - 1, screenY + this.cellSize/2 - 1, 2, 2);
          }
          
          // EXPERIMENTAL: Show reconstruction effects overlay
          if (modification) {
            this.renderReconstructionEffect(ctx, screenX, screenY, modification);
          }
        } else {
          // Undiscovered - deeper darkness
          ctx.fillStyle = '#000010';
          ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
        }
        
        // More subtle grid lines
        if (this.discovered.has(`${x},${y}`)) {
          ctx.strokeStyle = 'rgba(100, 100, 120, 0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX, screenY, this.cellSize, this.cellSize);
        }
      }
    }
  }
  
  // EXPERIMENTAL: Render special effects for reconstructed areas
  renderReconstructionEffect(ctx, screenX, screenY, modification) {
    if (!modification) return;
    
    const time = Date.now() * 0.001;
    
    switch (modification.type) {
      case 'bridge':
        // Shimmer effect for bridges
        ctx.fillStyle = `rgba(119, 255, 221, ${0.2 + Math.sin(time * 2) * 0.1})`;
        ctx.fillRect(screenX + 2, screenY + 2, this.cellSize - 4, this.cellSize - 4);
        break;
      
      case 'terraform':
        // Pulsing green energy for terraformed areas
        const greenIntensity = 0.3 + Math.sin(time * 1.5) * 0.1;
        ctx.fillStyle = `rgba(100, 255, 100, ${greenIntensity})`;
        ctx.fillRect(screenX + 4, screenY + 4, this.cellSize - 8, this.cellSize - 8);
        break;
      
      case 'sanctify':
        // Holy light effect for sanctuaries
        const holyIntensity = 0.4 + Math.sin(time * 1) * 0.2;
        ctx.fillStyle = `rgba(200, 200, 255, ${holyIntensity})`;
        ctx.fillRect(screenX + 1, screenY + 1, this.cellSize - 2, this.cellSize - 2);
        break;
      
      case 'vortexrift':
        // Chaotic energy swirls
        const chaosIntensity = Math.sin(time * 3) * 0.3 + 0.5;
        ctx.fillStyle = `rgba(255, 100, 255, ${chaosIntensity})`;
        const centerX = screenX + this.cellSize / 2;
        const centerY = screenY + this.cellSize / 2;
        
        // Draw swirling energy
        for (let i = 0; i < 3; i++) {
          const angle = (time * 2) + (i * Math.PI * 2 / 3);
          const radius = this.cellSize / 4;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
        break;
    }
  }
  
  // Render entities (player, enemies, loot)
  renderEntities(ctx) {
    // Render player with pixel sprite
    const playerScreenX = this.player.x * this.cellSize - this.camera.x + this.cellSize / 6;
    const playerScreenY = this.player.y * this.cellSize - this.camera.y + this.cellSize / 6;
    const playerSize = this.cellSize * 2/3;
    
    // Player glow effect
    const gradient = ctx.createRadialGradient(
      playerScreenX + playerSize/2, playerScreenY + playerSize/2, 0,
      playerScreenX + playerSize/2, playerScreenY + playerSize/2, playerSize + 6
    );
    gradient.addColorStop(0, 'rgba(0, 255, 136, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(playerScreenX - 6, playerScreenY - 6, playerSize + 12, playerSize + 12);
    
    // Draw pixel sprite player
    this.drawPlayerSprite(ctx, playerScreenX, playerScreenY, playerSize);
    
    // Render enemies with unique pixel sprites
    for (const [pos, enemy] of this.enemies) {
      if (enemy.defeated) continue;
      
      const [x, y] = pos.split(',').map(Number);
      if (!this.discovered.has(pos)) continue;
      
      const screenX = x * this.cellSize - this.camera.x + this.cellSize / 6;
      const screenY = y * this.cellSize - this.camera.y + this.cellSize / 6;
      const enemySize = this.cellSize * 2/3;
      
      // Enemy data with enhanced colors and characteristics
      const enemyData = {
        bruiser: { color: '#ff4444', glowColor: '#ff6666', accent: '#cc2222' },
        doctor: { color: '#44ff44', glowColor: '#66ff66', accent: '#22cc22' }, 
        trickster: { color: '#ffff44', glowColor: '#ffff66', accent: '#cccc22' },
        cat: { color: '#ff44ff', glowColor: '#ff66ff', accent: '#cc22cc' },
        robot: { color: '#4444ff', glowColor: '#6666ff', accent: '#2222cc' }
      };
      
      const data = enemyData[enemy.type] || { color: '#ff0000', glowColor: '#ff4444', accent: '#cc0000' };
      
      // Enemy glow effect
      const enemyGradient = ctx.createRadialGradient(
        screenX + enemySize/2, screenY + enemySize/2, 0,
        screenX + enemySize/2, screenY + enemySize/2, enemySize + 4
      );
      enemyGradient.addColorStop(0, data.glowColor + '60');
      enemyGradient.addColorStop(1, data.glowColor + '00');
      ctx.fillStyle = enemyGradient;
      ctx.fillRect(screenX - 6, screenY - 6, enemySize + 12, enemySize + 12);
      
      // Draw enemy sprite based on type
      this.drawEnemySprite(ctx, enemy.type, screenX, screenY, enemySize, data);
    }
    
    // Render loot with sparkle effects
    for (const [pos, loot] of this.loot) {
      const [x, y] = pos.split(',').map(Number);
      if (!this.discovered.has(pos)) continue;
      
      const screenX = x * this.cellSize - this.camera.x + this.cellSize / 4;
      const screenY = y * this.cellSize - this.camera.y + this.cellSize / 4;
      
      // Sparkle effect
      const time = Date.now() * 0.005;
      const sparkle = Math.sin(time) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 170, 0, ${sparkle})`;
      ctx.fillRect(screenX - 2, screenY - 2, this.cellSize / 2 + 4, this.cellSize / 2 + 4);
      
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(screenX, screenY, this.cellSize / 2, this.cellSize / 2);
    }
    
    ctx.textAlign = 'left'; // Reset alignment
  }
  
  // Render UI overlay
  renderUI(ctx, viewportWidth, viewportHeight) {
    // Calculate dynamic panel height based on abilities
    const baseHeight = 115; // Height for basic stats
    const abilitiesHeight = Math.max(this.player.abilities.size * 18, 20); // 18px per ability, min 20
    const totalPanelHeight = baseHeight + abilitiesHeight + 10; // 10px padding
    
    // Player stats panel with more atmospheric styling
    const panelGradient = ctx.createLinearGradient(10, 10, 10, totalPanelHeight);
    panelGradient.addColorStop(0, 'rgba(15, 15, 35, 0.9)');
    panelGradient.addColorStop(1, 'rgba(10, 10, 25, 0.9)');
    ctx.fillStyle = panelGradient;
    ctx.fillRect(10, 10, 240, totalPanelHeight);
    
    // Panel border
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 240, totalPanelHeight);
    
    // Title - more compact
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px serif';
    ctx.fillText('◈ EXPLORER STATUS ◈', 20, 28);
    
    // Stats with colors - more compact layout
    ctx.font = '12px monospace';
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText(`♥ ${this.player.hp}/${this.player.maxHP}`, 20, 48);
    
    ctx.fillStyle = '#4ecdc4';
    ctx.fillText(`⚡ ${this.player.ghis}/${this.player.maxGhis}`, 100, 48);
    
    ctx.fillStyle = '#95a5a6';
    ctx.fillText(`📍 ${this.player.x}, ${this.player.y}`, 20, 68);
    
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`🎴 ${this.player.cards.length} cards`, 120, 68);
    
    // Abilities panel - more compact
    if (this.player.abilities.size > 0) {
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 12px serif';
      ctx.fillText('⚔️ Abilities:', 20, 88);
      
      let abilityY = 105;
      let col = 0;
      const maxCols = 2;
      const colWidth = 110;
      
      for (const ability of this.player.abilities) {
        const stat = this.player.stats[ability] || 0;
        const abilityIcons = {
          strike: '⚔️',
          shield: '🛡️',
          pierce: '🗡️',
          surge: '⚡',
          hope: '🕊️',
          zap: '⚡',
          ignite: '🔥'
        };
        
        const x = 25 + (col * colWidth);
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        ctx.fillText(`${abilityIcons[ability] || '•'} ${ability}: ${stat}`, x, abilityY);
        
        col++;
        if (col >= maxCols) {
          col = 0;
          abilityY += 18;
        }
      }
    } else {
      ctx.fillStyle = '#888888';
      ctx.font = '11px serif';
      ctx.fillText('No abilities unlocked yet', 20, 100);
    }
    
    // Controls panel with atmospheric styling
    const controlsGradient = ctx.createLinearGradient(viewportWidth - 240, 10, viewportWidth - 240, 90);
    controlsGradient.addColorStop(0, 'rgba(15, 15, 35, 0.9)');
    controlsGradient.addColorStop(1, 'rgba(10, 10, 25, 0.9)');
    ctx.fillStyle = controlsGradient;
    ctx.fillRect(viewportWidth - 240, 10, 230, 90);
    
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 2;
    ctx.strokeRect(viewportWidth - 240, 10, 230, 90);
    
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px serif';
    ctx.fillText('⚡ CONTROLS ⚡', viewportWidth - 230, 30);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    
    // Detect if touch device and show appropriate controls
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
      ctx.fillText('Swipe: Move', viewportWidth - 230, 50);
      ctx.fillText('Tap: Battle actions', viewportWidth - 230, 70);
    } else {
      ctx.fillText('WASD: Move', viewportWidth - 230, 50);
      ctx.fillText('Enter enemies to battle', viewportWidth - 230, 70);
    }
    ctx.fillText('Explorer vs. Enemy Sprites', viewportWidth - 230, 90);
  }
  
  // Render battle UI (legacy - now mostly handled by HTML)
  renderBattleUI(ctx, viewportWidth, viewportHeight) {
    // Only show enemy turn banner when not player turn
    if (this.currentBattle.battleState !== 'player_turn') {
      // Non-intrusive enemy turn notification banner
      const bannerHeight = 60;
      const bannerY = viewportHeight / 2 - bannerHeight / 2;
      
      // Semi-transparent banner background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(viewportWidth / 2 - 200, bannerY, 400, bannerHeight);
      
      // Banner border
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.strokeRect(viewportWidth / 2 - 200, bannerY, 400, bannerHeight);
      
      ctx.textAlign = 'center';
      
      if (this.enemyTurnPhase === 'thinking') {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px serif';
        ctx.fillText('Enemy is thinking', viewportWidth / 2, bannerY + 25);
        
        // Add thinking animation dots
        const dots = '.'.repeat((Math.floor(Date.now() / 500) % 3) + 1);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px serif';
        ctx.fillText(dots, viewportWidth / 2, bannerY + 45);
      } else {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 18px serif';
        ctx.fillText('ENEMY TURN', viewportWidth / 2, bannerY + 25);
        
        // Show enemy name
        if (this.currentBattle && this.currentBattle.enemy) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px serif';
          ctx.fillText(`${this.currentBattle.enemy.persona} acts!`, viewportWidth / 2, bannerY + 45);
        }
      }
      
      ctx.textAlign = 'left';
    }
  }
  
  // NEW: Update HTML-based combat UI
  updateCombatUI() {
    const combatPanel = document.getElementById('mazeCombatUI');
    if (!combatPanel) return;
    
    combatPanel.hidden = false;
    
    // Update enemy info
    const enemy = this.currentBattle.enemy;
    const enemyName = document.getElementById('combatEnemyName');
    const enemyHP = document.getElementById('combatEnemyHP');
    const enemyHPBar = document.getElementById('combatEnemyHPBar');
    
    if (enemyName) enemyName.textContent = enemy.persona;
    if (enemyHP) enemyHP.textContent = `${enemy.hp}/${enemy.maxHP}`;
    if (enemyHPBar) {
      const hpPercent = (enemy.hp / enemy.maxHP) * 100;
      enemyHPBar.style.width = `${hpPercent}%`;
    }
    
    // Update player status
    const playerHP = document.getElementById('combatPlayerHP');
    const playerGHIS = document.getElementById('combatPlayerGHIS');
    const playerShield = document.getElementById('combatPlayerShield');
    const playerShieldValue = document.getElementById('combatPlayerShieldValue');
    
    if (playerHP) playerHP.textContent = `${this.player.hp}/${this.player.maxHP}`;
    if (playerGHIS) playerGHIS.textContent = `${this.player.ghis}/${this.player.maxGhis}`;
    if (playerShield && playerShieldValue) {
      if (this.player.shield > 0) {
        playerShield.hidden = false;
        playerShieldValue.textContent = this.player.shield;
      } else {
        playerShield.hidden = true;
      }
    }
    
    // Update combat actions
    this.updateCombatActions();
    
    // Update instructions
    const instructions = document.getElementById('combatInstructions');
    if (instructions) {
      if (this.currentBattle.battleState === 'player_turn') {
        instructions.textContent = 'Choose your action';
      } else if (this.currentBattle.battleState === 'enemy_turn') {
        instructions.textContent = 'Enemy is acting...';
      }
    }
  }
  
  // NEW: Update combat action buttons
  updateCombatActions() {
    const buttonsContainer = document.getElementById('combatActionButtons');
    if (!buttonsContainer) return;
    
    // Clear existing buttons
    buttonsContainer.innerHTML = '';
    
    // Only show buttons during player turn
    if (this.currentBattle.battleState !== 'player_turn') {
      return;
    }
    
    // Create buttons for each available action
    this.battleMenu.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className = 'combat-action-btn';
      if (!option.enabled) {
        button.className += ' combat-btn-disabled';
        button.disabled = true;
      }
      if (index === this.battleMenu.selectedOption) {
        button.className += ' selected';
      }
      
      button.innerHTML = `
        ${option.text}
        <span class="combat-btn-cost">Cost: ${option.cost} GHIS</span>
      `;
      
      // Add click handler
      button.addEventListener('click', () => {
        this.battleMenu.selectedOption = index;
        this.executeBattleAction();
      });
      
      // Add keyboard hover support
      button.addEventListener('mouseenter', () => {
        this.battleMenu.selectedOption = index;
        this.updateCombatActions(); // Refresh to show selection
      });
      
      buttonsContainer.appendChild(button);
    });
  }
  
  // NEW: Hide combat UI
  hideCombatUI() {
    const combatPanel = document.getElementById('mazeCombatUI');
    if (combatPanel) {
      combatPanel.hidden = true;
    }
  }
  
  // Handle input
  handleInput() {
    if (this.gameState === 'judge_intro') {
      // Handle JUDGE dialogue progression
      if (this.keys.has(' ') || this.keys.has('Enter')) {
        this.advanceJudgeDialogue();
      }
      // Handle skip option if available
      if ((this.keys.has('s') || this.keys.has('S')) && this.judgeDialogue.hasSeenBefore) {
        this.skipJudgeDialogue();
      }
    } else if (this.gameState === 'exploring') {
      if (this.keys.has('w') || this.keys.has('W')) this.movePlayer(0, -1);
      if (this.keys.has('s') || this.keys.has('S')) this.movePlayer(0, 1);
      if (this.keys.has('a') || this.keys.has('A')) this.movePlayer(-1, 0);
      if (this.keys.has('d') || this.keys.has('D')) this.movePlayer(1, 0);
      
      // Equipment menu
      if (this.keys.has('e') || this.keys.has('E')) {
        this.showEquipmentMenu();
      }
      
      // EXPERIMENTAL: Reconstruction mode toggle (R key)
      if (this.keys.has('r') || this.keys.has('R')) {
        this.toggleReconstructionMode();
      }
      
      // EXPERIMENTAL: Reconstruction mode interactions
      if (this.reconstructionMode) {
        // Number keys 1-4 to select reconstruction cards
        for (let i = 1; i <= 4; i++) {
          if (this.keys.has(i.toString())) {
            this.selectReconstructionCard(i - 1);
          }
        }
        
        // Space or Enter to place reconstruction
        if (this.keys.has(' ') || this.keys.has('Enter')) {
          this.placeReconstruction();
        }
        
        // Escape to cancel reconstruction mode
        if (this.keys.has('Escape')) {
          this.cancelReconstructionMode();
        }
      }
      
      // DEBUG: Press 'B' to force trigger a battle for testing
      if (this.keys.has('b') || this.keys.has('B')) {
        const testEnemy = { type: 'bruiser', level: 1, defeated: false };
        console.log('[DEBUG] Force triggering test battle');
        this.startBattle(testEnemy);
      }
    } else if (this.gameState === 'battle' && this.currentBattle.battleState === 'player_turn') {
      // Menu navigation with keyboard
      if (this.keys.has('ArrowUp') || this.keys.has('ArrowLeft')) {
        this.battleMenu.selectedOption = Math.max(0, this.battleMenu.selectedOption - 1);
        this.updateCombatActions(); // Refresh UI to show selection
      }
      if (this.keys.has('ArrowDown') || this.keys.has('ArrowRight')) {
        this.battleMenu.selectedOption = Math.min(this.battleMenu.options.length - 1, this.battleMenu.selectedOption + 1);
        this.updateCombatActions(); // Refresh UI to show selection
      }
      if (this.keys.has('Enter') || this.keys.has(' ')) {
        this.executeBattleAction();
      }
    }
    
    // Clear keys to prevent repeated actions
    this.keys.clear();
  }

  // Handle swipe gestures for mobile
  handleSwipe() {
    if (!this.touchState.isActive) return;

    const deltaX = this.touchState.endX - this.touchState.startX;
    const deltaY = this.touchState.endY - this.touchState.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < this.touchState.minSwipeDistance) return;

    // Determine swipe direction
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    if (this.gameState === 'exploring') {
      // Convert swipe to movement
      if (angle >= -45 && angle <= 45) {
        this.movePlayer(1, 0); // Right
      } else if (angle >= 45 && angle <= 135) {
        this.movePlayer(0, 1); // Down
      } else if (angle >= 135 || angle <= -135) {
        this.movePlayer(-1, 0); // Left
      } else if (angle >= -135 && angle <= -45) {
        this.movePlayer(0, -1); // Up
      }
    }

    this.touchState.isActive = false;
  }
  
  // Game loop
  update(timestamp) {
    if (timestamp - this.lastFrame > 200) { // Limit to ~5 FPS for turn-based feel
      this.handleInput();
      this.handleSwipe(); // Process any pending swipes
      this.lastFrame = timestamp;
    }
  }

  // Key event handlers
  onKeyDown(event) {
    this.keys.add(event.key);
  }

  onKeyUp(event) {
    // Optional: handle key up events
  }

  // Touch event handlers
  onTouchStart(event) {
    const touch = event.touches[0];
    this.touchState.startX = touch.clientX;
    this.touchState.startY = touch.clientY;
    this.touchState.isActive = true;
    
    // Check if touch target is a combat button - if so, don't prevent default
    const target = event.target;
    if (target && (target.classList.contains('combat-action-btn') || target.closest('.combat-action-btn'))) {
      // Let the button handle the touch normally
      return;
    }
    
    // Only prevent default for canvas interactions, not UI buttons
    event.preventDefault();
  }

  onTouchMove(event) {
    if (!this.touchState.isActive) return;
    
    // Check if touch target is a combat button - if so, don't prevent default
    const target = event.target;
    if (target && (target.classList.contains('combat-action-btn') || target.closest('.combat-action-btn'))) {
      return;
    }
    
    event.preventDefault();
    const touch = event.touches[0];
    this.touchState.endX = touch.clientX;
    this.touchState.endY = touch.clientY;
  }

  onTouchEnd(event) {
    if (!this.touchState.isActive) return;

    const touch = event.changedTouches[0];
    this.touchState.endX = touch.clientX;
    this.touchState.endY = touch.clientY;
    
    // Check if touch target is a combat button - if so, don't prevent default
    const target = event.target;
    if (target && (target.classList.contains('combat-action-btn') || target.closest('.combat-action-btn'))) {
      // Let the button handle the click normally
      return;
    }
    
    // Only prevent default for canvas interactions, not UI buttons
    event.preventDefault();
    
    // Handle JUDGE dialogue touch interaction
    if (this.gameState === 'judge_intro') {
      const currentTime = Date.now();
      const timeSinceLastTap = currentTime - this.touchState.lastTapTime;
      
      // Check for double-tap to skip (if available)
      if (timeSinceLastTap < this.touchState.doubleTapDelay && this.judgeDialogue.hasSeenBefore) {
        this.skipJudgeDialogue();
      } else {
        this.advanceJudgeDialogue();
      }
      
      this.touchState.lastTapTime = currentTime;
      return;
    }
    
    // Handle battle menu touch interaction - now handled by HTML buttons
    // No longer needed since we use HTML UI
    
    // Swipe will be processed in next update cycle
  }

  // Handle touch interaction with battle menu
  handleBattleTouch(clientX, clientY) {
    // Get canvas bounds to convert screen coordinates
    const canvas = document.getElementById('metroidvaniaCanvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Scale coordinates if canvas is scaled
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;

    // Check if touch is within battle menu area
    const menuStartY = 320;
    const menuItemHeight = 60;
    const menuWidth = 600;
    const menuX = (canvas.width - menuWidth) / 2;

    if (canvasX >= menuX && canvasX <= menuX + menuWidth) {
      const relativeY = canvasY - menuStartY;
      if (relativeY >= 0) {
        const optionIndex = Math.floor(relativeY / menuItemHeight);
        if (optionIndex >= 0 && optionIndex < this.battleMenu.options.length) {
          const option = this.battleMenu.options[optionIndex];
          if (option.enabled) {
            this.battleMenu.selectedOption = optionIndex;
            this.executeBattleAction();
          }
        }
      }
    }
  }

  // Draw pixel sprite player character
  drawPlayerSprite(ctx, x, y, size) {
    const pixelSize = Math.max(2, Math.floor(size / 16)); // Scale pixel size based on cell size
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    // Helper function to draw a pixel
    const drawPixel = (px, py, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        centerX + (px - 8) * pixelSize - pixelSize/2, 
        centerY + (py - 8) * pixelSize - pixelSize/2, 
        pixelSize, 
        pixelSize
      );
    };
    
    // Explorer sprite design (16x16 grid, centered)
    // Head/helmet (teal/cyan colors)
    drawPixel(6, 3, '#4ecdc4'); drawPixel(7, 3, '#4ecdc4'); drawPixel(8, 3, '#4ecdc4'); drawPixel(9, 3, '#4ecdc4');
    drawPixel(5, 4, '#4ecdc4'); drawPixel(6, 4, '#ffffff'); drawPixel(7, 4, '#4ecdc4'); drawPixel(8, 4, '#4ecdc4'); drawPixel(9, 4, '#ffffff'); drawPixel(10, 4, '#4ecdc4');
    drawPixel(5, 5, '#4ecdc4'); drawPixel(6, 5, '#ffffff'); drawPixel(7, 5, '#4ecdc4'); drawPixel(8, 5, '#4ecdc4'); drawPixel(9, 5, '#ffffff'); drawPixel(10, 5, '#4ecdc4');
    drawPixel(6, 6, '#4ecdc4'); drawPixel(7, 6, '#4ecdc4'); drawPixel(8, 6, '#4ecdc4'); drawPixel(9, 6, '#4ecdc4');
    
    // Body/armor (green colors)
    drawPixel(7, 7, '#00ff88'); drawPixel(8, 7, '#00ff88');
    drawPixel(6, 8, '#00ff88'); drawPixel(7, 8, '#ffffff'); drawPixel(8, 8, '#ffffff'); drawPixel(9, 8, '#00ff88');
    drawPixel(6, 9, '#00ff88'); drawPixel(7, 9, '#00ff88'); drawPixel(8, 9, '#00ff88'); drawPixel(9, 9, '#00ff88');
    drawPixel(6, 10, '#00ff88'); drawPixel(7, 10, '#00ff88'); drawPixel(8, 10, '#00ff88'); drawPixel(9, 10, '#00ff88');
    
    // Arms (darker green)
    drawPixel(4, 8, '#00cc66'); drawPixel(5, 8, '#00cc66');
    drawPixel(4, 9, '#00cc66'); drawPixel(5, 9, '#00cc66');
    drawPixel(10, 8, '#00cc66'); drawPixel(11, 8, '#00cc66');
    drawPixel(10, 9, '#00cc66'); drawPixel(11, 9, '#00cc66');
    
    // Legs (darker green)
    drawPixel(6, 11, '#00cc66'); drawPixel(7, 11, '#00cc66'); drawPixel(8, 11, '#00cc66'); drawPixel(9, 11, '#00cc66');
    drawPixel(6, 12, '#00cc66'); drawPixel(7, 12, '#00cc66'); drawPixel(8, 12, '#00cc66'); drawPixel(9, 12, '#00cc66');
    
    // Feet (dark gray)
    drawPixel(5, 13, '#333333'); drawPixel(6, 13, '#333333'); drawPixel(7, 13, '#333333');
    drawPixel(8, 13, '#333333'); drawPixel(9, 13, '#333333'); drawPixel(10, 13, '#333333');
    
    // Equipment highlights (gold accents)
    drawPixel(7, 8, '#ffd700'); drawPixel(8, 8, '#ffd700'); // Chest light
    
    // Add subtle outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
  }

  // Draw enemy sprites based on type
  drawEnemySprite(ctx, type, x, y, size, colorData) {
    const pixelSize = Math.max(2, Math.floor(size / 12)); // Slightly larger pixels for enemies
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    // Helper function to draw a pixel
    const drawPixel = (px, py, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        centerX + (px - 6) * pixelSize - pixelSize/2, 
        centerY + (py - 6) * pixelSize - pixelSize/2, 
        pixelSize, 
        pixelSize
      );
    };
    
    switch(type) {
      case 'bruiser':
        // Bulky warrior design (red)
        // Head
        drawPixel(4, 1, colorData.color); drawPixel(5, 1, colorData.color); drawPixel(6, 1, colorData.color); drawPixel(7, 1, colorData.color);
        drawPixel(3, 2, colorData.color); drawPixel(4, 2, '#ffffff'); drawPixel(5, 2, colorData.color); drawPixel(6, 2, colorData.color); drawPixel(7, 2, '#ffffff'); drawPixel(8, 2, colorData.color);
        drawPixel(4, 3, colorData.color); drawPixel(5, 3, colorData.color); drawPixel(6, 3, colorData.color); drawPixel(7, 3, colorData.color);
        // Body (broad shoulders)
        drawPixel(2, 4, colorData.accent); drawPixel(3, 4, colorData.color); drawPixel(4, 4, colorData.color); drawPixel(5, 4, colorData.color); 
        drawPixel(6, 4, colorData.color); drawPixel(7, 4, colorData.color); drawPixel(8, 4, colorData.color); drawPixel(9, 4, colorData.accent);
        drawPixel(3, 5, colorData.color); drawPixel(4, 5, colorData.color); drawPixel(5, 5, '#333333'); drawPixel(6, 5, '#333333'); drawPixel(7, 5, colorData.color); drawPixel(8, 5, colorData.color);
        drawPixel(4, 6, colorData.color); drawPixel(5, 6, colorData.color); drawPixel(6, 6, colorData.color); drawPixel(7, 6, colorData.color);
        // Legs
        drawPixel(4, 7, colorData.accent); drawPixel(5, 7, colorData.accent); drawPixel(6, 7, colorData.accent); drawPixel(7, 7, colorData.accent);
        drawPixel(4, 8, colorData.accent); drawPixel(5, 8, colorData.accent); drawPixel(6, 8, colorData.accent); drawPixel(7, 8, colorData.accent);
        break;
        
      case 'doctor':
        // Medical personnel design (green)
        // Head with cross
        drawPixel(4, 1, colorData.color); drawPixel(5, 1, colorData.color); drawPixel(6, 1, colorData.color); drawPixel(7, 1, colorData.color);
        drawPixel(4, 2, colorData.color); drawPixel(5, 2, '#ffffff'); drawPixel(6, 2, '#ffffff'); drawPixel(7, 2, colorData.color);
        drawPixel(4, 3, colorData.color); drawPixel(5, 3, '#ffffff'); drawPixel(6, 3, '#ffffff'); drawPixel(7, 3, colorData.color);
        // Medical cross on head
        drawPixel(5, 1, '#ff0000'); drawPixel(6, 1, '#ff0000'); drawPixel(5, 2, '#ff0000'); drawPixel(6, 2, '#ff0000');
        // Body
        drawPixel(4, 4, colorData.color); drawPixel(5, 4, '#ffffff'); drawPixel(6, 4, '#ffffff'); drawPixel(7, 4, colorData.color);
        drawPixel(4, 5, colorData.color); drawPixel(5, 5, colorData.color); drawPixel(6, 5, colorData.color); drawPixel(7, 5, colorData.color);
        drawPixel(4, 6, colorData.color); drawPixel(5, 6, colorData.color); drawPixel(6, 6, colorData.color); drawPixel(7, 6, colorData.color);
        // Legs
        drawPixel(4, 7, colorData.accent); drawPixel(5, 7, colorData.accent); drawPixel(6, 7, colorData.accent); drawPixel(7, 7, colorData.accent);
        break;
        
      case 'trickster':
        // Sneaky design (yellow)
        // Head with hat
        drawPixel(4, 0, colorData.accent); drawPixel(5, 0, colorData.accent); drawPixel(6, 0, colorData.accent); drawPixel(7, 0, colorData.accent);
        drawPixel(4, 1, colorData.color); drawPixel(5, 1, colorData.color); drawPixel(6, 1, colorData.color); drawPixel(7, 1, colorData.color);
        drawPixel(4, 2, colorData.color); drawPixel(5, 2, '#000000'); drawPixel(6, 2, '#000000'); drawPixel(7, 2, colorData.color);
        drawPixel(4, 3, colorData.color); drawPixel(5, 3, colorData.color); drawPixel(6, 3, colorData.color); drawPixel(7, 3, colorData.color);
        // Body (slim)
        drawPixel(5, 4, colorData.color); drawPixel(6, 4, colorData.color);
        drawPixel(4, 5, colorData.color); drawPixel(5, 5, '#333333'); drawPixel(6, 5, '#333333'); drawPixel(7, 5, colorData.color);
        drawPixel(5, 6, colorData.color); drawPixel(6, 6, colorData.color);
        // Legs
        drawPixel(5, 7, colorData.accent); drawPixel(6, 7, colorData.accent);
        drawPixel(5, 8, colorData.accent); drawPixel(6, 8, colorData.accent);
        break;
        
      case 'cat':
        // Feline design (magenta)
        // Head with ears
        drawPixel(3, 0, colorData.color); drawPixel(8, 0, colorData.color);
        drawPixel(4, 1, colorData.color); drawPixel(5, 1, colorData.color); drawPixel(6, 1, colorData.color); drawPixel(7, 1, colorData.color);
        drawPixel(4, 2, colorData.color); drawPixel(5, 2, '#ffffff'); drawPixel(6, 2, '#ffffff'); drawPixel(7, 2, colorData.color);
        drawPixel(4, 3, colorData.color); drawPixel(5, 3, colorData.color); drawPixel(6, 3, colorData.color); drawPixel(7, 3, colorData.color);
        // Whiskers
        drawPixel(2, 2, '#ffffff'); drawPixel(9, 2, '#ffffff');
        drawPixel(3, 3, '#ffffff'); drawPixel(8, 3, '#ffffff');
        // Body
        drawPixel(4, 4, colorData.color); drawPixel(5, 4, colorData.color); drawPixel(6, 4, colorData.color); drawPixel(7, 4, colorData.color);
        drawPixel(4, 5, colorData.color); drawPixel(5, 5, colorData.accent); drawPixel(6, 5, colorData.accent); drawPixel(7, 5, colorData.color);
        drawPixel(4, 6, colorData.color); drawPixel(5, 6, colorData.color); drawPixel(6, 6, colorData.color); drawPixel(7, 6, colorData.color);
        // Legs
        drawPixel(4, 7, colorData.accent); drawPixel(5, 7, colorData.accent); drawPixel(6, 7, colorData.accent); drawPixel(7, 7, colorData.accent);
        // Tail
        drawPixel(8, 5, colorData.color); drawPixel(9, 6, colorData.color);
        break;
        
      case 'robot':
        // Mechanical design (blue)
        // Head with antenna
        drawPixel(5, 0, '#ffffff'); drawPixel(6, 0, '#ffffff');
        drawPixel(4, 1, colorData.color); drawPixel(5, 1, colorData.color); drawPixel(6, 1, colorData.color); drawPixel(7, 1, colorData.color);
        drawPixel(4, 2, colorData.color); drawPixel(5, 2, '#ffff00'); drawPixel(6, 2, '#ffff00'); drawPixel(7, 2, colorData.color);
        drawPixel(4, 3, colorData.color); drawPixel(5, 3, colorData.color); drawPixel(6, 3, colorData.color); drawPixel(7, 3, colorData.color);
        // Body with circuits
        drawPixel(3, 4, colorData.color); drawPixel(4, 4, '#333333'); drawPixel(5, 4, colorData.color); drawPixel(6, 4, colorData.color); drawPixel(7, 4, '#333333'); drawPixel(8, 4, colorData.color);
        drawPixel(4, 5, colorData.color); drawPixel(5, 5, '#333333'); drawPixel(6, 5, '#333333'); drawPixel(7, 5, colorData.color);
        drawPixel(4, 6, colorData.color); drawPixel(5, 6, colorData.color); drawPixel(6, 6, colorData.color); drawPixel(7, 6, colorData.color);
        // Legs (blocky)
        drawPixel(4, 7, colorData.accent); drawPixel(5, 7, colorData.accent); drawPixel(6, 7, colorData.accent); drawPixel(7, 7, colorData.accent);
        drawPixel(4, 8, '#333333'); drawPixel(5, 8, '#333333'); drawPixel(6, 8, '#333333'); drawPixel(7, 8, '#333333');
        break;
        
      default:
        // Generic enemy (red square with details)
        drawPixel(4, 1, colorData.color); drawPixel(5, 1, colorData.color); drawPixel(6, 1, colorData.color); drawPixel(7, 1, colorData.color);
        drawPixel(4, 2, colorData.color); drawPixel(5, 2, '#ffffff'); drawPixel(6, 2, '#ffffff'); drawPixel(7, 2, colorData.color);
        drawPixel(4, 3, colorData.color); drawPixel(5, 3, colorData.color); drawPixel(6, 3, colorData.color); drawPixel(7, 3, colorData.color);
        drawPixel(4, 4, colorData.color); drawPixel(5, 4, colorData.color); drawPixel(6, 4, colorData.color); drawPixel(7, 4, colorData.color);
        drawPixel(4, 5, colorData.color); drawPixel(5, 5, colorData.accent); drawPixel(6, 5, colorData.accent); drawPixel(7, 5, colorData.color);
        drawPixel(4, 6, colorData.color); drawPixel(5, 6, colorData.color); drawPixel(6, 6, colorData.color); drawPixel(7, 6, colorData.color);
        drawPixel(4, 7, colorData.accent); drawPixel(5, 7, colorData.accent); drawPixel(6, 7, colorData.accent); drawPixel(7, 7, colorData.accent);
        break;
    }
    
    // Add subtle outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
  }
  
  // ========================================
  // EXPERIMENTAL: MAZE RECONSTRUCTION SYSTEM
  // ========================================
  
  // Toggle reconstruction mode
  toggleReconstructionMode() {
    if (this.gameState !== 'exploring') return;
    
    this.reconstructionMode = !this.reconstructionMode;
    this.selectedReconstructionCard = null;
    this.reconstructionRange = 0;
    
    if (this.reconstructionMode) {
      this.logBattleAction("🌟 RECONSTRUCTION MODE ACTIVATED! Use 1-4 keys to select cards, SPACE to place, ESC to cancel.");
      this.showReconstructionCards();
    } else {
      this.logBattleAction("Reconstruction mode deactivated.");
    }
  }
  
  // Cancel reconstruction mode
  cancelReconstructionMode() {
    this.reconstructionMode = false;
    this.selectedReconstructionCard = null;
    this.reconstructionRange = 0;
    this.logBattleAction("Reconstruction mode cancelled.");
  }
  
  // Show available reconstruction cards
  showReconstructionCards() {
    const reconstructionCards = this.getReconstructionCards();
    if (reconstructionCards.length === 0) {
      this.logBattleAction("No reconstruction cards available. Find Bridge, Terraform, Sanctify, or Vortex Rift cards!");
      this.cancelReconstructionMode();
      return;
    }
    
    reconstructionCards.forEach((card, index) => {
      const cost = card.cost || 0;
      const canAfford = this.player.ghis >= cost;
      const status = canAfford ? "" : " (INSUFFICIENT GHIS)";
      this.logBattleAction(`${index + 1}. ${card.sym} ${card.name} (${cost} GHIS)${status} - ${card.environmental.description}`);
    });
  }
  
  // Get player's reconstruction cards
  getReconstructionCards() {
    return this.player.cards.filter(card => 
      card.environmental && 
      ['bridge', 'terraform', 'sanctify', 'vortexrift'].includes(card.environmental.type)
    );
  }
  
  // Select a reconstruction card by index
  selectReconstructionCard(index) {
    const reconstructionCards = this.getReconstructionCards();
    if (index < 0 || index >= reconstructionCards.length) return;
    
    const card = reconstructionCards[index];
    const cost = card.cost || 0;
    
    if (this.player.ghis < cost) {
      this.logBattleAction(`❌ Insufficient GHIS! Need ${cost}, have ${this.player.ghis}.`);
      return;
    }
    
    this.selectedReconstructionCard = card;
    this.reconstructionRange = card.environmental.range || 1;
    this.logBattleAction(`🎯 Selected ${card.sym} ${card.name}. Move to target location and press SPACE to place.`);
  }
  
  // Place reconstruction at current player position
  placeReconstruction() {
    if (!this.selectedReconstructionCard || !this.reconstructionMode) return;
    
    const card = this.selectedReconstructionCard;
    const cost = card.cost || 0;
    
    // Check if we can afford it
    if (this.player.ghis < cost) {
      this.logBattleAction(`❌ Insufficient GHIS! Need ${cost}, have ${this.player.ghis}.`);
      return;
    }
    
    // Check if location is valid for reconstruction
    if (!this.isValidReconstructionLocation(this.player.x, this.player.y, card)) {
      this.logBattleAction(`❌ Cannot place ${card.name} here! ${this.getReconstructionLocationError(card)}`);
      return;
    }
    
    // Consume GHIS
    this.player.ghis -= cost;
    
    // Apply the reconstruction
    this.applyReconstruction(this.player.x, this.player.y, card);
    
    // Remove card from player's hand (consumed)
    const cardIndex = this.player.cards.findIndex(c => c.id === card.id);
    if (cardIndex !== -1) {
      this.player.cards.splice(cardIndex, 1);
    }
    
    this.logBattleAction(`✨ ${card.sym} ${card.name} placed! The maze bends to your will...`);
    
    // Exit reconstruction mode
    this.cancelReconstructionMode();
  }
  
  // Check if location is valid for reconstruction
  isValidReconstructionLocation(x, y, card) {
    switch (card.environmental.type) {
      case 'bridge':
        // Bridge can be placed on walls to create paths
        return this.maze[x] && this.maze[x][y] === 1;
      
      case 'terraform':
        // Terraform can be placed on walls to make them beneficial
        return this.maze[x] && this.maze[x][y] === 1;
      
      case 'sanctify':
        // Sanctify can be placed on open ground
        return this.maze[x] && this.maze[x][y] === 0;
      
      case 'vortexrift':
        // Vortex rifts can be placed anywhere
        return this.maze[x] && this.maze[x][y] !== undefined;
      
      default:
        return false;
    }
  }
  
  // Get error message for invalid reconstruction placement
  getReconstructionLocationError(card) {
    switch (card.environmental.type) {
      case 'bridge':
        return "Bridges can only be built through walls!";
      case 'terraform':
        return "Terraform can only transform walls!";
      case 'sanctify':
        return "Sanctuaries can only be created on open ground!";
      case 'vortexrift':
        return "Vortex rifts cannot be placed here!";
      default:
        return "Invalid placement!";
    }
  }
  
  // Apply reconstruction effect to the maze
  applyReconstruction(x, y, card) {
    const range = card.environmental.range || 1;
    const modification = {
      type: card.environmental.type,
      card: card,
      range: range,
      persistent: card.environmental.persistent || false,
      placedAt: Date.now(),
      resonance: card.environmental.resonance || null
    };
    
    // Apply effect in range around the target position
    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        const targetX = x + dx;
        const targetY = y + dy;
        
        if (targetX >= 0 && targetX < this.mazeSize && 
            targetY >= 0 && targetY < this.mazeSize) {
          
          const distance = Math.abs(dx) + Math.abs(dy); // Manhattan distance
          if (distance <= range) {
            this.applyReconstructionToCell(targetX, targetY, modification);
          }
        }
      }
    }
    
    // Store the modification for persistence and resonance tracking
    const key = `${x},${y}`;
    this.mazeModifications.set(key, modification);
  }
  
  // Apply reconstruction effect to a single cell
  applyReconstructionToCell(x, y, modification) {
    switch (modification.type) {
      case 'bridge':
        // Convert walls to paths
        if (this.maze[x][y] === 1) {
          this.maze[x][y] = 0; // Convert to open path
        }
        break;
      
      case 'terraform':
        // Convert walls to beneficial terrain (special value 2)
        if (this.maze[x][y] === 1) {
          this.maze[x][y] = 2; // Beneficial terrain
        }
        break;
      
      case 'sanctify':
        // Create healing sanctuary (special value 3)
        if (this.maze[x][y] === 0) {
          this.maze[x][y] = 3; // Sanctuary
        }
        break;
      
      case 'vortexrift':
        // Create chaotic vortex area (special value 4)
        this.maze[x][y] = 4; // Vortex rift
        break;
    }
    
    // Mark area as modified for visual feedback
    const key = `${x},${y}`;
    this.mazeModifications.set(key, modification);
  }
  
  // Check for resonance effects at player's current location
  getLocationResonance(x, y) {
    const key = `${x},${y}`;
    const modification = this.mazeModifications.get(key);
    return modification ? modification.resonance : null;
  }
  
  // Apply resonance effects to card usage (called during battle)
  applyResonanceToCard(card, damage, shield, heal) {
    const resonance = this.getLocationResonance(this.player.x, this.player.y);
    if (!resonance) return { damage, shield, heal };
    
    let modifiedDamage = damage;
    let modifiedShield = shield;
    let modifiedHeal = heal;
    
    if (resonance.bonusDamage) {
      modifiedDamage += resonance.bonusDamage;
    }
    
    if (resonance.bonusShield) {
      modifiedShield += resonance.bonusShield;
    }
    
    if (resonance.bonusHeal) {
      modifiedHeal += resonance.bonusHeal;
    }
    
    return { 
      damage: modifiedDamage, 
      shield: modifiedShield, 
      heal: modifiedHeal 
    };
  }
  
  // Get energy cost discount from vortex rifts
  getResonanceEnergyCost(originalCost) {
    const resonance = this.getLocationResonance(this.player.x, this.player.y);
    if (resonance && resonance.energyDiscount) {
      return Math.max(1, originalCost - resonance.energyDiscount);
    }
    return originalCost;
  }
  
  // Check if player is in a sanctuary (for automatic healing)
  isInSanctuary() {
    return this.maze[this.player.x] && this.maze[this.player.x][this.player.y] === 3;
  }
  
  // Check if player is in a vortex rift (for chaotic effects)
  isInVortexRift() {
    return this.maze[this.player.x] && this.maze[this.player.x][this.player.y] === 4;
  }
}

export { MetroidvaniaGame };