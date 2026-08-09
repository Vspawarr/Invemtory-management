import Link from 'next/link';
import { getAdminMatches } from '@/lib/actions/queries-admin';
import { STAGE_LABELS } from '@/lib/cricket';
import StatusBadge from '@/components/ui/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function LiveScoringIndexPage() {
  const matches = await getAdminMatches();
  const live = matches.filter((m) => m.status === 'LIVE');
  const upcoming = matches.filter((m) => m.status === 'SCHEDULED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase text-navy-900">Live Scoring</h1>
        <p className="text-sm text-slate-500">Pick a match to score ball-by-ball.</p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase text-red-600">Live Now</h2>
        {live.length === 0 && <p className="text-sm text-slate-500">No matches are live right now.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {live.map((m) => (
            <Link
              key={m.id}
              href={`/admin/live-scoring/${m.id}`}
              className="block rounded-xl bg-white p-4 shadow-sm ring-2 ring-red-500"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-navy-600">{STAGE_LABELS[m.stage]}</span>
                <StatusBadge status={m.status} />
              </div>
              <p className="font-bold text-navy-900">
                {m.team_a_name} vs {m.team_b_name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase text-slate-500">Ready to Start</h2>
        {upcoming.length === 0 && <p className="text-sm text-slate-500">No scheduled matches.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {upcoming.map((m) => (
            <Link
              key={m.id}
              href={`/admin/matches/${m.id}`}
              className="block rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-navy-600">{STAGE_LABELS[m.stage]}</span>
                <StatusBadge status={m.status} />
              </div>
              <p className="font-bold text-navy-900">
                {m.team_a_name ?? 'TBD'} vs {m.team_b_name ?? 'TBD'}
              </p>
              <p className="mt-1 text-xs text-slate-400">Set up roster &amp; toss on the match page →</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
