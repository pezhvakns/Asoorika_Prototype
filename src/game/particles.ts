export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  gravity: number;
  shape: 'circle' | 'diamond' | 'leaf';
  rotation: number;
  vRot: number;
}

export interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

const MAX_PARTICLES = 180;
const MAX_POPUPS = 16;

export class EffectsPool {
  public readonly particles: Particle[];
  public readonly popups: FloatingText[];
  private pCursor = 0;
  private tCursor = 0;

  constructor() {
    this.particles = Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 6,
      life: 0,
      maxLife: 0.5,
      color: '#0B0D14',
      gravity: 900,
      shape: 'circle',
      rotation: 0,
      vRot: 0,
    }));

    this.popups = Array.from({ length: MAX_POPUPS }, () => ({
      active: false,
      x: 0,
      y: 0,
      vy: -140,
      text: '',
      color: '#F6E4CE',
      life: 0,
      maxLife: 0.9,
    }));
  }

  public clear(): void {
    for (const p of this.particles) p.active = false;
    for (const t of this.popups) t.active = false;
  }

  public spawnBurst(opts: {
    x: number;
    y: number;
    count: number;
    color: string;
    speedMin: number;
    speedMax: number;
    sizeMin: number;
    sizeMax: number;
    lifeMin: number;
    lifeMax: number;
    gravity?: number;
    angleMin?: number;
    angleMax?: number;
    shape?: 'circle' | 'diamond' | 'leaf';
  }): void {
    const aMin = opts.angleMin ?? 0;
    const aMax = opts.angleMax ?? Math.PI * 2;
    const grav = opts.gravity ?? 900;
    const shape = opts.shape ?? 'circle';

    for (let i = 0; i < opts.count; i++) {
      const p = this.particles[this.pCursor];
      this.pCursor = (this.pCursor + 1) % MAX_PARTICLES;

      const angle = aMin + Math.random() * (aMax - aMin);
      const speed = opts.speedMin + Math.random() * (opts.speedMax - opts.speedMin);
      p.active = true;
      p.x = opts.x + (Math.random() - 0.5) * 18;
      p.y = opts.y + (Math.random() - 0.5) * 12;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = opts.sizeMin + Math.random() * (opts.sizeMax - opts.sizeMin);
      p.maxLife = opts.lifeMin + Math.random() * (opts.lifeMax - opts.lifeMin);
      p.life = p.maxLife;
      p.color = opts.color;
      p.gravity = grav;
      p.shape = shape;
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 10;
    }
  }

  public spawnPopup(x: number, y: number, text: string, color = '#F6E4CE'): void {
    const t = this.popups[this.tCursor];
    this.tCursor = (this.tCursor + 1) % MAX_POPUPS;
    t.active = true;
    t.x = x;
    t.y = y;
    t.vy = -130;
    t.text = text;
    t.color = color;
    t.maxLife = 0.95;
    t.life = t.maxLife;
  }

  public update(dt: number): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
    }

    for (let i = 0; i < MAX_POPUPS; i++) {
      const t = this.popups[i];
      if (!t.active) continue;
      t.life -= dt;
      if (t.life <= 0) {
        t.active = false;
        continue;
      }
      t.y += t.vy * dt;
      t.vy *= Math.pow(0.25, dt);
    }
  }
}
