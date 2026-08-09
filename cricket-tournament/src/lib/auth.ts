import { createClient } from '@/lib/supabase/server';
import type { AdminUser } from '@/types/database';

// Resolves the logged-in admin (auth session + admin_users row). Returns null
// if not logged in or not an admin -- callers should redirect to
// /admin/login in that case. This is a convenience check for UI purposes;
// the authoritative check is Postgres RLS via is_admin().
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, name, email, role')
    .eq('id', user.id)
    .single();

  return admin ?? null;
}
