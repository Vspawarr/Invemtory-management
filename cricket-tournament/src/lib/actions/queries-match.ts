import { createClient } from '@/lib/supabase/server';
import type { MatchPlayer } from '@/types/database';

export interface MatchPlayerWithName extends MatchPlayer {
  player_name: string;
}

export async function getMatchRosterWithNames(matchId: string): Promise<MatchPlayerWithName[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('match_players')
    .select('*, player:players(name)')
    .eq('match_id', matchId);

  return (data ?? []).map((row) => {
    const raw = row as unknown as MatchPlayer & { player: { name: string } | null };
    return { ...(raw as MatchPlayer), player_name: raw.player?.name ?? 'Unknown' };
  });
}
