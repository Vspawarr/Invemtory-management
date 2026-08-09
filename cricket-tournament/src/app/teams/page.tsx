import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import { getTournament, getPublicTeams } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  const [tournament, teams] = await Promise.all([getTournament(), getPublicTeams()]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-black uppercase text-navy-900">Teams / Pairs</h1>
        <p className="mt-1 text-sm text-slate-500">{teams.length} registered teams</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {teams.map((t) => (
            <div key={t.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-navy-900">{t.team_name}</p>
                {t.seed && (
                  <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-[11px] font-bold text-navy-900">
                    Seed {t.seed}
                  </span>
                )}
              </div>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {(t.players ?? []).map((p) => (
                  <li key={p.id}>
                    {p.name}
                    {p.village ? ` (${p.village})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {teams.length === 0 && (
          <p className="mt-6 rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm">
            No teams registered yet.
          </p>
        )}
      </main>
      <PublicFooter contactNumber={tournament?.contact_number} />
    </div>
  );
}
