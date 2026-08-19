import { formatEventLabel, DISMISSAL_LABELS } from '@/lib/cricket';
import type { ScoringEvent } from '@/types/database';

// Cricbuzz/Cricinfo-style over-wise ball-by-ball feed: most recent over
// first, each ball shown as a chip plus a short text line, with the running
// score after each over.
export default function BallByBall({
  events,
  playerNames,
}: {
  events: ScoringEvent[];
  playerNames: Record<string, string>;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-400">No balls bowled yet.</p>;
  }

  const overs = new Map<number, ScoringEvent[]>();
  for (const e of events) {
    const list = overs.get(e.over_number) ?? [];
    list.push(e);
    overs.set(e.over_number, list);
  }

  const overSummaries = [...overs.entries()]
    .sort((a, b) => a[0] - b[0])
    .reduce<{ overNumber: number; balls: ScoringEvent[]; overRuns: number; scoreAfter: number }[]>(
      (acc, [overNumber, balls]) => {
        const overRuns = balls.reduce((sum, b) => sum + b.runs, 0);
        const scoreAfter = (acc[acc.length - 1]?.scoreAfter ?? 0) + overRuns;
        acc.push({ overNumber, balls, overRuns, scoreAfter });
        return acc;
      },
      []
    )
    .reverse(); // most recent over first

  return (
    <div className="max-h-96 space-y-4 overflow-y-auto rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
      {overSummaries.map(({ overNumber, balls, overRuns, scoreAfter }) => (
        <div key={overNumber}>
          <div className="mb-1 flex items-center justify-between text-xs font-bold text-navy-900">
            <span>Over {overNumber + 1}</span>
            <span className="text-slate-500">
              {overRuns >= 0 ? '+' : ''}
              {overRuns} runs · {scoreAfter}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {balls.map((e) => (
              <span
                key={e.id}
                title={e.is_free_hit ? 'Free Hit' : undefined}
                className={`grid h-7 min-w-7 place-items-center rounded-full px-1.5 text-[11px] font-black ${
                  e.is_wicket
                    ? 'bg-red-600 text-white'
                    : e.event_type === 'WIDE' || e.event_type === 'NO_BALL'
                    ? 'bg-gold-500 text-navy-900'
                    : e.runs >= 4
                    ? 'bg-navy-900 text-gold-400'
                    : 'bg-slate-200 text-navy-900'
                } ${e.is_free_hit ? 'ring-2 ring-offset-1 ring-gold-500' : ''}`}
              >
                {formatEventLabel(e)}
              </span>
            ))}
          </div>
          <ul className="mt-1 space-y-0.5 text-[11px] text-slate-500">
            {balls.map((e) => (
              <li key={e.id}>
                {e.over_number + 1}.{e.ball_number}{' '}
                {e.striker_id && playerNames[e.striker_id] ? `${playerNames[e.striker_id]}: ` : ''}
                {e.is_wicket
                  ? `WICKET (${e.dismissal_type ? DISMISSAL_LABELS[e.dismissal_type] : 'out'})${
                      e.runs === 0 ? ', no run penalty (Free Hit)' : `, ${e.runs} runs`
                    }`
                  : e.event_type === 'WIDE'
                  ? `Wide, +${e.runs}`
                  : e.event_type === 'NO_BALL'
                  ? `No ball, +${e.runs}`
                  : e.event_type === 'CORRECTION'
                  ? `Correction: ${e.runs >= 0 ? '+' : ''}${e.runs}${e.reason ? ` (${e.reason})` : ''}`
                  : `${e.runs} run${e.runs === 1 ? '' : 's'}`}
                {e.is_free_hit && !e.is_wicket ? ' · Free Hit' : ''}
                {e.field_zone ? ` · ${e.field_zone}` : ''}
                {e.commentary ? ` — "${e.commentary}"` : ''}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
