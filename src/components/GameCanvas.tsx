import { useEffect, useRef } from 'react';
import { type LoadedAssets, loadAllGameAssets } from '../game/assets';
import { soundEngine } from '../game/audio';
import { EffectsPool } from '../game/particles';
import {
  type DifficultyLevel,
  type GamePhase,
  type SimEvent,
  type SimulationState,
  createInitialState,
  stepSimulation,
  updateCamera,
} from '../game/physics';
import { computeViewportMetrics, renderGameFrame } from '../game/renderer';

export interface HudSnapshot {
  phase: GamePhase;
  difficulty: DifficultyLevel;
  hearts: number;
  maxHearts: number;
  score: number;
  heightPercent: number;
  floor: number;
  elapsedTime: number;
  enemiesDefeated: number;
  assetsReady: boolean;
  loadProgress: number;
}

export interface GameControllerHandle {
  startGame: () => void;
  restartGame: () => void;
  togglePause: () => void;
  resumeGame: () => void;
  returnToTitle: () => void;
  triggerJump: () => void;
  triggerHeadbutt: () => void;
}

interface GameCanvasProps {
  initialAutostart: boolean;
  difficulty: DifficultyLevel;
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onRegisterController: (controller: GameControllerHandle) => void;
  onToggleMute: () => void;
}

export function GameCanvas({
  initialAutostart,
  difficulty,
  onHudUpdate,
  onRegisterController,
  onToggleMute,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const difficultyRef = useRef<DifficultyLevel>(difficulty);
  difficultyRef.current = difficulty;

  const callbacksRef = useRef({ onHudUpdate, onRegisterController, onToggleMute });
  callbacksRef.current = { onHudUpdate, onRegisterController, onToggleMute };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const state: SimulationState = createInitialState(
      initialAutostart ? 'playing' : 'title',
      difficultyRef.current
    );
    const effects = new EffectsPool();
    let assets: LoadedAssets | null = null;
    let loadProgress = 0;

    let cssW = Math.max(320, container.clientWidth || window.innerWidth);
    let cssH = Math.max(240, container.clientHeight || window.innerHeight);
    let metrics = computeViewportMetrics(cssW, cssH);

    const resizeCanvas = () => {
      cssW = Math.max(320, container.clientWidth || window.innerWidth);
      cssH = Math.max(240, container.clientHeight || window.innerHeight);
      const maxDpr = navigator.webdriver ? 1 : 1.5;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      metrics = computeViewportMetrics(cssW, cssH);
      updateCamera(state, metrics.viewWorldW, metrics.viewWorldH, 0.016, true);
    };
    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(container);

    // Input state: separated held vs edge-triggered one-shots
    const heldKeys = new Set<string>();
    let queuedJump = false;
    let queuedHeadbutt = false;
    let externalJumpHoldTimer = 0;

    const clearInputs = () => {
      heldKeys.clear();
      queuedJump = false;
      queuedHeadbutt = false;
      externalJumpHoldTimer = 0;
    };

    const syncBodyState = (phase: GamePhase) => {
      const bodyState =
        phase === 'victory' || phase === 'defeat' ? 'gameover' : phase;
      document.body.dataset.state = bodyState;
    };

    const lastSent = {
      phase: '' as string,
      difficulty: '' as string,
      hearts: -1,
      score: -1,
      heightPercent: -1,
      floor: -1,
      elapsedSec: -1,
      enemiesDefeated: -1,
      assetsReady: false,
      loadProgress: -1,
    };

    const emitHud = (force = false) => {
      const elapsedSec = Math.floor(state.elapsedTime);
      const ready = assets !== null;
      if (
        !force &&
        lastSent.phase === state.phase &&
        lastSent.difficulty === state.difficulty &&
        lastSent.hearts === state.hearts &&
        lastSent.score === state.score &&
        lastSent.heightPercent === state.heightPercent &&
        lastSent.floor === state.floor &&
        lastSent.elapsedSec === elapsedSec &&
        lastSent.enemiesDefeated === state.enemiesDefeated &&
        lastSent.assetsReady === ready &&
        lastSent.loadProgress === loadProgress
      ) {
        return;
      }

      lastSent.phase = state.phase;
      lastSent.difficulty = state.difficulty;
      lastSent.hearts = state.hearts;
      lastSent.score = state.score;
      lastSent.heightPercent = state.heightPercent;
      lastSent.floor = state.floor;
      lastSent.elapsedSec = elapsedSec;
      lastSent.enemiesDefeated = state.enemiesDefeated;
      lastSent.assetsReady = ready;
      lastSent.loadProgress = loadProgress;

      syncBodyState(state.phase);
      callbacksRef.current.onHudUpdate({
        phase: state.phase,
        difficulty: state.difficulty,
        hearts: state.hearts,
        maxHearts: state.maxHearts,
        score: state.score,
        heightPercent: state.heightPercent,
        floor: state.floor,
        elapsedTime: state.elapsedTime,
        enemiesDefeated: state.enemiesDefeated,
        assetsReady: ready,
        loadProgress,
      });
    };

    const resetRun = (nextPhase: GamePhase) => {
      const fresh = createInitialState(nextPhase, difficultyRef.current);
      Object.assign(state, fresh);
      effects.clear();
      clearInputs();
      updateCamera(state, metrics.viewWorldW, metrics.viewWorldH, 0.016, true);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      emitHud(true);
    };

    const controller: GameControllerHandle = {
      startGame: () => {
        soundEngine.unlock();
        resetRun('playing');
      },
      restartGame: () => {
        soundEngine.unlock();
        resetRun('playing');
      },
      togglePause: () => {
        if (state.phase === 'playing') {
          state.phase = 'paused';
          clearInputs();
          emitHud(true);
        } else if (state.phase === 'paused') {
          state.phase = 'playing';
          clearInputs();
          emitHud(true);
        }
      },
      resumeGame: () => {
        if (state.phase === 'paused') {
          state.phase = 'playing';
          clearInputs();
          emitHud(true);
        }
      },
      returnToTitle: () => {
        resetRun('title');
      },
      triggerJump: () => {
        if (state.phase === 'playing') {
          soundEngine.unlock();
          queuedJump = true;
          // Hold jump briefly for full responsive webcam-gesture arc
          externalJumpHoldTimer = 0.28;
        }
      },
      triggerHeadbutt: () => {
        if (state.phase === 'playing') {
          soundEngine.unlock();
          queuedHeadbutt = true;
        }
      },
    };

    callbacksRef.current.onRegisterController(controller);
    syncBodyState(state.phase);
    emitHud(true);

    // Load all 60 map and sprite assets
    let unmounted = false;
    loadAllGameAssets((loaded, total) => {
      if (unmounted) return;
      loadProgress = Math.round((loaded / Math.max(1, total)) * 100);
      emitHud();
    })
      .then((loadedAssets) => {
        if (unmounted) return;
        assets = loadedAssets;
        loadProgress = 100;
        emitHud(true);
      })
      .catch(() => {
        // Keep rendering fallback if any asset fails
      });

    const handleSimEvents = (events: SimEvent[]) => {
      for (const ev of events) {
        switch (ev.type) {
          case 'jump':
            soundEngine.playJump();
            effects.spawnJumpDust(ev.x, ev.y, ev.dir);
            break;
          case 'spring':
            soundEngine.playSpring();
            effects.spawnBurst({
              x: ev.x,
              y: ev.y,
              count: 22,
              color: '#00A9E8',
              speedMin: 220,
              speedMax: 680,
              sizeMin: 6,
              sizeMax: 14,
              lifeMin: 0.35,
              lifeMax: 0.72,
              gravity: 1100,
              angleMin: Math.PI * 1.15,
              angleMax: Math.PI * 1.85,
              shape: 'diamond',
            });
            effects.spawnPopup(ev.x, ev.y - 40, 'SPRING!', '#38BDF8');
            break;
          case 'land':
            soundEngine.playLand(ev.impact);
            effects.spawnLandDust(ev.x, ev.y, ev.impact);
            break;
          case 'headbutt':
            soundEngine.playHeadbutt();
            // Subtle hoof anticipation dust kick as the goat rears up to attack
            effects.spawnBurst({
              x: ev.x - ev.dir * 52,
              y: ev.y + 68,
              count: 5,
              color: '#C89260',
              speedMin: 60,
              speedMax: 150,
              sizeMin: 9,
              sizeMax: 14,
              endSizeMult: 1.9,
              lifeMin: 0.2,
              lifeMax: 0.34,
              gravity: -25,
              drag: 0.14,
              angleMin: ev.dir === 1 ? Math.PI * 0.9 : -0.35,
              angleMax: ev.dir === 1 ? Math.PI * 1.35 : 0.1,
              shape: 'dust',
            });
            break;
          case 'attackStrike':
            effects.spawnAttackImpact(ev.x, ev.y, ev.dir);
            break;
          case 'enemyKo':
            soundEngine.playEnemyKo();
            effects.spawnEnemyImpact(ev.x, ev.y, ev.dir);
            effects.spawnPopup(ev.x, ev.y - 50, `+${ev.points}`, '#FCD34D');
            break;
          case 'hurt':
            soundEngine.playHurt();
            effects.spawnBurst({
              x: ev.x,
              y: ev.y,
              count: 20,
              color: '#C83A2B',
              speedMin: 180,
              speedMax: 580,
              sizeMin: 6,
              sizeMax: 14,
              lifeMin: 0.3,
              lifeMax: 0.6,
              gravity: 900,
            });
            effects.spawnPopup(ev.x, ev.y - 60, '-1 HEART', '#F87171');
            break;
          case 'turn':
            soundEngine.playTurn();
            break;
          case 'victory':
            soundEngine.playVictory();
            effects.spawnBurst({
              x: ev.x,
              y: ev.y,
              count: 38,
              color: '#F4B444',
              speedMin: 160,
              speedMax: 680,
              sizeMin: 8,
              sizeMax: 16,
              lifeMin: 0.6,
              lifeMax: 1.4,
              gravity: 500,
              shape: 'leaf',
            });
            effects.spawnPopup(ev.x, ev.y - 50, 'LEAF BITTEN!', '#FDE68A');
            break;
          case 'defeat':
            soundEngine.playDefeat();
            break;
        }
      }
    };

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const code = e.code;
      if (code === 'Space' || code === 'ArrowUp' || code === 'ArrowDown') {
        e.preventDefault();
      }

      if (state.phase === 'title') {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          controller.startGame();
        }
        return;
      }

      if (code === 'Escape' || code === 'KeyP') {
        if (state.phase === 'playing' || state.phase === 'paused') {
          e.preventDefault();
          controller.togglePause();
        }
        return;
      }

      if (code === 'KeyM') {
        e.preventDefault();
        callbacksRef.current.onToggleMute();
        return;
      }

      if (code === 'KeyR') {
        if (state.phase === 'playing' || state.phase === 'paused') {
          e.preventDefault();
          controller.restartGame();
        }
        return;
      }

      if (state.phase !== 'playing') return;

      if (!e.repeat) {
        if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
          soundEngine.unlock();
          queuedJump = true;
        }
        if (code === 'KeyE') {
          soundEngine.unlock();
          queuedHeadbutt = true;
        }
      }
      heldKeys.add(code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
    };

    const onBlur = () => clearInputs();
    const onVisibilityChange = () => {
      if (document.hidden) clearInputs();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // 60fps simulation & render loop with compositor-friendly pacing on non-active screens
    let rafId = 0;
    let timerId = 0;
    let lastTime = performance.now();
    let lastDrawTime = 0;

    const scheduleNext = (drawMs: number) => {
      if (unmounted) return;
      if (state.phase !== 'playing') {
        // Gentle 20fps ambient animation on title/pause/gameover screens
        timerId = window.setTimeout(() => {
          rafId = requestAnimationFrame(frame);
        }, 48);
      } else if (navigator.webdriver || drawMs > 12) {
        // Give browser compositor breathing room on software-rendered devices
        timerId = window.setTimeout(() => {
          rafId = requestAnimationFrame(frame);
        }, 16);
      } else {
        rafId = requestAnimationFrame(frame);
      }
    };

    const frame = (now: number) => {
      const drawStart = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      if (externalJumpHoldTimer > 0) {
        externalJumpHoldTimer = Math.max(0, externalJumpHoldTimer - dt);
      }

      const jumpHeld =
        heldKeys.has('Space') ||
        heldKeys.has('ArrowUp') ||
        heldKeys.has('KeyW') ||
        externalJumpHoldTimer > 0;

      const simEvents = stepSimulation(
        state,
        {
          jumpPressed: queuedJump,
          jumpHeld,
          headbuttPressed: queuedHeadbutt,
        },
        dt
      );
      queuedJump = false;
      queuedHeadbutt = false;

      if (simEvents.length > 0) {
        handleSimEvents(simEvents);
      }

      if (state.phase !== 'paused') {
        effects.update(dt);
      }
      updateCamera(state, metrics.viewWorldW, metrics.viewWorldH, dt, false);

      if (assets) {
        renderGameFrame(
          ctx,
          cssW,
          cssH,
          assets,
          state,
          effects,
          metrics,
          now / 1000
        );
        lastDrawTime = now;
      } else if (now - lastDrawTime > 120) {
        ctx.fillStyle = '#1A120D';
        ctx.fillRect(0, 0, cssW, cssH);
        lastDrawTime = now;
      }

      emitHud();
      scheduleNext(performance.now() - drawStart);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      unmounted = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [initialAutostart]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full overflow-hidden bg-[#1A120D]"
      data-testid="game-viewport"
    >
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        className="block w-full h-full"
      />
    </div>
  );
}
