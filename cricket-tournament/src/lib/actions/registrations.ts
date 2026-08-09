'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAdmin } from '@/lib/auth';

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('Not authorized');
  return admin;
}

async function getTournament() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tournaments')
    .select('id, registration_fee')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) throw new Error('Tournament not configured');
  return data;
}

export async function createRegistration(teamId: string, notes?: string) {
  const admin = await requireAdmin();
  const tournament = await getTournament();
  const supabase = await createClient();

  const { data: registration, error } = await supabase
    .from('registrations')
    .insert({
      tournament_id: tournament.id,
      team_id: teamId,
      notes: notes || null,
      created_by: admin.id,
    })
    .select('id')
    .single();

  if (error || !registration) throw new Error(error?.message ?? 'Could not create registration.');

  const { error: paymentError } = await supabase.from('payments').insert({
    registration_id: registration.id,
    team_id: teamId,
    amount: tournament.registration_fee,
    status: 'PENDING',
  });
  if (paymentError) throw new Error(paymentError.message);

  revalidatePath('/admin/registrations');
  revalidatePath('/admin/payments');
  revalidatePath('/admin/teams');
}

export async function updateRegistrationNotes(registrationId: string, notes: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('registrations').update({ notes }).eq('id', registrationId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/registrations');
}
