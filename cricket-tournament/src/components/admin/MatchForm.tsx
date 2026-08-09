'use client';

import { useActionState } from 'react';
import type { Team, Tournament } from '@/types/database';
import type { MatchFormState } from '@/lib/actions/matches';
import { STAGE_LABELS } from '@/lib/cricket';

export default function MatchForm({
  teams,
  tournament,
  action,
}: {
  teams: Team[];
  tournament: Tournament;
  action: (state: MatchFormState, formData: FormData) => Promise<MatchFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Stage</label>
        <select
          name="stage"
          defaultValue="LEAGUE"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        >
          {Object.entries(STAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TeamSelect name="team_a_id" label="Team A" teams={teams} />
        <TeamSelect name="team_b_id" label="Team B" teams={teams} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Date</label>
          <input type="date" name="match_date" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Time</label>
          <input type="time" name="match_time" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Venue</label>
        <input
          name="venue"
          defaultValue={tournament.venue}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
          Overs (default: {tournament.normal_overs} league / {tournament.semi_final_overs} SF &amp; Final)
        </label>
        <input
          type="number"
          name="overs"
          placeholder="Leave blank to use stage default"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-navy-900 py-3 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? 'Saving…' : 'Create Match'}
      </button>
    </form>
  );
}

function TeamSelect({ name, label, teams }: { name: string; label: string; teams: Team[] }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase text-slate-600">{label}</label>
      <select name={name} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
        <option value="">— TBD —</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.team_name}
          </option>
        ))}
      </select>
    </div>
  );
}
