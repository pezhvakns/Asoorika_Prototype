import { type LeaderboardEntry } from '../services/leaderboard';

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  highlightId?: string | null;
  compact?: boolean;
}

export function LeaderboardPanel({
  entries,
  loading,
  error,
  highlightId,
  compact = false,
}: LeaderboardPanelProps) {
  const visibleEntries = compact ? entries.slice(0, 6) : entries.slice(0, 10);

  return (
    <div className="w-full" data-testid="leaderboard-panel">
      <div className="flex items-baseline justify-between mb-2.5 border-b border-[#5B3B24] pb-2">
        <h2 className="font-display text-sm sm:text-base font-bold tracking-wide text-[#F6E4CE]">
          Museum High Scores
        </h2>
        <span className="text-[11px] font-mono text-[#C89B70]">
          Live Updates
        </span>
      </div>

      {loading && entries.length === 0 ? (
        <p className="py-4 text-center text-xs text-[#C89B70]">
          Loading exhibition records...
        </p>
      ) : error && entries.length === 0 ? (
        <p className="py-4 text-center text-xs text-[#F87171]">{error}</p>
      ) : visibleEntries.length === 0 ? (
        <p className="py-4 text-center text-xs text-[#C89B70]">
          No scores recorded yet. Be the first to reach the leaf!
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-wider text-[#B6895F] border-b border-[#3D2719]">
                <th className="py-1.5 pr-2 font-medium">#</th>
                <th className="py-1.5 pr-2 font-medium">Visitor</th>
                <th className="py-1.5 pr-2 font-medium text-right">Climb</th>
                <th className="py-1.5 pr-2 font-medium text-right">Time</th>
                <th className="py-1.5 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#332014] text-xs sm:text-[13px]">
              {visibleEntries.map((entry, idx) => {
                const isHighlighted = highlightId === entry.id;
                return (
                  <tr
                    key={entry.id}
                    className={
                      isHighlighted
                        ? 'bg-[#D99058]/20 text-[#FFF5E8]'
                        : 'text-[#E8C5A0]'
                    }
                  >
                    <td className="py-2 pr-2 font-mono tabular-nums text-[#C89B70]">
                      {idx + 1}
                    </td>
                    <td className="py-2 pr-2 font-medium text-[#F6E4CE] max-w-[140px] truncate">
                      <span>{entry.name}</span>
                      <span className="ml-1.5 text-[10px] font-mono text-[#A67A52]">
                        {entry.victory ? 'Leaf' : `${entry.heightPercent}%`}
                      </span>
                    </td>
                    <td className="py-2 pr-2 font-mono tabular-nums text-right text-[#C89B70]">
                      {entry.heightPercent}%
                    </td>
                    <td className="py-2 pr-2 font-mono tabular-nums text-right text-[#C89B70]">
                      {entry.clearTime.toFixed(1)}s
                    </td>
                    <td className="py-2 font-mono tabular-nums text-right font-bold text-[#F6E4CE]">
                      {entry.score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
