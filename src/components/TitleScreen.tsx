import { useState } from 'react';
import {
  DIFFICULTY_CONFIGS,
  DIFFICULTY_ORDER,
  type DifficultyLevel,
} from '../game/physics';
import { type LeaderboardEntry } from '../services/leaderboard';
import { LeaderboardPanel } from './LeaderboardPanel';

interface TitleScreenProps {
  controlMode: 'keyboard' | 'webcam';
  onSelectControlMode: (mode: 'keyboard' | 'webcam') => void;
  difficulty: DifficultyLevel;
  onSelectDifficulty: (level: DifficultyLevel) => void;
  onStart: () => void;
  assetsReady: boolean;
  loadProgress: number;
  entries: LeaderboardEntry[];
  leaderboardLoading: boolean;
  leaderboardError: string | null;
}

export function TitleScreen({
  controlMode,
  onSelectControlMode,
  difficulty,
  onSelectDifficulty,
  onStart,
  assetsReady,
  loadProgress,
  entries,
  leaderboardLoading,
  leaderboardError,
}: TitleScreenProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const activeDiff = DIFFICULTY_CONFIGS[difficulty];

  const handleCopyShareLink = async () => {
    const shareUrl = window.location.href.split('?')[0];
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2200);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2200);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-5 sm:p-8 bg-gradient-to-b from-[#1A120D]/42 via-[#1A120D]/12 to-[#1A120D]/48">
      {/* Top bar: subtle museum exhibition label on left, Share Link + Leaderboard toggle on right */}
      <div className="flex items-center justify-between gap-4">
        <span className="px-3 py-1.5 rounded-md bg-[#1A120D]/90 border border-[#5B3B24] text-xs font-mono tracking-wider text-[#F6E4CE]">
          Interactive Museum Prototype
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="px-3.5 py-2 text-xs font-semibold rounded-md bg-[#1A120D]/92 border border-[#6E492D] text-[#F6E4CE] hover:bg-[#362317] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-md"
          >
            {linkCopied ? 'Link Copied!' : 'Share Link'}
          </button>
          <button
            type="button"
            onClick={() => setShowLeaderboard((v) => !v)}
            aria-expanded={showLeaderboard}
            className="px-3.5 py-2 text-xs font-semibold rounded-md bg-[#1A120D]/92 border border-[#6E492D] text-[#F6E4CE] hover:bg-[#362317] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-md"
          >
            {showLeaderboard
              ? 'Hide High Scores'
              : `High Scores (${entries.length})`}
          </button>
        </div>
      </div>

      {/* Main center focal stage */}
      <div className="flex-1 flex items-center justify-center py-4 overflow-y-auto">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Primary Title & Museum Instruction Plaque */}
          <div
            className={`${
              showLeaderboard ? 'lg:col-span-7' : 'lg:col-span-8 lg:col-start-3'
            } bg-[#1A120D]/95 border border-[#6E492D] rounded-lg p-6 sm:p-8 shadow-2xl text-center`}
          >
            {/* Bespoke inline SVG Title Lockup inspired by ancient Elamite pottery */}
            <div className="flex justify-center mb-4">
              <svg
                viewBox="0 0 420 112"
                className="w-full max-w-[360px] h-auto"
                role="img"
                aria-label="Asoorika"
              >
                {/* Geometric pottery frieze top accent */}
                <g fill="#D99058" opacity="0.9">
                  <polygon points="72,14 82,4 92,14 82,24" />
                  <polygon points="104,14 114,4 124,14 114,24" />
                  <rect x="136" y="12" width="148" height="3" />
                  <polygon points="296,14 306,4 316,14 306,24" />
                  <polygon points="328,14 338,4 348,14 338,24" />
                </g>

                {/* Title typography */}
                <text
                  x="210"
                  y="74"
                  textAnchor="middle"
                  fill="#F6E4CE"
                  stroke="#0B0D14"
                  strokeWidth="6"
                  paintOrder="stroke fill"
                  style={{
                    fontFamily: '"Cinzel", Georgia, serif',
                    fontSize: '52px',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                  }}
                >
                  ASOORIKA
                </text>

                {/* Bottom terracotta pottery border */}
                <line
                  x1="56"
                  y1="94"
                  x2="364"
                  y2="94"
                  stroke="#D99058"
                  strokeWidth="2.5"
                />
                <polygon points="210,87 219,94 210,101 201,94" fill="#F4B444" />
              </svg>
            </div>

            {/* Required Museum Experience Instruction Text */}
            <p className="text-sm sm:text-base leading-relaxed text-[#F6E4CE] max-w-xl mx-auto mb-5">
              This is a prototype interactive experience for museum. Instructions:
              jump above obstacles and headbutt the evil to reach the leaf!
            </p>

            {/* Goat Speed Level Selector: Easy / Medium / Hard */}
            <div className="mb-5">
              <div className="text-xs font-medium text-[#C89B70] mb-2">
                Goat Speed Level
              </div>
              <div
                className="inline-flex items-center gap-1 p-1 bg-[#110C09] border border-[#5B3B24] rounded-md"
                role="group"
                aria-label="Goat speed level"
              >
                {DIFFICULTY_ORDER.map((levelId) => {
                  const cfg = DIFFICULTY_CONFIGS[levelId];
                  const selected = difficulty === levelId;
                  return (
                    <button
                      key={levelId}
                      type="button"
                      onClick={() => onSelectDifficulty(levelId)}
                      aria-pressed={selected}
                      className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        selected
                          ? 'bg-[#D99058] text-[#0B0D14]'
                          : 'text-[#E8C5A0] hover:text-[#FFF5E8]'
                      }`}
                    >
                      <span>{cfg.label}</span>
                      <span
                        className={`font-mono text-[11px] ${
                          selected ? 'text-[#2B170B]' : 'text-[#A67E58]'
                        }`}
                      >
                        {cfg.speedMultiplierLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-[#D9B084]">
                {activeDiff.description} ({activeDiff.speedMultiplierLabel} speed)
              </p>
            </div>

            {/* Control Mode Selector: Keyboard vs Webcam (MediaPipe) */}
            <div className="mb-6">
              <div className="text-xs font-medium text-[#C89B70] mb-2">
                Choose Control Method
              </div>
              <div
                className="inline-flex items-center gap-1 p-1 bg-[#110C09] border border-[#5B3B24] rounded-md"
                role="group"
                aria-label="Control method"
              >
                <button
                  type="button"
                  onClick={() => onSelectControlMode('keyboard')}
                  aria-pressed={controlMode === 'keyboard'}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    controlMode === 'keyboard'
                      ? 'bg-[#D99058] text-[#0B0D14]'
                      : 'text-[#E8C5A0] hover:text-[#FFF5E8]'
                  }`}
                >
                  Keyboard Controls
                </button>
                <button
                  type="button"
                  onClick={() => onSelectControlMode('webcam')}
                  aria-pressed={controlMode === 'webcam'}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    controlMode === 'webcam'
                      ? 'bg-[#D99058] text-[#0B0D14]'
                      : 'text-[#E8C5A0] hover:text-[#FFF5E8]'
                  }`}
                >
                  Webcam (MediaPipe)
                </button>
              </div>
              <p className="mt-2 text-xs text-[#D9B084]">
                {controlMode === 'keyboard'
                  ? 'Press Space to jump over red spikes and E to headbutt evil creatures.'
                  : 'Clench your Left Hand Fist to jump and Right Hand Fist to headbutt (Space & E also work).'}
              </p>
            </div>

            {/* Primary Start CTA */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                data-start="true"
                disabled={!assetsReady}
                onClick={onStart}
                className="px-10 py-3.5 text-base font-display font-bold tracking-wider uppercase rounded-md bg-[#D99058] text-[#0B0D14] hover:bg-[#E7A16B] active:scale-[0.98] disabled:opacity-60 transition-all shadow-lg cursor-pointer whitespace-nowrap"
              >
                {assetsReady ? 'Play' : `Preparing Artifacts (${loadProgress}%)`}
              </button>
            </div>
          </div>

          {/* Optional live leaderboard side card when toggled */}
          {showLeaderboard && (
            <div className="lg:col-span-5 bg-[#1A120D]/95 border border-[#6E492D] rounded-lg p-5 shadow-2xl">
              <LeaderboardPanel
                entries={entries}
                loading={leaderboardLoading}
                error={leaderboardError}
                compact
              />
            </div>
          )}
        </div>
      </div>

      {/* Single flat control-hint line in bottom safe margin */}
      <div className="flex justify-center">
        <div className="px-4 py-1.5 rounded-md bg-[#1A120D]/90 border border-[#5B3B24] text-xs text-[#F6E4CE] tracking-wide">
          {controlMode === 'keyboard'
            ? 'Space Jump · E Headbutt · P Pause · Enter Start'
            : 'Left Hand Fist Jump · Right Hand Fist Headbutt · Esc Pause'}
        </div>
      </div>
    </div>
  );
}
