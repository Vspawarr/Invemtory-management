import type { ScoringEvent } from '@/types/database';

export interface ScorecardPlayer {
  id: string;
  name: string;
  runs: number;
  isStriker?: boolean;
  isNonStriker?: boolean;
}

// Cricbuzz/Cricinfo-style batting card: name, runs, balls faced, 4s, 6s,
// strike rate. Runs come from match_players.runs_scored (authoritative);
// balls/4s/6s are derived from that innings' ball-by-ball events, counting
// only legal deliveries the player was on strike for (wides are excluded,
// matching standard scorecard convention).
export default function ScoreCard({
  teamName,
  players,
  events,
}: {
  teamName: string;
  players: ScorecardPlayer[];
  events: ScoringEvent[];
}) {
  function statsFor(playerId: string) {
    const faced = events.filter(
      (e) => e.striker_id === playerId && (e.event_type === 'RUN' || e.event_type === 'WICKET')
    );
    const balls = faced.length;
    const fours = faced.filter((e) => e.event_type === 'RUN' && e.runs === 4).length;
    const sixes = faced.filter((e) => e.event_type === 'RUN' && e.runs === 6).length;
    return { balls, fours, sixes };
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
      <p className="border-b border-slate-100 bg-navy-900 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white">
        {teamName} — Scorecard
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase text-slate-400">
            <th className="px-3 py-1.5 text-left font-semibold">Batter</th>
            <th className="px-2 py-1.5 text-right font-semibold">R</th>
            <th className="px-2 py-1.5 text-right font-semibold">B</th>
            <th className="px-2 py-1.5 text-right font-semibold">4s</th>
            <th className="px-2 py-1.5 text-right font-semibold">6s</th>
            <th className="px-3 py-1.5 text-right font-semibold">SR</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => {
            const { balls, fours, sixes } = statsFor(p.id);
            const sr = balls > 0 ? ((p.runs / balls) * 100).toFixed(1) : '-';
            const active = p.isStriker || p.isNonStriker;
            return (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-3 py-1.5 font-semibold text-navy-900">
                  {p.name}
                  {p.isStriker && <span className="ml-1 text-red-600">*</span>}
                  {!active && <span className="ml-1 text-[10px] font-normal text-slate-400">not batting</span>}
                </td>
                <td className="px-2 py-1.5 text-right font-bold">{p.runs}</td>
                <td className="px-2 py-1.5 text-right text-slate-500">{balls}</td>
                <td className="px-2 py-1.5 text-right text-slate-500">{fours}</td>
                <td className="px-2 py-1.5 text-right text-slate-500">{sixes}</td>
                <td className="px-3 py-1.5 text-right text-slate-500">{sr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-400">
        * on strike. Wickets deduct 2 team runs (see Rules) and are not counted as batting runs.
      </p>
    </div>
  );
}
