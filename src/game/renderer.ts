import { type LoadedAssets, SPRITE_CROPS } from './assets';
import {
  CLAY_BG_COLOR,
  JUMP_PADS,
  MAP_HEIGHT,
  MAP_WIDTH,
  TREE_GOAL,
} from './levelData';
import { type EffectsPool } from './particles';
import { PHYSICS, type SimulationState, getHeadbuttHitbox } from './physics';

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

  // 6. Goat Protagonist (normalized across RunLeft, RunRight, one-shot Jump, and Headbutt Punch)
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
      // 4-frame Headbutt animation (flipped when facing left)
      const progress =
        1 - Math.max(0, g.headbuttTimer / PHYSICS.HEADBUTT_DURATION);
      const frameIdx = Math.min(
        assets.goatPunch.length - 1,
        Math.floor(progress * assets.goatPunch.length)
      );
      const img = assets.goatPunch[frameIdx];
      if (g.dir === -1) ctx.scale(-1, 1);
      ctx.drawImage(img, -128.5, -201, 257, 202);
    } else if (!g.grounded && g.jumpAnimActive) {
      // 8-frame one-shot Jump animation (plays once per jump, flipped when facing left)
      const progress = Math.min(
        0.999,
        g.jumpAnimTime / PHYSICS.JUMP_ANIM_DURATION
      );
      const frameIdx = Math.min(
        assets.goatJump.length - 1,
        Math.floor(progress * assets.goatJump.length)
      );
      const img = assets.goatJump[frameIdx];
      if (g.dir === -1) ctx.scale(-1, 1);
      ctx.drawImage(img, -128.5, -201, 257, 202);
    } else if (state.phase === 'title') {
      // Resting ibex silhouette on Title Screen
      ctx.drawImage(assets.goatIdle, -64, -154, 128, 154);
    } else if (g.dir === 1) {
      // 6-frame RunRight synced to distance traveled (cropped cleanly from 392x392)
      const frameIdx = Math.floor(g.runDistance / 42) % assets.goatRunRight.length;
      const img = assets.goatRunRight[frameIdx];
      const c = SPRITE_CROPS.goatRunRight;
      ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, -64, -154, 128, 154);
    } else {
      // 6-frame RunLeft synced to distance traveled
      const frameIdx = Math.floor(g.runDistance / 42) % assets.goatRunLeft.length;
      const img = assets.goatRunLeft[frameIdx];
      const c = SPRITE_CROPS.goatRunLeft;
      ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, -64, -154, 128, 154);
    }

    if (g.hitFlashTimer > 0) {
      ctx.fillStyle = 'rgba(255, 220, 210, 0.65)';
      ctx.beginPath();
      ctx.arc(0, -76, 68, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Headbutt kinetic horn arc slash during active frames
  const hb = getHeadbuttHitbox(g);
  if (hb) {
    ctx.save();
    ctx.strokeStyle = 'rgba(246, 228, 206, 0.85)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    const arcX = g.dir === 1 ? g.x + g.w + 18 : g.x - 18;
    const arcY = g.y + g.h * 0.42;
    ctx.beginPath();
    if (g.dir === 1) {
      ctx.arc(arcX - 24, arcY, 64, -Math.PI * 0.36, Math.PI * 0.32);
    } else {
      ctx.arc(arcX + 24, arcY, 64, Math.PI * 0.68, Math.PI * 1.36);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 7. Pooled particles
  for (let i = 0; i < effects.particles.length; i++) {
    const p = effects.particles[i];
    if (!p.active) continue;
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;

    if (p.shape === 'diamond') {
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.7, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.7, 0);
      ctx.closePath();
      ctx.fill();
    } else if (p.shape === 'leaf') {
      const s = p.size;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.4, s * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
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
