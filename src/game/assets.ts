export interface SpriteFrameCrop {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

const BASE_URL = (import.meta.env.BASE_URL || './').replace(/\/?$/, '/');
const assetUrl = (relativePath: string): string =>
  `${BASE_URL}${relativePath.replace(/^\/+/, '')}`;

export const ASSET_URLS = {
  staticMap: assetUrl('assets/aistudio/StaticMap_29888b02.png'),
  damageZone: assetUrl('assets/aistudio/DamageZone_acf68f29.png'),
  jumpGuide: assetUrl('assets/aistudio/Jump_bdcd44c4.png'),
  overview: assetUrl('assets/aistudio/Overview_10391176.png'),
  goatIdle: assetUrl('assets/aistudio/Goat_1ac2656b.png'),
  treeIdle: assetUrl('assets/aistudio/tree_3bd06858.png'),
  evilManIdle: assetUrl('assets/aistudio/EvilMan_79b95001.png'),
  evilBirdIdle: assetUrl('assets/aistudio/EvilBird_3f9e84ff.png'),

  goatWalk: [
    assetUrl('assets/aistudio/Goat_Walk_01_d05662db.png'),
    assetUrl('assets/aistudio/Goat_Walk_02_84522474.png'),
    assetUrl('assets/aistudio/Goat_Walk_03_08f67e7d.png'),
    assetUrl('assets/aistudio/Goat_Walk_04_67c547ba.png'),
    assetUrl('assets/aistudio/Goat_Walk_05_8abff913.png'),
    assetUrl('assets/aistudio/Goat_Walk_06_da4f802e.png'),
  ],
  goatRun: [
    assetUrl('assets/aistudio/Goat_Run_01_bb1dba5d.png'),
    assetUrl('assets/aistudio/Goat_Run_02_54968e55.png'),
    assetUrl('assets/aistudio/Goat_Run_03_e5392ec7.png'),
    assetUrl('assets/aistudio/Goat_Run_04_c308a721.png'),
    assetUrl('assets/aistudio/Goat_Run_05_8ee2f2c7.png'),
  ],
  goatJump: [
    assetUrl('assets/aistudio/Goat_Jump_01_d26fad72.png'),
    assetUrl('assets/aistudio/Goat_Jump_02_cfed125c.png'),
    assetUrl('assets/aistudio/Goat_Jump_03_edc11e2b.png'),
    assetUrl('assets/aistudio/Goat_Jump_04_a431e062.png'),
    assetUrl('assets/aistudio/Goat_Jump_05_15357e00.png'),
    assetUrl('assets/aistudio/Goat_Jump_06_e64e72a8.png'),
    assetUrl('assets/aistudio/Goat_Jump_07_46503744.png'),
    assetUrl('assets/aistudio/Goat_Jump_08_a601d2dd.png'),
    assetUrl('assets/aistudio/Goat_Jump_09_612d379f.png'),
    assetUrl('assets/aistudio/Goat_Jump_10_ea540317.png'),
  ],
  goatAttack: [
    assetUrl('assets/aistudio/Goat_Attack_01_6eb89f7f.png'),
    assetUrl('assets/aistudio/Goat_Attack_02_39c56541.png'),
    assetUrl('assets/aistudio/Goat_Attack_03_2f7a0fda.png'),
    assetUrl('assets/aistudio/Goat_Attack_04_462558df.png'),
    assetUrl('assets/aistudio/Goat_Attack_05_04aeec4c.png'),
    assetUrl('assets/aistudio/Goat_Attack_06_4215131a.png'),
    assetUrl('assets/aistudio/Goat_Attack_07_9e345b69.png'),
    assetUrl('assets/aistudio/Goat_Attack_08_7aea8569.png'),
    assetUrl('assets/aistudio/Goat_Attack_09_47c8b7f1.png'),
    assetUrl('assets/aistudio/Goat_Attack_10_0e8fc3ea.png'),
    assetUrl('assets/aistudio/Goat_Attack_11_7889a5f1.png'),
    assetUrl('assets/aistudio/Goat_Attack_12_cd8bbe7b.png'),
    assetUrl('assets/aistudio/Goat_Attack_13_a03e9dc3.png'),
  ],
  evilMan: [
    assetUrl('assets/aistudio/EvilMan_1_14058508.png'),
    assetUrl('assets/aistudio/EvilMan_2_f70c508f.png'),
    assetUrl('assets/aistudio/EvilMan_3_7bca5b11.png'),
    assetUrl('assets/aistudio/EvilMan_4_5087c987.png'),
    assetUrl('assets/aistudio/EvilMan_5_7bca5b11.png'),
  ],
  evilBird: [
    assetUrl('assets/aistudio/EvilBird_1_274086b9.png'),
    assetUrl('assets/aistudio/EvilBird_2_27b57f4c.png'),
    assetUrl('assets/aistudio/EvilBird_3_038366b1.png'),
    assetUrl('assets/aistudio/EvilBird_4_55338f16.png'),
    assetUrl('assets/aistudio/EvilBird_5_983ea62c.png'),
    assetUrl('assets/aistudio/EvilBird_6_65a521c5.png'),
    assetUrl('assets/aistudio/EvilBird_7_b6b42f46.png'),
    assetUrl('assets/aistudio/EvilBird_8_ca6d5f68.png'),
    assetUrl('assets/aistudio/EvilBird_9_4a145dd0.png'),
  ],
  tree: [
    assetUrl('assets/aistudio/Tree_1_f5ba4f43.png'),
    assetUrl('assets/aistudio/Tree_2_d15100d4.png'),
    assetUrl('assets/aistudio/Tree_3_17248f97.png'),
    assetUrl('assets/aistudio/Tree_4_ff741493.png'),
    assetUrl('assets/aistudio/Tree_5_ee4facd4.png'),
    assetUrl('assets/aistudio/Tree_6_ff741493.png'),
    assetUrl('assets/aistudio/Tree_7_17248f97.png'),
    assetUrl('assets/aistudio/Tree_8_d15100d4.png'),
    assetUrl('assets/aistudio/Tree_9_f5ba4f43.png'),
    assetUrl('assets/aistudio/Tree_10_9cf82b84.png'),
    assetUrl('assets/aistudio/Tree_11_6de1205e.png'),
    assetUrl('assets/aistudio/Tree_12_b4ef9ec4.png'),
    assetUrl('assets/aistudio/Tree_13_40328c42.png'),
    assetUrl('assets/aistudio/Tree_14_313cc62c.png'),
  ],
} as const;

// Measured source dimensions & hoof anchors so Walk, Run, Jump, and Attack share identical 128x154 body scale
export const SPRITE_CROPS = {
  evilManFull: { sx: 0, sy: 0, sw: 333, sh: 268 } satisfies SpriteFrameCrop,
  evilBirdFull: { sx: 0, sy: 0, sw: 392, sh: 392 } satisfies SpriteFrameCrop,
  treeFull: { sx: 0, sy: 0, sw: 281, sh: 248 } satisfies SpriteFrameCrop,
};

export const GOAT_SPRITE_METRICS = {
  walk: { srcSize: 392, scale: 0.44, anchorX: 206, anchorY: 366 },
  run: { srcSize: 419, scale: 0.434, anchorX: 217, anchorY: 394 },
  jump: {
    srcSize: 1181,
    scale: 0.2575,
    anchorX: 551,
    // Measured hoof-bottom Y per frame so the physics engine drives exact elevation without floating offset
    frameFeetY: [1111, 1111, 1112, 1112, 1080, 758, 700, 669, 663, 669],
  },
  attack: { srcSize: 787, scale: 0.38, anchorX: 352, anchorY: 733 },
} as const;

export interface LoadedAssets {
  staticMap: HTMLImageElement;
  bakedMap: HTMLCanvasElement;
  bakedMapScale: number;
  springPadSprite: HTMLCanvasElement;
  jumpGuide: HTMLImageElement;
  goatIdle: HTMLImageElement;
  goatWalk: HTMLCanvasElement[];
  goatRun: HTMLCanvasElement[];
  goatJump: HTMLCanvasElement[];
  goatAttack: HTMLCanvasElement[];
  evilMan: HTMLImageElement[];
  evilBird: HTMLImageElement[];
  tree: HTMLImageElement[];
}

function buildBakedMap(
  staticMap: HTMLImageElement,
  damageZone: HTMLImageElement
): {
  canvas: HTMLCanvasElement;
  scale: number;
} {
  // 0.5x scale (1571x2236) matches 1440px+ viewports crisply while cutting pixel fill by 4x
  const scale = 0.5;
  const w = Math.round(staticMap.naturalWidth * scale);
  const h = Math.round(staticMap.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (ctx) {
    ctx.fillStyle = '#D99058';
    ctx.fillRect(0, 0, w, h);

    const clayGrad = ctx.createLinearGradient(0, 0, 0, h);
    clayGrad.addColorStop(0, 'rgba(255, 226, 185, 0.14)');
    clayGrad.addColorStop(0.5, 'rgba(217, 144, 88, 0.0)');
    clayGrad.addColorStop(1, 'rgba(92, 42, 16, 0.12)');
    ctx.fillStyle = clayGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(staticMap, 0, 0, w, h);
    ctx.restore();

    // Subtle museum cinnabar-red pottery glaze over hazard zones from DamageZone guide
    // so visitors can tell sharp spikes/hazards apart from safe black platforms at a glance
    const dzCanvas = document.createElement('canvas');
    dzCanvas.width = w;
    dzCanvas.height = h;
    const dzCtx = dzCanvas.getContext('2d');
    if (dzCtx) {
      dzCtx.drawImage(damageZone, 0, 0, w, h);
      const imgData = dzCtx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const a = d[i + 3];
        if (a > 90 && r > 150 && g < 95 && b < 95) {
          // Ancient crimson-ochre glaze
          d[i] = 158;
          d[i + 1] = 26;
          d[i + 2] = 20;
          d[i + 3] = Math.round(a * 0.78);
        } else {
          d[i + 3] = 0;
        }
      }
      dzCtx.putImageData(imgData, 0, 0);
      ctx.drawImage(dzCanvas, 0, 0);
    }
  }
  return { canvas, scale };
}

function buildSpringPadSprite(jumpGuide: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 310;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(jumpGuide, 2736, 2988, 310, 140, 0, 0, 310, 140);
    // Strip opaque white backdrop so only the turquoise-blue wave motifs render over terracotta clay
    const imgData = ctx.getImageData(0, 0, 310, 140);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      // Keep only the turquoise/blue wave strokes
      if (b > 130 && b > r + 35) {
        d[i] = 10;
        d[i + 1] = 138;
        d[i + 2] = 204;
        d[i + 3] = 235;
      } else {
        d[i + 3] = 0;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  return canvas;
}

function bakeSpriteFrames(
  images: HTMLImageElement[],
  targetSize: number
): HTMLCanvasElement[] {
  return images.map((img) => {
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetSize, targetSize);
    }
    return canvas;
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

let cachedPromise: Promise<LoadedAssets> | null = null;

export function loadAllGameAssets(
  onProgress?: (loaded: number, total: number) => void
): Promise<LoadedAssets> {
  if (cachedPromise) return cachedPromise;

  const allUrls: string[] = [
    ASSET_URLS.staticMap,
    ASSET_URLS.damageZone,
    ASSET_URLS.jumpGuide,
    ASSET_URLS.goatIdle,
    ...ASSET_URLS.goatWalk,
    ...ASSET_URLS.goatRun,
    ...ASSET_URLS.goatJump,
    ...ASSET_URLS.goatAttack,
    ...ASSET_URLS.evilMan,
    ...ASSET_URLS.evilBird,
    ...ASSET_URLS.tree,
  ];

  let done = 0;
  const total = allUrls.length;
  const trackedLoad = (src: string) =>
    loadImage(src).then((img) => {
      done += 1;
      onProgress?.(done, total);
      return img;
    });

  cachedPromise = Promise.all([
    trackedLoad(ASSET_URLS.staticMap),
    trackedLoad(ASSET_URLS.damageZone),
    trackedLoad(ASSET_URLS.jumpGuide),
    trackedLoad(ASSET_URLS.goatIdle),
    Promise.all(ASSET_URLS.goatWalk.map(trackedLoad)),
    Promise.all(ASSET_URLS.goatRun.map(trackedLoad)),
    Promise.all(ASSET_URLS.goatJump.map(trackedLoad)),
    Promise.all(ASSET_URLS.goatAttack.map(trackedLoad)),
    Promise.all(ASSET_URLS.evilMan.map(trackedLoad)),
    Promise.all(ASSET_URLS.evilBird.map(trackedLoad)),
    Promise.all(ASSET_URLS.tree.map(trackedLoad)),
  ]).then(
    ([
      staticMap,
      damageZone,
      jumpGuide,
      goatIdle,
      goatWalk,
      goatRun,
      goatJump,
      goatAttack,
      evilMan,
      evilBird,
      tree,
    ]) => {
      const baked = buildBakedMap(staticMap, damageZone);
      const springPadSprite = buildSpringPadSprite(jumpGuide);
      return {
        staticMap,
        bakedMap: baked.canvas,
        bakedMapScale: baked.scale,
        springPadSprite,
        jumpGuide,
        goatIdle,
        goatWalk: bakeSpriteFrames(goatWalk, 256),
        goatRun: bakeSpriteFrames(goatRun, 256),
        goatJump: bakeSpriteFrames(goatJump, 384),
        goatAttack: bakeSpriteFrames(goatAttack, 384),
        evilMan,
        evilBird,
        tree,
      };
    }
  );

  return cachedPromise;
}
