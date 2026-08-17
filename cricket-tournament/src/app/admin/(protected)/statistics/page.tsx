import {
  getPlayerLeaderboard,
  getTeamLeaderboard,
  getPlayerStats,
  getPlayerMilestones,
  getBestBowling,
  getInningsRecords,
  getMatchMargins,
} from '@/lib/queries';
import RecordsSection from '@/components/RecordsSection';

export const dynamic = 'force-dynamic';

export default async function AdminStatisticsPage() {
  const [players, teams, playerStats, milestones, bestBowling, inningsRecords, matchMargins] = await Promise.all([
    getPlayerLeaderboard(),
    getTeamLeaderboard(),
    getPlayerStats(),
    getPlayerMilestones(),
    getBestBowling(),
    getInningsRecords(),
    getMatchMargins(),
  ]);
  const topScorer = [...players].sort((a, b) => b.highest_score - a.highest_score)[0];
  const topWicketTaker = [...players].sort((a, b) => b.wickets_taken - a.wickets_taken)[0];
  const mostSixes = [...playerStats].sort((a, b) => b.sixes - a.sixes)[0];
  const mostFours = [...playerStats].sort((a, b) => b.fours - a.fours)[0];
  const statsByPlayer = new Map(playerStats.map((p) => [p.player_id, p]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-black uppercase text-navy-900">Statistics</h1>
        <p className="text-sm text-slate-500">Detailed player and team performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Highlight label="Highest Individual Score" value={topScorer ? `${topScorer.highest_score} — ${topScorer.name}` : '—'} />
        <Highlight label="Most Wickets" value={topWicketTaker ? `${topWicketTaker.wickets_taken} — ${topWicketTaker.name}` : '—'} />
        <Highlight label="Most Sixes" value={mostSixes && mostSixes.sixes > 0 ? `${mostSixes.sixes} — ${mostSixes.name}` : '—'} />
        <Highlight label="Most Fours" value={mostFours && mostFours.fours > 0 ? `${mostFours.fours} — ${mostFours.name}` : '—'} />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[940px] text-sm">
          <thead className="bg-navy-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">#</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Player</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Team</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Matches</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Runs</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Average</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Highest Score</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">4s</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">6s</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Wickets</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Wins</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Losses</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p.player_id} className="border-t border-slate-100">
                <td className="px-3 py-2">{i + 1}</td>
                <td className="px-3 py-2 font-semibold text-navy-900">{p.name}</td>
                <td className="px-3 py-2">{p.team_name ?? '—'}</td>
                <td className="px-3 py-2 text-right">{p.matches_played}</td>
                <td className="px-3 py-2 text-right font-bold">{p.runs_scored}</td>
                <td className="px-3 py-2 text-right">{p.average_runs}</td>
                <td className="px-3 py-2 text-right">{p.highest_score}</td>
                <td className="px-3 py-2 text-right">{statsByPlayer.get(p.player_id)?.fours ?? 0}</td>
                <td className="px-3 py-2 text-right">{statsByPlayer.get(p.player_id)?.sixes ?? 0}</td>
                <td className="px-3 py-2 text-right">{p.wickets_taken}</td>
                <td className="px-3 py-2 text-right">{p.wins}</td>
                <td className="px-3 py-2 text-right">{p.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {players.length === 0 && <p className="p-4 text-sm text-slate-500">No player statistics yet.</p>}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-navy-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Team</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Matches</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Runs Scored</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Runs Conceded</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Net Run Differential</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.team_id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold text-navy-900">{t.team_name}</td>
                <td className="px-3 py-2 text-right">{t.matches_played}</td>
                <td className="px-3 py-2 text-right">{t.runs_scored}</td>
                <td className="px-3 py-2 text-right">{t.runs_conceded}</td>
                <td className="px-3 py-2 text-right font-bold">{t.net_run_differential}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {teams.length === 0 && <p className="p-4 text-sm text-slate-500">No team statistics yet.</p>}
      </div>

      <RecordsSection
        milestones={milestones}
        bestBowling={bestBowling}
        inningsRecords={inningsRecords}
        matchMargins={matchMargins}
      />
    </div>
  );
}

function Highlight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-navy-900">{value}</p>
    </div>
  );
}
