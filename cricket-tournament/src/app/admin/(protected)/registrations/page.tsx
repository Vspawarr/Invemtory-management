import { getAdminRegistrations, getTeamsWithoutRegistration } from '@/lib/actions/queries-admin';
import NewRegistrationForm from '@/components/admin/NewRegistrationForm';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AdminRegistrationsPage() {
  const [registrations, unregisteredTeams] = await Promise.all([
    getAdminRegistrations(),
    getTeamsWithoutRegistration(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black uppercase text-navy-900">Registrations</h1>
        <p className="text-sm text-slate-500">{registrations.length} registrations</p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-bold text-navy-900">Register a Team</p>
        <NewRegistrationForm teams={unregisteredTeams} />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-navy-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Reg #</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Team</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Player 1</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Player 2</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Date</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Payment</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">Notes</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono text-xs font-bold text-navy-900">{r.registration_number}</td>
                <td className="px-3 py-2 font-semibold">{r.team.team_name}</td>
                <td className="px-3 py-2">{r.team.players[0]?.name ?? '—'}</td>
                <td className="px-3 py-2">{r.team.players[1]?.name ?? '—'}</td>
                <td className="px-3 py-2">{format(new Date(r.registration_date), 'd MMM yyyy')}</td>
                <td className="px-3 py-2">{r.payment?.status ?? 'PENDING'}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{r.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {registrations.length === 0 && <p className="p-4 text-sm text-slate-500">No registrations yet.</p>}
      </div>
    </div>
  );
}
