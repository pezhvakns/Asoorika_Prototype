import { GOAT_SPRITE_METRICS, type LoadedAssets, SPRITE_CROPS } from './assets';
import {
  CLAY_BG_COLOR,
  JUMP_PADS,
  MAP_HEIGHT,
  MAP_WIDTH,
  TREE_GOAL,
} from './levelData';
import { type EffectsPool } from './particles';
import {
  DIFFICULTY_CONFIGS,
  PHYSICS,
  type SimulationState,
  getHeadbuttHitbox,
} from './physics';

export interface ViewportMetrics {
  scale: number;
  viewWorldW: number;
  viewWorldH: number;
  offsetX: number;
  offsetY: number;
}

export function computeViewportMetrics(
  canvasCssW: number,
  canvasCssH: number
): ViewportMetrics {
  const aspect = canvasCssW / Math.max(1, canvasCssH);
  // Desktop landscape: fit full horizontal arena (3141px) so player sees entire floor left-to-right,
  // while showing roughly the bottom 1/3 vertically (~1600-1950 world px of 4472).
  // Narrow/portrait viewports: zoom to ~1/3 height vertically and track horizontally as well.
  let scale: number;
  if (aspect >= 1.1) {
    scale = canvasCssW / MAP_WIDTH;
    // Cap vertical view to at most 46% of map so camera visibly follows upward on ultra-tall monitors
    const maxWorldH = MAP_HEIGHT * 0.45;
    if (canvasCssH / scale > maxWorldH) {
      scale = canvasCssH / maxWorldH;
    }
  } else {
    scale = canvasCssH / (MAP_HEIGHT / 3);
  }

  const viewWorldW = Math.min(MAP_WIDTH, canvasCssW / scale);
  const viewWorldH = Math.min(MAP_HEIGHT, canvasCssH / scale);
  const renderedW = Math.min(canvasCssW, MAP_WIDTH * scale);
  const offsetX = Math.max(0, (canvasCssW - renderedW) * 0.5);
  const offsetY = 0;

  return { scale, viewWorldW, viewWorldH, offsetX, offsetY };
}

export function renderGameFrame(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  assets: LoadedAssets,
  state: SimulationState,
  effects: EffectsPool,
  metrics: ViewportMetrics,
  nowSec: number
): void {
  // Museum gallery obsidian surround behind pottery panel
  ctx.fillStyle = '#1A120D';
  ctx.fillRect(0, 0, cssW, cssH);

  // Compute decaying trauma^2 camera shake
  const shakeMag = state.trauma * state.trauma * 24;
  const shakeX = shakeMag > 0.2 ? (Math.random() * 2 - 1) * shakeMag : 0;
  const shakeY = shakeMag > 0.2 ? (Math.random() * 2 - 1) * shakeMag : 0;

  ctx.save();
  // Clip to map viewport area
  const drawWidth = Math.min(cssW, MAP_WIDTH * metrics.scale);
  ctx.beginPath();
  ctx.rect(metrics.offsetX, metrics.offsetY, drawWidth, cssH);
  ctx.clip();

  // Transform into world coordinates
  ctx.translate(metrics.offsetX, metrics.offsetY);
  ctx.scale(metrics.scale, metrics.scale);
  ctx.translate(-state.cameraX + shakeX, -state.cameraY + shakeY);

  // 1 & 2. Draw ONLY the visible camera slice of the pre-baked opaque pottery map
  const visX = Math.max(0, Math.floor(state.cameraX - 40));
  const visY = Math.max(0, Math.floor(state.cameraY - 40));
  const visW = Math.min(MAP_WIDTH - visX, Math.ceil(metrics.viewWorldW + 80));
  const visH = Math.min(MAP_HEIGHT - visY, Math.ceil(metrics.viewWorldH + 80));
  const bScale = assets.bakedMapScale;

  ctx.fillStyle = CLAY_BG_COLOR;
  ctx.fillRect(visX, visY, visW, visH);
  if (visW > 0 && visH > 0) {
    ctx.drawImage(
      assets.bakedMap,
      visX * bScale,
      visY * bScale,
      visW * bScale,
      visH * bScale,
      visX,
      visY,
      visW,
      visH
    );
  }

  // 3. Animated turquoise highlight on the Blue Wave Jump Pad (pre-cropped sprite)
  const pad = JUMP_PADS[0];
  if (pad) {
    ctx.save();
    const pulse = 0.72 + Math.sin(nowSec * 4.5) * 0.22;
    ctx.globalAlpha = pulse;
    ctx.drawImage(assets.springPadSprite, 2736, 2988, 310, 140);
    // Subtle upward wind/water arcs inviting the player to bounce
    ctx.strokeStyle = 'rgba(0, 175, 240, 0.55)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const phase = (nowSec * 1.4 + i * 0.33) % 1;
      const arcY = pad.y - 12 - phase * 95;
      ctx.globalAlpha = (1 - phase) * 0.65;
      ctx.beginPath();
      ctx.moveTo(pad.x + 70, arcY + 14);
      ctx.quadraticCurveTo(
        pad.x + pad.w * 0.5,
        arcY - 12,
        pad.x + pad.w - 70,
        arcY + 14
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Sacred Tree (14-frame continuous swaying loop) + glowing golden leaf aura
  const treeFrames = assets.tree;
  const treeIdx = Math.floor(state.treeAnimTime * 9) % treeFrames.length;
  const treeImg = treeFrames[treeIdx];
  // Warm golden beacon glow behind the sacred leaf so goal is unmistakable
  const glowR = 130 + Math.sin(nowSec * 3.2) * 18;
  const treeCenterX = TREE_GOAL.x + TREE_GOAL.w * 0.52;
  const treeCenterY = TREE_GOAL.y + TREE_GOAL.h * 0.42;
  const leafGlow = ctx.createRadialGradient(
    treeCenterX,
    treeCenterY,
    12,
    treeCenterX,
    treeCenterY,
    glowR
  );
  leafGlow.addColorStop(0, 'rgba(255, 224, 130, 0.52)');
  leafGlow.addColorStop(0.55, 'rgba(244, 180, 68, 0.22)');
  leafGlow.addColorStop(1, 'rgba(244, 180, 68, 0)');
  ctx.fillStyle = leafGlow;
  ctx.beginPath();
  ctx.arc(treeCenterX, treeCenterY, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Draw swaying tree anchored firmly on Top Floor (y=666)
  ctx.drawImage(
    treeImg,
    SPRITE_CROPS.treeFull.sx,
    SPRITE_CROPS.treeFull.sy,
    SPRITE_CROPS.treeFull.sw,
    SPRITE_CROPS.treeFull.sh,
    TREE_GOAL.x - 42,
    666 - 248,
    281,
    248
  );

  // 5. Animated Evil Characters (EvilBird 9-frame loop & EvilMan 5-frame loop)
  for (const enemy of state.enemies) {
    if (!enemy.alive && enemy.koTimer <= 0) continue;

    ctx.save();
    const cx = enemy.x + enemy.w * 0.5;
    const cy = enemy.y + enemy.h * 0.5;
    ctx.translate(cx, cy);

    if (!enemy.alive) {
      ctx.globalAlpha = Math.max(0, enemy.koTimer / 0.55);
      ctx.rotate(enemy.koRotation);
    }

    // Subtle telegraph warning ring when enemy is lunging or swooping
    if (enemy.alive && enemy.telegraphTimer > 0.15) {
      ctx.save();
      ctx.strokeStyle = `rgba(200, 58, 43, ${Math.min(0.75, enemy.telegraphTimer * 0.85)})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(0, 0, enemy.w * 0.62, enemy.h * 0.58, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (enemy.kind === 'evilBird') {
      const idx = Math.floor(enemy.animTime * 11) % assets.evilBird.length;
      const img = assets.evilBird[idx];
      if (enemy.dir === 1) ctx.scale(-1, 1);
      ctx.drawImage(img, -196, -196, 392, 392);
    } else {
      const idx = Math.floor(enemy.animTime * 8) % assets.evilMan.length;
      const img = assets.evilMan[idx];
      // Anchor feet solidly to top floor
      ctx.drawImage(img, -166, -138, 333, 268);
    }

    if (enemy.hitFlashTimer > 0) {
      ctx.fillStyle = 'rgba(255, 245, 224, 0.72)';
      ctx.beginPath();
      ctx.arc(0, 0, enemy.w * 0.48, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 6. Goat Protagonist (normalized across Walk, Run, one-shot Jump, and 13-frame Attack)
  const g = state.goat;
  const invulnBlink =
    g.invulnTimer > 0 && Math.floor(g.invulnTimer * 18) % 2 === 0;

  if (!invulnBlink) {
    ctx.save();
    const feetCenterX = g.x + g.w * 0.5;
    const feetY = g.y + g.h;
    ctx.translate(feetCenterX, feetY);
    ctx.scale(g.scaleX, g.scaleY);

    // Subtle ground contact shadow
    if (g.grounded) {
      ctx.fillStyle = 'rgba(11, 13, 20, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, -3, 52, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (g.headbuttTimer > 0) {
      // 13-frame rearing horn-slam Attack animation (flipped when facing left)
      const progress =
        1 - Math.max(0, g.headbuttTimer / PHYSICS.HEADBUTT_DURATION);
      const frameIdx = Math.min(
        assets.goatAttack.length - 1,
        Math.floor(progress * assets.goatAttack.length)
      );
      const img = assets.goatAttack[frameIdx];
      const m = GOAT_SPRITE_METRICS.attack;
      if (g.dir === -1) ctx.scale(-1, 1);
      ctx.drawImage(
        img,
        -m.anchorX * m.scale,
        -m.anchorY * m.scale,
        m.srcSize * m.scale,
        m.srcSize * m.scale
      );
    } else if (!g.grounded && g.jumpAnimActive) {
      // 10-frame one-shot Jump animation with per-frame hoof anchoring
      const progress = Math.min(
        0.999,
        g.jumpAnimTime / PHYSICS.JUMP_ANIM_DURATION
      );
      const frameIdx = Math.min(
        assets.goatJump.length - 1,
        Math.floor(progress * assets.goatJump.length)
      );
      const img = assets.goatJump[frameIdx];
      const m = GOAT_SPRITE_METRICS.jump;
      const frameFootY = m.frameFeetY[frameIdx] ?? m.frameFeetY[0];
      if (g.dir === -1) ctx.scale(-1, 1);
      ctx.drawImage(
        img,
        -m.anchorX * m.scale,
        -frameFootY * m.scale,
        m.srcSize * m.scale,
        m.srcSize * m.scale
      );
    } else if (state.phase === 'title') {
      // Resting ibex silhouette on Title Screen
      ctx.drawImage(assets.goatIdle, -64, -154, 128, 154);
    } else {
      // Difficulty-matched gait: Easy uses Walk, Medium & Hard use Run synced 1:1 to stridePerFrame
      const diffCfg = DIFFICULTY_CONFIGS[state.difficulty];
      const useWalk = diffCfg.gaitMode === 'walk';
      const frames = useWalk ? assets.goatWalk : assets.goatRun;
      const m = useWalk ? GOAT_SPRITE_METRICS.walk : GOAT_SPRITE_METRICS.run;
      const frameIdx =
        Math.floor(g.runDistance / diffCfg.stridePerFrame) % frames.length;
      const img = frames[frameIdx];
      if (g.dir === -1) ctx.scale(-1, 1);
      ctx.drawImage(
        img,
        -m.anchorX * m.scale,
        -m.anchorY * m.scale,
        m.srcSize * m.scale,
        m.srcSize * m.scale
      );
    }

    if (g.hitFlashTimer > 0) {
      ctx.fillStyle = 'rgba(255, 220, 210, 0.65)';
      ctx.beginPath();
      ctx.arc(0, -76, 68, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Attack horn-slam kinetic slash arc timed to the forward strike frames (frames 10-13)
  const hb = getHeadbuttHitbox(g);
  const attackElapsed =
    g.headbuttTimer > 0 ? PHYSICS.HEADBUTT_DURATION - g.headbuttTimer : -1;
  if (hb && attackElapsed >= PHYSICS.HEADBUTT_STRIKE_AT * 0.82) {
    const slashProgress = Math.min(
      1,
      (attackElapsed - PHYSICS.HEADBUTT_STRIKE_AT * 0.82) /
        Math.max(0.05, PHYSICS.HEADBUTT_ACTIVE_END - PHYSICS.HEADBUTT_STRIKE_AT * 0.82)
    );
    ctx.save();
    const arcX = g.dir === 1 ? g.x + g.w + 46 : g.x - 46;
    const arcY = g.y + g.h * 0.44;
    ctx.globalAlpha = (1 - slashProgress * 0.65) * 0.92;
    ctx.lineCap = 'round';

    // Outer warm amber sweep
    ctx.strokeStyle = '#F4B444';
    ctx.lineWidth = 14 * (1 - slashProgress * 0.45);
    ctx.beginPath();
    if (g.dir === 1) {
      ctx.arc(arcX - 38, arcY, 78, -Math.PI * 0.42, Math.PI * 0.34);
    } else {
      ctx.arc(arcX + 38, arcY, 78, Math.PI * 0.66, Math.PI * 1.42);
    }
    ctx.stroke();

    // Inner bright parchment highlight
    ctx.strokeStyle = '#FFF5E8';
    ctx.lineWidth = 6 * (1 - slashProgress * 0.4);
    ctx.beginPath();
    if (g.dir === 1) {
      ctx.arc(arcX - 30, arcY, 72, -Math.PI * 0.36, Math.PI * 0.28);
    } else {
      ctx.arc(arcX + 30, arcY, 72, Math.PI * 0.72, Math.PI * 1.36);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 7. Pooled shockwave & impact effects (land rings, horn-slam strikes, enemy KO bursts)
  for (let i = 0; i < effects.shockwaves.length; i++) {
    const s = effects.shockwaves[i];
    if (!s.active) continue;
    const progress = 1 - s.life / s.maxLife;
    const alpha = Math.max(0, 1 - progress);
    ctx.save();
    ctx.translate(s.x, s.y);

    if (s.kind === 'land') {
      ctx.scale(1, 0.32);
      ctx.globalAlpha = alpha * 0.65;
      ctx.strokeStyle = s.secondaryColor;
      ctx.lineWidth = s.lineWidth * (1.2 - progress * 0.6);
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(4, s.radius), 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.45;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth * 0.65;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, s.radius * 0.72), 0, Math.PI * 2);
      ctx.stroke();
    } else if (s.kind === 'strike') {
      // Directional crescent impact ring + 6 starburst rays
      const startA = s.dir === 1 ? -Math.PI * 0.58 : Math.PI * 0.42;
      const endA = s.dir === 1 ? Math.PI * 0.58 : Math.PI * 1.58;
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = s.secondaryColor;
      ctx.lineWidth = s.lineWidth * (1.15 - progress * 0.65);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(6, s.radius), startA, endA);
      ctx.stroke();

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = Math.max(2, s.lineWidth * 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(4, s.radius * 0.78), startA + 0.12, endA - 0.12);
      ctx.stroke();

      // Radial starburst impact lines
      const rayCount = 6;
      const innerR = s.radius * 0.36;
      const outerR = s.radius * 1.12;
      for (let r = 0; r < rayCount; r++) {
        const frac = (r / (rayCount - 1)) - 0.5;
        const angle = (s.dir === 1 ? 0 : Math.PI) + frac * 1.7;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
        ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
        ctx.stroke();
      }
    } else {
      // Heavy KO dual-ring starburst
      ctx.globalAlpha = alpha * 0.92;
      ctx.strokeStyle = s.secondaryColor;
      ctx.lineWidth = s.lineWidth * (1.2 - progress * 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(8, s.radius), 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = Math.max(2, s.lineWidth * 0.55);
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(5, s.radius * 0.68), 0, Math.PI * 2);
      ctx.stroke();

      const spikes = 8;
      for (let r = 0; r < spikes; r++) {
        const angle = (r / spikes) * Math.PI * 2 + progress * 0.35;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * s.radius * 0.45, Math.sin(angle) * s.radius * 0.45);
        ctx.lineTo(Math.cos(angle) * s.radius * 1.18, Math.sin(angle) * s.radius * 1.18);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // 8. Pooled particles (billowing clay dust, terracotta dirt clods, kinetic sparks, shards)
  for (let i = 0; i < effects.particles.length; i++) {
    const p = effects.particles[i];
    if (!p.active) continue;
    const lifeRatio = Math.max(0, p.life / p.maxLife);
    const t = 1 - lifeRatio;
    const curSize = p.size + (p.endSize - p.size) * t;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;

    if (p.shape === 'dust') {
      // Soft layered billowing clay dust puff
      ctx.globalAlpha = lifeRatio * lifeRatio * 0.62;
      ctx.beginPath();
      ctx.arc(0, 0, curSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = lifeRatio * 0.38;
      ctx.beginPath();
      ctx.arc(curSize * 0.42, -curSize * 0.18, curSize * 0.68, 0, Math.PI * 2);
      ctx.arc(-curSize * 0.38, curSize * 0.14, curSize * 0.62, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'dirt') {
      // Angular terracotta clay clod
      ctx.globalAlpha = Math.min(1, lifeRatio * 1.4);
      const s = curSize;
      ctx.beginPath();
      ctx.moveTo(-s * 0.9, -s * 0.4);
      ctx.lineTo(s * 0.2, -s * 0.95);
      ctx.lineTo(s * 0.95, -s * 0.15);
      ctx.lineTo(s * 0.55, s * 0.85);
      ctx.lineTo(-s * 0.75, s * 0.65);
      ctx.closePath();
      ctx.fill();
    } else if (p.shape === 'spark') {
      // Tapered directional impact streak
      ctx.globalAlpha = lifeRatio;
      const len = curSize * 2.6;
      const thick = Math.max(2, curSize * 0.34);
      ctx.beginPath();
      ctx.moveTo(len * 0.55, 0);
      ctx.lineTo(-len * 0.15, -thick);
      ctx.lineTo(-len * 0.55, 0);
      ctx.lineTo(-len * 0.15, thick);
      ctx.closePath();
      ctx.fill();
    } else if (p.shape === 'diamond') {
      ctx.globalAlpha = lifeRatio;
      const s = curSize;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.7, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.7, 0);
      ctx.closePath();
      ctx.fill();
    } else if (p.shape === 'leaf') {
      ctx.globalAlpha = lifeRatio;
      const s = curSize;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.4, s * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = lifeRatio;
      ctx.beginPath();
      ctx.arc(0, 0, curSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 8. Floating score/action popups
  ctx.save();
  ctx.font = '700 44px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i < effects.popups.length; i++) {
    const t = effects.popups[i];
    if (!t.active) continue;
    const alpha = Math.min(1, (t.life / t.maxLife) * 1.4);
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#0B0D14';
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.restore();

  ctx.restore();

  // Subtle critical-health peripheral crimson vignette when at 1 heart
  if (state.phase === 'playing' && state.hearts === 1) {
    const pulse = 0.16 + Math.sin(nowSec * 5.2) * 0.08;
    const vig = ctx.createRadialGradient(
      cssW * 0.5,
      cssH * 0.5,
      Math.min(cssW, cssH) * 0.35,
      cssW * 0.5,
      cssH * 0.5,
      Math.max(cssW, cssH) * 0.72
    );
    vig.addColorStop(0, 'rgba(200, 58, 43, 0)');
    vig.addColorStop(1, `rgba(180, 32, 24, ${pulse.toFixed(3)})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, cssW, cssH);
  }
}
