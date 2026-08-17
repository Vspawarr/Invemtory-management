import type { PlayerMilestoneRow, BestBowlingRow, InningsRecordRow, MatchMarginRow } from '@/types/database';

// Tournament records: milestones (50s/100s), best bowling figures, highest
// team totals, and biggest win margins. Shared between the admin Statistics
// page and the public Stats page.
export default function RecordsSection({
  milestones,
  bestBowling,
  inningsRecords,
  matchMargins,
}: {
  milestones: PlayerMilestoneRow[];
  bestBowling: BestBowlingRow[];
  inningsRecords: InningsRecordRow[];
  matchMargins: MatchMarginRow[];
}) {
  const highestTotal = inningsRecords[0] ?? null;
  const biggestRunsWin = [...matchMargins]
    .filter((m) => m.margin_runs !== null)
    .sort((a, b) => (b.margin_runs ?? 0) - (a.margin_runs ?? 0))[0];
  const biggestBallsWin = [...matchMargins]
    .filter((m) => m.margin_balls !== null)
    .sort((a, b) => (b.margin_balls ?? 0) - (a.margin_balls ?? 0))[0];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-extrabold uppercase text-navy-900">Records</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <RecordCard
          label="Highest Team Total"
          value={highestTotal ? `${highestTotal.total_runs}/${highestTotal.wickets}` : '—'}
          detail={
            highestTotal
              ? `${highestTotal.batting_team_name} vs ${highestTotal.bowling_team_name}`
              : 'No completed innings yet'
          }
        />
        <RecordCard
          label="Biggest Win (Runs)"
          value={biggestRunsWin ? `${biggestRunsWin.margin_runs} runs` : '—'}
          detail={
            biggestRunsWin
              ? `${biggestRunsWin.winner_team_name} beat ${biggestRunsWin.loser_team_name}`
              : 'No result yet'
          }
        />
        <RecordCard
          label="Biggest Win (Chasing)"
          value={biggestBallsWin ? `${biggestBallsWin.margin_balls} balls remaining` : '—'}
          detail={
            biggestBallsWin
              ? `${biggestBallsWin.winner_team_name} beat ${biggestBallsWin.loser_team_name}`
              : 'No result yet'
          }
        />
      </div>

      {inningsRecords.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase text-slate-500">Highest Innings Totals</h3>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-navy-900 text-white">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase">#</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase">Team</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase">Opponent</th>
                  <th className="px-3 py-2 text-right text-xs font-bold uppercase">Score</th>
                  <th className="px-3 py-2 text-right text-xs font-bold uppercase">Match #</th>
                </tr>
              </thead>
              <tbody>
                {inningsRecords.map((r, i) => (
                  <tr key={`${r.match_id}-${r.batting_team_name}`} className="border-t border-slate-100">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2 font-semibold text-navy-900">{r.batting_team_name}</td>
                    <td className="px-3 py-2">{r.bowling_team_name}</td>
                    <td className="px-3 py-2 text-right font-bold">
                      {r.total_runs}/{r.wickets}
                    </td>
                    <td className="px-3 py-2 text-right">{r.match_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase text-slate-500">Milestones (50s &amp; 100s)</h3>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full min-w-[360px] text-sm">
              <thead className="bg-navy-900 text-white">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase">Player</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase">Team</th>
                  <th className="px-3 py-2 text-right text-xs font-bold uppercase">50s</th>
                  <th className="px-3 py-2 text-right text-xs font-bold uppercase">100s</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => (
                  <tr key={m.player_id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold text-navy-900">{m.name}</td>
                    <td className="px-3 py-2">{m.team_name ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{m.fifties}</td>
                    <td className="px-3 py-2 text-right font-bold">{m.hundreds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {milestones.length === 0 && <p className="p-4 text-sm text-slate-500">No 50+ scores yet.</p>}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold uppercase text-slate-500">Best Bowling (Wickets in a Match)</h3>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full min-w-[360px] text-sm">
              <thead className="bg-navy-900 text-white">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase">Player</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase">Team</th>
                  <th className="px-3 py-2 text-right text-xs font-bold uppercase">Wkts</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase">Vs</th>
                </tr>
              </thead>
              <tbody>
                {bestBowling.map((b) => (
                  <tr key={b.player_id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold text-navy-900">{b.name}</td>
                    <td className="px-3 py-2">{b.team_name ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-bold">{b.best_wickets}</td>
                    <td className="px-3 py-2">{b.opponent_team_name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bestBowling.length === 0 && <p className="p-4 text-sm text-slate-500">No wickets credited yet.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function RecordCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-navy-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
