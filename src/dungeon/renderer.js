// Minimal wireframe first-person renderer (Canvas 2D, no dependencies).
// Walls are projected with a simple perspective transform, painter-sorted,
// and drawn as fogged outlines.

import { DIRS } from './navigation.js';

let IVORY = [232, 228, 216];
let ACCENT = [110, 200, 255];
let WARM = [255, 170, 90];

export function setPalette(p) { IVORY = p.ivory; ACCENT = p.accent; WARM = p.warm; }
const BG = '#08080b';
const NEAR = 0.12;
const VIEW = 7;

const ease = t => t * t * (3 - 2 * t);
const angleDelta = (a, b) => ((b - a + 540) % 360) - 180;

// Smooths camera motion toward the navigator's grid state.
export class CameraRig {
  constructor(nav) {
    this.x = nav.x; this.z = nav.z; this.yaw = nav.dir * 90;
    this.from = { x: this.x, z: this.z, yaw: this.yaw };
    this.to = { ...this.from };
    this.t = 1; this.dur = 240;
    this.reduceMotion = false;
  }

  moveTo(nav) {
    this.from = { x: this.x, z: this.z, yaw: this.yaw };
    this.to = { x: nav.x, z: nav.z, yaw: this.yaw + angleDelta(this.yaw, nav.dir * 90) };
    this.t = this.reduceMotion ? 1 : 0;
    if (this.reduceMotion) this.update(0);
  }

  update(dtMs) {
    if (this.t >= 1 && this.x === this.to.x && this.z === this.to.z) return;
    this.t = Math.min(1, this.t + dtMs / this.dur);
    const k = ease(this.t);
    this.x = this.from.x + (this.to.x - this.from.x) * k;
    this.z = this.from.z + (this.to.z - this.from.z) * k;
    this.yaw = this.from.yaw + (this.to.yaw - this.from.yaw) * k;
    if (this.t >= 1) {
      this.x = this.to.x; this.z = this.to.z; this.yaw = ((this.to.yaw % 360) + 360) % 360;
      this.from = { ...this.to, yaw: this.yaw }; this.to = { ...this.from };
    }
  }

  get moving() { return this.t < 1; }
}

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

export class DungeonRenderer {
  constructor(canvas, nav, rig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nav = nav;
    this.rig = rig;
    this.time = 0;
    this.reduceMotion = false;
    this.enemyFx = { hitAt: -1e9, flash: 0, shieldAt: -1e9, burn: false, frozen: false, dead: false, deadAt: 0 };
    this.fxTarget = null;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    this.w = this.canvas.width; this.h = this.canvas.height;
    this.focal = Math.min(this.w * 0.9, this.h * 1.3);
  }

  // World -> camera space: returns [side, up, depth]
  toCam(x, y, z) {
    const yaw = this.rig.yaw * Math.PI / 180;
    const dx = x - this.rig.x, dz = z - this.rig.z;
    const fx = Math.sin(yaw), fz = -Math.cos(yaw);
    const rx = Math.cos(yaw), rz = Math.sin(yaw);
    const bob = this.rig.moving && !this.reduceMotion ? Math.sin(this.rig.t * Math.PI * 2) * 0.015 : 0;
    return [dx * rx + dz * rz, y - 0.5 - bob, dx * fx + dz * fz];
  }

  proj(p) {
    return [this.w / 2 + p[0] / p[2] * this.focal, this.h / 2 - p[1] / p[2] * this.focal];
  }

  clipNear(pts) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const ain = a[2] >= NEAR, bin = b[2] >= NEAR;
      if (ain) out.push(a);
      if (ain !== bin) {
        const t = (NEAR - a[2]) / (b[2] - a[2]);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]);
      }
    }
    return out;
  }

  poly(worldPts, color, fog, fill = true, lineW = 1) {
    const cam = this.clipNear(worldPts.map(p => this.toCam(...p)));
    if (cam.length < 3) return;
    const ctx = this.ctx;
    ctx.beginPath();
    cam.forEach((p, i) => { const s = this.proj(p); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); });
    ctx.closePath();
    if (fill) { ctx.fillStyle = BG; ctx.fill(); }
    ctx.strokeStyle = rgba(color, fog);
    ctx.lineWidth = lineW * (this.w / 800 + 0.6);
    ctx.stroke();
  }

  line3(a, b, color, alpha, lw = 1) {
    let pa = this.toCam(...a), pb = this.toCam(...b);
    if (pa[2] < NEAR && pb[2] < NEAR) return;
    if (pa[2] < NEAR) { const t = (NEAR - pa[2]) / (pb[2] - pa[2]); pa = [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t, NEAR]; }
    if (pb[2] < NEAR) { const t = (NEAR - pb[2]) / (pa[2] - pb[2]); pb = [pb[0] + (pa[0] - pb[0]) * t, pb[1] + (pa[1] - pb[1]) * t, NEAR]; }
    const sa = this.proj(pa), sb = this.proj(pb), ctx = this.ctx;
    ctx.beginPath(); ctx.moveTo(sa[0], sa[1]); ctx.lineTo(sb[0], sb[1]);
    ctx.strokeStyle = rgba(color, alpha);
    ctx.lineWidth = lw * (this.w / 800 + 0.6);
    ctx.stroke();
  }

  fogAt(x, z) {
    const d = Math.hypot(x - this.rig.x, z - this.rig.z);
    const flicker = this.reduceMotion ? 0 : Math.sin(this.time * 0.007) * 0.04;
    return 1.05 - d / (VIEW + 0.5) + flicker;
  }

  render(dt) {
    this.time += dt;
    const ctx = this.ctx;
    if (!this.w) this.resize();
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, this.w, this.h);

    const { nav } = this;
    const cx = Math.round(this.rig.x), cz = Math.round(this.rig.z);
    const faces = [];
    for (let z = cz - VIEW; z <= cz + VIEW; z++) {
      for (let x = cx - VIEW; x <= cx + VIEW; x++) {
        const c = nav.cell(x, z);
        const solid = nav.isWall(x, z);
        const dist = Math.hypot(x - this.rig.x, z - this.rig.z);
        if (dist > VIEW) continue;
        if (!solid) {
          faces.push({ dist, kind: 'floor', x, z, exit: c === 'X' });
          continue;
        }
        const color = c === 'D' ? ACCENT : c === 'X' ? WARM : IVORY;
        DIRS.forEach(d => {
          const ox = x + d.dx, oz = z + d.dz;
          if (nav.isWall(ox, oz)) return;
          faces.push({ dist: dist - 0.01, kind: 'wall', x, z, d, color, door: c === 'D' || c === 'X' });
        });
      }
    }
    faces.sort((a, b) => b.dist - a.dist);
    for (const f of faces) {
      if (f.kind === 'floor') this.drawFloor(f);
      else this.drawWall(f);
    }
    this.drawEntities();
    this.drawVignette();
  }

  drawFloor(f) {
    const fog = this.fogAt(f.x, f.z) * 0.5;
    if (fog <= 0.02) return;
    const x0 = f.x - 0.5, x1 = f.x + 0.5, z0 = f.z - 0.5, z1 = f.z + 0.5;
    this.poly([[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]], f.exit ? WARM : IVORY, fog * (f.exit ? 2 : 1), true, 1);
    if (f.exit) {
      const glow = 0.5 + (this.reduceMotion ? 0 : 0.5 * Math.sin(this.time * 0.004));
      for (let h = 0.15; h <= 0.85; h += 0.35) {
        this.poly([[x0 + .1, h, z0 + .1], [x1 - .1, h, z0 + .1], [x1 - .1, h, z1 - .1], [x0 + .1, h, z1 - .1]], WARM, fog * glow * 2, false, 1);
      }
    }
  }

  drawWall(f) {
    // Face geometry on the side of the cell facing direction f.d
    const { x, z, d } = f;
    const hx = d.dx * 0.5, hz = d.dz * 0.5;
    const px = -d.dz * 0.5, pz = d.dx * 0.5;
    const mx = x + hx, mz = z + hz;
    const pts = [[mx - px, 0, mz - pz], [mx + px, 0, mz + pz], [mx + px, 1, mz + pz], [mx - px, 1, mz - pz]];
    const fog = this.fogAt(mx, mz);
    if (fog <= 0.02) return;
    this.poly(pts, f.color, fog * (f.door ? 1.2 : 0.9), true, f.door ? 1.6 : 1.1);
    if (f.door) {
      this.line3([mx - px, 0, mz - pz], [mx + px, 1, mz + pz], f.color, fog * 0.7);
      this.line3([mx + px, 0, mz + pz], [mx - px, 1, mz - pz], f.color, fog * 0.7);
    } else {
      this.line3([mx - px, 0.5, mz - pz], [mx + px, 0.5, mz + pz], f.color, fog * 0.25, 0.7);
    }
  }

  drawBillboard(x, z, h, fn) {
    const p = this.toCam(x, h, z);
    if (p[2] < NEAR) return;
    const s = this.proj(p);
    fn(s[0], s[1], this.focal / p[2], p[2]);
  }

  drawEntities() {
    const { nav, ctx } = this;
    const t = this.time;
    if (nav.level.chest && !nav.chestOpen) {
      const c = nav.level.chest;
      const fog = this.fogAt(c.x, c.z);
      const pts = (y) => [[c.x - .25, y, c.z - .25], [c.x + .25, y, c.z - .25], [c.x + .25, y, c.z + .25], [c.x - .25, y, c.z + .25]];
      if (fog > 0) {
        this.poly(pts(0), WARM, fog, true); this.poly(pts(0.35), WARM, fog, true);
        [[-.25, -.25], [.25, -.25], [.25, .25], [-.25, .25]].forEach(([ox, oz]) =>
          this.line3([c.x + ox, 0, c.z + oz], [c.x + ox, 0.35, c.z + oz], WARM, fog));
      }
    }
    for (const e of nav.level.enemies) this.drawEnemy(e, t);
  }

  hasSight(x, z) {
    const x0 = this.rig.x, z0 = this.rig.z;
    const n = Math.ceil(Math.hypot(x - x0, z - z0) * 4);
    for (let i = 1; i < n; i++) {
      const px = Math.round(x0 + (x - x0) * i / n), pz = Math.round(z0 + (z - z0) * i / n);
      if (this.nav.isWall(px, pz)) return false;
    }
    return true;
  }

  drawEnemy(e, t) {
    const { ctx } = this;
    const fx = this.enemyFx;
    const isTarget = this.fxTarget === e;
    const dying = isTarget && fx.dead && t - fx.deadAt < 900;
    if (!e.alive && !dying) return;
    const fog = this.fogAt(e.x, e.z);
    if (fog <= 0 || !this.hasSight(e.x, e.z)) return;
    {
      let a = fog;
      let jitter = 0;
      const sinceHit = isTarget ? t - fx.hitAt : 1e9;
      if (sinceHit < 350 && !this.reduceMotion) jitter = Math.sin(sinceHit * 0.12) * 0.06 * (1 - sinceHit / 350);
      if (dying) a *= Math.max(0, 1 - (t - fx.deadAt) / 900);
      const bobY = this.reduceMotion ? 0 : Math.sin(t * 0.003 + e.x) * 0.04;
      const boss = !!e.spec?.boss;
      const base = 0.5 + bobY, r = boss ? 0.36 : 0.28, hh = boss ? 0.6 : 0.5;
      const ex = e.x + jitter, ez = e.z;
      const top = [ex, base + hh, ez], bot = [ex, base - hh + (boss ? 0.1 : 0), ez];
      const ring = [[ex - r, base, ez], [ex, base, ez - r], [ex + r, base, ez], [ex, base, ez + r]];
      const spin = this.reduceMotion ? 0 : t * 0.001;
      const col = sinceHit < 150 ? [255, 255, 255] : (isTarget && fx.burn ? WARM : (isTarget && fx.frozen ? ACCENT : IVORY));
      const rot = ([px, py, pz]) => {
        const dx = px - ex, dz = pz - ez;
        return [ex + dx * Math.cos(spin) - dz * Math.sin(spin), py, ez + dx * Math.sin(spin) + dz * Math.cos(spin)];
      };
      const R = ring.map(rot);
      for (let i = 0; i < 4; i++) {
        this.line3(R[i], R[(i + 1) % 4], col, a, 1.5);
        this.line3(top, R[i], col, a, 1.2);
        this.line3(bot, R[i], col, a, 1.2);
      }
      this.drawBillboard(ex, ez, base + hh + 0.28, (sx, sy, k) => {
        ctx.font = `${Math.max(10, k * 0.18)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = rgba(col, a);
        ctx.fillText(e.glyph || '◉', sx, sy);
      });
      if (isTarget && t - fx.shieldAt < 700) {
        const k = 1 - (t - fx.shieldAt) / 700;
        const sr = 0.5;
        this.poly([[ex - sr, 0, ez - sr], [ex + sr, 0, ez - sr], [ex + sr, 1, ez - sr], [ex - sr, 1, ez - sr]], ACCENT, k, false, 2);
      }
    }
  }

  drawVignette() {
    const { ctx, w, h } = this;
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // Exploration map (fog-of-war: only visited cells shown)
  drawMap(canvas) {
    const ctx = canvas.getContext('2d');
    const { nav } = this;
    const { w, h } = nav.level;
    const s = Math.floor(Math.min(canvas.width / w, canvas.height / h));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let z = 0; z < h; z++) {
      for (let x = 0; x < w; x++) {
        if (!nav.visited.has(x + ',' + z)) continue;
        const c = nav.cell(x, z);
        ctx.fillStyle = c === '#' ? 'rgba(232,228,216,.35)' : c === 'D' ? 'rgba(110,200,255,.7)' : c === 'X' ? (nav.exitLocked() ? 'rgba(255,90,90,.8)' : 'rgba(255,170,90,.8)') : 'rgba(232,228,216,.08)';
        ctx.fillRect(x * s, z * s, s - 1, s - 1);
        if (nav.isEnemyAt(x, z)) { ctx.fillStyle = '#f66'; ctx.fillRect(x * s + 2, z * s + 2, s - 5, s - 5); }
        if (nav.isChestAt(x, z)) { ctx.fillStyle = '#fa5'; ctx.fillRect(x * s + 3, z * s + 3, s - 7, s - 7); }
      }
    }
    const px = nav.x * s + s / 2, pz = nav.z * s + s / 2, d = DIRS[nav.dir];
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(px + d.dx * s * 0.45, pz + d.dz * s * 0.45);
    ctx.lineTo(px - d.dz * s * 0.3 - d.dx * s * 0.3, pz + d.dx * s * 0.3 - d.dz * s * 0.3);
    ctx.lineTo(px + d.dz * s * 0.3 - d.dx * s * 0.3, pz - d.dx * s * 0.3 - d.dz * s * 0.3);
    ctx.closePath(); ctx.fill();
  }
}
