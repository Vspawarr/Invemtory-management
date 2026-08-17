import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import { getTournament, getPlayerLeaderboard, getTeamLeaderboard, getPointsTable } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const [tournament, players, teams, points] = await Promise.all([
    getTournament(),
    getPlayerLeaderboard(),
    getTeamLeaderboard(),
    getPointsTable(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-8">
        <div>
          <h1 className="text-2xl font-black uppercase text-navy-900">Leaderboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Runs and wickets update automatically as matches are scored.
          </p>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-extrabold uppercase text-navy-900">Player Rankings</h2>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-navy-900 text-white">
                <tr>
                  <Th>#</Th>
                  <Th>Player</Th>
                  <Th>Team</Th>
                  <Th align="right">M</Th>
                  <Th align="right">Runs</Th>
                  <Th align="right">Wkts</Th>
                  <Th align="right">KO Played</Th>
                  <Th align="right">W</Th>
                  <Th align="right">L</Th>
                  <Th align="right">KO Left</Th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.player_id} className="border-t border-slate-100">
                    <Td>{i + 1}</Td>
                    <Td className="font-semibold text-navy-900">{p.name}</Td>
                    <Td>{p.team_name ?? '—'}</Td>
                    <Td align="right">{p.matches_played}</Td>
                    <Td align="right" className="font-bold">{p.runs_scored}</Td>
                    <Td align="right">{p.wickets_taken}</Td>
                    <Td align="right">{p.knockout_matches_played}</Td>
                    <Td align="right">{p.wins}</Td>
                    <Td align="right">{p.losses}</Td>
                    <Td align="right">
                      <span
                        className={
                          p.knockout_matches_remaining === 0
                            ? 'font-bold text-red-600'
                            : 'text-slate-600'
                        }
                      >
                        {p.knockout_matches_remaining}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {players.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">No player statistics yet.</p>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-extrabold uppercase text-navy-900">Points Table</h2>
          <p className="mb-3 -mt-2 text-xs text-slate-500">League stage only. Ranked by points, then Net Run Rate.</p>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-navy-900 text-white">
                <tr>
                  <Th>#</Th>
                  <Th>Team</Th>
                  <Th align="right">M</Th>
                  <Th align="right">W</Th>
                  <Th align="right">L</Th>
                  <Th align="right">T</Th>
                  <Th align="right">Pts</Th>
                  <Th align="right">NRR</Th>
                </tr>
              </thead>
              <tbody>
                {points.map((p, i) => (
                  <tr key={p.team_id} className="border-t border-slate-100">
                    <Td>{i + 1}</Td>
                    <Td className="font-semibold text-navy-900">{p.team_name}</Td>
                    <Td align="right">{p.matches_played}</Td>
                    <Td align="right">{p.wins}</Td>
                    <Td align="right">{p.losses}</Td>
                    <Td align="right">{p.ties}</Td>
                    <Td align="right" className="font-bold">{p.points}</Td>
                    <Td align="right">{p.net_run_rate > 0 ? '+' : ''}{p.net_run_rate.toFixed(3)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {points.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">No league matches completed yet.</p>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-extrabold uppercase text-navy-900">Team Rankings</h2>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-navy-900 text-white">
                <tr>
                  <Th>#</Th>
                  <Th>Team</Th>
                  <Th align="right">M</Th>
                  <Th align="right">W</Th>
                  <Th align="right">L</Th>
                  <Th align="right">Runs For</Th>
                  <Th align="right">Runs Against</Th>
                  <Th align="right">NRD</Th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => (
                  <tr key={t.team_id} className="border-t border-slate-100">
                    <Td>{i + 1}</Td>
                    <Td className="font-semibold text-navy-900">{t.team_name}</Td>
                    <Td align="right">{t.matches_played}</Td>
                    <Td align="right" className="font-bold">{t.wins}</Td>
                    <Td align="right">{t.losses}</Td>
                    <Td align="right">{t.runs_scored}</Td>
                    <Td align="right">{t.runs_conceded}</Td>
                    <Td align="right">{t.net_run_differential}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {teams.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">No team statistics yet.</p>
          )}
        </section>
      </main>
      <PublicFooter contactNumber={tournament?.contact_number} />
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <th className={`px-3 py-2 text-xs font-bold uppercase tracking-wide ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  align,
  className = '',
}: {
  children: React.ReactNode;
  align?: 'right';
  className?: string;
}) {
  return (
    <td className={`px-3 py-2 ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>
      {children}
    </td>
  );
}
