// Grid navigation for the First Descent dungeon prototype.
// Pure logic (no DOM) so it can be tested headlessly.

export const DIRS = [
  { dx: 0, dz: -1 }, // N
  { dx: 1, dz: 0 },  // E
  { dx: 0, dz: 1 },  // S
  { dx: -1, dz: 0 }  // W
];

// '#': wall  '.': floor  'D': closed door  'S': start  'C': chest
// 'E': enemy  'X': exit
export const LEVEL_ROWS = [
  '###########',
  '#S..#C....#',
  '#.#.#.###.#',
  '#.#...#.#.#',
  '#.#####.#.#',
  '#...D...E.X',
  '###########'
];

export function parseLevel(rows = LEVEL_ROWS) {
  const level = { w: rows[0].length, h: rows.length, cells: [], start: null, enemy: null, chest: null, exit: null };
  rows.forEach((row, z) => {
    const line = [];
    [...row].forEach((ch, x) => {
      if (ch === 'S') { level.start = { x, z, dir: 1 }; ch = '.'; }
      else if (ch === 'E') { level.enemy = { x, z }; ch = '.'; }
      else if (ch === 'C') { level.chest = { x, z }; ch = '.'; }
      else if (ch === 'X') { level.exit = { x, z }; }
      line.push(ch);
    });
    level.cells.push(line);
  });
  return level;
}

export class Navigator {
  constructor(level = parseLevel()) {
    this.level = level;
    this.x = level.start.x;
    this.z = level.start.z;
    this.dir = level.start.dir;
    this.enemyAlive = !!level.enemy;
    this.chestOpen = !level.chest;
    this.visited = new Set();
    this.markVisited();
  }

  cell(x, z) {
    const row = this.level.cells[z];
    return row ? row[x] || '#' : '#';
  }

  setCell(x, z, ch) { this.level.cells[z][x] = ch; }

  isEnemyAt(x, z) {
    const e = this.level.enemy;
    return !!(this.enemyAlive && e && e.x === x && e.z === z);
  }

  isChestAt(x, z) {
    const c = this.level.chest;
    return !!(!this.chestOpen && c && c.x === x && c.z === z);
  }

  isSolid(x, z) {
    const c = this.cell(x, z);
    return c === '#' || c === 'D' || this.isEnemyAt(x, z) || this.isChestAt(x, z);
  }

  get facing() { return DIRS[this.dir]; }

  front() { return { x: this.x + this.facing.dx, z: this.z + this.facing.dz }; }

  markVisited() {
    this.visited.add(this.x + ',' + this.z);
    for (let i = 0; i < 4; i++) {
      this.visited.add((this.x + DIRS[i].dx) + ',' + (this.z + DIRS[i].dz));
    }
  }

  // step: +1 forward, -1 backward. Returns true if the player moved.
  move(step) {
    const nx = this.x + this.facing.dx * step;
    const nz = this.z + this.facing.dz * step;
    if (this.isSolid(nx, nz)) return false;
    this.x = nx;
    this.z = nz;
    this.markVisited();
    return true;
  }

  turn(step) { this.dir = (this.dir + step + 4) % 4; }

  // Interact with whatever is directly ahead. Returns 'door' | 'chest' | null.
  interact() {
    const f = this.front();
    if (this.cell(f.x, f.z) === 'D') { this.setCell(f.x, f.z, '.'); return 'door'; }
    if (this.isChestAt(f.x, f.z)) { this.chestOpen = true; return 'chest'; }
    return null;
  }

  // Is the living enemy in a straight, unobstructed line within `range` tiles?
  // Returns the direction index towards it, or -1.
  enemyInRange(range = 3) {
    const e = this.level.enemy;
    if (!this.enemyAlive || !e) return -1;
    for (let d = 0; d < 4; d++) {
      for (let i = 1; i <= range; i++) {
        const x = this.x + DIRS[d].dx * i;
        const z = this.z + DIRS[d].dz * i;
        if (x === e.x && z === e.z) return d;
        const c = this.cell(x, z);
        if (c === '#' || c === 'D') break;
      }
    }
    return -1;
  }

  atExit() {
    const e = this.level.exit;
    return !!e && this.x === e.x && this.z === e.z;
  }
}
