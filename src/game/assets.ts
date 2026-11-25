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

  goatRunRight: [
    assetUrl('assets/aistudio/GoatRunRight_1_bb932fad.png'),
    assetUrl('assets/aistudio/GoatRunRight_2_72c967e1.png'),
    assetUrl('assets/aistudio/GoatRunRight_3_a192cab1.png'),
    assetUrl('assets/aistudio/GoatRunRight_4_dd3671f3.png'),
    assetUrl('assets/aistudio/GoatRunRight_5_a9a5c856.png'),
    assetUrl('assets/aistudio/GoatRunRight_6_543256c6.png'),
  ],
  goatRunLeft: [
    assetUrl('assets/aistudio/GoatRunLeft_1_9b8047ee.png'),
    assetUrl('assets/aistudio/GoatRunLeft_2_7e645aa7.png'),
    assetUrl('assets/aistudio/GoatRunLeft_3_da0f2ff9.png'),
    assetUrl('assets/aistudio/GoatRunLeft_4_c73619cd.png'),
    assetUrl('assets/aistudio/GoatRunLeft_5_91166aae.png'),
    assetUrl('assets/aistudio/GoatRunLeft_6_248bc823.png'),
  ],
  goatJump: [
    assetUrl('assets/aistudio/GoatJump_1_498a8f70.png'),
    assetUrl('assets/aistudio/GoatJump_2_65162e29.png'),
    assetUrl('assets/aistudio/GoatJump_3_403cd319.png'),
    assetUrl('assets/aistudio/GoatJump_4_d3fa9eea.png'),
    assetUrl('assets/aistudio/GoatJump_5_acd1ac03.png'),
    assetUrl('assets/aistudio/GoatJump_6_315924d0.png'),
    assetUrl('assets/aistudio/GoatJump_7_23bbaeaf.png'),
    assetUrl('assets/aistudio/GoatJump_8_592b0f91.png'),
  ],
  goatPunch: [
    assetUrl('assets/aistudio/GoatPunch_1_498a8f70.png'),
    assetUrl('assets/aistudio/GoatPunch_2_71607662.png'),
    assetUrl('assets/aistudio/GoatPunch_3_71607662.png'),
    assetUrl('assets/aistudio/GoatPunch_4_480265ab.png'),
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

// Measured non-transparent source crops so every animation frame aligns cleanly with zero scale jitter
export const SPRITE_CROPS = {
  goatRunRight: { sx: 108, sy: 77, sw: 183, sh: 219 } satisfies SpriteFrameCrop,
  goatRunLeft: { sx: 0, sy: 0, sw: 183, sh: 219 } satisfies SpriteFrameCrop,
  goatJumpFull: { sx: 0, sy: 0, sw: 257, sh: 202 } satisfies SpriteFrameCrop,
  goatPunchFull: { sx: 0, sy: 0, sw: 257, sh: 202 } satisfies SpriteFrameCrop,
  evilManFull: { sx: 0, sy: 0, sw: 333, sh: 268 } satisfies SpriteFrameCrop,
  evilBirdFull: { sx: 0, sy: 0, sw: 392, sh: 392 } satisfies SpriteFrameCrop,
  treeFull: { sx: 0, sy: 0, sw: 281, sh: 248 } satisfies SpriteFrameCrop,
};

export interface LoadedAssets {
  staticMap: HTMLImageElement;
  bakedMap: HTMLCanvasElement;
  bakedMapScale: number;
  springPadSprite: HTMLCanvasElement;
  jumpGuide: HTMLImageElement;
  goatIdle: HTMLImageElement;
  goatRunRight: HTMLImageElement[];
  goatRunLeft: HTMLImageElement[];
  goatJump: HTMLImageElement[];
  goatPunch: HTMLImageElement[];
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
    ...ASSET_URLS.goatRunRight,
    ...ASSET_URLS.goatRunLeft,
    ...ASSET_URLS.goatJump,
    ...ASSET_URLS.goatPunch,
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
    Promise.all(ASSET_URLS.goatRunRight.map(trackedLoad)),
    Promise.all(ASSET_URLS.goatRunLeft.map(trackedLoad)),
    Promise.all(ASSET_URLS.goatJump.map(trackedLoad)),
    Promise.all(ASSET_URLS.goatPunch.map(trackedLoad)),
    Promise.all(ASSET_URLS.evilMan.map(trackedLoad)),
    Promise.all(ASSET_URLS.evilBird.map(trackedLoad)),
    Promise.all(ASSET_URLS.tree.map(trackedLoad)),
  ]).then(
    ([
      staticMap,
      damageZone,
      jumpGuide,
      goatIdle,
      goatRunRight,
      goatRunLeft,
      goatJump,
      goatPunch,
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
        goatRunRight,
        goatRunLeft,
        goatJump,
        goatPunch,
        evilMan,
        evilBird,
        tree,
      };
    }
  );

  return cachedPromise;
}
