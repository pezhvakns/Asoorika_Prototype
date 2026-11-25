import { type RefObject } from 'react';
import { type GestureSnapshot } from '../game/mediapipeController';
import { DIFFICULTY_CONFIGS } from '../game/physics';
import { type HudSnapshot } from './GameCanvas';

interface HudOverlayProps {
  hud: HudSnapshot;
  muted: boolean;
  controlMode: 'keyboard' | 'webcam';
  gesture: GestureSnapshot;
  videoRef: RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: RefObject<HTMLCanvasElement | null>;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onJumpTap: () => void;
  onHeadbuttTap: () => void;
}

function PotteryHeart({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className="w-7 h-7 transition-transform duration-150"
      aria-hidden="true"
    >
      {/* Outer dark clay silhouette */}
      <path
        d="M14 24.8C13.4 24.4 3.5 17.6 3.5 10.6C3.5 6.8 6.4 4 10 4C11.9 4 13.4 5 14 6.2C14.6 5 16.1 4 18 4C21.6 4 24.5 6.8 24.5 10.6C24.5 17.6 14.6 24.4 14 24.8Z"
        fill="#0B0D14"
        stroke="#0B0D14"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {filled ? (
        <>
          <path
            d="M14 22.8C13.5 22.4 5.2 16.5 5.2 10.7C5.2 7.8 7.4 5.7 10 5.7C11.7 5.7 13.1 6.7 14 8.2C14.9 6.7 16.3 5.7 18 5.7C20.6 5.7 22.8 7.8 22.8 10.7C22.8 16.5 14.5 22.4 14 22.8Z"
            fill="#C83A2B"
          />
          <path
            d="M8.5 8.4C7.6 9.1 7.2 10.3 7.5 11.6"
            stroke="#F6E4CE"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
        </>
      ) : (
        <path
          d="M14 22.4C13.5 22 5.6 16.3 5.6 10.7C5.6 8 7.6 6.1 10 6.1C11.7 6.1 13.1 7.1 14 8.5C14.9 7.1 16.3 6.1 18 6.1C20.4 6.1 22.4 8 22.4 10.7C22.4 16.3 14.5 22 14 22.4Z"
          fill="#2B1C12"
          stroke="#6A452C"
          strokeWidth="1.2"
        />
      )}
    </svg>
  );
}

export function HudOverlay({
  hud,
  muted,
  controlMode,
  gesture,
  videoRef,
  overlayCanvasRef,
  onToggleMute,
  onTogglePause,
  onRestart,
  onJumpTap,
  onHeadbuttTap,
}: HudOverlayProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 sm:p-5"
      aria-label="Game status HUD"
    >
      {/* Top perimeter clusters */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-left: Vitality Hearts + Climb Altitude */}
        <div className="flex flex-col gap-2 bg-[#1A120D]/90 border border-[#5B3B24] rounded-md px-3.5 py-2.5 shadow-lg">
          <div
            className="flex items-center gap-1.5"
            aria-label={`Hearts: ${hud.hearts} of ${hud.maxHearts}`}
            data-testid="hud-hearts"
          >
            {Array.from({ length: hud.maxHearts }).map((_, idx) => (
              <PotteryHeart key={idx} filled={idx < hud.hearts} />
            ))}
            <span className="ml-1.5 font-mono text-xs font-semibold text-[#E8C5A0] tabular-nums">
              {hud.hearts}/{hud.maxHearts}
            </span>
            <span
              className="ml-2 pl-2 border-l border-[#5B3B24] font-mono text-[11px] font-semibold uppercase tracking-wider text-[#D99058]"
              data-testid="hud-difficulty"
            >
              {DIFFICULTY_CONFIGS[hud.difficulty].label}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-[#D9B084]">
            <span className="font-mono font-semibold uppercase tracking-wider text-[#F6E4CE]">
              Floor {hud.floor}/4
            </span>
            <div className="w-24 h-2 bg-[#2B1C12] border border-[#5B3B24] rounded-xs overflow-hidden">
              <div
                className="h-full bg-[#D99058] transition-transform duration-150 origin-left"
                style={{ transform: `scaleX(${hud.heightPercent / 100})` }}
              />
            </div>
            <span className="font-mono tabular-nums font-semibold text-[#F6E4CE]">
              {hud.heightPercent}%
            </span>
          </div>
        </div>

        {/* Top-right: Tabular Score + Compact Utility Icon Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="bg-[#1A120D]/90 border border-[#5B3B24] rounded-md px-4 py-2 text-right shadow-lg">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C89B70]">
              Score
            </div>
            <div
              className="font-mono text-2xl leading-none font-bold text-[#F6E4CE] tabular-nums hud-text-shadow"
              data-testid="hud-score"
            >
              {Math.round(hud.score)}
            </div>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              aria-label={muted ? 'Unmute audio (M)' : 'Mute audio (M)'}
              title={muted ? 'Unmute (M)' : 'Mute (M)'}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-[#1A120D]/90 border border-[#5B3B24] text-[#F6E4CE] hover:bg-[#2E2016] active:scale-95 transition-colors cursor-pointer"
            >
              {muted ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                  <line x1="22" y1="9" x2="16" y2="15" />
                  <line x1="16" y1="9" x2="22" y2="15" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              aria-label="Restart run (R)"
              title="Restart (R)"
              className="w-10 h-10 flex items-center justify-center rounded-md bg-[#1A120D]/90 border border-[#5B3B24] text-[#F6E4CE] hover:bg-[#2E2016] active:scale-95 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onTogglePause();
              }}
              aria-label="Pause game (P or Escape)"
              title="Pause (P / Esc)"
              className="w-10 h-10 flex items-center justify-center rounded-md bg-[#1A120D]/90 border border-[#5B3B24] text-[#F6E4CE] hover:bg-[#2E2016] active:scale-95 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom perimeter strip: minimal control cue + mobile touch buttons + optional Webcam MediaPipe panel */}
      <div className="flex items-end justify-between gap-4">
        <div className="hidden sm:block text-xs font-medium text-[#F6E4CE] bg-[#1A120D]/85 border border-[#5B3B24] rounded-md px-3 py-1.5">
          {controlMode === 'webcam'
            ? 'Left Fist Jump · Right Fist Headbutt · Space / E Backup · Esc Pause'
            : 'Space Jump · E Headbutt · P Pause · R Restart'}
        </div>

        {/* Mobile/Touch action buttons */}
        <div className="flex sm:hidden items-center gap-2.5 pointer-events-auto">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onJumpTap();
            }}
            className="min-w-[84px] h-12 px-4 rounded-md bg-[#1A120D]/90 border border-[#D99058] text-sm font-bold text-[#F6E4CE] active:bg-[#D99058] active:text-[#0B0D14]"
          >
            Jump
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onHeadbuttTap();
            }}
            className="min-w-[96px] h-12 px-4 rounded-md bg-[#1A120D]/90 border border-[#C83A2B] text-sm font-bold text-[#F6E4CE] active:bg-[#C83A2B]"
          >
            Headbutt
          </button>
        </div>

        {/* Compact mirrored MediaPipe webcam preview when Webcam mode is active */}
        {controlMode === 'webcam' && (
          <div className="pointer-events-auto bg-[#1A120D]/95 border border-[#5B3B24] rounded-md p-2 shadow-xl w-44 sm:w-52">
            <div className="relative w-full aspect-[4/3] bg-[#0B0D14] rounded-xs overflow-hidden">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100 opacity-85"
              />
              <canvas
                ref={overlayCanvasRef}
                width={208}
                height={156}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
              {gesture.status !== 'ready' && (
                <div className="absolute inset-0 flex items-center justify-center p-2 text-center bg-[#0B0D14]/85 text-[11px] leading-snug text-[#E8C5A0]">
                  {gesture.status === 'loading'
                    ? 'Starting camera & MediaPipe...'
                    : gesture.errorMessage || 'Camera offline · Use Space & E'}
                </div>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono">
              <span
                className={
                  gesture.leftFist
                    ? 'text-[#38BDF8] font-bold'
                    : 'text-[#C89B70]'
                }
              >
                L-Fist: {gesture.leftFist ? 'JUMP' : 'Open'}
              </span>
              <span
                className={
                  gesture.rightFist
                    ? 'text-[#F59E0B] font-bold'
                    : 'text-[#C89B70]'
                }
              >
                R-Fist: {gesture.rightFist ? 'BUTT' : 'Open'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
