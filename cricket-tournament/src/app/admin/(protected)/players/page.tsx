import Link from 'next/link';
import { getAdminPlayers } from '@/lib/actions/queries-admin';
import PlayerRowActions from '@/components/admin/PlayerRowActions';

export const dynamic = 'force-dynamic';

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const players = await getAdminPlayers(q);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black uppercase text-navy-900">Players</h1>
          <p className="text-sm text-slate-500">{players.length} players</p>
        </div>
        <Link
          href="/admin/players/new"
          className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-bold text-white active:scale-95"
        >
          + Add Player
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search by name, mobile, or village…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy-600 focus:outline-none sm:max-w-sm"
        />
        <button type="submit" className="rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-navy-900">
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-navy-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Name</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Mobile</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Village</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Team</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Payment</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Status</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold text-navy-900">{p.name}</td>
                <td className="px-3 py-2">{p.mobile}</td>
                <td className="px-3 py-2">{p.village ?? '—'}</td>
                <td className="px-3 py-2">{p.team?.team_name ?? '—'}</td>
                <td className="px-3 py-2">{p.team?.payment_status ?? '—'}</td>
                <td className="px-3 py-2">
                  <span className={p.is_active ? 'text-emerald-600' : 'text-slate-400'}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <PlayerRowActions playerId={p.id} isActive={p.is_active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {players.length === 0 && <p className="p-4 text-sm text-slate-500">No players found.</p>}
      </div>
    </div>
  );
}
