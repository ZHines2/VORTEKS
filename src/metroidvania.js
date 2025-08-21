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
    this.battleMenu = {
      visible: false,
      selectedOption: 0,
      options: []
    };
    
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
    
    // Seed with random open spaces (reduced for tighter maze)
    for (let x = 1; x < this.mazeSize - 1; x++) {
      for (let y = 1; y < this.mazeSize - 1; y++) {
        if (Math.random() < 0.35) { // Reduced from 0.45 for tighter corridors
          this.maze[x][y] = 0; // 0 = open, 1 = wall
        }
      }
    }
    
    // Apply cellular automata rules for natural cave-like structures (adjusted for tighter maze)
    for (let iteration = 0; iteration < 6; iteration++) { // More iterations for tighter structure
      const newMaze = this.maze.map(row => [...row]);
      
      for (let x = 1; x < this.mazeSize - 1; x++) {
        for (let y = 1; y < this.mazeSize - 1; y++) {
          const neighbors = this.countNeighbors(x, y);
          
          if (neighbors >= 4) { // Reduced threshold for tighter corridors
            newMaze[x][y] = 1; // Become wall
          } else if (neighbors <= 2) { // Adjusted for balance
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
    
    // Initialize battle menu
    this.initializeBattleMenu();
    
    // Regenerate GHIS for battle
    this.player.ghis = this.player.maxGhis;
    
    recordBattle({ mode: 'metroidvania', opponent: enemy.type });
  }
  
  // Initialize battle menu options
  initializeBattleMenu() {
    this.battleMenu.visible = true;
    this.battleMenu.selectedOption = 0;
    this.battleMenu.options = [];
    
    // Add available actions based on player abilities
    if (this.player.abilities.has('strike')) {
      this.battleMenu.options.push({
        text: `Attack (Strike)`,
        action: 'strike',
        cost: 1,
        enabled: this.player.ghis >= 1,
        description: `Deal ${3 + this.player.stats.strike} damage`
      });
    }
    
    if (this.player.abilities.has('shield')) {
      this.battleMenu.options.push({
        text: `Defend (Shield)`,
        action: 'shield',
        cost: 1,
        enabled: this.player.ghis >= 1,
        description: `Block ${5 + this.player.stats.shield} damage`
      });
    }
    
    if (this.player.abilities.has('pierce')) {
      this.battleMenu.options.push({
        text: `Pierce Attack`,
        action: 'pierce',
        cost: 2,
        enabled: this.player.ghis >= 2,
        description: `Deal ${4 + this.player.stats.pierce} piercing damage`
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
        if (this.player.abilities.has('strike') && this.player.ghis >= 1) {
          const damage = 3 + this.player.stats.strike;
          this.currentBattle.enemy.hp -= damage;
          this.player.ghis -= 1;
          success = true;
          this.logBattleAction(`You strike for ${damage} damage!`);
        }
        break;
        
      case 'shield':
        if (this.player.abilities.has('shield') && this.player.ghis >= 1) {
          const shieldAmount = 5 + this.player.stats.shield;
          this.player.shield = (this.player.shield || 0) + shieldAmount;
          this.player.ghis -= 1;
          success = true;
          this.logBattleAction(`You gain ${shieldAmount} shield!`);
        }
        break;
        
      case 'pierce':
        if (this.player.abilities.has('pierce') && this.player.ghis >= 2) {
          const damage = 4 + this.player.stats.pierce;
          this.currentBattle.enemy.hp -= damage;
          this.player.ghis -= 2;
          success = true;
          this.logBattleAction(`You pierce for ${damage} damage (ignores armor)!`);
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
        this.battleMenu.visible = false;
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
  
  // Enemy AI turn
  // Execute enemy turn
  executeEnemyTurn() {
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
    this.logBattleAction(`${enemy.persona} attacks for ${damage} damage!`);
    
    this.checkBattleEnd();
    if (this.gameState === 'battle') {
      this.currentBattle.battleState = 'player_turn';
      // Regenerate some GHIS
      this.player.ghis = Math.min(this.player.maxGhis, this.player.ghis + 1);
      // Reinitialize menu for next turn
      this.initializeBattleMenu();
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
    this.battleMenu.visible = false;
    
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
    this.battleMenu.visible = false;
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
          } else {
            // Floor - darker, more atmospheric
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
            
            // Subtle floor pattern
            ctx.fillStyle = 'rgba(50, 50, 70, 0.5)';
            ctx.fillRect(screenX + this.cellSize/2 - 1, screenY + this.cellSize/2 - 1, 2, 2);
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
  
  // Render entities (player, enemies, loot)
  renderEntities(ctx) {
    // Render player with glow effect
    const playerScreenX = this.player.x * this.cellSize - this.camera.x + this.cellSize / 6;
    const playerScreenY = this.player.y * this.cellSize - this.camera.y + this.cellSize / 6;
    const playerSize = this.cellSize * 2/3;
    
    // Player glow
    const gradient = ctx.createRadialGradient(
      playerScreenX + playerSize/2, playerScreenY + playerSize/2, 0,
      playerScreenX + playerSize/2, playerScreenY + playerSize/2, playerSize
    );
    gradient.addColorStop(0, 'rgba(0, 255, 136, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(playerScreenX - 4, playerScreenY - 4, playerSize + 8, playerSize + 8);
    
    // Player body
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(playerScreenX, playerScreenY, playerSize, playerSize);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(playerScreenX, playerScreenY, playerSize, playerSize);
    
    // Render enemies with different styles
    for (const [pos, enemy] of this.enemies) {
      if (enemy.defeated) continue;
      
      const [x, y] = pos.split(',').map(Number);
      if (!this.discovered.has(pos)) continue;
      
      const screenX = x * this.cellSize - this.camera.x + this.cellSize / 6;
      const screenY = y * this.cellSize - this.camera.y + this.cellSize / 6;
      const enemySize = this.cellSize * 2/3;
      
      // Enemy colors and styles
      const enemyData = {
        bruiser: { color: '#ff4444', symbol: '◆' },
        doctor: { color: '#44ff44', symbol: '⚕' }, 
        trickster: { color: '#ffff44', symbol: '◊' },
        cat: { color: '#ff44ff', symbol: '◈' },
        robot: { color: '#4444ff', symbol: '⬟' }
      };
      
      const data = enemyData[enemy.type] || { color: '#ff0000', symbol: '◼' };
      
      // Enemy glow effect
      const enemyGradient = ctx.createRadialGradient(
        screenX + enemySize/2, screenY + enemySize/2, 0,
        screenX + enemySize/2, screenY + enemySize/2, enemySize
      );
      enemyGradient.addColorStop(0, data.color + '80');
      enemyGradient.addColorStop(1, data.color + '00');
      ctx.fillStyle = enemyGradient;
      ctx.fillRect(screenX - 4, screenY - 4, enemySize + 8, enemySize + 8);
      
      // Enemy body
      ctx.fillStyle = data.color;
      ctx.fillRect(screenX, screenY, enemySize, enemySize);
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX, screenY, enemySize, enemySize);
      
      // Enemy symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.fillText(data.symbol, screenX + enemySize/2, screenY + enemySize/2 + 6);
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
    // Player stats panel with more atmospheric styling
    const panelGradient = ctx.createLinearGradient(10, 10, 10, 140);
    panelGradient.addColorStop(0, 'rgba(15, 15, 35, 0.9)');
    panelGradient.addColorStop(1, 'rgba(10, 10, 25, 0.9)');
    ctx.fillStyle = panelGradient;
    ctx.fillRect(10, 10, 220, 140);
    
    // Panel border
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 220, 140);
    
    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px serif';
    ctx.fillText('◈ EXPLORER STATUS ◈', 20, 30);
    
    // Stats with colors
    ctx.font = '14px monospace';
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText(`♥ HP: ${this.player.hp}/${this.player.maxHP}`, 20, 50);
    
    ctx.fillStyle = '#4ecdc4';
    ctx.fillText(`⚡ GHIS: ${this.player.ghis}/${this.player.maxGhis}`, 20, 70);
    
    ctx.fillStyle = '#95a5a6';
    ctx.fillText(`📍 Pos: ${this.player.x}, ${this.player.y}`, 20, 90);
    
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`🎴 Cards: ${this.player.cards.length}`, 20, 110);
    
    // Abilities panel
    ctx.fillStyle = '#e74c3c';
    ctx.fillText('⚔️ Abilities:', 20, 130);
    let abilityY = 150;
    for (const ability of this.player.abilities) {
      const stat = this.player.stats[ability] || 0;
      const abilityIcons = {
        strike: '⚔️',
        shield: '🛡️',
        pierce: '🗡️',
        surge: '⚡'
      };
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${abilityIcons[ability] || '•'} ${ability}: ${stat}`, 30, abilityY);
      abilityY += 20;
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
    ctx.fillText('WASD: Move', viewportWidth - 230, 50);
    ctx.fillText('Enter enemies to battle', viewportWidth - 230, 70);
    ctx.fillText('🔴 = Enemies, 🟢 = You', viewportWidth - 230, 90);
  }
  
  // Render battle UI
  renderBattleUI(ctx, viewportWidth, viewportHeight) {
    if (!this.battleMenu.visible) {
      // Enemy turn or transition state
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, viewportWidth, viewportHeight);
      
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 24px serif';
      ctx.textAlign = 'center';
      ctx.fillText('ENEMY TURN', viewportWidth / 2, viewportHeight / 2);
      ctx.textAlign = 'left';
      return;
    }
    
    // RPG-style combat menu overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    
    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚔️ COMBAT ⚔️', viewportWidth / 2, 60);
    
    // Enemy information
    const enemy = this.currentBattle.enemy;
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 20px serif';
    ctx.fillText(`${enemy.persona}`, viewportWidth / 2, 120);
    
    // Enemy HP bar
    const enemyHPPercent = enemy.hp / enemy.maxHP;
    const hpBarWidth = 300;
    const hpBarHeight = 20;
    const hpBarX = (viewportWidth - hpBarWidth) / 2;
    const hpBarY = 140;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth * enemyHPPercent, hpBarHeight);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
    
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${enemy.hp}/${enemy.maxHP} HP`, viewportWidth / 2, hpBarY + 15);
    
    // Player status
    ctx.fillStyle = '#4ecdc4';
    ctx.font = '16px serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Your HP: ${this.player.hp}/${this.player.maxHP}`, 50, 220);
    ctx.fillText(`GHIS Energy: ${this.player.ghis}/${this.player.maxGhis}`, 50, 245);
    if (this.player.shield > 0) {
      ctx.fillStyle = '#6bb6ff';
      ctx.fillText(`Shield: ${this.player.shield}`, 50, 270);
    }
    
    // Combat menu
    const menuStartY = 320;
    const menuItemHeight = 60;
    const menuWidth = 600;
    const menuX = (viewportWidth - menuWidth) / 2;
    
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(menuX - 20, menuStartY - 20, menuWidth + 40, this.battleMenu.options.length * menuItemHeight + 40);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(menuX - 20, menuStartY - 20, menuWidth + 40, this.battleMenu.options.length * menuItemHeight + 40);
    
    // Menu options
    this.battleMenu.options.forEach((option, index) => {
      const y = menuStartY + index * menuItemHeight;
      const isSelected = index === this.battleMenu.selectedOption;
      const isEnabled = option.enabled;
      
      // Selection highlight
      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillRect(menuX, y - 10, menuWidth, menuItemHeight - 10);
      }
      
      // Option text
      ctx.fillStyle = isEnabled ? (isSelected ? '#ffd700' : '#ecf0f1') : '#7f8c8d';
      ctx.font = isSelected ? 'bold 18px serif' : '16px serif';
      ctx.textAlign = 'left';
      
      const prefix = isSelected ? '➤ ' : '   ';
      ctx.fillText(`${prefix}${option.text}`, menuX + 20, y + 15);
      
      // Cost and description
      ctx.font = '14px monospace';
      ctx.fillStyle = isEnabled ? '#bdc3c7' : '#7f8c8d';
      ctx.fillText(`Cost: ${option.cost} GHIS`, menuX + 20, y + 35);
      ctx.fillText(option.description, menuX + 180, y + 35);
    });
    
    // Instructions
    ctx.fillStyle = '#95a5a6';
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Use ↑↓ arrows to select, ENTER to confirm', viewportWidth / 2, viewportHeight - 40);
    
    ctx.textAlign = 'left'; // Reset alignment
  }
  
  // Handle input
  handleInput() {
    if (this.gameState === 'exploring') {
      if (this.keys.has('w') || this.keys.has('W')) this.movePlayer(0, -1);
      if (this.keys.has('s') || this.keys.has('S')) this.movePlayer(0, 1);
      if (this.keys.has('a') || this.keys.has('A')) this.movePlayer(-1, 0);
      if (this.keys.has('d') || this.keys.has('D')) this.movePlayer(1, 0);
    } else if (this.gameState === 'battle' && this.battleMenu.visible) {
      // Menu navigation
      if (this.keys.has('ArrowUp')) {
        this.battleMenu.selectedOption = Math.max(0, this.battleMenu.selectedOption - 1);
      }
      if (this.keys.has('ArrowDown')) {
        this.battleMenu.selectedOption = Math.min(this.battleMenu.options.length - 1, this.battleMenu.selectedOption + 1);
      }
      if (this.keys.has('Enter')) {
        this.executeBattleAction();
      }
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