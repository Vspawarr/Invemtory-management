import { createClient } from '@/lib/supabase/server';
import type {
  Tournament,
  TournamentRule,
  PublicMatch,
  PublicTeam,
  PublicPlayer,
  PlayerLeaderboardRow,
  TeamLeaderboardRow,
  PointsTableRow,
  PlayerStatsRow,
  PlayerMilestoneRow,
  BestBowlingRow,
  InningsRecordRow,
  MatchMarginRow,
  LiveMatchSummary,
  MatchStatus,
} from '@/types/database';

// Single-tournament app: always take the most recently created tournament row.
export async function getTournament(): Promise<Tournament | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getTournamentRules(): Promise<TournamentRule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tournament_rules')
    .select('*')
    .order('order_index', { ascending: true });
  return data ?? [];
}

export async function getMatchesByStatus(status: MatchStatus | MatchStatus[]): Promise<PublicMatch[]> {
  const supabase = await createClient();
  let query = supabase.from('v_matches_public').select('*');
  query = Array.isArray(status) ? query.in('status', status) : query.eq('status', status);
  const { data } = await query.order('match_date', { ascending: true }).order('match_number', { ascending: true });
  return data ?? [];
}

export async function getMatchByShareCode(shareCode: string): Promise<LiveMatchSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('v_live_match_summary')
    .select('*')
    .eq('share_code', shareCode)
    .maybeSingle();
  return data;
}

export async function getPublicTeams(): Promise<PublicTeam[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('v_teams_public')
    .select('*')
    .eq('is_active', true)
    .order('team_name', { ascending: true });
  return data ?? [];
}

export async function getPublicPlayers(): Promise<PublicPlayer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('v_players_public')
    .select('*')
    .order('name', { ascending: true });
  return data ?? [];
}

export async function getPlayerLeaderboard(): Promise<PlayerLeaderboardRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('v_player_leaderboard').select('*');
  return data ?? [];
}

export async function getTeamLeaderboard(): Promise<TeamLeaderboardRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('v_team_leaderboard').select('*');
  return data ?? [];
}

export async function getPointsTable(): Promise<PointsTableRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('v_points_table').select('*');
  return data ?? [];
}

export async function getPlayerStats(): Promise<PlayerStatsRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('v_player_stats').select('*');
  return data ?? [];
}

export async function getPlayerMilestones(): Promise<PlayerMilestoneRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('v_player_milestones').select('*');
  return data ?? [];
}

export async function getBestBowling(): Promise<BestBowlingRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('v_best_bowling').select('*');
  return data ?? [];
}

export async function getInningsRecords(): Promise<InningsRecordRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('v_innings_records').select('*').limit(5);
  return data ?? [];
}

export async function getMatchMargins(): Promise<MatchMarginRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('v_match_margins').select('*');
  return data ?? [];
}
