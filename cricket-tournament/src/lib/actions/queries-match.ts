import { createClient } from '@/lib/supabase/server';
import type { MatchPlayer } from '@/types/database';

export interface MatchPlayerWithName extends MatchPlayer {
  player_name: string;
  player_bowling_style: string | null;
  player_batting_style: 'RIGHT_HAND' | 'LEFT_HAND';
}

export async function getMatchRosterWithNames(matchId: string): Promise<MatchPlayerWithName[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('match_players')
    .select('*, player:players(name, bowling_style, batting_style)')
    .eq('match_id', matchId);

  return (data ?? []).map((row) => {
    const raw = row as unknown as MatchPlayer & {
      player: { name: string; bowling_style: string | null; batting_style: 'RIGHT_HAND' | 'LEFT_HAND' } | null;
    };
    return {
      ...(raw as MatchPlayer),
      player_name: raw.player?.name ?? 'Unknown',
      player_bowling_style: raw.player?.bowling_style ?? null,
      player_batting_style: raw.player?.batting_style ?? 'RIGHT_HAND',
    };
  });
}
