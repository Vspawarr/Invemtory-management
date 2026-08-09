import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAdminMatch } from '@/lib/actions/queries-admin';
import { getMatchRosterWithNames } from '@/lib/actions/queries-match';
import { getCurrentAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import ScoringConsole from '@/components/admin/ScoringConsole';

export const dynamic = 'force-dynamic';

export default async function LiveScoringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [match, roster, admin] = await Promise.all([
    getAdminMatch(id),
    getMatchRosterWithNames(id),
    getCurrentAdmin(),
  ]);

  if (!match || !admin) notFound();
  if (!match.team_a_id || !match.team_b_id) notFound();

  const supabase = await createClient();
  const { data: inningsRows } = await supabase
    .from('innings')
    .select('*')
    .eq('match_id', id)
    .order('innings_number', { ascending: false });

  const currentInnings = inningsRows?.find((i) => i.status === 'IN_PROGRESS') ?? inningsRows?.[0];

  if (!currentInnings) {
    return (
      <div className="max-w-lg space-y-4">
        <p className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
          This match hasn&apos;t started yet.{' '}
          <Link href={`/admin/matches/${id}`} className="font-bold text-navy-600 underline">
            Go to the match page
          </Link>{' '}
          to add the roster and start the toss.
        </p>
      </div>
    );
  }

  const { data: recentEvents } = await supabase
    .from('scoring_events')
    .select('*')
    .eq('innings_id', currentInnings.id)
    .eq('is_undone', false)
    .order('sequence_number', { ascending: false })
    .limit(12);

  const battingRoster = roster
    .filter((r) => r.team_id === currentInnings.batting_team_id)
    .map((r) => ({ id: r.player_id, name: r.player_name }));
  const bowlingRoster = roster
    .filter((r) => r.team_id === currentInnings.bowling_team_id)
    .map((r) => ({ id: r.player_id, name: r.player_name }));

  return (
    <div className="mx-auto max-w-lg">
      <ScoringConsole
        matchId={id}
        matchOvers={match.overs}
        teamAId={match.team_a_id}
        teamAName={match.team_a_name ?? 'Team A'}
        teamBId={match.team_b_id}
        teamBName={match.team_b_name ?? 'Team B'}
        initialInnings={currentInnings}
        battingRoster={battingRoster}
        bowlingRoster={bowlingRoster}
        admin={admin}
        initialEvents={(recentEvents ?? []).reverse()}
      />
    </div>
  );
}
