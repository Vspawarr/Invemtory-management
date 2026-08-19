'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from './AdminNav';
import InstallAppButton from '@/components/InstallAppButton';
import { createClient } from '@/lib/supabase/client';
import type { AdminUser } from '@/types/database';

export default function AdminShell({
  admin,
  children,
}: {
  admin: AdminUser;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-navy-900 px-4 py-3 text-white lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-bold"
          aria-label="Open menu"
        >
          ☰ Menu
        </button>
        <span className="text-sm font-bold uppercase tracking-wide text-gold-400">Admin</span>
        <button onClick={signOut} className="text-xs font-semibold text-white/70">
          Sign out
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-72 space-y-1 overflow-y-auto bg-navy-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-gold-400">{admin.name}</span>
              <button onClick={() => setOpen(false)} className="text-white/70" aria-label="Close menu">
                ✕
              </button>
            </div>
            <InstallAppButton className="mb-3 w-full rounded-lg bg-gold-500 py-2 text-xs font-bold uppercase text-navy-900" />
            <AdminNav />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}

      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy-900 p-4 lg:flex">
          <div className="mb-4">
            <p className="text-sm font-bold text-white">{admin.name}</p>
            <p className="truncate text-xs text-white/50">{admin.email}</p>
          </div>
          <InstallAppButton className="mb-4 w-full rounded-lg bg-gold-500 py-2 text-xs font-bold uppercase text-navy-900" />
          <div className="flex-1 space-y-1 overflow-y-auto">
            <AdminNav />
          </div>
          <button
            onClick={signOut}
            className="mt-4 rounded-lg border border-white/20 py-2 text-xs font-bold uppercase text-white/70 hover:bg-white/10"
          >
            Sign Out
          </button>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
