import { notFound } from 'next/navigation';
import { getAdminMatch } from '@/lib/actions/queries-admin';
import { getMatchRosterWithNames } from '@/lib/actions/queries-match';
import { createClient } from '@/lib/supabase/server';
import MatchDetailPanel from '@/components/admin/MatchDetailPanel';
import { STAGE_LABELS } from '@/lib/cricket';
import StatusBadge from '@/components/ui/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getAdminMatch(id);
  if (!match) notFound();

  const supabase = await createClient();
  const [teamAResult, teamBResult, roster, inningsResult] = await Promise.all([
    match.team_a_id
      ? supabase.from('teams').select('id, team_name, team_players(position, player:players(id, name))').eq('id', match.team_a_id).single()
      : Promise.resolve({ data: null }),
    match.team_b_id
      ? supabase.from('teams').select('id, team_name, team_players(position, player:players(id, name))').eq('id', match.team_b_id).single()
      : Promise.resolve({ data: null }),
    getMatchRosterWithNames(id),
    supabase.from('innings').select('id, innings_number, status').eq('match_id', id).order('innings_number', { ascending: false }),
  ]);

  function mapTeam(row: typeof teamAResult.data) {
    if (!row) return null;
    const raw = row as unknown as {
      id: string;
      team_name: string;
      team_players: { position: number; player: { id: string; name: string } | null }[];
    };
    return {
      id: raw.id,
      team_name: raw.team_name,
      players: (raw.team_players ?? [])
        .sort((a, b) => a.position - b.position)
        .map((tp) => tp.player)
        .filter((p): p is { id: string; name: string } => !!p),
    };
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <span className="text-xs font-bold uppercase text-navy-600">
          #{match.match_number} · {STAGE_LABELS[match.stage] ?? match.stage}
        </span>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-xl font-black text-navy-900">
            {match.team_a_name ?? 'TBD'} vs {match.team_b_name ?? 'TBD'}
          </h1>
          <StatusBadge status={match.status} />
        </div>
        <p className="text-sm text-slate-500">
          {match.venue} · {match.overs} overs
        </p>
      </div>

      <MatchDetailPanel
        match={match}
        teamA={mapTeam(teamAResult.data)}
        teamB={mapTeam(teamBResult.data)}
        roster={roster}
        hasInnings={(inningsResult.data?.length ?? 0) > 0}
        latestInningsStatus={inningsResult.data?.[0]?.status ?? null}
      />
    </div>
  );
}
