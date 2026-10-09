// Grid navigation for the dungeon prototype. Pure logic (no DOM).
import { LOCATIONS } from './levels.js';

export const DIRS = [
  { dx: 0, dz: -1 }, // N
  { dx: 1, dz: 0 },  // E
  { dx: 0, dz: 1 },  // S
  { dx: -1, dz: 0 }  // W
];

export function parseLevel(location = LOCATIONS[0]) {
  const rows = location.rows;
  const level = { w: rows[0].length, h: rows.length, cells: [], start: null, enemies: [], chest: null, exit: null, quota: 0 };
  rows.forEach((row, z) => {
    const line = [];
    [...row].forEach((ch, x) => {
      if (ch === 'S') { level.start = { x, z, dir: 1 }; ch = '.'; }
      else if (ch === 'E') { level.enemies.push({ x, z, alive: true }); ch = '.'; }
      else if (ch === 'C') { level.chest = { x, z }; ch = '.'; }
      else if (ch === 'X') { level.exit = { x, z }; }
      line.push(ch);
    });
    level.cells.push(line);
  });
  level.quota = level.enemies.length;
  location.opponents.forEach((o, i) => {
    if (level.enemies[i]) level.enemies[i].spec = o;
  });
  return level;
}

export class Navigator {
  constructor(location = LOCATIONS[0]) {
    this.location = location;
    this.level = parseLevel(location);
    const s = this.level.start;
    this.x = s.x; this.z = s.z; this.dir = s.dir;
    this.chestOpen = !this.level.chest;
    this.visited = new Set();
    this.markVisited();
  }

  get quota() { return this.level.quota; }
  get defeated() { return this.level.enemies.filter(e => !e.alive).length; }
  get remaining() { return this.quota - this.defeated; }
  exitLocked() { return this.remaining > 0; }

  cell(x, z) {
    const row = this.level.cells[z];
    return row ? row[x] || '#' : '#';
  }

  setCell(x, z, ch) { this.level.cells[z][x] = ch; }

  enemyAt(x, z) { return this.level.enemies.find(e => e.alive && e.x === x && e.z === z) || null; }
  isEnemyAt(x, z) { return !!this.enemyAt(x, z); }

  isChestAt(x, z) {
    const c = this.level.chest;
    return !!(!this.chestOpen && c && c.x === x && c.z === z);
  }

  // Cells that block sight and movement as architecture.
  isWall(x, z) {
    const c = this.cell(x, z);
    return c === '#' || c === 'D' || (c === 'X' && this.exitLocked());
  }

  isSolid(x, z) { return this.isWall(x, z) || this.isEnemyAt(x, z) || this.isChestAt(x, z); }

  get facing() { return DIRS[this.dir]; }
  front() { return { x: this.x + this.facing.dx, z: this.z + this.facing.dz }; }

  markVisited() {
    this.visited.add(this.x + ',' + this.z);
    for (let i = 0; i < 4; i++) this.visited.add((this.x + DIRS[i].dx) + ',' + (this.z + DIRS[i].dz));
  }

  move(step) {
    const nx = this.x + this.facing.dx * step;
    const nz = this.z + this.facing.dz * step;
    if (this.isSolid(nx, nz)) return false;
    this.x = nx; this.z = nz;
    this.markVisited();
    return true;
  }

  turn(step) { this.dir = (this.dir + step + 4) % 4; }

  // Returns 'door' | 'chest' | 'locked' | null
  interact() {
    const f = this.front();
    if (this.cell(f.x, f.z) === 'D') { this.setCell(f.x, f.z, '.'); return 'door'; }
    if (this.isChestAt(f.x, f.z)) { this.chestOpen = true; return 'chest'; }
    if (this.cell(f.x, f.z) === 'X' && this.exitLocked()) return 'locked';
    return null;
  }

  // Nearest living enemy in an unobstructed straight line: { dir, enemy } or null.
  enemyInRange(range = 3) {
    let best = null;
    for (let d = 0; d < 4; d++) {
      for (let i = 1; i <= range; i++) {
        const x = this.x + DIRS[d].dx * i;
        const z = this.z + DIRS[d].dz * i;
        const e = this.enemyAt(x, z);
        if (e) { if (!best || i < best.dist) best = { dir: d, enemy: e, dist: i }; break; }
        if (this.isWall(x, z)) break;
      }
    }
    return best;
  }

  atExit() {
    const e = this.level.exit;
    return !!e && !this.exitLocked() && this.x === e.x && this.z === e.z;
  }
}
