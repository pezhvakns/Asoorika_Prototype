export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Platform extends Rect {
  id: string;
  /** One-way platforms allow jumping up through from below and landing cleanly on top */
  oneWay: boolean;
}

export interface DamageZone extends Rect {
  id: string;
  label: string;
}

export interface JumpPad extends Rect {
  id: string;
  bounceVelocity: number;
}

export interface EnemySpawn {
  id: string;
  kind: 'evilBird' | 'evilMan';
  x: number;
  y: number;
  w: number;
  h: number;
  patrolMinX: number;
  patrolMaxX: number;
  baseY: number;
  speed: number;
  points: number;
}

export const MAP_WIDTH = 3141;
export const MAP_HEIGHT = 4472;
export const CLAY_BG_COLOR = '#D99058';

// Goat spawn position matching Overview_10391176.png (bottom-left standing on bottom floor)
export const GOAT_SPAWN = {
  x: 150,
  y: 4164,
  w: 118,
  h: 146,
};

// Bottom floor reference Y and summit Y for altitude calculation
export const START_FLOOR_Y = 4318;
export const SUMMIT_FLOOR_Y = 666;

// Sacred Tree goal zone at top-left matching Overview_10391176.png
export const TREE_GOAL: Rect = {
  x: 56,
  y: 454,
  w: 176,
  h: 212,
};

// Platforms extracted pixel-accurately from StaticMap_29888b02.png
export const PLATFORMS: Platform[] = [
  // Top frieze ceiling border
  { id: 'ceiling-frieze', x: 0, y: 0, w: 3141, h: 366, oneWay: false },

  // Bottom solid floor
  { id: 'bottom-floor', x: 0, y: 4318, w: 3141, h: 154, oneWay: false },

  // Bottom-right solid wall block (with spikes on its left face)
  { id: 'bottom-right-block', x: 2944, y: 4108, w: 197, h: 210, oneWay: false },

  // Floor 1 -> Floor 2 stepping platforms
  { id: 'step-1-right', x: 1938, y: 3912, w: 642, h: 102, oneWay: true },
  { id: 'step-2-center', x: 768, y: 3720, w: 876, h: 156, oneWay: true },
  { id: 'step-3-left', x: 426, y: 3534, w: 318, h: 144, oneWay: true },
  { id: 'step-4-wall', x: 0, y: 3420, w: 204, h: 102, oneWay: true },
  { id: 'step-5-midleft', x: 318, y: 3120, w: 618, h: 102, oneWay: true },
  { id: 'big-center-block', x: 1242, y: 3120, w: 1164, h: 294, oneWay: true },

  // Blue water spring platform (also acts as a jump pad surface)
  { id: 'spring-platform', x: 2748, y: 3000, w: 288, h: 120, oneWay: true },

  // Floor 2 (Middle Floor)
  { id: 'middle-floor', x: 320, y: 2375, w: 2464, h: 140, oneWay: true },

  // Left checkered staircase (Floor 2 -> Floor 3)
  { id: 'stair-3', x: 405, y: 2175, w: 224, h: 200, oneWay: true },
  { id: 'stair-2', x: 200, y: 1975, w: 228, h: 200, oneWay: true },
  { id: 'stair-1', x: 0, y: 1781, w: 218, h: 194, oneWay: true },

  // Floor 3 (Upper Floor)
  { id: 'upper-floor', x: 534, y: 1692, w: 2607, h: 90, oneWay: true },

  // Floor 3 stepping blocks over hazards
  { id: 'upper-step-1', x: 990, y: 1584, w: 96, h: 96, oneWay: true },
  { id: 'upper-step-2', x: 1092, y: 1482, w: 96, h: 96, oneWay: true },
  { id: 'upper-ledge-beast', x: 1404, y: 1380, w: 312, h: 96, oneWay: true },
  { id: 'upper-ledge-bird', x: 1818, y: 1164, w: 306, h: 96, oneWay: true },

  // High right beam above hanging figures (leads left onto Top Floor)
  { id: 'high-right-beam', x: 2224, y: 942, w: 868, h: 26, oneWay: true },

  // Floor 4 (Top Summit Floor with EvilMan & Sacred Tree)
  { id: 'top-floor', x: 0, y: 666, w: 1974, h: 150, oneWay: false },
];

// Blue Jump Zone extracted from Jump_bdcd44c4.png
export const JUMP_PADS: JumpPad[] = [
  {
    id: 'water-spring',
    x: 2740,
    y: 2986,
    w: 304,
    h: 134,
    bounceVelocity: -2120,
  },
];

// Red Damage Zones extracted from DamageZone_acf68f29.png (fairly inset by ~14px for crisp feel)
export const DAMAGE_ZONES: DamageZone[] = [
  // Bottom-right wall spikes
  { id: 'dz-bottom-right-spikes', label: 'Wall Spikes', x: 2896, y: 4122, w: 48, h: 186 },

  // Rotating star hazard on step-2-center
  { id: 'dz-lower-star', label: 'Spiked Star', x: 786, y: 3554, w: 176, h: 160 },

  // Twin ceremonial vase spikes on middle floor
  { id: 'dz-mid-vases', label: 'Ceremonial Spikes', x: 1776, y: 2216, w: 204, h: 156 },

  // Upper floor horned beast hazard
  { id: 'dz-upper-beast', label: 'Horned Beast', x: 1378, y: 1538, w: 264, h: 150 },

  // Upper floor giant bird hazard
  { id: 'dz-upper-bird', label: 'Shadow Crane', x: 1836, y: 1376, w: 286, h: 310 },

  // Upper floor right flock of tall ibis hazards
  { id: 'dz-upper-ibis-flock', label: 'Ibis Flock', x: 2240, y: 1290, w: 856, h: 396 },

  // Hanging upside-down figures beneath the high right beam
  { id: 'dz-hanging-figures', label: 'Hanging Spirits', x: 2236, y: 984, w: 840, h: 260 },

  // Floating spiky diamond on upper-left
  { id: 'dz-floating-diamond', label: 'Spiked Diamond', x: 626, y: 1090, w: 204, h: 204 },

  // Left wall spikes below top floor
  { id: 'dz-left-wall-spikes', label: 'Left Wall Spikes', x: 4, y: 840, w: 104, h: 572 },

  // Three ceiling creatures hanging under Top Floor
  { id: 'dz-ceiling-creatures', label: 'Ceiling Spirits', x: 1152, y: 822, w: 436, h: 122 },
];

// Animated evil characters placed per Overview_10391176.png
export const INITIAL_ENEMIES: EnemySpawn[] = [
  {
    id: 'evil-bird-1',
    kind: 'evilBird',
    x: 1880,
    y: 2660,
    w: 250,
    h: 230,
    patrolMinX: 1180,
    patrolMaxX: 2560,
    baseY: 2680,
    speed: 250,
    points: 350,
  },
  {
    id: 'evil-man-boss',
    kind: 'evilMan',
    x: 540,
    y: 446,
    w: 200,
    h: 220,
    patrolMinX: 340,
    patrolMaxX: 1420,
    baseY: 446,
    speed: 210,
    points: 500,
  },
];

export function getFloorNumber(y: number): number {
  if (y < 920) return 4;
  if (y < 1850) return 3;
  if (y < 2750) return 2;
  return 1;
}
