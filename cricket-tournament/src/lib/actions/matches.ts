'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAdmin } from '@/lib/auth';
import type { MatchStage, MatchStatus, ResultType } from '@/types/database';

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('Not authorized');
  return admin;
}

async function getTournament() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) throw new Error('Tournament not configured');
  return data;
}

export type MatchFormState = { error?: string } | null;

export async function createMatch(_prev: MatchFormState, formData: FormData): Promise<MatchFormState> {
  await requireAdmin();
  const tournament = await getTournament();
  const supabase = await createClient();

  const stage = String(formData.get('stage') ?? 'LEAGUE') as MatchStage;
  const teamAId = String(formData.get('team_a_id') ?? '').trim() || null;
  const teamBId = String(formData.get('team_b_id') ?? '').trim() || null;
  const matchDate = String(formData.get('match_date') ?? '').trim() || null;
  const matchTime = String(formData.get('match_time') ?? '').trim() || null;
  const venue = String(formData.get('venue') ?? '').trim() || tournament.venue;

  if (teamAId && teamBId && teamAId === teamBId) {
    return { error: 'Team A and Team B must be different teams.' };
  }

  const defaultOvers =
    stage === 'SEMI_FINAL' || stage === 'FINAL' ? tournament.semi_final_overs : tournament.normal_overs;
  const oversRaw = String(formData.get('overs') ?? '').trim();
  const overs = oversRaw ? Number(oversRaw) : defaultOvers;

  const { data: maxRow } = await supabase
    .from('matches')
    .select('match_number')
    .eq('tournament_id', tournament.id)
    .order('match_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  const matchNumber = (maxRow?.match_number ?? 0) + 1;

  const { error } = await supabase.from('matches').insert({
    tournament_id: tournament.id,
    match_number: matchNumber,
    stage,
    team_a_id: teamAId,
    team_b_id: teamBId,
    match_date: matchDate,
    match_time: matchTime,
    venue,
    overs,
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/matches');
  redirect('/admin/matches');
}

export async function updateMatchDetails(matchId: string, input: {
  team_a_id?: string | null;
  team_b_id?: string | null;
  match_date?: string | null;
  match_time?: string | null;
  venue?: string | null;
  overs?: number;
  stage?: MatchStage;
  status?: MatchStatus;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('matches').update(input).eq('id', matchId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/matches');
  revalidatePath(`/admin/matches/${matchId}`);
}

export interface RosterResult {
  added: string[];
  blocked: { playerId: string; name: string; message: string }[];
}

// Adds both teams' 2 players to match_players. For knockout-stage matches
// this is where the "max 3 knockout matches per player" rule is enforced --
// the DB trigger blocks ineligible players outright (raise exception), we
// just catch it per-player and report which ones were blocked.
export async function addMatchRoster(matchId: string): Promise<RosterResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single();
  if (!match) throw new Error('Match not found');

  const teamIds = [match.team_a_id, match.team_b_id].filter((id): id is string => !!id);
  const result: RosterResult = { added: [], blocked: [] };

  for (const teamId of teamIds) {
    const { data: roster } = await supabase
      .from('team_players')
      .select('player:players(id, name)')
      .eq('team_id', teamId);

    for (const row of (roster ?? []) as unknown as { player: { id: string; name: string } | null }[]) {
      const player = row.player;
      if (!player) continue;

      const { error } = await supabase
        .from('match_players')
        .insert({ match_id: matchId, team_id: teamId, player_id: player.id });

      if (error) {
        if (error.message.includes('not eligible')) {
          result.blocked.push({ playerId: player.id, name: player.name, message: error.message });
        } else if (!error.message.includes('duplicate key')) {
          throw new Error(error.message);
        }
      } else {
        result.added.push(player.id);
      }
    }
  }

  revalidatePath(`/admin/matches/${matchId}`);
  revalidatePath('/admin/live-scoring');
  return result;
}

export async function startMatch(matchId: string, battingTeamId: string, strikerId: string, nonStrikerId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single();
  if (!match) throw new Error('Match not found');
  const bowlingTeamId = battingTeamId === match.team_a_id ? match.team_b_id : match.team_a_id;
  if (!bowlingTeamId) throw new Error('Both teams must be set before starting the match.');

  const { error: inningsError } = await supabase.from('innings').insert({
    match_id: matchId,
    innings_number: 1,
    batting_team_id: battingTeamId,
    bowling_team_id: bowlingTeamId,
    striker_id: strikerId,
    non_striker_id: nonStrikerId,
  });
  if (inningsError) throw new Error(inningsError.message);

  const { error: matchError } = await supabase.from('matches').update({ status: 'LIVE' }).eq('id', matchId);
  if (matchError) throw new Error(matchError.message);

  revalidatePath(`/admin/live-scoring/${matchId}`);
  revalidatePath('/admin/live-scoring');
  revalidatePath('/admin/matches');
}

export async function startSecondInnings(matchId: string, strikerId: string, nonStrikerId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single();
  if (!match) throw new Error('Match not found');
  const { data: innings1 } = await supabase
    .from('innings')
    .select('*')
    .eq('match_id', matchId)
    .eq('innings_number', 1)
    .single();
  if (!innings1) throw new Error('First innings not found');

  const { error } = await supabase.from('innings').insert({
    match_id: matchId,
    innings_number: 2,
    batting_team_id: innings1.bowling_team_id,
    bowling_team_id: innings1.batting_team_id,
    striker_id: strikerId,
    non_striker_id: nonStrikerId,
    target: innings1.total_runs + 1,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/live-scoring/${matchId}`);
}

export async function endInnings(inningsId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('innings').update({ status: 'COMPLETED' }).eq('id', inningsId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/live-scoring');
}

export async function setBatsmen(inningsId: string, strikerId: string | null, nonStrikerId: string | null) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from('innings')
    .update({ striker_id: strikerId, non_striker_id: nonStrikerId })
    .eq('id', inningsId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/live-scoring');
}

export async function swapStrike(inningsId: string, strikerId: string, nonStrikerId: string) {
  return setBatsmen(inningsId, nonStrikerId, strikerId);
}

export async function completeMatchAction(
  matchId: string,
  winnerTeamId: string | null,
  resultType: ResultType,
  summary: string
) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc('complete_match', {
    p_match_id: matchId,
    p_winner_team_id: winnerTeamId,
    p_result_type: resultType,
    p_summary: summary,
    p_admin_user_id: admin.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/admin/matches');
  revalidatePath('/admin/results');
  revalidatePath('/admin/leaderboard');
  revalidatePath('/admin/live-scoring');
  revalidatePath('/');
}

export async function cancelMatch(matchId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('matches').update({ status: 'CANCELLED' }).eq('id', matchId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/matches');
}
