'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAdmin } from '@/lib/auth';
import type { PaymentMethod, PaymentStatus } from '@/types/database';

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('Not authorized');
  return admin;
}

export async function updatePayment(
  paymentId: string,
  input: {
    status: PaymentStatus;
    payment_method?: PaymentMethod | null;
    transaction_reference?: string | null;
    amount?: number;
    notes?: string | null;
  }
) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from('payments')
    .update({
      status: input.status,
      payment_method: input.payment_method ?? null,
      transaction_reference: input.transaction_reference ?? null,
      amount: input.amount,
      notes: input.notes ?? null,
      verified_by: input.status === 'PAID' ? admin.id : null,
      paid_at: input.status === 'PAID' ? new Date().toISOString() : null,
    })
    .eq('id', paymentId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/payments');
  revalidatePath('/admin/registrations');
  revalidatePath('/admin');
  revalidatePath('/admin/teams');
}
