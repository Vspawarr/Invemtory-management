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

export type PlayerFormState = { error?: string } | null;

export async function createPlayer(_prev: PlayerFormState, formData: FormData): Promise<PlayerFormState> {
  await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  const mobile = String(formData.get('mobile') ?? '').trim();
  const village = String(formData.get('village') ?? '').trim() || null;
  const ageRaw = String(formData.get('age') ?? '').trim();
  const age = ageRaw ? Number(ageRaw) : null;
  const photoUrl = String(formData.get('photo_url') ?? '').trim() || null;

  if (!name || !mobile) {
    return { error: 'Name and mobile number are required.' };
  }
  if (!/^\d{10}$/.test(mobile)) {
    return { error: 'Mobile number must be exactly 10 digits.' };
  }

  const tournamentId = await getTournamentId();
  const supabase = await createClient();
  const { error } = await supabase.from('players').insert({
    tournament_id: tournamentId,
    name,
    mobile,
    village,
    age,
    photo_url: photoUrl,
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/players');
  redirect('/admin/players');
}

export async function updatePlayer(
  playerId: string,
  _prev: PlayerFormState,
  formData: FormData
): Promise<PlayerFormState> {
  await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  const mobile = String(formData.get('mobile') ?? '').trim();
  const village = String(formData.get('village') ?? '').trim() || null;
  const ageRaw = String(formData.get('age') ?? '').trim();
  const age = ageRaw ? Number(ageRaw) : null;
  const photoUrl = String(formData.get('photo_url') ?? '').trim() || null;

  if (!name || !mobile) {
    return { error: 'Name and mobile number are required.' };
  }
  if (!/^\d{10}$/.test(mobile)) {
    return { error: 'Mobile number must be exactly 10 digits.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('players')
    .update({ name, mobile, village, age, photo_url: photoUrl })
    .eq('id', playerId);

  if (error) return { error: error.message };

  revalidatePath('/admin/players');
  redirect('/admin/players');
}

export async function setPlayerActive(playerId: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('players').update({ is_active: isActive }).eq('id', playerId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/players');
}

export async function deletePlayer(playerId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('players').delete().eq('id', playerId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/players');
}
