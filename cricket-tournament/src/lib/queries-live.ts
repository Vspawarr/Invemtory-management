import { createClient } from '@/lib/supabase/server';
import type { ScoringEvent, PublicTeam } from '@/types/database';

export async function getRecentEvents(inningsId: string, limit = 12): Promise<ScoringEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('scoring_events')
    .select('*')
    .eq('innings_id', inningsId)
    .eq('is_undone', false)
    .order('sequence_number', { ascending: false })
    .limit(limit);
  return (data ?? []).reverse();
}

export async function getTeamRoster(teamId: string): Promise<PublicTeam | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('v_teams_public').select('*').eq('id', teamId).maybeSingle();
  return data;
}
