export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  endSize: number;
  life: number;
  maxLife: number;
  color: string;
  gravity: number;
  drag: number;
  shape: 'circle' | 'diamond' | 'leaf' | 'dust' | 'dirt' | 'spark';
  rotation: number;
  vRot: number;
}

export interface ShockwaveEffect {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
  secondaryColor: string;
  lineWidth: number;
  dir: 1 | -1;
  kind: 'strike' | 'ko' | 'land';
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

const MAX_PARTICLES = 240;
const MAX_SHOCKWAVES = 20;
const MAX_POPUPS = 16;

export class EffectsPool {
  public readonly particles: Particle[];
  public readonly shockwaves: ShockwaveEffect[];
  public readonly popups: FloatingText[];
  private pCursor = 0;
  private sCursor = 0;
  private tCursor = 0;

  constructor() {
    this.particles = Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 6,
      endSize: 6,
      life: 0,
      maxLife: 0.5,
      color: '#0B0D14',
      gravity: 900,
      drag: 1,
      shape: 'circle',
      rotation: 0,
      vRot: 0,
    }));

    this.shockwaves = Array.from({ length: MAX_SHOCKWAVES }, () => ({
      active: false,
      x: 0,
      y: 0,
      radius: 10,
      maxRadius: 90,
      life: 0,
      maxLife: 0.3,
      color: '#FFF5E8',
      secondaryColor: '#D99058',
      lineWidth: 6,
      dir: 1,
      kind: 'strike',
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
    for (const s of this.shockwaves) s.active = false;
    for (const t of this.popups) t.active = false;
  }

  private allocParticle(): Particle {
    const p = this.particles[this.pCursor];
    this.pCursor = (this.pCursor + 1) % MAX_PARTICLES;
    return p;
  }

  public spawnShockwave(opts: {
    x: number;
    y: number;
    startRadius: number;
    maxRadius: number;
    life: number;
    color: string;
    secondaryColor: string;
    lineWidth: number;
    dir?: 1 | -1;
    kind: 'strike' | 'ko' | 'land';
  }): void {
    const s = this.shockwaves[this.sCursor];
    this.sCursor = (this.sCursor + 1) % MAX_SHOCKWAVES;
    s.active = true;
    s.x = opts.x;
    s.y = opts.y;
    s.radius = opts.startRadius;
    s.maxRadius = opts.maxRadius;
    s.life = opts.life;
    s.maxLife = opts.life;
    s.color = opts.color;
    s.secondaryColor = opts.secondaryColor;
    s.lineWidth = opts.lineWidth;
    s.dir = opts.dir ?? 1;
    s.kind = opts.kind;
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
    endSizeMult?: number;
    lifeMin: number;
    lifeMax: number;
    gravity?: number;
    drag?: number;
    angleMin?: number;
    angleMax?: number;
    spreadX?: number;
    spreadY?: number;
    shape?: Particle['shape'];
  }): void {
    const aMin = opts.angleMin ?? 0;
    const aMax = opts.angleMax ?? Math.PI * 2;
    const grav = opts.gravity ?? 900;
    const drag = opts.drag ?? 1;
    const shape = opts.shape ?? 'circle';
    const spreadX = opts.spreadX ?? 18;
    const spreadY = opts.spreadY ?? 12;
    const endMult = opts.endSizeMult ?? 1;

    for (let i = 0; i < opts.count; i++) {
      const p = this.allocParticle();
      const angle = aMin + Math.random() * (aMax - aMin);
      const speed = opts.speedMin + Math.random() * (opts.speedMax - opts.speedMin);
      const size = opts.sizeMin + Math.random() * (opts.sizeMax - opts.sizeMin);
      p.active = true;
      p.x = opts.x + (Math.random() - 0.5) * spreadX;
      p.y = opts.y + (Math.random() - 0.5) * spreadY;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = size;
      p.endSize = size * endMult;
      p.maxLife = opts.lifeMin + Math.random() * (opts.lifeMax - opts.lifeMin);
      p.life = p.maxLife;
      p.color = opts.color;
      p.gravity = grav;
      p.drag = drag;
      p.shape = shape;
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 10;
    }
  }

  /** Realistic earthen dust clouds + kicked terracotta dirt clods on jump takeoff */
  public spawnJumpDust(x: number, y: number, dir: 1 | -1): void {
    // Soft billowing dust puffs expanding outward from hooves
    const dustPalette = ['#F6E4CE', '#EAD0B0', '#A36333'];
    for (let i = 0; i < 11; i++) {
      const p = this.allocParticle();
      const side = i < 7 ? -dir : dir;
      const spread = (Math.random() - 0.5) * 44;
      const size = 18 + Math.random() * 18;
      p.active = true;
      p.x = x + spread - dir * 12;
      p.y = y - 8 - Math.random() * 10;
      p.vx = side * (110 + Math.random() * 220);
      p.vy = -(55 + Math.random() * 135);
      p.size = size;
      p.endSize = size * 2.2;
      p.maxLife = 0.44 + Math.random() * 0.28;
      p.life = p.maxLife;
      p.color = dustPalette[i % dustPalette.length];
      p.gravity = -55;
      p.drag = 0.08;
      p.shape = 'dust';
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 3.5;
    }

    // Heavy dark clay dirt pebbles kicked backward and up
    const dirtPalette = ['#1E1109', '#3A2010', '#5E341A'];
    for (let i = 0; i < 12; i++) {
      const p = this.allocParticle();
      const backAngle =
        dir === 1
          ? Math.PI * (1.06 + Math.random() * 0.44)
          : Math.PI * (1.5 + Math.random() * 0.44);
      const speed = 210 + Math.random() * 320;
      const size = 7 + Math.random() * 7;
      p.active = true;
      p.x = x - dir * (6 + Math.random() * 26);
      p.y = y - 6;
      p.vx = Math.cos(backAngle) * speed;
      p.vy = Math.sin(backAngle) * speed;
      p.size = size;
      p.endSize = size * 0.65;
      p.maxLife = 0.38 + Math.random() * 0.28;
      p.life = p.maxLife;
      p.color = dirtPalette[i % dirtPalette.length];
      p.gravity = 1350;
      p.drag = 0.55;
      p.shape = 'dirt';
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 14;
    }
  }

  /** Twin outward-billowing clay dust clouds + dirt clods + ground ring on landing */
  public spawnLandDust(x: number, y: number, impact: number): void {
    const strength = Math.max(0.75, Math.min(1.7, impact / 800));

    // Crisp ground puff ring
    this.spawnShockwave({
      x,
      y: y - 5,
      startRadius: 22,
      maxRadius: 96 * strength,
      life: 0.34,
      color: '#F6E4CE',
      secondaryColor: '#5B3318',
      lineWidth: 7,
      kind: 'land',
    });

    // Twin left/right rolling dust clouds
    const dustPalette = ['#F6E4CE', '#E5C29B', '#9E6032'];
    const cloudCount = Math.round(13 * strength);
    for (let i = 0; i < cloudCount; i++) {
      const p = this.allocParticle();
      const side = i % 2 === 0 ? -1 : 1;
      const size = (20 + Math.random() * 18) * Math.min(1.25, strength);
      p.active = true;
      p.x = x + side * (16 + Math.random() * 32);
      p.y = y - 8 - Math.random() * 10;
      p.vx = side * (160 + Math.random() * 260) * strength;
      p.vy = -(45 + Math.random() * 130) * strength;
      p.size = size;
      p.endSize = size * 2.35;
      p.maxLife = 0.46 + Math.random() * 0.32;
      p.life = p.maxLife;
      p.color = dustPalette[i % dustPalette.length];
      p.gravity = -45;
      p.drag = 0.06;
      p.shape = 'dust';
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = side * (1.8 + Math.random() * 2.4);
    }

    // Crisp clay dirt pebbles splashing outward from impact
    const dirtPalette = ['#1E1109', '#3E2211', '#63371B'];
    const clodCount = Math.round(14 * strength);
    for (let i = 0; i < clodCount; i++) {
      const p = this.allocParticle();
      const angle = Math.PI * (1.06 + Math.random() * 0.88);
      const speed = (200 + Math.random() * 340) * strength;
      const size = 6.5 + Math.random() * 7;
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 52;
      p.y = y - 6;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = size;
      p.endSize = size * 0.6;
      p.maxLife = 0.38 + Math.random() * 0.28;
      p.life = p.maxLife;
      p.color = dirtPalette[i % dirtPalette.length];
      p.gravity = 1400;
      p.drag = 0.6;
      p.shape = 'dirt';
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 16;
    }
  }

  /** Directional horn-slam shockwave + radial sparks + ground dust kick on Attack strike */
  public spawnAttackImpact(x: number, y: number, dir: 1 | -1): void {
    this.spawnShockwave({
      x,
      y,
      startRadius: 20,
      maxRadius: 142,
      life: 0.28,
      color: '#FFF5E8',
      secondaryColor: '#F4B444',
      lineWidth: 10,
      dir,
      kind: 'strike',
    });

    // Fast kinetic spark streaks bursting forward from the horn tip
    const baseAngle = dir === 1 ? 0 : Math.PI;
    const sparkColors = ['#FFF5E8', '#F4B444', '#0B0D14'];
    for (let i = 0; i < 15; i++) {
      const p = this.allocParticle();
      const angle = baseAngle + (Math.random() - 0.5) * 1.45;
      const speed = 380 + Math.random() * 580;
      const size = 12 + Math.random() * 12;
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 18;
      p.y = y + (Math.random() - 0.5) * 26;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = size;
      p.endSize = size * 0.3;
      p.maxLife = 0.2 + Math.random() * 0.18;
      p.life = p.maxLife;
      p.color = sparkColors[i % sparkColors.length];
      p.gravity = 120;
      p.drag = 0.14;
      p.shape = 'spark';
      p.rotation = angle;
      p.vRot = 0;
    }

    // Small dust puff kicked up by the forward strike force
    this.spawnBurst({
      x: x - dir * 24,
      y: y + 48,
      count: 6,
      color: '#F0D4B4',
      speedMin: 95,
      speedMax: 240,
      sizeMin: 14,
      sizeMax: 22,
      endSizeMult: 2.0,
      lifeMin: 0.28,
      lifeMax: 0.42,
      gravity: -35,
      drag: 0.12,
      angleMin: dir === 1 ? -0.6 : Math.PI - 0.6,
      angleMax: dir === 1 ? 0.3 : Math.PI + 0.3,
      shape: 'dust',
    });
  }

  /** Heavy multi-ring KO impact burst when Attack connects with an evil spirit */
  public spawnEnemyImpact(x: number, y: number, dir: 1 | -1): void {
    this.spawnShockwave({
      x,
      y,
      startRadius: 22,
      maxRadius: 175,
      life: 0.32,
      color: '#FFF5E8',
      secondaryColor: '#C83A2B',
      lineWidth: 10,
      dir,
      kind: 'ko',
    });

    // High-energy radial sparks
    for (let i = 0; i < 16; i++) {
      const p = this.allocParticle();
      const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const speed = 360 + Math.random() * 580;
      const size = 11 + Math.random() * 12;
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = size;
      p.endSize = size * 0.25;
      p.maxLife = 0.22 + Math.random() * 0.22;
      p.life = p.maxLife;
      p.color = i % 2 === 0 ? '#FFF5E8' : '#F4B444';
      p.gravity = 180;
      p.drag = 0.16;
      p.shape = 'spark';
      p.rotation = angle;
      p.vRot = 0;
    }

    // Obsidian pottery shards scattering outward
    this.spawnBurst({
      x,
      y,
      count: 22,
      color: '#0B0D14',
      speedMin: 220,
      speedMax: 740,
      sizeMin: 7,
      sizeMax: 16,
      lifeMin: 0.36,
      lifeMax: 0.72,
      gravity: 1150,
      shape: 'diamond',
    });
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
      if (p.drag < 1) {
        const damp = Math.pow(p.drag, dt);
        p.vx *= damp;
        if (p.shape === 'dust' || p.shape === 'spark') {
          p.vy *= damp;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
    }

    for (let i = 0; i < MAX_SHOCKWAVES; i++) {
      const s = this.shockwaves[i];
      if (!s.active) continue;
      s.life -= dt;
      if (s.life <= 0) {
        s.active = false;
        continue;
      }
      const t = 1 - s.life / s.maxLife;
      const eased = 1 - Math.pow(1 - t, 3);
      s.radius = s.maxRadius * eased;
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
