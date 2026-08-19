'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentAdmin } from '@/lib/auth';
import type { AdminUser } from '@/types/database';

async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('Not authorized');
  if (admin.role !== 'SUPER_ADMIN') {
    throw new Error('Only a super admin can manage other admin accounts.');
  }
  return admin;
}

export async function getAdmins(): Promise<AdminUser[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('admin_users').select('id, name, email, role').order('name');
  return data ?? [];
}

export type AdminFormState = { error?: string } | null;

export async function createAdmin(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireSuperAdmin();

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const role = String(formData.get('role') ?? 'ADMIN') === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';

  if (!name || !email || !password) {
    return { error: 'Name, email, and password are all required.' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const adminClient = createAdminClient();

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId = created?.user?.id;

  if (createError) {
    if (createError.message.toLowerCase().includes('already registered')) {
      const { data: list, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) return { error: listError.message };
      const existing = list.users.find((u) => u.email === email);
      if (!existing) return { error: createError.message };
      userId = existing.id;
    } else {
      return { error: createError.message };
    }
  }

  if (!userId) return { error: 'Could not create the admin account.' };

  const { error: upsertError } = await adminClient
    .from('admin_users')
    .upsert({ id: userId, name, email, role }, { onConflict: 'id' });

  if (upsertError) return { error: upsertError.message };

  revalidatePath('/admin/admins');
  return null;
}

export async function removeAdmin(adminId: string) {
  const current = await requireSuperAdmin();

  if (adminId === current.id) {
    throw new Error("You can't remove your own admin access.");
  }

  const supabase = await createClient();
  const { count } = await supabase.from('admin_users').select('id', { count: 'exact', head: true });
  if ((count ?? 0) <= 1) {
    throw new Error('At least one admin account must remain.');
  }

  const { error } = await supabase.from('admin_users').delete().eq('id', adminId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/admins');
}
