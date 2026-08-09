import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { STAGE_LABELS } from '@/lib/cricket';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AdminResultsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('matches')
    .select(
      '*, team_a:teams!matches_team_a_id_fkey(team_name), team_b:teams!matches_team_b_id_fkey(team_name), match_results(*, winner:teams!match_results_winner_team_id_fkey(team_name))'
    )
    .eq('status', 'COMPLETED')
    .order('match_number', { ascending: false });

  const results = (data ?? []) as unknown as {
    id: string;
    match_number: number;
    stage: string;
    match_date: string | null;
    team_a: { team_name: string } | null;
    team_b: { team_name: string } | null;
    match_results: {
      winner: { team_name: string } | null;
      result_type: string;
      team_a_score: number;
      team_b_score: number;
      summary: string | null;
    }[];
  }[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black uppercase text-navy-900">Results</h1>
        <p className="text-sm text-slate-500">{results.length} completed matches</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((m) => {
          const result = m.match_results[0];
          return (
            <Link
              key={m.id}
              href={`/admin/matches/${m.id}`}
              className="block rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
            >
              <p className="text-xs font-bold uppercase text-navy-600">
                #{m.match_number} · {STAGE_LABELS[m.stage] ?? m.stage}
                {m.match_date ? ` · ${format(new Date(m.match_date), 'd MMM yyyy')}` : ''}
              </p>
              <p className="mt-1 font-bold text-navy-900">
                {m.team_a?.team_name ?? 'TBD'} {result?.team_a_score ?? '-'} vs{' '}
                {m.team_b?.team_name ?? 'TBD'} {result?.team_b_score ?? '-'}
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-600">
                {result?.summary ?? (result?.winner ? `${result.winner.team_name} won` : 'Result recorded')}
              </p>
            </Link>
          );
        })}
      </div>
      {results.length === 0 && (
        <p className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm">No completed matches yet.</p>
      )}
    </div>
  );
}
