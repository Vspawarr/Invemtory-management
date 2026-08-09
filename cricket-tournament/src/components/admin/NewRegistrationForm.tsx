'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Team } from '@/types/database';
import { createRegistration } from '@/lib/actions/registrations';

export default function NewRegistrationForm({ teams }: { teams: Team[] }) {
  const [teamId, setTeamId] = useState('');
  const [notes, setNotes] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (teams.length === 0) {
    return <p className="text-sm text-slate-500">All active teams already have a registration.</p>;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <select
        value={teamId}
        onChange={(e) => setTeamId(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm sm:w-64"
      >
        <option value="">— Select team —</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.team_name}
          </option>
        ))}
      </select>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
      />
      <button
        disabled={!teamId || pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await createRegistration(teamId, notes);
              setTeamId('');
              setNotes('');
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Failed to register team.');
            }
          })
        }
        className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        Register Team
      </button>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
