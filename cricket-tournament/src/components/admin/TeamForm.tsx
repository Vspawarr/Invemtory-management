'use client';

import { useActionState } from 'react';
import type { Player } from '@/types/database';
import type { TeamFormState } from '@/lib/actions/teams';

export default function TeamForm({
  players,
  action,
}: {
  players: Player[];
  action: (state: TeamFormState, formData: FormData) => Promise<TeamFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Team Name</label>
        <input
          name="team_name"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Player 1 (optional now)</label>
        <select
          name="player1_id"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
        >
          <option value="">— Select later —</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.village ? `(${p.village})` : ''}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Player 2 (optional now)</label>
        <select
          name="player2_id"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
        >
          <option value="">— Select later —</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.village ? `(${p.village})` : ''}
            </option>
          ))}
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
        {pending ? 'Saving…' : 'Create Team'}
      </button>
    </form>
  );
}
