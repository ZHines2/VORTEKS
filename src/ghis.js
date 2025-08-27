// ghis.js
// VORTEKS GHÏS Mode - Rogue-like asteroids with card-based powerups
// Real-time space combat with Light Body (LB) ship

import { CARDS } from '../data/cards.js';
import { shuffle, clamp } from './utils.js';
import { recordCardPlayed } from './telemetry.js';

// GHÏS game state
export class GhisGame {
  constructor() {
    this.gameState = 'playing'; // playing, paused, gameOver
    
    // Player Light Body (LB) ship
    this.player = {
      x: 400, // Start in center
      y: 300,
      vx: 0, // Velocity
      vy: 0,
      angle: 0, // Facing direction in radians
      hp: 20, // Start with more HP
      maxHP: 20,
      shield: 0,
      maxShield: 0,
      speed: 1, // Base movement speed multiplier
      size: 8, // Ship collision radius
      invulnerable: 0, // Invulnerability frames after taking damage
      
      // Weapons and abilities
      weapons: {
        pewpew: {
          damage: 2, // Increased base damage
          fireRate: 200, // Faster firing rate
          lastFired: 0,
          pierce: 0, // How many enemies to pass through
          multishot: 1, // Number of projectiles per shot
          criticalChance: 0, // Critical hit chance 0-1
          criticalDamage: 1.5 // Critical damage multiplier
        },
        zap: {
          damage: 3, // Stronger zap damage
          fireRate: 1000, // Slower than pewpew
          lastFired: 0,
          chains: 1, // Number of chain targets
          range: 150 // Chain range
        }
      },
      
      // Drones/companions
      drones: [],
      
      // Status effects
      status: {
        hope: 0, // Passive healing amount per second
        freeze: { active: false, strength: 0, duration: 0 }
      },
      
      // Collected powerups
      powerups: {
        heart: 0,
        shield: 0,
        strike: 0,
        pierce: 0,
        zap: 0,
        echo: 0,
        freeze: 0,
        focus: 0,
        droid: 0,
        hope: 0,
        overload: 0,
        surge: 0,
        reap: 0
      }
    };
    
    // Game world
    this.world = {
      width: 1600, // Larger than viewport for scrolling
      height: 1200
    };
    
    // Camera for following player
    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      smoothing: 0.1
    };
    
    // Game entities
    this.projectiles = [];
    this.enemies = [];
    this.powerupDrops = [];
    this.particles = [];
    
    // Game timing
    this.lastUpdate = 0;
    this.gameTime = 0;
    
    // Debug mode
    this.debug = {
      enabled: false,
      showHitboxes: false,
      showStats: true,
      godMode: false
    };
    
    // Input state
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false,
      mouseX: 0,
      mouseY: 0,
      // Touch-specific input
      touchMoving: false,
      touchShooting: false,
      touchMoveX: 0,
      touchMoveY: 0,
      isMobile: false
    };
    
    // Initialize
    this.setupEventListeners();
    this.generateInitialEnemies();
    this.spawnStartingPowerups(); // Give player some initial powerups
  }
  
  setupEventListeners() {
    // Detect if device is mobile - include screen size for better detection
    this.input.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                         ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) ||
                         (window.innerWidth <= 768); // Also consider small screen sizes
    
    console.log('Mobile detection:', {
      userAgent: navigator.userAgent,
      touchStart: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints,
      screenWidth: window.innerWidth,
      isMobile: this.input.isMobile
    });
    
    // Keyboard input
    this.keyDownHandler = (e) => {
      switch(e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.up = true;
          e.preventDefault();
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.down = true;
          e.preventDefault();
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = true;
          e.preventDefault();
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = true;
          e.preventDefault();
          break;
        case 'Space':
          this.input.shoot = true;
          e.preventDefault();
          break;
        case 'KeyF':
          if (this.debug.enabled) {
            this.debug.godMode = !this.debug.godMode;
          }
          break;
        case 'KeyH':
          if (this.debug.enabled) {
            this.debug.showHitboxes = !this.debug.showHitboxes;
          }
          break;
      }
    };
    
    this.keyUpHandler = (e) => {
      switch(e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.up = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.down = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = false;
          break;
        case 'Space':
          this.input.shoot = false;
          break;
      }
    };
    
    // Mouse input for aiming
    this.mouseMoveHandler = (e) => {
      const canvas = e.target;
      const rect = canvas.getBoundingClientRect();
      this.input.mouseX = e.clientX - rect.left;
      this.input.mouseY = e.clientY - rect.top;
    };
    
    // Touch event handlers
    this.touchStartHandler = (e) => {
      e.preventDefault();
      const canvas = e.target;
      const rect = canvas.getBoundingClientRect();
      
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Update mouse position for aiming (use first touch)
        if (i === 0) {
          this.input.mouseX = touchX;
          this.input.mouseY = touchY;
        }
      }
      
      // Start shooting on touch
      this.input.shoot = true;
      this.input.touchShooting = true;
    };
    
    this.touchMoveHandler = (e) => {
      e.preventDefault();
      const canvas = e.target;
      const rect = canvas.getBoundingClientRect();
      
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Update mouse position for aiming
        this.input.mouseX = touchX;
        this.input.mouseY = touchY;
      }
    };
    
    this.touchEndHandler = (e) => {
      e.preventDefault();
      
      // Stop shooting when no touches
      if (e.touches.length === 0) {
        this.input.shoot = false;
        this.input.touchShooting = false;
      }
    };
    
    // Mobile control handlers
    this.setupMobileControls();
    
    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
  }
  
  setupMobileControls() {
    // Create mobile control UI if on mobile device
    if (this.input.isMobile) {
      this.createMobileControlUI();
    }
  }
  
  createMobileControlUI() {
    // Create mobile controls container
    const ghisGame = document.querySelector('.ghis-game');
    if (!ghisGame) return;
    
    // Check if mobile controls already exist
    let mobileControls = document.getElementById('ghisMobileControls');
    if (!mobileControls) {
      mobileControls = document.createElement('div');
      mobileControls.id = 'ghisMobileControls';
      mobileControls.className = 'ghis-mobile-controls';
      
      // Movement pad (left side)
      const movementPad = document.createElement('div');
      movementPad.className = 'mobile-movement-pad';
      
      // Create directional buttons
      const directions = [
        { name: 'up', symbol: '▲', class: 'move-up' },
        { name: 'down', symbol: '▼', class: 'move-down' },
        { name: 'left', symbol: '◀', class: 'move-left' },
        { name: 'right', symbol: '▶', class: 'move-right' }
      ];
      
      directions.forEach(dir => {
        const btn = document.createElement('button');
        btn.className = `mobile-move-btn ${dir.class}`;
        btn.innerHTML = dir.symbol;
        btn.setAttribute('data-direction', dir.name);
        
        // Touch events for movement buttons
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.input[dir.name] = true;
          btn.classList.add('active');
        });
        
        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.input[dir.name] = false;
          btn.classList.remove('active');
        });
        
        // Prevent context menu
        btn.addEventListener('contextmenu', e => e.preventDefault());
        
        movementPad.appendChild(btn);
      });
      
      // Shooting area (right side) - entire right side is shoot area
      const shootArea = document.createElement('div');
      shootArea.className = 'mobile-shoot-area';
      shootArea.innerHTML = '<div class="shoot-text">HOLD TO SHOOT</div>';
      
      // Touch events for shooting
      shootArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.input.shoot = true;
        this.input.touchShooting = true;
        shootArea.classList.add('active');
      });
      
      shootArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.input.shoot = false;
        this.input.touchShooting = false;
        shootArea.classList.remove('active');
      });
      
      // Prevent context menu
      shootArea.addEventListener('contextmenu', e => e.preventDefault());
      
      mobileControls.appendChild(movementPad);
      mobileControls.appendChild(shootArea);
      
      // Insert after the game canvas
      ghisGame.parentNode.insertBefore(mobileControls, ghisGame.nextSibling);
    }
  }
  
  removeEventListeners() {
    document.removeEventListener('keydown', this.keyDownHandler);
    document.removeEventListener('keyup', this.keyUpHandler);
    
    // Remove mobile controls if they exist
    const mobileControls = document.getElementById('ghisMobileControls');
    if (mobileControls) {
      mobileControls.remove();
    }
  }
  
  generateInitialEnemies() {
    // Spawn fewer initial enemies for better balance
    for (let i = 0; i < 5; i++) {
      this.spawnEnemy();
    }
  }
  
  spawnStartingPowerups() {
    // Spawn some starting powerups to help the player get going
    const startingPowerups = ['heart', 'shield', 'strike', 'surge'];
    
    for (let i = 0; i < startingPowerups.length; i++) {
      const angle = (i / startingPowerups.length) * Math.PI * 2;
      const distance = 100;
      const x = this.player.x + Math.cos(angle) * distance;
      const y = this.player.y + Math.sin(angle) * distance;
      
      const drop = {
        x: x,
        y: y,
        type: startingPowerups[i],
        seed: Math.random() * Math.PI * 2,
        createdAt: this.gameTime
      };
      
      this.powerupDrops.push(drop);
    }
  }
  
  spawnEnemy() {
    // Spawn enemy away from player
    let x, y;
    do {
      x = Math.random() * this.world.width;
      y = Math.random() * this.world.height;
    } while (this.getDistance(x, y, this.player.x, this.player.y) < 300); // Spawn farther away
    
    const enemy = {
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 1, // Slower movement
      vy: (Math.random() - 0.5) * 1,
      hp: 2, // Less HP so they die easier
      maxHP: 2,
      size: 6,
      type: 'basic',
      lastShot: 0,
      shootRate: 2000,
      speed: 0.3, // Slower enemy speed
      color: '#ff4444'
    };
    
    this.enemies.push(enemy);
  }
  
  update(timestamp) {
    if (this.gameState !== 'playing') return;
    
    const deltaTime = timestamp - this.lastUpdate;
    this.lastUpdate = timestamp;
    this.gameTime = timestamp;
    
    // Update player
    this.updatePlayer(deltaTime);
    
    // Update camera
    this.updateCamera();
    
    // Update enemies
    this.updateEnemies(deltaTime);
    
    // Update projectiles
    this.updateProjectiles(deltaTime);
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Update powerup drops
    this.updatePowerupDrops(deltaTime);
    
    // Check collisions
    this.checkCollisions();
    
    // Spawn more enemies if needed
    if (this.enemies.length < 8) { // Reduced max enemies
      this.spawnEnemy();
    }
  }
  
  updatePlayer(deltaTime) {
    // Handle input for movement
    const acceleration = 0.008 * deltaTime;
    const maxSpeed = 4 * this.player.speed;
    const friction = 0.95;
    
    if (this.input.up) {
      this.player.vy -= acceleration;
    }
    if (this.input.down) {
      this.player.vy += acceleration;
    }
    if (this.input.left) {
      this.player.vx -= acceleration;
    }
    if (this.input.right) {
      this.player.vx += acceleration;
    }
    
    // Apply friction
    this.player.vx *= friction;
    this.player.vy *= friction;
    
    // Limit speed
    const speed = Math.sqrt(this.player.vx * this.player.vx + this.player.vy * this.player.vy);
    if (speed > maxSpeed) {
      this.player.vx = (this.player.vx / speed) * maxSpeed;
      this.player.vy = (this.player.vy / speed) * maxSpeed;
    }
    
    // Update position
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    
    // Keep player in world bounds
    this.player.x = clamp(this.player.x, this.player.size, this.world.width - this.player.size);
    this.player.y = clamp(this.player.y, this.player.size, this.world.height - this.player.size);
    
    // Update invulnerability frames
    if (this.player.invulnerable > 0) {
      this.player.invulnerable -= deltaTime;
    }
    
    // Handle shooting
    if (this.input.shoot) {
      this.shootWeapons(deltaTime);
    }
    
    // Passive healing from hope
    if (this.player.status.hope > 0) {
      const healAmount = (this.player.status.hope * deltaTime) / 1000; // heal per second
      this.player.hp = Math.min(this.player.maxHP, this.player.hp + healAmount);
    }
  }
  
  updateCamera() {
    // Camera follows player with smoothing
    this.camera.targetX = this.player.x - 400; // Center on player (assuming 800px width)
    this.camera.targetY = this.player.y - 300; // Center on player (assuming 600px height)
    
    this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothing;
    this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.smoothing;
    
    // Keep camera in world bounds
    this.camera.x = clamp(this.camera.x, 0, this.world.width - 800);
    this.camera.y = clamp(this.camera.y, 0, this.world.height - 600);
  }
  
  updateEnemies(deltaTime) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // Apply freeze effect
      let speedMultiplier = 1;
      if (this.player.powerups.freeze > 0) {
        speedMultiplier = Math.max(0.2, 1 - (this.player.powerups.freeze * 0.15)); // Each freeze reduces speed by 15%
      }
      
      // Move toward player
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        const speed = enemy.speed * deltaTime * 0.01 * speedMultiplier;
        enemy.vx += (dx / dist) * speed;
        enemy.vy += (dy / dist) * speed;
      }
      
      // Apply movement
      enemy.x += enemy.vx * speedMultiplier;
      enemy.y += enemy.vy * speedMultiplier;
      
      // Apply friction
      enemy.vx *= 0.98;
      enemy.vy *= 0.98;
      
      // Remove dead enemies
      if (enemy.hp <= 0) {
        this.spawnPowerupDrop(enemy.x, enemy.y);
        this.enemies.splice(i, 1);
      }
    }
  }
  
  updateProjectiles(deltaTime) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      
      // Move projectile
      proj.x += proj.vx;
      proj.y += proj.vy;
      
      // Remove if out of world bounds or expired
      if (proj.x < 0 || proj.x > this.world.width || 
          proj.y < 0 || proj.y > this.world.height ||
          this.gameTime - proj.createdAt > proj.lifetime) {
        this.projectiles.splice(i, 1);
      }
    }
  }
  
  updateParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= deltaTime;
      particle.alpha = particle.life / particle.maxLife;
      
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  updatePowerupDrops(deltaTime) {
    for (let i = this.powerupDrops.length - 1; i >= 0; i--) {
      const drop = this.powerupDrops[i];
      
      // Simple floating animation
      drop.y += Math.sin(this.gameTime * 0.003 + drop.seed) * 0.5;
      
      // Remove after timeout
      if (this.gameTime - drop.createdAt > 30000) { // 30 seconds
        this.powerupDrops.splice(i, 1);
      }
    }
  }
  
  shootWeapons(deltaTime) {
    // Shoot pewpew weapon
    const pewpew = this.player.weapons.pewpew;
    if (this.gameTime - pewpew.lastFired >= pewpew.fireRate) {
      this.shootPewpew();
      pewpew.lastFired = this.gameTime;
    }
    
    // Shoot zap weapon if unlocked
    const zap = this.player.weapons.zap;
    if (this.player.powerups.zap > 0 && this.gameTime - zap.lastFired >= zap.fireRate) {
      this.shootZap();
      zap.lastFired = this.gameTime;
    }
  }
  
  shootPewpew() {
    const weapon = this.player.weapons.pewpew;
    const spreadAngle = Math.PI / 8; // Spread for multishot
    
    for (let i = 0; i < weapon.multishot; i++) {
      let angle = this.player.angle;
      
      // Add spread for multishot
      if (weapon.multishot > 1) {
        const spread = (i - (weapon.multishot - 1) / 2) * (spreadAngle / Math.max(1, weapon.multishot - 1));
        angle += spread;
      }
      
      const speed = 8;
      const projectile = {
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: weapon.damage,
        pierce: weapon.pierce,
        owner: 'player',
        type: 'pewpew',
        size: 2,
        color: '#00ffff',
        createdAt: this.gameTime,
        lifetime: 5000
      };
      
      this.projectiles.push(projectile);
    }
    
    // Create muzzle flash particle
    this.createParticle(this.player.x, this.player.y, '#ffffff', 100);
  }
  
  shootZap() {
    // Find nearest enemy for zap chain
    let nearestEnemy = null;
    let nearestDist = Infinity;
    
    for (const enemy of this.enemies) {
      const dist = this.getDistance(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < nearestDist && dist <= this.player.weapons.zap.range) {
        nearestEnemy = enemy;
        nearestDist = dist;
      }
    }
    
    if (nearestEnemy) {
      this.zapChain(this.player.x, this.player.y, nearestEnemy, this.player.powerups.zap);
    }
  }
  
  zapChain(startX, startY, target, chainsLeft) {
    if (!target || chainsLeft <= 0) return;
    
    // Deal damage to current target
    target.hp -= this.player.weapons.zap.damage;
    
    // Create lightning effect
    this.createLightningEffect(startX, startY, target.x, target.y);
    
    // Find next target for chain
    if (chainsLeft > 1) {
      let nextTarget = null;
      let nearestDist = Infinity;
      
      for (const enemy of this.enemies) {
        if (enemy === target) continue;
        const dist = this.getDistance(target.x, target.y, enemy.x, enemy.y);
        if (dist < nearestDist && dist <= this.player.weapons.zap.range) {
          nextTarget = enemy;
          nearestDist = dist;
        }
      }
      
      if (nextTarget) {
        // Chain to next target with slight delay
        setTimeout(() => {
          this.zapChain(target.x, target.y, nextTarget, chainsLeft - 1);
        }, 50);
      }
    }
  }
  
  checkCollisions() {
    // Player projectiles vs enemies
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (proj.owner !== 'player') continue;
      
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        
        if (this.isColliding(proj, enemy)) {
          // Deal damage
          enemy.hp -= proj.damage;
          
          // Create hit effect
          this.createParticle(enemy.x, enemy.y, '#ff4444', 200);
          
          // Handle pierce
          if (proj.pierce > 0) {
            proj.pierce--;
          } else {
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }
    
    // Player vs enemies (collision damage)
    if (!this.debug.godMode && this.player.invulnerable <= 0) {
      for (const enemy of this.enemies) {
        if (this.isColliding(this.player, enemy)) {
          // Take damage (with shield check)
          if (this.player.shield > 0) {
            this.player.shield--;
          } else {
            this.player.hp--;
          }
          
          // Add invulnerability frames (1 second)
          this.player.invulnerable = 1000;
          
          // Knockback
          const dx = this.player.x - enemy.x;
          const dy = this.player.y - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          this.player.vx += (dx / dist) * 5;
          this.player.vy += (dy / dist) * 5;
          
          // Game over check
          if (this.player.hp <= 0) {
            this.gameState = 'gameOver';
          }
          
          break; // Only take damage from one enemy per frame
        }
      }
    }
    
    // Player vs powerup drops
    for (let i = this.powerupDrops.length - 1; i >= 0; i--) {
      const drop = this.powerupDrops[i];
      
      if (this.getDistance(this.player.x, this.player.y, drop.x, drop.y) < 20) {
        this.collectPowerup(drop.type);
        this.powerupDrops.splice(i, 1);
      }
    }
  }
  
  collectPowerup(type) {
    this.player.powerups[type]++;
    
    // Log the powerup collection
    if (window.currentGhisGame === this) {
      const powerupNames = {
        heart: 'Heart (+5 max HP)',
        shield: 'Shield (restore/boost)',
        strike: 'Strike (+1 damage)',
        pierce: 'Pierce (+1 penetration)',
        zap: 'Zap (lightning chain)',
        echo: 'Echo (faster firing)',
        freeze: 'Freeze (slow enemies)',
        focus: 'Focus (+10% crit chance)',
        droid: 'Droid (+1 companion)',
        hope: 'Hope (+1 healing/sec)',
        overload: 'Overload (+1 multishot)',
        surge: 'Surge (+20% speed)',
        reap: 'Reap (piercing laser)'
      };
      
      if (typeof window.logToGhis === 'function') {
        window.logToGhis(`Collected ${powerupNames[type] || type}!`);
      }
    }
    
    // Apply powerup effect
    switch (type) {
      case 'heart':
        this.player.maxHP += 5;
        this.player.hp = Math.min(this.player.maxHP, this.player.hp + 5);
        break;
      case 'shield':
        if (this.player.shield >= this.player.maxShield) {
          this.player.maxShield++;
        }
        this.player.shield = this.player.maxShield;
        break;
      case 'strike':
        this.player.weapons.pewpew.damage++;
        break;
      case 'pierce':
        this.player.weapons.pewpew.pierce++;
        break;
      case 'echo':
        this.player.weapons.pewpew.fireRate = Math.max(50, this.player.weapons.pewpew.fireRate - 50);
        break;
      case 'freeze':
        // Freeze effect is applied in updateEnemies based on powerup count
        break;
      case 'focus':
        this.player.weapons.pewpew.criticalChance = Math.min(0.5, this.player.weapons.pewpew.criticalChance + 0.1);
        break;
      case 'droid':
        this.spawnDrone();
        break;
      case 'hope':
        this.player.status.hope++;
        break;
      case 'overload':
        this.player.weapons.pewpew.multishot++;
        break;
      case 'surge':
        this.player.speed += 0.2;
        break;
    }
    
    // Create collection effect
    this.createParticle(this.player.x, this.player.y, '#00ff00', 500);
  }
  
  spawnDrone() {
    const drone = {
      x: this.player.x,
      y: this.player.y,
      targetX: this.player.x,
      targetY: this.player.y,
      offset: this.player.drones.length * (Math.PI * 2 / 8), // Orbit offset
      distance: 40,
      lastShot: 0,
      shootRate: 600
    };
    
    this.player.drones.push(drone);
  }
  
  spawnPowerupDrop(x, y) {
    // Random powerup type based on weights
    const powerupTypes = [
      'heart', 'shield', 'strike', 'pierce', 'zap', 'echo', 
      'freeze', 'focus', 'droid', 'hope', 'overload', 'surge', 'reap'
    ];
    
    const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    
    const drop = {
      x: x,
      y: y,
      type: type,
      seed: Math.random() * Math.PI * 2,
      createdAt: this.gameTime
    };
    
    this.powerupDrops.push(drop);
  }
  
  createParticle(x, y, color, life) {
    const particle = {
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      color: color,
      life: life,
      maxLife: life,
      alpha: 1,
      size: Math.random() * 3 + 1
    };
    
    this.particles.push(particle);
  }
  
  createLightningEffect(x1, y1, x2, y2) {
    // Create multiple particles along the lightning path
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 20;
      const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20;
      this.createParticle(x, y, '#ffff00', 150);
    }
  }
  
  getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  isColliding(a, b) {
    const distance = this.getDistance(a.x, a.y, b.x, b.y);
    return distance < (a.size + b.size);
  }
  
  render(ctx) {
    // Clear canvas
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Save context for camera transform
    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);
    
    // Render stars background
    this.renderStars(ctx);
    
    // Render entities
    this.renderEnemies(ctx);
    this.renderProjectiles(ctx);
    this.renderPowerupDrops(ctx);
    this.renderParticles(ctx);
    this.renderPlayer(ctx);
    this.renderDrones(ctx);
    
    // Debug rendering
    if (this.debug.enabled && this.debug.showHitboxes) {
      this.renderDebugHitboxes(ctx);
    }
    
    ctx.restore();
    
    // Render UI (not affected by camera)
    this.renderUI(ctx);
  }
  
  renderStars(ctx) {
    // Simple star field background
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 137.5) % this.world.width; // Pseudo-random distribution
      const y = (i * 211.3) % this.world.height;
      const size = (i % 3) + 1;
      
      ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
  }
  
  renderPlayer(ctx) {
    // Calculate player angle based on mouse position
    const mouseWorldX = this.input.mouseX + this.camera.x;
    const mouseWorldY = this.input.mouseY + this.camera.y;
    this.player.angle = Math.atan2(mouseWorldY - this.player.y, mouseWorldX - this.player.x);
    
    // Invulnerability flashing effect
    if (this.player.invulnerable > 0) {
      const flashRate = 200; // Flash every 200ms
      if (Math.floor(this.gameTime / flashRate) % 2 === 0) {
        return; // Skip rendering to create flashing effect
      }
    }
    
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.player.angle);
    
    // Draw Light Body (LB) ship - pixelated style
    this.drawLightBodyShip(ctx);
    
    ctx.restore();
    
    // Shield effect
    if (this.player.shield > 0) {
      const glowIntensity = 0.3 + Math.sin(this.gameTime * 0.01) * 0.2;
      ctx.fillStyle = `rgba(100, 150, 255, ${glowIntensity})`;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this.player.size + 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawLightBodyShip(ctx) {
    // Light Body ship - appearance based on player powerups and stats
    const scale = 2;
    const powerups = this.player.powerups;
    
    // Base ship color - changes based on dominant powerup
    let mainColor = '#00ffff'; // Default cyan
    let accentColor = '#ffffff'; // Default white
    
    // Determine dominant powerup for color theming
    let maxPowerup = '';
    let maxCount = 0;
    for (const [type, count] of Object.entries(powerups)) {
      if (count > maxCount) {
        maxCount = count;
        maxPowerup = type;
      }
    }
    
    // Color theme based on dominant powerup
    switch (maxPowerup) {
      case 'heart':
        mainColor = '#ff4444'; accentColor = '#ffaaaa'; break;
      case 'shield':
        mainColor = '#4444ff'; accentColor = '#aaaaff'; break;
      case 'strike':
        mainColor = '#ff8844'; accentColor = '#ffcc88'; break;
      case 'pierce':
        mainColor = '#ffff44'; accentColor = '#ffff88'; break;
      case 'zap':
        mainColor = '#8844ff'; accentColor = '#cc88ff'; break;
      case 'echo':
        mainColor = '#44ff88'; accentColor = '#88ffaa'; break;
      case 'freeze':
        mainColor = '#44ffff'; accentColor = '#88ffff'; break;
      case 'focus':
        mainColor = '#ff44ff'; accentColor = '#ff88ff'; break;
      case 'droid':
        mainColor = '#ffaa44'; accentColor = '#ffcc88'; break;
      case 'hope':
        mainColor = '#88ff44'; accentColor = '#aaffaa'; break;
      case 'overload':
        mainColor = '#ff4488'; accentColor = '#ff88aa'; break;
      case 'surge':
        mainColor = '#4488ff'; accentColor = '#88aaff'; break;
      case 'reap':
        mainColor = '#884444'; accentColor = '#aa8888'; break;
    }
    
    // Main body - size increases with total powerups
    const totalPowerups = Object.values(powerups).reduce((a, b) => a + b, 0);
    const bodyScale = scale + Math.min(totalPowerups * 0.1, 1); // Grows up to +1 scale
    
    ctx.fillStyle = mainColor;
    ctx.fillRect(-4 * bodyScale, -2 * bodyScale, 8 * bodyScale, 4 * bodyScale);
    
    // Cockpit
    ctx.fillStyle = accentColor;
    ctx.fillRect(2 * bodyScale, -1 * bodyScale, 2 * bodyScale, 2 * bodyScale);
    
    // Wings - enhanced based on surge powerups
    const wingScale = scale + (powerups.surge || 0) * 0.2;
    ctx.fillStyle = mainColor;
    ctx.fillRect(-6 * wingScale, -1 * scale, 2 * wingScale, 2 * scale);
    ctx.fillRect(-2 * wingScale, -3 * scale, 2 * wingScale, 1 * scale);
    ctx.fillRect(-2 * wingScale, 2 * scale, 2 * wingScale, 1 * scale);
    
    // Engine effects - enhanced based on powerups
    let engineColor = '#ff4400';
    if (powerups.surge > 0) engineColor = '#44aaff'; // Blue engines for speed
    if (powerups.focus > 0) engineColor = '#ff44aa'; // Pink engines for focus
    
    ctx.fillStyle = engineColor;
    const engineLength = 1 + (powerups.surge || 0) * 0.3;
    ctx.fillRect(-6 * scale, -1 * scale, engineLength * scale, 2 * scale);
    
    // Weapon hardpoints - show based on strike/pierce powerups
    if ((powerups.strike || 0) > 0) {
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(3 * scale, -2 * scale, 1 * scale, 1 * scale);
      ctx.fillRect(3 * scale, 1 * scale, 1 * scale, 1 * scale);
    }
    
    // Shield emitters - show if shield powerups collected
    if ((powerups.shield || 0) > 0) {
      ctx.fillStyle = '#aaaaff';
      ctx.fillRect(-1 * scale, -3 * scale, 1 * scale, 1 * scale);
      ctx.fillRect(-1 * scale, 2 * scale, 1 * scale, 1 * scale);
    }
    
    // Special effects based on powerups
    if ((powerups.zap || 0) > 0) {
      // Lightning crackling effect
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-2, -2);
      ctx.lineTo(2, 2);
      ctx.moveTo(-2, 2);
      ctx.lineTo(2, -2);
      ctx.stroke();
    }
    
    if ((powerups.hope || 0) > 0) {
      // Healing aura
      const auraIntensity = 0.3 + Math.sin(this.gameTime * 0.005) * 0.2;
      ctx.fillStyle = `rgba(100, 255, 100, ${auraIntensity})`;
      ctx.beginPath();
      ctx.arc(0, 0, 8 + powerups.hope, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  renderDrones(ctx) {
    for (const drone of this.player.drones) {
      // Update drone position (orbit around player)
      const angle = this.gameTime * 0.002 + drone.offset;
      drone.targetX = this.player.x + Math.cos(angle) * drone.distance;
      drone.targetY = this.player.y + Math.sin(angle) * drone.distance;
      
      // Smooth movement toward target
      drone.x += (drone.targetX - drone.x) * 0.1;
      drone.y += (drone.targetY - drone.y) * 0.1;
      
      // Render drone
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(drone.x - 3, drone.y - 3, 6, 6);
      
      // Drone shooting
      if (this.gameTime - drone.lastShot >= drone.shootRate) {
        // Find nearest enemy to shoot at
        let nearestEnemy = null;
        let nearestDist = Infinity;
        
        for (const enemy of this.enemies) {
          const dist = this.getDistance(drone.x, drone.y, enemy.x, enemy.y);
          if (dist < nearestDist && dist <= 200) {
            nearestEnemy = enemy;
            nearestDist = dist;
          }
        }
        
        if (nearestEnemy) {
          const angle = Math.atan2(nearestEnemy.y - drone.y, nearestEnemy.x - drone.x);
          const speed = 6;
          
          const projectile = {
            x: drone.x,
            y: drone.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: this.player.weapons.pewpew.damage,
            pierce: 0,
            owner: 'player',
            type: 'drone',
            size: 1,
            color: '#ffaa00',
            createdAt: this.gameTime,
            lifetime: 3000
          };
          
          this.projectiles.push(projectile);
          drone.lastShot = this.gameTime;
        }
      }
    }
  }
  
  renderEnemies(ctx) {
    for (const enemy of this.enemies) {
      // Simple enemy rendering
      ctx.fillStyle = enemy.color;
      ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size, enemy.size * 2, enemy.size * 2);
      
      // Health bar
      if (enemy.hp < enemy.maxHP) {
        const barWidth = enemy.size * 2;
        const barHeight = 2;
        const healthPercent = enemy.hp / enemy.maxHP;
        
        ctx.fillStyle = '#444';
        ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.size - 8, barWidth, barHeight);
        
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.size - 8, barWidth * healthPercent, barHeight);
      }
    }
  }
  
  renderProjectiles(ctx) {
    for (const proj of this.projectiles) {
      ctx.fillStyle = proj.color;
      ctx.fillRect(proj.x - proj.size, proj.y - proj.size, proj.size * 2, proj.size * 2);
    }
  }
  
  renderPowerupDrops(ctx) {
    for (const drop of this.powerupDrops) {
      // Powerup glow effect
      const glowIntensity = 0.5 + Math.sin(this.gameTime * 0.005 + drop.seed) * 0.3;
      ctx.fillStyle = `rgba(0, 255, 0, ${glowIntensity})`;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Powerup symbol (simple)
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.getPowerupSymbol(drop.type), drop.x, drop.y + 4);
    }
  }
  
  renderParticles(ctx) {
    for (const particle of this.particles) {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
  }
  
  renderDebugHitboxes(ctx) {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;
    
    // Player hitbox
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.size, 0, Math.PI * 2);
    ctx.stroke();
    
    // Enemy hitboxes
    for (const enemy of this.enemies) {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  renderUI(ctx) {
    // Health bar
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthPercent = this.player.hp / this.player.maxHP;
    
    ctx.fillStyle = '#444';
    ctx.fillRect(10, 10, healthBarWidth, healthBarHeight);
    
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(10, 10, healthBarWidth * healthPercent, healthBarHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.ceil(this.player.hp)}/${this.player.maxHP}`, 15, 25);
    
    // Shield display
    if (this.player.maxShield > 0) {
      ctx.fillText(`Shield: ${this.player.shield}/${this.player.maxShield}`, 15, 45);
    }
    
    // Powerup counts (debug display)
    if (this.debug.enabled && this.debug.showStats) {
      let y = 70;
      for (const [type, count] of Object.entries(this.player.powerups)) {
        if (count > 0) {
          ctx.fillText(`${type}: ${count}`, 15, y);
          y += 15;
        }
      }
    }
    
    // Game state messages
    if (this.gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      ctx.fillStyle = '#ff4444';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', ctx.canvas.width / 2, ctx.canvas.height / 2);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText('Press R to restart', ctx.canvas.width / 2, ctx.canvas.height / 2 + 40);
    }
    
    // Instructions
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    
    if (this.input.isMobile) {
      ctx.fillText('Use controls below to move and shoot', ctx.canvas.width - 10, ctx.canvas.height - 30);
      ctx.fillText('Touch screen to aim | Hold shoot button to fire', ctx.canvas.width - 10, ctx.canvas.height - 15);
    } else {
      ctx.fillText('WASD/Arrows: Move | Mouse: Aim | Space: Shoot', ctx.canvas.width - 10, ctx.canvas.height - 30);
      if (this.debug.enabled) {
        ctx.fillText('Debug: F=God Mode | H=Hitboxes', ctx.canvas.width - 10, ctx.canvas.height - 15);
      }
    }
  }
  
  getPowerupSymbol(type) {
    const symbols = {
      heart: '♥',
      shield: '🛡',
      strike: '⚔',
      pierce: '🗡',
      zap: '⚡',
      echo: '🔄',
      freeze: '❄',
      focus: '🎯',
      droid: '🤖',
      hope: '✨',
      overload: '💥',
      surge: '🚀',
      reap: '💀'
    };
    return symbols[type] || '?';
  }
  
  // Debug functions
  enableDebug() {
    this.debug.enabled = true;
  }
  
  disableDebug() {
    this.debug.enabled = false;
  }
  
  // Cleanup
  destroy() {
    this.removeEventListeners();
  }
}