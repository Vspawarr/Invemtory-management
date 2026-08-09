'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAdmin } from '@/lib/auth';

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('Not authorized');
  return admin;
}

export async function addRule(tournamentId: string, ruleText: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: maxRow } = await supabase
    .from('tournament_rules')
    .select('order_index')
    .eq('tournament_id', tournamentId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  const orderIndex = (maxRow?.order_index ?? 0) + 1;

  const { error } = await supabase
    .from('tournament_rules')
    .insert({ tournament_id: tournamentId, order_index: orderIndex, rule_text: ruleText });
  if (error) throw new Error(error.message);

  revalidatePath('/rules');
  revalidatePath('/admin/rules');
}

export async function updateRule(ruleId: string, ruleText: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('tournament_rules').update({ rule_text: ruleText }).eq('id', ruleId);
  if (error) throw new Error(error.message);
  revalidatePath('/rules');
  revalidatePath('/admin/rules');
}

export async function deleteRule(ruleId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('tournament_rules').delete().eq('id', ruleId);
  if (error) throw new Error(error.message);
  revalidatePath('/rules');
  revalidatePath('/admin/rules');
}

export async function reorderRule(ruleId: string, direction: 'up' | 'down', tournamentId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: rules } = await supabase
    .from('tournament_rules')
    .select('id, order_index')
    .eq('tournament_id', tournamentId)
    .order('order_index', { ascending: true });
  if (!rules) return;

  const index = rules.findIndex((r) => r.id === ruleId);
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= rules.length) return;

  const a = rules[index];
  const b = rules[swapWith];

  await supabase.from('tournament_rules').update({ order_index: b.order_index }).eq('id', a.id);
  await supabase.from('tournament_rules').update({ order_index: a.order_index }).eq('id', b.id);

  revalidatePath('/rules');
  revalidatePath('/admin/rules');
}
