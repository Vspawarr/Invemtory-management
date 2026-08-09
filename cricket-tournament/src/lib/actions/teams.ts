'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAdmin } from '@/lib/auth';

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('Not authorized');
  return admin;
}

async function getTournamentId(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tournaments')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) throw new Error('Tournament not configured');
  return data.id;
}

export type TeamFormState = { error?: string } | null;

export async function createTeam(_prev: TeamFormState, formData: FormData): Promise<TeamFormState> {
  await requireAdmin();
  const teamName = String(formData.get('team_name') ?? '').trim();
  const player1Id = String(formData.get('player1_id') ?? '').trim();
  const player2Id = String(formData.get('player2_id') ?? '').trim();

  if (!teamName) return { error: 'Team name is required.' };
  if (player1Id && player2Id && player1Id === player2Id) {
    return { error: 'Player 1 and Player 2 must be different people.' };
  }

  const tournamentId = await getTournamentId();
  const supabase = await createClient();

  const { data: team, error } = await supabase
    .from('teams')
    .insert({ tournament_id: tournamentId, team_name: teamName })
    .select('id')
    .single();

  if (error || !team) return { error: error?.message ?? 'Could not create team.' };

  if (player1Id) {
    const { error: p1Error } = await supabase
      .from('team_players')
      .insert({ team_id: team.id, player_id: player1Id, position: 1 });
    if (p1Error) return { error: p1Error.message };
  }
  if (player2Id) {
    const { error: p2Error } = await supabase
      .from('team_players')
      .insert({ team_id: team.id, player_id: player2Id, position: 2 });
    if (p2Error) return { error: p2Error.message };
  }

  revalidatePath('/admin/teams');
  redirect(`/admin/teams/${team.id}/edit`);
}

export async function updateTeamName(teamId: string, teamName: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('teams').update({ team_name: teamName }).eq('id', teamId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/teams');
}

export async function assignPlayerToTeam(teamId: string, playerId: string, position: 1 | 2) {
  await requireAdmin();
  const supabase = await createClient();

  // replace whatever currently occupies that slot
  await supabase.from('team_players').delete().eq('team_id', teamId).eq('position', position);
  const { error } = await supabase.from('team_players').insert({ team_id: teamId, player_id: playerId, position });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/teams');
  revalidatePath(`/admin/teams/${teamId}/edit`);
}

export async function removePlayerFromTeam(teamId: string, position: 1 | 2) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('team_players').delete().eq('team_id', teamId).eq('position', position);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/teams');
  revalidatePath(`/admin/teams/${teamId}/edit`);
}

export async function setTeamStatus(teamId: string, status: 'DRAFT' | 'READY' | 'WITHDRAWN') {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('teams').update({ registration_status: status }).eq('id', teamId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/teams');
  revalidatePath(`/admin/teams/${teamId}/edit`);
}

export async function setTeamSeed(teamId: string, seed: number | null) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('teams').update({ seed }).eq('id', teamId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/teams');
}

export async function deactivateTeam(teamId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('teams').update({ is_active: false }).eq('id', teamId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/teams');
}
