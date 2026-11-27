import {
  DAMAGE_ZONES,
  GOAT_SPAWN,
  INITIAL_ENEMIES,
  JUMP_PADS,
  MAP_HEIGHT,
  MAP_WIDTH,
  PLATFORMS,
  START_FLOOR_Y,
  SUMMIT_FLOOR_Y,
  TREE_GOAL,
  type Rect,
  getFloorNumber,
} from './levelData';

export type GamePhase = 'title' | 'playing' | 'paused' | 'victory' | 'defeat';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  gaitMode: 'walk' | 'run';
  speedMultiplierLabel: string;
  description: string;
  runSpeed: number;
  headbuttBoost: number;
  /** World pixels traveled per animation frame so hooves stay locked to ground without sliding */
  stridePerFrame: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    gaitMode: 'walk',
    speedMultiplierLabel: 'Walk',
    description: 'Steady walking pace for relaxed museum climbs',
    runSpeed: 340,
    headbuttBoost: 150,
    stridePerFrame: 34,
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    gaitMode: 'run',
    speedMultiplierLabel: 'Run',
    description: 'Energetic ibex run with nimble jump timing',
    runSpeed: 620,
    headbuttBoost: 240,
    stridePerFrame: 60,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    gaitMode: 'run',
    speedMultiplierLabel: 'Fast Run',
    description: 'High-speed sprint with faster gallop cadence',
    runSpeed: 930,
    headbuttBoost: 320,
    stridePerFrame: 60,
  },
};

export const DIFFICULTY_ORDER: DifficultyLevel[] = ['easy', 'medium', 'hard'];

export interface SimInput {
  jumpPressed: boolean;
  jumpHeld: boolean;
  headbuttPressed: boolean;
}

export interface EnemyEntity {
  id: string;
  kind: 'evilBird' | 'evilMan';
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  dir: 1 | -1;
  patrolMinX: number;
  patrolMaxX: number;
  baseY: number;
  speed: number;
  points: number;
  alive: boolean;
  koTimer: number;
  koRotation: number;
  animTime: number;
  telegraphTimer: number;
  swoopPhase: number;
  hitFlashTimer: number;
}

export interface GoatEntity {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  dir: 1 | -1;
  grounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  jumpAnimActive: boolean;
  jumpAnimTime: number;
  headbuttTimer: number;
  headbuttCooldown: number;
  attackStrikeEmitted: boolean;
  invulnTimer: number;
  runDistance: number;
  scaleX: number;
  scaleY: number;
  hitFlashTimer: number;
}

export type SimEvent =
  | { type: 'jump'; x: number; y: number; dir: 1 | -1 }
  | { type: 'spring'; x: number; y: number }
  | { type: 'land'; x: number; y: number; impact: number }
  | { type: 'headbutt'; x: number; y: number; dir: 1 | -1 }
  | { type: 'attackStrike'; x: number; y: number; dir: 1 | -1 }
  | { type: 'enemyKo'; x: number; y: number; dir: 1 | -1; points: number; kind: 'evilBird' | 'evilMan' }
  | { type: 'hurt'; x: number; y: number; heartsLeft: number }
  | { type: 'turn'; x: number; y: number; dir: 1 | -1 }
  | { type: 'victory'; x: number; y: number; score: number }
  | { type: 'defeat'; x: number; y: number; score: number };

export interface SimulationState {
  phase: GamePhase;
  difficulty: DifficultyLevel;
  goat: GoatEntity;
  enemies: EnemyEntity[];
  hearts: number;
  maxHearts: number;
  score: number;
  bonusPoints: number;
  enemiesDefeated: number;
  highestY: number;
  heightPercent: number;
  floor: number;
  elapsedTime: number;
  treeAnimTime: number;
  hitstopTimer: number;
  trauma: number;
  cameraY: number;
  cameraX: number;
  defeatDelayTimer: number;
}

export const PHYSICS = {
  RUN_SPEED: 620,
  HEADBUTT_BOOST: 240,
  GRAVITY: 2650,
  FALL_GRAVITY: 3450,
  MAX_FALL_SPEED: 2050,
  JUMP_VELOCITY: -1580,
  JUMP_CUT_MULTIPLIER: 0.52,
  COYOTE_TIME: 0.11,
  JUMP_BUFFER_TIME: 0.13,
  JUMP_ANIM_DURATION: 0.62,
  HEADBUTT_DURATION: 0.48,
  HEADBUTT_WINDUP: 0.0,
  HEADBUTT_STRIKE_AT: 0.31,
  HEADBUTT_ACTIVE_END: 0.44,
  HEADBUTT_COOLDOWN: 0.52,
  HEADBUTT_REACH: 118,
  INVULN_DURATION: 1.4,
  MAX_HEARTS: 3,
} as const;

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function computeHeightPercent(feetY: number): number {
  const ratio = (START_FLOOR_Y - feetY) / (START_FLOOR_Y - SUMMIT_FLOOR_Y);
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

export function calculateScore(params: {
  heightPercent: number;
  bonusPoints: number;
  hearts: number;
  elapsedTime: number;
  victory: boolean;
}): number {
  const climbScore = Math.round(params.heightPercent * 10);
  if (!params.victory) {
    return climbScore + params.bonusPoints;
  }
  const heartBonus = params.hearts * 250;
  const speedBonus = Math.max(0, Math.round((120 - params.elapsedTime) * 10));
  return climbScore + params.bonusPoints + heartBonus + speedBonus + 500;
}

export function createInitialState(
  phase: GamePhase = 'title',
  difficulty: DifficultyLevel = 'medium'
): SimulationState {
  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const goat: GoatEntity = {
    x: GOAT_SPAWN.x,
    y: START_FLOOR_Y - GOAT_SPAWN.h,
    w: GOAT_SPAWN.w,
    h: GOAT_SPAWN.h,
    vx: diffConfig.runSpeed,
    vy: 0,
    dir: 1,
    grounded: true,
    coyoteTimer: PHYSICS.COYOTE_TIME,
    jumpBufferTimer: 0,
    jumpAnimActive: false,
    jumpAnimTime: 0,
    headbuttTimer: 0,
    headbuttCooldown: 0,
    attackStrikeEmitted: false,
    invulnTimer: 0,
    runDistance: 0,
    scaleX: 1,
    scaleY: 1,
    hitFlashTimer: 0,
  };

  const enemies: EnemyEntity[] = INITIAL_ENEMIES.map((spawn) => ({
    id: spawn.id,
    kind: spawn.kind,
    x: spawn.x,
    y: spawn.y,
    w: spawn.w,
    h: spawn.h,
    vx: spawn.kind === 'evilMan' ? spawn.speed : -spawn.speed,
    vy: 0,
    dir: spawn.kind === 'evilMan' ? 1 : -1,
    patrolMinX: spawn.patrolMinX,
    patrolMaxX: spawn.patrolMaxX,
    baseY: spawn.baseY,
    speed: spawn.speed,
    points: spawn.points,
    alive: true,
    koTimer: 0,
    koRotation: 0,
    animTime: 0,
    telegraphTimer: 0,
    swoopPhase: 0,
    hitFlashTimer: 0,
  }));

  return {
    phase,
    difficulty,
    goat,
    enemies,
    hearts: PHYSICS.MAX_HEARTS,
    maxHearts: PHYSICS.MAX_HEARTS,
    score: 0,
    bonusPoints: 0,
    enemiesDefeated: 0,
    highestY: START_FLOOR_Y,
    heightPercent: 0,
    floor: 1,
    elapsedTime: 0,
    treeAnimTime: 0,
    hitstopTimer: 0,
    trauma: 0,
    cameraY: MAP_HEIGHT - MAP_HEIGHT / 3,
    cameraX: 0,
    defeatDelayTimer: 0,
  };
}

export function getHeadbuttHitbox(goat: GoatEntity): Rect | null {
  if (goat.headbuttTimer <= 0) return null;
  const elapsed = PHYSICS.HEADBUTT_DURATION - goat.headbuttTimer;
  if (elapsed < PHYSICS.HEADBUTT_WINDUP || elapsed > PHYSICS.HEADBUTT_ACTIVE_END) {
    return null;
  }
  const reach = PHYSICS.HEADBUTT_REACH;
  return {
    x: goat.dir === 1 ? goat.x + goat.w * 0.45 : goat.x - reach + goat.w * 0.55,
    y: goat.y - 16,
    w: reach + goat.w * 0.55,
    h: goat.h + 24,
  };
}

export function updateCamera(
  state: SimulationState,
  viewWorldW: number,
  viewWorldH: number,
  dt: number,
  instant = false
): void {
  const maxCamY = Math.max(0, MAP_HEIGHT - viewWorldH);
  // Keep goat positioned comfortably in lower-middle third as it climbs
  const goatCenterY = state.goat.y + state.goat.h * 0.5;
  const desiredY = Math.max(0, Math.min(maxCamY, goatCenterY - viewWorldH * 0.62));

  const maxCamX = Math.max(0, MAP_WIDTH - viewWorldW);
  const goatCenterX = state.goat.x + state.goat.w * 0.5;
  const desiredX = Math.max(0, Math.min(maxCamX, goatCenterX - viewWorldW * 0.5));

  if (instant) {
    state.cameraY = desiredY;
    state.cameraX = desiredX;
    return;
  }

  const smoothing = 1 - Math.exp(-7.5 * dt);
  state.cameraY += (desiredY - state.cameraY) * smoothing;
  state.cameraX += (desiredX - state.cameraX) * smoothing;
}

export function stepSimulation(
  state: SimulationState,
  input: SimInput,
  rawDt: number
): SimEvent[] {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  const events: SimEvent[] = [];

  // Always animate the sacred tree & decay trauma/hitflash in real time
  state.treeAnimTime += dt;
  state.trauma = Math.max(0, state.trauma - dt * 2.2);
  if (state.goat.hitFlashTimer > 0) {
    state.goat.hitFlashTimer = Math.max(0, state.goat.hitFlashTimer - dt);
  }
  for (const enemy of state.enemies) {
    if (enemy.hitFlashTimer > 0) {
      enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - dt);
    }
  }

  if (state.phase !== 'playing') {
    // Animate ambient enemy idle on title screen
    if (state.phase === 'title') {
      for (const enemy of state.enemies) {
        enemy.animTime += dt;
      }
    }
    return events;
  }

  // Handle brief hitstop freeze on heavy impacts
  if (state.hitstopTimer > 0) {
    state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
    return events;
  }

  // Brief dramatic beat before switching to defeat modal
  if (state.defeatDelayTimer > 0) {
    state.defeatDelayTimer -= dt;
    if (state.defeatDelayTimer <= 0) {
      state.phase = 'defeat';
      events.push({
        type: 'defeat',
        x: state.goat.x + state.goat.w * 0.5,
        y: state.goat.y + state.goat.h * 0.5,
        score: state.score,
      });
    }
    return events;
  }

  state.elapsedTime += dt;
  const g = state.goat;

  // Recover squash-and-stretch smoothly toward 1
  const stretchDamp = 1 - Math.exp(-14 * dt);
  g.scaleX += (1 - g.scaleX) * stretchDamp;
  g.scaleY += (1 - g.scaleY) * stretchDamp;

  // Cooldowns & timers
  if (g.invulnTimer > 0) g.invulnTimer = Math.max(0, g.invulnTimer - dt);
  if (g.headbuttCooldown > 0) g.headbuttCooldown = Math.max(0, g.headbuttCooldown - dt);
  if (g.headbuttTimer > 0) g.headbuttTimer = Math.max(0, g.headbuttTimer - dt);

  if (g.grounded) {
    g.coyoteTimer = PHYSICS.COYOTE_TIME;
  } else {
    g.coyoteTimer = Math.max(0, g.coyoteTimer - dt);
  }

  if (input.jumpPressed) {
    g.jumpBufferTimer = PHYSICS.JUMP_BUFFER_TIME;
  } else {
    g.jumpBufferTimer = Math.max(0, g.jumpBufferTimer - dt);
  }

  // Attack trigger (13-frame rearing horn-slam animation)
  if (input.headbuttPressed && g.headbuttCooldown <= 0) {
    g.headbuttTimer = PHYSICS.HEADBUTT_DURATION;
    g.headbuttCooldown = PHYSICS.HEADBUTT_COOLDOWN;
    g.attackStrikeEmitted = false;
    g.scaleX = 1.14;
    g.scaleY = 0.9;
    events.push({
      type: 'headbutt',
      x: g.x + (g.dir === 1 ? g.w : 0),
      y: g.y + g.h * 0.45,
      dir: g.dir,
    });
  }

  // Emit horn-slam impact effect right as the 13-frame attack thrusts forward (frames 10-11)
  if (g.headbuttTimer > 0 && !g.attackStrikeEmitted) {
    const attackElapsed = PHYSICS.HEADBUTT_DURATION - g.headbuttTimer;
    if (attackElapsed >= PHYSICS.HEADBUTT_STRIKE_AT) {
      g.attackStrikeEmitted = true;
      state.trauma = Math.min(1, state.trauma + 0.22);
      events.push({
        type: 'attackStrike',
        x: g.x + (g.dir === 1 ? g.w + 52 : -52),
        y: g.y + g.h * 0.48,
        dir: g.dir,
      });
    }
  }

  // Jump execution (buffered + coyote time)
  if (g.jumpBufferTimer > 0 && g.coyoteTimer > 0) {
    g.vy = PHYSICS.JUMP_VELOCITY;
    g.grounded = false;
    g.coyoteTimer = 0;
    g.jumpBufferTimer = 0;
    g.jumpAnimActive = true;
    g.jumpAnimTime = 0;
    g.scaleX = 0.86;
    g.scaleY = 1.16;
    events.push({ type: 'jump', x: g.x + g.w * 0.5, y: g.y + g.h, dir: g.dir });
  }

  // Variable jump height cut when jump is released early while ascending
  if (!input.jumpHeld && g.vy < -520) {
    g.vy *= Math.pow(PHYSICS.JUMP_CUT_MULTIPLIER, dt * 12);
  }

  // Auto-running horizontal velocity scaled by selected difficulty level (plus lunge boost during headbutt)
  const diffConfig = DIFFICULTY_CONFIGS[state.difficulty];
  const boost = g.headbuttTimer > 0 ? diffConfig.headbuttBoost : 0;
  g.vx = g.dir * (diffConfig.runSpeed + boost);

  // Horizontal movement + wall / boundary turnaround
  const prevX = g.x;
  g.x += g.vx * dt;

  if (g.x <= 0) {
    g.x = 0;
    if (g.dir === -1) {
      g.dir = 1;
      events.push({ type: 'turn', x: g.x, y: g.y + g.h, dir: 1 });
    }
  } else if (g.x + g.w >= MAP_WIDTH) {
    g.x = MAP_WIDTH - g.w;
    if (g.dir === 1) {
      g.dir = -1;
      events.push({ type: 'turn', x: g.x + g.w, y: g.y + g.h, dir: -1 });
    }
  }

  // Resolve horizontal collisions against solid (non-one-way) platforms
  for (const p of PLATFORMS) {
    if (p.oneWay) continue;
    if (!rectsOverlap(g, p)) continue;
    if (g.vx > 0 && prevX + g.w <= p.x + 26) {
      g.x = p.x - g.w;
      g.dir = -1;
      events.push({ type: 'turn', x: g.x + g.w, y: g.y + g.h, dir: -1 });
    } else if (g.vx < 0 && prevX >= p.x + p.w - 26) {
      g.x = p.x + p.w;
      g.dir = 1;
      events.push({ type: 'turn', x: g.x, y: g.y + g.h, dir: 1 });
    }
  }

  // Vertical gravity (heavier on descent for crisp platformer feel)
  const grav = g.vy < 0 ? PHYSICS.GRAVITY : PHYSICS.FALL_GRAVITY;
  g.vy = Math.min(PHYSICS.MAX_FALL_SPEED, g.vy + grav * dt);

  const prevY = g.y;
  const prevBottom = prevY + g.h;
  const wasGrounded = g.grounded;
  g.y += g.vy * dt;
  g.grounded = false;

  // Vertical platform resolution
  for (const p of PLATFORMS) {
    const horizOverlap = g.x + g.w - 14 > p.x && g.x + 14 < p.x + p.w;
    if (!horizOverlap) continue;

    // Landing on top of platform
    if (g.vy >= 0 && prevBottom <= p.y + 24 && g.y + g.h >= p.y) {
      const impact = g.vy;
      g.y = p.y - g.h;
      g.vy = 0;
      g.grounded = true;
      if (!wasGrounded && impact > 240) {
        g.scaleX = 1.2;
        g.scaleY = 0.8;
        events.push({ type: 'land', x: g.x + g.w * 0.5, y: p.y, impact });
      }
      break;
    }

    // Hitting underside of solid (non-one-way) ceilings/floors
    if (!p.oneWay && g.vy < 0 && prevY >= p.y + p.h - 24 && g.y < p.y + p.h) {
      g.y = p.y + p.h;
      g.vy = 40;
    }
  }

  // Blue Wave Jump Pad bounce check
  for (const pad of JUMP_PADS) {
    if (rectsOverlap(g, pad) && g.vy >= -200) {
      g.y = pad.y - g.h + 12;
      g.vy = pad.bounceVelocity;
      g.grounded = false;
      g.coyoteTimer = 0;
      g.jumpAnimActive = true;
      g.jumpAnimTime = 0;
      g.scaleX = 0.76;
      g.scaleY = 1.3;
      state.trauma = Math.min(1, state.trauma + 0.25);
      events.push({ type: 'spring', x: pad.x + pad.w * 0.5, y: pad.y });
    }
  }

  // Advance gait distance & one-shot jump animation
  if (g.grounded) {
    g.runDistance += Math.abs(g.vx) * dt;
    if (g.jumpAnimActive) {
      g.jumpAnimActive = false;
      g.jumpAnimTime = 0;
    }
  } else if (g.jumpAnimActive) {
    g.jumpAnimTime += dt;
    if (g.jumpAnimTime >= PHYSICS.JUMP_ANIM_DURATION) {
      g.jumpAnimTime = PHYSICS.JUMP_ANIM_DURATION;
    }
  }

  // Update highest climb & score
  const feetY = g.y + g.h;
  if (feetY < state.highestY) {
    state.highestY = feetY;
  }
  state.heightPercent = computeHeightPercent(state.highestY);
  state.floor = getFloorNumber(feetY);
  state.score = calculateScore({
    heightPercent: state.heightPercent,
    bonusPoints: state.bonusPoints,
    hearts: state.hearts,
    elapsedTime: state.elapsedTime,
    victory: false,
  });

  // Update enemies (patrol, distinct policies, telegraphs, KO arcs)
  const headbuttBox = getHeadbuttHitbox(g);
  const goatHurtbox: Rect = {
    x: g.x + 22,
    y: g.y + 22,
    w: g.w - 44,
    h: g.h - 28,
  };

  for (const enemy of state.enemies) {
    enemy.animTime += dt;
    if (!enemy.alive) {
      if (enemy.koTimer > 0) {
        enemy.koTimer = Math.max(0, enemy.koTimer - dt);
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;
        enemy.vy += 1900 * dt;
        enemy.koRotation += enemy.dir * 8.5 * dt;
      }
      continue;
    }

    if (enemy.kind === 'evilBird') {
      // Swooping flyer policy: patrols across mid-right sky with periodic telegraphed dive
      enemy.swoopPhase += dt * 1.9;
      enemy.x += enemy.dir * enemy.speed * dt;
      if (enemy.x <= enemy.patrolMinX) {
        enemy.x = enemy.patrolMinX;
        enemy.dir = 1;
      } else if (enemy.x + enemy.w >= enemy.patrolMaxX) {
        enemy.x = enemy.patrolMaxX - enemy.w;
        enemy.dir = -1;
      }
      const swoopSin = Math.sin(enemy.swoopPhase);
      enemy.telegraphTimer = swoopSin > 0.65 ? swoopSin - 0.65 : 0;
      enemy.y = enemy.baseY + Math.sin(enemy.swoopPhase) * 140;
    } else {
      // EvilMan guardian policy: paces Top Floor in front of tree and telegraphs lunge when goat is on Top Floor
      const goatOnTop = g.y < 760;
      const distX = g.x - enemy.x;
      if (goatOnTop && Math.abs(distX) < 620) {
        enemy.telegraphTimer = Math.min(1, enemy.telegraphTimer + dt * 2.4);
        const chaseDir: 1 | -1 = distX >= 0 ? 1 : -1;
        enemy.dir = chaseDir;
        const speedMult = enemy.telegraphTimer > 0.45 ? 1.38 : 0.6;
        enemy.x += chaseDir * enemy.speed * speedMult * dt;
      } else {
        enemy.telegraphTimer = Math.max(0, enemy.telegraphTimer - dt * 2);
        enemy.x += enemy.dir * enemy.speed * dt;
      }
      if (enemy.x <= enemy.patrolMinX) {
        enemy.x = enemy.patrolMinX;
        enemy.dir = 1;
      } else if (enemy.x + enemy.w >= enemy.patrolMaxX) {
        enemy.x = enemy.patrolMaxX - enemy.w;
        enemy.dir = -1;
      }
      enemy.y = enemy.baseY;
    }

    const enemyBox: Rect = {
      x: enemy.x + 26,
      y: enemy.y + 24,
      w: enemy.w - 52,
      h: enemy.h - 44,
    };

    // Check headbutt KO first (prioritizes player offense!)
    if (headbuttBox && rectsOverlap(headbuttBox, enemyBox)) {
      enemy.alive = false;
      enemy.koTimer = 0.55;
      enemy.vx = g.dir * 720;
      enemy.vy = -780;
      enemy.hitFlashTimer = 0.08;
      state.hitstopTimer = 0.06;
      state.trauma = Math.min(1, state.trauma + 0.55);
      state.bonusPoints += enemy.points;
      state.enemiesDefeated += 1;
      state.score = calculateScore({
        heightPercent: state.heightPercent,
        bonusPoints: state.bonusPoints,
        hearts: state.hearts,
        elapsedTime: state.elapsedTime,
        victory: false,
      });
      events.push({
        type: 'enemyKo',
        x: enemy.x + enemy.w * 0.5,
        y: enemy.y + enemy.h * 0.5,
        dir: g.dir,
        points: enemy.points,
        kind: enemy.kind,
      });
      continue;
    }

    // Otherwise check collision damage against goat (protected during active headbutt clash)
    if (!headbuttBox && g.invulnTimer <= 0 && rectsOverlap(goatHurtbox, enemyBox)) {
      applyDamage(state, events, enemy.x + enemy.w * 0.5);
    }
  }

  // Check red DamageZone spike collisions
  if (g.invulnTimer <= 0 && state.defeatDelayTimer <= 0) {
    for (const dz of DAMAGE_ZONES) {
      if (rectsOverlap(goatHurtbox, dz)) {
        applyDamage(state, events, dz.x + dz.w * 0.5);
        break;
      }
    }
  }

  // Check Sacred Tree Leaf goal!
  if (state.defeatDelayTimer <= 0 && rectsOverlap(g, TREE_GOAL)) {
    state.phase = 'victory';
    state.heightPercent = 100;
    state.score = calculateScore({
      heightPercent: 100,
      bonusPoints: state.bonusPoints,
      hearts: state.hearts,
      elapsedTime: state.elapsedTime,
      victory: true,
    });
    state.trauma = 0.25;
    events.push({
      type: 'victory',
      x: TREE_GOAL.x + TREE_GOAL.w * 0.5,
      y: TREE_GOAL.y + TREE_GOAL.h * 0.35,
      score: state.score,
    });
  }

  return events;
}

function applyDamage(
  state: SimulationState,
  events: SimEvent[],
  hazardCenterX: number
): void {
  const g = state.goat;
  state.hearts = Math.max(0, state.hearts - 1);
  g.invulnTimer = PHYSICS.INVULN_DURATION;
  g.hitFlashTimer = 0.08;
  g.vy = -780;
  g.grounded = false;
  // Bounce away from hazard center so player doesn't stay stuck in spikes
  const goatCenterX = g.x + g.w * 0.5;
  g.dir = goatCenterX < hazardCenterX ? -1 : 1;
  g.scaleX = 1.24;
  g.scaleY = 0.78;
  state.hitstopTimer = 0.055;
  state.trauma = Math.min(1, state.trauma + 0.65);

  events.push({
    type: 'hurt',
    x: goatCenterX,
    y: g.y + g.h * 0.5,
    heartsLeft: state.hearts,
  });

  if (state.hearts <= 0) {
    state.defeatDelayTimer = 0.45;
  }
}
