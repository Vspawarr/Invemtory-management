import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import { getTournament, getPublicPlayers } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  const [tournament, players] = await Promise.all([getTournament(), getPublicPlayers()]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-black uppercase text-navy-900">Players</h1>
        <p className="mt-1 text-sm text-slate-500">{players.length} registered players</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {players.map((p) => (
            <div key={p.id} className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-100">
              <div className="mx-auto grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-navy-100 text-lg font-bold text-navy-900">
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  p.name.slice(0, 1).toUpperCase()
                )}
              </div>
              <p className="mt-2 truncate text-sm font-bold text-navy-900">{p.name}</p>
              {p.village && <p className="truncate text-xs text-slate-500">{p.village}</p>}
              {p.team_name && (
                <p className="mt-1 truncate text-[11px] font-semibold text-navy-600">
                  {p.team_name}
                </p>
              )}
            </div>
          ))}
        </div>

        {players.length === 0 && (
          <p className="mt-6 rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm">
            No players registered yet.
          </p>
        )}
      </main>
      <PublicFooter contactNumber={tournament?.contact_number} />
    </div>
  );
}
