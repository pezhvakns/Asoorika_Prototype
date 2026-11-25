import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GameCanvas,
  type GameControllerHandle,
  type HudSnapshot,
} from './components/GameCanvas';
import { HudOverlay } from './components/HudOverlay';
import { StatusModal } from './components/StatusModal';
import { TitleScreen } from './components/TitleScreen';
import { soundEngine } from './game/audio';
import {
  type GestureSnapshot,
  MediaPipeHandController,
} from './game/mediapipeController';
import { type DifficultyLevel } from './game/physics';
import { useRealtimeLeaderboard } from './services/leaderboard';

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  difficulty: 'medium',
  hearts: 3,
  maxHearts: 3,
  score: 0,
  heightPercent: 0,
  floor: 1,
  elapsedTime: 0,
  enemiesDefeated: 0,
  assetsReady: false,
  loadProgress: 0,
};

const INITIAL_GESTURE: GestureSnapshot = {
  leftFist: false,
  rightFist: false,
  leftDetected: false,
  rightDetected: false,
  status: 'idle',
};

export default function App() {
  const initialAutostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const [hud, setHud] = useState<HudSnapshot>({
    ...INITIAL_HUD,
    phase: initialAutostart ? 'playing' : 'title',
  });
  const [controlMode, setControlMode] = useState<'keyboard' | 'webcam'>('keyboard');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [muted, setMuted] = useState(false);
  const [gesture, setGesture] = useState<GestureSnapshot>(INITIAL_GESTURE);

  const controllerRef = useRef<GameControllerHandle | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mpRef = useRef<MediaPipeHandController | null>(null);

  const {
    entries,
    loading: leaderboardLoading,
    error: leaderboardError,
    submitScore,
  } = useRealtimeLeaderboard();

  const handleRegisterController = useCallback((ctrl: GameControllerHandle) => {
    controllerRef.current = ctrl;
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundEngine.toggleMute();
    setMuted(nextMuted);
  }, []);

  // Manage MediaPipe webcam controller lifecycle strictly when in webcam mode during gameplay
  useEffect(() => {
    const shouldRunWebcam = controlMode === 'webcam' && hud.phase === 'playing';
    if (!shouldRunWebcam) {
      if (mpRef.current) {
        mpRef.current.stop();
        mpRef.current = null;
      }
      setGesture(INITIAL_GESTURE);
      return;
    }

    const mp = new MediaPipeHandController({
      onJump: () => controllerRef.current?.triggerJump(),
      onHeadbutt: () => controllerRef.current?.triggerHeadbutt(),
      onStatusChange: (snap) => setGesture(snap),
    });
    mpRef.current = mp;
    mp.attachElements(videoRef.current, overlayCanvasRef.current);
    mp.start();

    return () => {
      mp.stop();
      if (mpRef.current === mp) mpRef.current = null;
    };
  }, [controlMode, hud.phase]);

  // Keep DOM elements attached whenever videoRef mounts
  useEffect(() => {
    if (mpRef.current) {
      mpRef.current.attachElements(videoRef.current, overlayCanvasRef.current);
    }
  });

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#1A120D]">
      {/* Isolated 60fps Canvas sibling */}
      <GameCanvas
        initialAutostart={initialAutostart}
        difficulty={difficulty}
        onHudUpdate={setHud}
        onRegisterController={handleRegisterController}
        onToggleMute={handleToggleMute}
      />

      {/* Title Screen */}
      {hud.phase === 'title' && (
        <TitleScreen
          controlMode={controlMode}
          onSelectControlMode={setControlMode}
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          onStart={() => controllerRef.current?.startGame()}
          assetsReady={hud.assetsReady}
          loadProgress={hud.loadProgress}
          entries={entries}
          leaderboardLoading={leaderboardLoading}
          leaderboardError={leaderboardError}
        />
      )}

      {/* Active Gameplay HUD */}
      {hud.phase === 'playing' && (
        <HudOverlay
          hud={hud}
          muted={muted}
          controlMode={controlMode}
          gesture={gesture}
          videoRef={videoRef}
          overlayCanvasRef={overlayCanvasRef}
          onToggleMute={handleToggleMute}
          onTogglePause={() => controllerRef.current?.togglePause()}
          onRestart={() => controllerRef.current?.restartGame()}
          onJumpTap={() => controllerRef.current?.triggerJump()}
          onHeadbuttTap={() => controllerRef.current?.triggerHeadbutt()}
        />
      )}

      {/* Pause, Victory, and Game Over Modals */}
      {(hud.phase === 'paused' ||
        hud.phase === 'victory' ||
        hud.phase === 'defeat') && (
        <StatusModal
          hud={hud}
          controlMode={controlMode}
          entries={entries}
          leaderboardLoading={leaderboardLoading}
          leaderboardError={leaderboardError}
          onResume={() => controllerRef.current?.resumeGame()}
          onRestart={() => controllerRef.current?.restartGame()}
          onReturnToTitle={() => controllerRef.current?.returnToTitle()}
          onSubmitScore={submitScore}
        />
      )}
    </main>
  );
}
