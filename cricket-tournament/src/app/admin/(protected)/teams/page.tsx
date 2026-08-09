import Link from 'next/link';
import { getAdminTeams } from '@/lib/actions/queries-admin';

export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-slate-500',
  READY: 'text-emerald-600',
  WITHDRAWN: 'text-red-600',
};

export default async function AdminTeamsPage() {
  const teams = await getAdminTeams();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black uppercase text-navy-900">Teams / Pairs</h1>
          <p className="text-sm text-slate-500">{teams.length} teams</p>
        </div>
        <Link
          href="/admin/teams/new"
          className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-bold text-white active:scale-95"
        >
          + Add Team
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-navy-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Team</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Player 1</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Player 2</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Status</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Payment</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Seed</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold text-navy-900">{t.team_name}</td>
                <td className="px-3 py-2">{t.players[0]?.name ?? '—'}</td>
                <td className="px-3 py-2">{t.players[1]?.name ?? '—'}</td>
                <td className={`px-3 py-2 font-semibold ${STATUS_COLORS[t.registration_status]}`}>
                  {t.registration_status}
                </td>
                <td className="px-3 py-2">{t.payment_status}</td>
                <td className="px-3 py-2">{t.seed ?? '—'}</td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/teams/${t.id}/edit`} className="text-xs font-bold text-navy-600 hover:underline">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {teams.length === 0 && <p className="p-4 text-sm text-slate-500">No teams yet.</p>}
      </div>
    </div>
  );
}
