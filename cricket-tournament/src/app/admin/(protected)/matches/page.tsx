import Link from 'next/link';
import { getAdminMatches } from '@/lib/actions/queries-admin';
import { STAGE_LABELS } from '@/lib/cricket';
import StatusBadge from '@/components/ui/StatusBadge';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AdminMatchesPage() {
  const matches = await getAdminMatches();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black uppercase text-navy-900">Matches</h1>
          <p className="text-sm text-slate-500">{matches.length} matches</p>
        </div>
        <Link
          href="/admin/matches/new"
          className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-bold text-white active:scale-95"
        >
          + Create Match
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/admin/matches/${m.id}`}
            className="block rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-navy-600">
                #{m.match_number} · {STAGE_LABELS[m.stage] ?? m.stage}
              </span>
              <StatusBadge status={m.status} />
            </div>
            <p className="text-base font-bold text-navy-900">
              {m.team_a_name ?? 'TBD'} <span className="text-slate-400">vs</span> {m.team_b_name ?? 'TBD'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {m.match_date ? format(new Date(m.match_date), 'd MMM yyyy') : 'Date TBA'}
              {m.match_time ? ` · ${m.match_time.slice(0, 5)}` : ''} · {m.overs} overs
            </p>
          </Link>
        ))}
      </div>
      {matches.length === 0 && <p className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm">No matches yet.</p>}
    </div>
  );
}
