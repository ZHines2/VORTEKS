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
      hp: 20,
      maxHP: 20,
      ghis: 3, // Energy system renamed to GHIS
      maxGhis: 3,
      cards: [], // Player's collected cards
      abilities: new Set(), // Unlocked abilities
      stats: {
        strike: 0,
        shield: 0,
        surge: 0,
        pierce: 0
      }
    };
    
    this.maze = null;
    this.mazeSize = 50; // Large procedural maze
    this.cellSize = 32; // Pixel size of each grid cell
    this.camera = { x: 0, y: 0 };
    this.enemies = new Map(); // Position -> enemy data
    this.loot = new Map(); // Position -> loot data
    this.discovered = new Set(); // Discovered cell positions
    
    this.gameState = 'exploring'; // 'exploring', 'battle', 'paused'
    this.currentBattle = null;
    
    this.canvas = null;
    this.ctx = null;
    
    this.keys = new Set(); // Pressed keys
    this.lastFrame = 0;
    
    // Initialize the game
    this.generateMaze();
    this.spawnPlayer();
    this.populateEnemies();
  }
  
  // Generate procedural maze using cellular automata
  generateMaze() {
    this.maze = Array(this.mazeSize).fill().map(() => Array(this.mazeSize).fill(1));
    
    // Seed with random open spaces
    for (let x = 1; x < this.mazeSize - 1; x++) {
      for (let y = 1; y < this.mazeSize - 1; y++) {
        if (Math.random() < 0.45) {
          this.maze[x][y] = 0; // 0 = open, 1 = wall
        }
      }
    }
    
    // Apply cellular automata rules for natural cave-like structures
    for (let iteration = 0; iteration < 5; iteration++) {
      const newMaze = this.maze.map(row => [...row]);
      
      for (let x = 1; x < this.mazeSize - 1; x++) {
        for (let y = 1; y < this.mazeSize - 1; y++) {
          const neighbors = this.countNeighbors(x, y);
          
          if (neighbors >= 5) {
            newMaze[x][y] = 1; // Become wall
          } else if (neighbors <= 3) {
            newMaze[x][y] = 0; // Become open
          }
        }
      }
      
      this.maze = newMaze;
    }
    
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
  
  countNeighbors(x, y) {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.mazeSize && ny >= 0 && ny < this.mazeSize) {
          count += this.maze[nx][ny];
        } else {
          count++; // Count out-of-bounds as walls
        }
      }
    }
    return count;
  }
  
  // Find a valid spawn position
  spawnPlayer() {
    for (let attempts = 0; attempts < 100; attempts++) {
      const x = Math.floor(Math.random() * (this.mazeSize - 2)) + 1;
      const y = Math.floor(Math.random() * (this.mazeSize - 2)) + 1;
      
      if (this.maze[x][y] === 0) {
        this.player.x = x;
        this.player.y = y;
        this.discovered.add(`${x},${y}`);
        this.updateCamera();
        return;
      }
    }
    
    // Fallback: force a spawn
    this.player.x = Math.floor(this.mazeSize / 2);
    this.player.y = Math.floor(this.mazeSize / 2);
    this.maze[this.player.x][this.player.y] = 0;
    this.discovered.add(`${this.player.x},${this.player.y}`);
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
    
    // Check bounds and walls
    if (newX >= 0 && newX < this.mazeSize && 
        newY >= 0 && newY < this.mazeSize && 
        this.maze[newX][newY] === 0) {
      
      this.player.x = newX;
      this.player.y = newY;
      this.discovered.add(`${newX},${newY}`);
      this.updateCamera();
      
      // Check for encounters
      this.checkEncounters();
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
  
  // Start battle with enemy
  startBattle(enemy) {
    this.gameState = 'battle';
    
    // Create AI opponent
    const aiPlayer = createAIPlayer(enemy.type, enemy.level);
    aiPlayer.deck = makePersonaDeck(enemy.type, enemy.level);
    
    this.currentBattle = {
      enemy: aiPlayer,
      enemyData: enemy,
      playerInitialCards: [...this.player.cards],
      battleState: 'player_turn' // 'player_turn', 'enemy_turn', 'ended'
    };
    
    // Regenerate GHIS for battle
    this.player.ghis = this.player.maxGhis;
    
    recordBattle({ mode: 'metroidvania', opponent: enemy.type });
  }
  
  // Player uses ability during battle
  useAbility(abilityType) {
    if (this.gameState !== 'battle' || this.currentBattle.battleState !== 'player_turn') {
      return;
    }
    
    let success = false;
    
    switch (abilityType) {
      case 'strike':
        if (this.player.abilities.has('strike') && this.player.ghis >= 1) {
          const damage = Math.max(1, this.player.stats.strike);
          this.currentBattle.enemy.hp -= damage;
          this.player.ghis -= 1;
          success = true;
          this.logBattleAction(`You strike for ${damage} damage`);
        }
        break;
        
      case 'shield':
        if (this.player.abilities.has('shield') && this.player.ghis >= 1) {
          const shieldAmount = Math.max(1, this.player.stats.shield);
          this.player.shield = (this.player.shield || 0) + shieldAmount;
          this.player.ghis -= 1;
          success = true;
          this.logBattleAction(`You gain ${shieldAmount} shield`);
        }
        break;
        
      case 'pierce':
        if (this.player.abilities.has('pierce') && this.player.ghis >= 2) {
          const damage = Math.max(2, this.player.stats.pierce);
          this.currentBattle.enemy.hp -= damage; // Pierce ignores shields
          this.player.ghis -= 2;
          success = true;
          this.logBattleAction(`You pierce for ${damage} damage`);
        }
        break;
    }
    
    if (success) {
      this.checkBattleEnd();
      if (this.gameState === 'battle') {
        this.currentBattle.battleState = 'enemy_turn';
        setTimeout(() => this.enemyTurn(), 1000);
      }
    }
  }
  
  // Enemy AI turn
  enemyTurn() {
    if (this.gameState !== 'battle') return;
    
    const enemy = this.currentBattle.enemy;
    
    // Simple AI: random attack
    const damage = Math.floor(Math.random() * 4) + 2;
    let actualDamage = damage;
    
    if (this.player.shield > 0) {
      const shieldBlock = Math.min(this.player.shield, damage);
      this.player.shield -= shieldBlock;
      actualDamage -= shieldBlock;
    }
    
    this.player.hp -= Math.max(0, actualDamage);
    this.logBattleAction(`Enemy attacks for ${damage} damage`);
    
    this.checkBattleEnd();
    if (this.gameState === 'battle') {
      this.currentBattle.battleState = 'player_turn';
      // Regenerate some GHIS
      this.player.ghis = Math.min(this.player.maxGhis, this.player.ghis + 1);
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
    this.logBattleAction('Defeat! You respawn at a safe location.');
    
    // Respawn logic - move to a safe area
    this.findSafeRespawn();
    this.player.hp = Math.floor(this.player.maxHP / 2);
    this.player.shield = 0;
    
    this.gameState = 'exploring';
    this.currentBattle = null;
  }
  
  // Generate loot from defeated enemy
  generateLoot(enemy) {
    const lootCards = [];
    const cardPool = CARDS.filter(card => 
      ['heart', 'swords', 'shield', 'surge', 'pierce'].includes(card.id)
    );
    
    // Number of cards based on enemy level
    const numCards = enemy.level;
    
    for (let i = 0; i < numCards; i++) {
      const card = cardPool[Math.floor(Math.random() * cardPool.length)];
      lootCards.push(card);
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
        
      case 'surge': // Surge cards affect max GHIS
        this.player.stats.surge++;
        this.player.maxGhis = Math.min(10, 3 + this.player.stats.surge);
        break;
        
      case 'pierce': // Pierce cards
        this.player.abilities.add('pierce');
        this.player.stats.pierce++;
        break;
        
      case 'heart': // Heart cards increase max HP
        this.player.maxHP += 2;
        this.player.hp += 2; // Also heal
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
    // Could integrate with existing UI logging system
  }
  
  // Render the game
  render(ctx) {
    if (!ctx) return;
    
    const viewportWidth = ctx.canvas.width;
    const viewportHeight = ctx.canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    
    // Render maze
    this.renderMaze(ctx, viewportWidth, viewportHeight);
    
    // Render entities
    this.renderEntities(ctx);
    
    // Render UI
    this.renderUI(ctx, viewportWidth, viewportHeight);
    
    // Render battle UI if in battle
    if (this.gameState === 'battle') {
      this.renderBattleUI(ctx, viewportWidth, viewportHeight);
    }
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
          if (this.maze[x][y] === 1) {
            // Wall
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
          } else {
            // Floor
            ctx.fillStyle = '#2a2a3a';
            ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
          }
        } else {
          // Undiscovered - darkness
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
        }
        
        // Grid lines for clarity
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, this.cellSize, this.cellSize);
      }
    }
  }
  
  // Render entities (player, enemies, loot)
  renderEntities(ctx) {
    // Render player
    const playerScreenX = this.player.x * this.cellSize - this.camera.x + this.cellSize / 4;
    const playerScreenY = this.player.y * this.cellSize - this.camera.y + this.cellSize / 4;
    
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(playerScreenX, playerScreenY, this.cellSize / 2, this.cellSize / 2);
    
    // Render enemies
    for (const [pos, enemy] of this.enemies) {
      if (enemy.defeated) continue;
      
      const [x, y] = pos.split(',').map(Number);
      if (!this.discovered.has(pos)) continue;
      
      const screenX = x * this.cellSize - this.camera.x + this.cellSize / 4;
      const screenY = y * this.cellSize - this.camera.y + this.cellSize / 4;
      
      // Different colors for different enemy types
      const colors = {
        bruiser: '#ff4444',
        doctor: '#44ff44', 
        trickster: '#ffff44',
        cat: '#ff44ff',
        robot: '#4444ff'
      };
      
      ctx.fillStyle = colors[enemy.type] || '#ff0000';
      ctx.fillRect(screenX, screenY, this.cellSize / 2, this.cellSize / 2);
    }
    
    // Render loot
    for (const [pos, loot] of this.loot) {
      const [x, y] = pos.split(',').map(Number);
      if (!this.discovered.has(pos)) continue;
      
      const screenX = x * this.cellSize - this.camera.x + this.cellSize / 4;
      const screenY = y * this.cellSize - this.camera.y + this.cellSize / 4;
      
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(screenX, screenY, this.cellSize / 2, this.cellSize / 2);
    }
  }
  
  // Render UI overlay
  renderUI(ctx, viewportWidth, viewportHeight) {
    // Player stats panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 120);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHP}`, 20, 30);
    ctx.fillText(`GHIS: ${this.player.ghis}/${this.player.maxGhis}`, 20, 50);
    ctx.fillText(`Position: ${this.player.x}, ${this.player.y}`, 20, 70);
    ctx.fillText(`Cards: ${this.player.cards.length}`, 20, 90);
    
    // Abilities panel
    ctx.fillText('Abilities:', 20, 110);
    let abilityY = 130;
    for (const ability of this.player.abilities) {
      const stat = this.player.stats[ability] || 0;
      ctx.fillText(`${ability}: ${stat}`, 20, abilityY);
      abilityY += 20;
    }
    
    // Controls
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(viewportWidth - 220, 10, 210, 80);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Controls:', viewportWidth - 210, 30);
    ctx.fillText('WASD: Move', viewportWidth - 210, 50);
    ctx.fillText('Space: Use Strike', viewportWidth - 210, 70);
    ctx.fillText('Q: Use Shield', viewportWidth - 210, 90);
  }
  
  // Render battle UI
  renderBattleUI(ctx, viewportWidth, viewportHeight) {
    // Battle overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, viewportHeight - 150, viewportWidth, 150);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText('BATTLE MODE', 20, viewportHeight - 120);
    
    const enemy = this.currentBattle.enemy;
    ctx.fillText(`Enemy: ${enemy.persona} (HP: ${enemy.hp}/${enemy.maxHP})`, 20, viewportHeight - 90);
    ctx.fillText(`Your Turn: ${this.currentBattle.battleState === 'player_turn' ? 'YES' : 'NO'}`, 20, viewportHeight - 60);
    
    // Available abilities
    ctx.fillText('Available abilities:', 20, viewportHeight - 30);
    let x = 200;
    
    if (this.player.abilities.has('strike')) {
      ctx.fillStyle = this.player.ghis >= 1 ? '#00ff00' : '#666666';
      ctx.fillText('[SPACE] Strike', x, viewportHeight - 30);
      x += 150;
    }
    
    if (this.player.abilities.has('shield')) {
      ctx.fillStyle = this.player.ghis >= 1 ? '#00ff00' : '#666666';
      ctx.fillText('[Q] Shield', x, viewportHeight - 30);
      x += 120;
    }
    
    if (this.player.abilities.has('pierce')) {
      ctx.fillStyle = this.player.ghis >= 2 ? '#00ff00' : '#666666';
      ctx.fillText('[E] Pierce', x, viewportHeight - 30);
    }
  }
  
  // Handle input
  handleInput() {
    if (this.gameState === 'exploring') {
      if (this.keys.has('w') || this.keys.has('W')) this.movePlayer(0, -1);
      if (this.keys.has('s') || this.keys.has('S')) this.movePlayer(0, 1);
      if (this.keys.has('a') || this.keys.has('A')) this.movePlayer(-1, 0);
      if (this.keys.has('d') || this.keys.has('D')) this.movePlayer(1, 0);
    } else if (this.gameState === 'battle') {
      if (this.keys.has(' ')) this.useAbility('strike');
      if (this.keys.has('q') || this.keys.has('Q')) this.useAbility('shield');
      if (this.keys.has('e') || this.keys.has('E')) this.useAbility('pierce');
    }
    
    // Clear keys to prevent repeated actions
    this.keys.clear();
  }
  
  // Game loop
  update(timestamp) {
    if (timestamp - this.lastFrame > 200) { // Limit to ~5 FPS for turn-based feel
      this.handleInput();
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
}

export { MetroidvaniaGame };