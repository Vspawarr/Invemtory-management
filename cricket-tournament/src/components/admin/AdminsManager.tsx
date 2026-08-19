'use client';

import { useActionState, useState, useTransition } from 'react';
import { createAdmin, removeAdmin } from '@/lib/actions/admins';
import type { AdminUser } from '@/types/database';

export default function AdminsManager({
  admins,
  currentAdminId,
}: {
  admins: AdminUser[];
  currentAdminId: string;
}) {
  const [state, formAction, pending] = useActionState(createAdmin, null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleRemove(id: string, name: string) {
    if (!confirm(`Remove admin access for ${name}? They won't be able to log in to /admin anymore.`)) return;
    setRemoveError(null);
    setPendingRemoveId(id);
    startTransition(async () => {
      try {
        await removeAdmin(id);
      } catch (e) {
        setRemoveError(e instanceof Error ? e.message : 'Could not remove this admin.');
      } finally {
        setPendingRemoveId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <p className="mb-3 text-sm font-bold text-navy-900">Add Admin</p>
        <form action={formAction} className="space-y-3" key={admins.length}>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Full Name</label>
            <input
              name="name"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Password</label>
            <input
              name="password"
              type="text"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Share this with them directly (SMS/WhatsApp) so they can log in at /admin/login.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Role</label>
            <select
              name="role"
              defaultValue="ADMIN"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
            >
              <option value="ADMIN">Admin — can score matches and manage the tournament</option>
              <option value="SUPER_ADMIN">Super Admin — can also add/remove other admins</option>
            </select>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-navy-900 py-3 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {pending ? 'Adding…' : 'Add Admin'}
          </button>
        </form>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <p className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-navy-900">
          Current Admins ({admins.length})
        </p>
        {removeError && (
          <p className="mx-4 mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{removeError}</p>
        )}
        <ul className="divide-y divide-slate-100">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  {a.name} {a.id === currentAdminId && <span className="text-xs font-normal text-slate-400">(you)</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {a.email} · {a.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
              {a.id !== currentAdminId && (
                <button
                  onClick={() => handleRemove(a.id, a.name)}
                  disabled={pendingRemoveId === a.id}
                  className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                >
                  {pendingRemoveId === a.id ? 'Removing…' : 'Remove'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
