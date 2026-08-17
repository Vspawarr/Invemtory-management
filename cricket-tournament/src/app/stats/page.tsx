import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import { getTournament, getPlayerStats } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const [tournament, players] = await Promise.all([getTournament(), getPlayerStats()]);

  const byRuns = [...players].filter((p) => p.matches_played > 0).sort((a, b) => b.runs_scored - a.runs_scored);
  const byWickets = [...players].filter((p) => p.matches_played > 0).sort((a, b) => b.wickets_taken - a.wickets_taken);
  const bySixes = [...players].sort((a, b) => b.sixes - a.sixes)[0];
  const byFours = [...players].sort((a, b) => b.fours - a.fours)[0];

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-8">
        <div>
          <h1 className="text-2xl font-black uppercase text-navy-900">Statistics</h1>
          <p className="mt-1 text-sm text-slate-500">Batting and bowling numbers, updated live as matches are scored.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Highlight label="Most Runs" value={byRuns[0] ? `${byRuns[0].runs_scored} — ${byRuns[0].name}` : '—'} />
          <Highlight label="Most Wickets" value={byWickets[0] ? `${byWickets[0].wickets_taken} — ${byWickets[0].name}` : '—'} />
          <Highlight label="Most Sixes" value={bySixes && bySixes.sixes > 0 ? `${bySixes.sixes} — ${bySixes.name}` : '—'} />
          <Highlight label="Most Fours" value={byFours && byFours.fours > 0 ? `${byFours.fours} — ${byFours.name}` : '—'} />
        </div>

        <section>
          <h2 className="mb-3 text-lg font-extrabold uppercase text-navy-900">Batting</h2>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-navy-900 text-white">
                <tr>
                  <Th>#</Th>
                  <Th>Player</Th>
                  <Th>Team</Th>
                  <Th align="right">M</Th>
                  <Th align="right">Runs</Th>
                  <Th align="right">Avg</Th>
                  <Th align="right">SR</Th>
                  <Th align="right">HS</Th>
                  <Th align="right">4s</Th>
                  <Th align="right">6s</Th>
                </tr>
              </thead>
              <tbody>
                {byRuns.map((p, i) => (
                  <tr key={p.player_id} className="border-t border-slate-100">
                    <Td>{i + 1}</Td>
                    <Td className="font-semibold text-navy-900">{p.name}</Td>
                    <Td>{p.team_name ?? '—'}</Td>
                    <Td align="right">{p.matches_played}</Td>
                    <Td align="right" className="font-bold">{p.runs_scored}</Td>
                    <Td align="right">{p.average_runs}</Td>
                    <Td align="right">{p.strike_rate}</Td>
                    <Td align="right">{p.highest_score}</Td>
                    <Td align="right">{p.fours}</Td>
                    <Td align="right">{p.sixes}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {byRuns.length === 0 && <p className="mt-3 text-sm text-slate-500">No batting stats yet.</p>}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-extrabold uppercase text-navy-900">Bowling</h2>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-navy-900 text-white">
                <tr>
                  <Th>#</Th>
                  <Th>Player</Th>
                  <Th>Team</Th>
                  <Th align="right">M</Th>
                  <Th align="right">Wkts</Th>
                </tr>
              </thead>
              <tbody>
                {byWickets
                  .filter((p) => p.wickets_taken > 0)
                  .map((p, i) => (
                    <tr key={p.player_id} className="border-t border-slate-100">
                      <Td>{i + 1}</Td>
                      <Td className="font-semibold text-navy-900">{p.name}</Td>
                      <Td>{p.team_name ?? '—'}</Td>
                      <Td align="right">{p.matches_played}</Td>
                      <Td align="right" className="font-bold">{p.wickets_taken}</Td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {byWickets.filter((p) => p.wickets_taken > 0).length === 0 && (
            <p className="mt-3 text-sm text-slate-500">No wickets credited to a bowler yet.</p>
          )}
        </section>
      </main>
      <PublicFooter contactNumber={tournament?.contact_number} />
    </div>
  );
}

function Highlight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-navy-900">{value}</p>
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
    <td className={`px-3 py-2 ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>{children}</td>
  );
}
