import { getPlayerLeaderboard, getTeamLeaderboard } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AdminLeaderboardPage() {
  const [players, teams] = await Promise.all([getPlayerLeaderboard(), getTeamLeaderboard()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-black uppercase text-navy-900">Leaderboard</h1>
        <p className="text-sm text-slate-500">Same data shown publicly, for quick admin reference.</p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-navy-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Player</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Team</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">M</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Runs</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Wkts</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">KO Played</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">KO Left</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.player_id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold text-navy-900">{p.name}</td>
                <td className="px-3 py-2">{p.team_name ?? '—'}</td>
                <td className="px-3 py-2 text-right">{p.matches_played}</td>
                <td className="px-3 py-2 text-right font-bold">{p.runs_scored}</td>
                <td className="px-3 py-2 text-right">{p.wickets_taken}</td>
                <td className="px-3 py-2 text-right">{p.knockout_matches_played}</td>
                <td className="px-3 py-2 text-right">
                  <span className={p.knockout_matches_remaining === 0 ? 'font-bold text-red-600' : ''}>
                    {p.knockout_matches_remaining}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-navy-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Team</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">M</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">W</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">L</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">NRD</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.team_id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold text-navy-900">{t.team_name}</td>
                <td className="px-3 py-2 text-right">{t.matches_played}</td>
                <td className="px-3 py-2 text-right font-bold">{t.wins}</td>
                <td className="px-3 py-2 text-right">{t.losses}</td>
                <td className="px-3 py-2 text-right">{t.net_run_differential}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
