// One-off bootstrap script: creates a Supabase Auth user (or reuses an
// existing one) and inserts the matching admin_users row so they can sign
// in to /admin. Requires SUPABASE_SERVICE_ROLE_KEY -- run locally only.
//
// Usage:
//   npx tsx scripts/create-admin.ts --email admin@example.com --password "Str0ngPass!" --name "Tournament Admin"

import { createClient } from '@supabase/supabase-js';

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    if (key && value) out[key] = value;
  }
  return out;
}

async function main() {
  const { email, password, name } = parseArgs();
  if (!email || !password || !name) {
    console.error('Usage: npx tsx scripts/create-admin.ts --email <email> --password <password> --name "<name>"');
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local).');
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId = created?.user?.id;

  if (createError) {
    if (createError.message.toLowerCase().includes('already registered')) {
      const { data: list, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      const existing = list.users.find((u) => u.email === email);
      if (!existing) throw createError;
      userId = existing.id;
    } else {
      throw createError;
    }
  }

  if (!userId) throw new Error('Could not resolve a user id.');

  const { error: upsertError } = await supabase
    .from('admin_users')
    .upsert({ id: userId, email, name, role: 'ADMIN' }, { onConflict: 'id' });

  if (upsertError) throw upsertError;

  console.log(`Admin ready: ${email} (id: ${userId})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
