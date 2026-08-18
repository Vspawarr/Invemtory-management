'use client';

import { useActionState } from 'react';
import type { Player } from '@/types/database';
import type { PlayerFormState } from '@/lib/actions/players';
import { BOWLING_STYLES } from '@/lib/cricket';

export default function PlayerForm({
  player,
  action,
}: {
  player?: Player;
  action: (state: PlayerFormState, formData: FormData) => Promise<PlayerFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Full Name" name="name" defaultValue={player?.name} required />
      <Field
        label="Mobile Number"
        name="mobile"
        defaultValue={player?.mobile}
        required
        inputMode="numeric"
        maxLength={10}
      />
      <Field label="Village" name="village" defaultValue={player?.village ?? ''} />
      <Field label="Age (optional)" name="age" type="number" defaultValue={player?.age ?? ''} />
      <Field label="Photo URL (optional)" name="photo_url" defaultValue={player?.photo_url ?? ''} />

      <div>
        <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Batting Style</label>
        <div className="flex gap-2">
          {(['RIGHT_HAND', 'LEFT_HAND'] as const).map((hand) => (
            <label
              key={hand}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm has-[:checked]:border-navy-600 has-[:checked]:bg-navy-50 has-[:checked]:font-bold"
            >
              <input
                type="radio"
                name="batting_style"
                value={hand}
                defaultChecked={(player?.batting_style ?? 'RIGHT_HAND') === hand}
                className="accent-navy-900"
              />
              {hand === 'RIGHT_HAND' ? 'Right-hand Bat' : 'Left-hand Bat'}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase text-slate-600">
          Bowling Style (optional)
        </label>
        <select
          name="bowling_style"
          defaultValue={player?.bowling_style ?? ''}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
        >
          <option value="">Not set / batsman only</option>
          {BOWLING_STYLES.map((style) => (
            <option key={style} value={style}>
              {style}
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
        {pending ? 'Saving…' : player ? 'Save Changes' : 'Add Player'}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = 'text',
  inputMode,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
  inputMode?: 'numeric';
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase text-slate-600">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ''}
        inputMode={inputMode}
        maxLength={maxLength}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
      />
    </div>
  );
}
