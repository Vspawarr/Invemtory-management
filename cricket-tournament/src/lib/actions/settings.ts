'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAdmin } from '@/lib/auth';
import type { TournamentStatus } from '@/types/database';

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('Not authorized');
  return admin;
}

export type SettingsFormState = { error?: string; success?: boolean } | null;

export async function updateTournamentSettings(
  tournamentId: string,
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  await requireAdmin();
  const supabase = await createClient();

  const galleryRaw = String(formData.get('gallery_urls') ?? '').trim();

  const { error } = await supabase
    .from('tournaments')
    .update({
      name: String(formData.get('name') ?? '').trim(),
      village: String(formData.get('village') ?? '').trim(),
      venue: String(formData.get('venue') ?? '').trim(),
      registration_fee: Number(formData.get('registration_fee') ?? 200),
      contact_number: String(formData.get('contact_number') ?? '').trim(),
      tournament_date: String(formData.get('tournament_date') ?? '').trim() || null,
      status: String(formData.get('status') ?? 'UPCOMING') as TournamentStatus,
      registration_open: formData.get('registration_open') === 'on',
      normal_overs: Number(formData.get('normal_overs') ?? 2),
      semi_final_overs: Number(formData.get('semi_final_overs') ?? 4),
      final_overs: Number(formData.get('final_overs') ?? 4),
      max_knockout_matches_per_player: Number(formData.get('max_knockout_matches_per_player') ?? 3),
      wicket_penalty: Number(formData.get('wicket_penalty') ?? -2),
      wide_run_value: Number(formData.get('wide_run_value') ?? 1),
      no_ball_run_value: Number(formData.get('no_ball_run_value') ?? 1),
      extras_allowed: formData.get('extras_allowed') === 'on',
      banner_image_url: String(formData.get('banner_image_url') ?? '').trim() || null,
      gallery_urls: galleryRaw ? galleryRaw.split(',').map((u) => u.trim()).filter(Boolean) : [],
      super_over_first_balls: Number(formData.get('super_over_first_balls') ?? 6),
      super_over_repeat_balls: Number(formData.get('super_over_repeat_balls') ?? 3),
    })
    .eq('id', tournamentId);

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/rules');
  revalidatePath('/admin/settings');
  return { success: true };
}
