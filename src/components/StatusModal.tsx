import { type FormEvent, useEffect, useState } from 'react';
import { DIFFICULTY_CONFIGS } from '../game/physics';
import {
  type LeaderboardEntry,
  type SubmitScorePayload,
} from '../services/leaderboard';
import { type HudSnapshot } from './GameCanvas';
import { LeaderboardPanel } from './LeaderboardPanel';

interface StatusModalProps {
  hud: HudSnapshot;
  controlMode: 'keyboard' | 'webcam';
  entries: LeaderboardEntry[];
  leaderboardLoading: boolean;
  leaderboardError: string | null;
  onResume: () => void;
  onRestart: () => void;
  onReturnToTitle: () => void;
  onSubmitScore: (payload: SubmitScorePayload) => Promise<LeaderboardEntry>;
}

export function StatusModal({
  hud,
  controlMode,
  entries,
  leaderboardLoading,
  leaderboardError,
  onResume,
  onRestart,
  onReturnToTitle,
  onSubmitScore,
}: StatusModalProps) {
  const [visitorName, setVisitorName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  // Reset form state whenever a new end-of-run modal opens
  useEffect(() => {
    setSubmitError(null);
    setSavedEntryId(null);
  }, [hud.phase, hud.score]);

  if (hud.phase === 'paused') {
    return (
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#120C08]/80"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-modal-title"
      >
        <div className="w-full max-w-md bg-[#1A120D] border border-[#6E492D] rounded-lg p-6 sm:p-7 shadow-2xl text-center">
          <h2
            id="pause-modal-title"
            className="font-display text-2xl font-bold tracking-wide text-[#F6E4CE] mb-2"
          >
            Paused
          </h2>
          <p className="text-xs text-[#C89B70] mb-6">
            {DIFFICULTY_CONFIGS[hud.difficulty].label} ({DIFFICULTY_CONFIGS[hud.difficulty].speedMultiplierLabel}) · Floor {hud.floor}/4 · {hud.heightPercent}% climbed · Score{' '}
            <span className="font-mono tabular-nums text-[#F6E4CE]">
              {Math.round(hud.score)}
            </span>
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="w-full py-3 px-5 rounded-md bg-[#D99058] text-[#0B0D14] font-display font-bold tracking-wider uppercase hover:bg-[#E7A16B] transition-colors cursor-pointer"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="w-full py-2.5 px-5 rounded-md bg-[#2A1C13] border border-[#6E492D] text-[#F6E4CE] text-sm font-semibold hover:bg-[#382519] transition-colors cursor-pointer"
            >
              Restart
            </button>
            <button
              type="button"
              onClick={onReturnToTitle}
              className="w-full py-2.5 px-5 rounded-md text-[#C89B70] text-sm font-medium hover:text-[#F6E4CE] transition-colors cursor-pointer"
            >
              Main Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hud.phase !== 'victory' && hud.phase !== 'defeat') {
    return null;
  }

  const isVictory = hud.phase === 'victory';

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = visitorName.trim();
    if (!trimmed) {
      setSubmitError('Please enter your name to save to the museum leaderboard.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const entry = await onSubmitScore({
        name: trimmed,
        score: Math.round(hud.score),
        clearTime: hud.elapsedTime,
        heartsRemaining: hud.hearts,
        heightPercent: hud.heightPercent,
        victory: isVictory,
        controlMode,
      });
      setSavedEntryId(entry.id);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to save score right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#120C08]/84 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="outcome-modal-title"
    >
      <div className="w-full max-w-2xl bg-[#1A120D] border border-[#6E492D] rounded-lg p-6 sm:p-7 shadow-2xl my-auto">
        {/* Outcome Heading */}
        <div className="text-center mb-5">
          <h2
            id="outcome-modal-title"
            className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-[#F6E4CE]"
          >
            {isVictory ? 'Sacred Leaf Reached!' : 'Journey Ended'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#D9B084]">
            {isVictory
              ? 'The ibex ascended the pottery vessel and claimed the leaf at the summit.'
              : 'All three hearts were lost on the climb. Rise again to reach the tree.'}
          </p>
        </div>

        {/* 3 Frozen Run Stat Tiles */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-[#241710] border border-[#4D321F] rounded-md p-3 text-center">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#C89B70]">
              Score
            </div>
            <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-[#F6E4CE] tabular-nums">
              {Math.round(hud.score)}
            </div>
          </div>

          <div className="bg-[#241710] border border-[#4D321F] rounded-md p-3 text-center">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#C89B70]">
              {isVictory ? 'Clear Time' : 'Height Reached'}
            </div>
            <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-[#F6E4CE] tabular-nums">
              {isVictory
                ? `${hud.elapsedTime.toFixed(1)}s`
                : `${hud.heightPercent}%`}
            </div>
          </div>

          <div className="bg-[#241710] border border-[#4D321F] rounded-md p-3 text-center">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#C89B70]">
              {isVictory ? 'Hearts Left' : 'Evil Defeated'}
            </div>
            <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-[#F6E4CE] tabular-nums">
              {isVictory
                ? `${hud.hearts}/${hud.maxHearts}`
                : hud.enemiesDefeated}
            </div>
          </div>
        </div>

        {/* Real-time Leaderboard Submission Form */}
        {!savedEntryId ? (
          <form
            onSubmit={handleSave}
            className="mb-5 flex flex-col sm:flex-row gap-2 items-stretch sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="visitor-name-input"
                className="block text-xs font-medium text-[#D9B084] mb-1"
              >
                Record your score on the museum leaderboard
              </label>
              <input
                id="visitor-name-input"
                type="text"
                maxLength={24}
                placeholder="Enter visitor name"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md bg-[#110C09] border border-[#5B3B24] text-[#F6E4CE] placeholder-[#8A6547] focus:outline-none focus:border-[#D99058]"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold rounded-md bg-[#3B2618] border border-[#D99058] text-[#F6E4CE] hover:bg-[#4E3220] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Score'}
            </button>
          </form>
        ) : (
          <p className="mb-5 text-xs font-medium text-[#F4B444] text-center">
            Score recorded on the live museum leaderboard.
          </p>
        )}

        {submitError && (
          <p className="mb-4 text-xs text-[#F87171]" role="alert">
            {submitError}
          </p>
        )}

        {/* Live Leaderboard */}
        <div className="mb-6 bg-[#140E0A] border border-[#4D321F] rounded-md p-4">
          <LeaderboardPanel
            entries={entries}
            loading={leaderboardLoading}
            error={leaderboardError}
            highlightId={savedEntryId}
            compact
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="w-full sm:w-auto px-8 py-3 rounded-md bg-[#D99058] text-[#0B0D14] font-display font-bold tracking-wider uppercase hover:bg-[#E7A16B] transition-colors cursor-pointer whitespace-nowrap"
          >
            {isVictory ? 'Play Again' : 'Try Again'}
          </button>
          <button
            type="button"
            onClick={onReturnToTitle}
            className="w-full sm:w-auto px-6 py-3 rounded-md bg-[#2A1C13] border border-[#6E492D] text-[#F6E4CE] text-sm font-semibold hover:bg-[#382519] transition-colors cursor-pointer whitespace-nowrap"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
