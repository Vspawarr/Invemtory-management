'use client';

import { useActionState } from 'react';
import type { Tournament } from '@/types/database';
import type { SettingsFormState } from '@/lib/actions/settings';

export default function SettingsForm({
  tournament,
  action,
}: {
  tournament: Tournament;
  action: (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      <FieldGroup title="Tournament Identity">
        <Field label="Tournament Name" name="name" defaultValue={tournament.name} />
        <Field label="Village" name="village" defaultValue={tournament.village} />
        <Field label="Venue" name="venue" defaultValue={tournament.venue} />
        <Field label="Registration Contact" name="contact_number" defaultValue={tournament.contact_number} />
      </FieldGroup>

      <FieldGroup title="Status &amp; Schedule">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Tournament Status</label>
          <select
            name="status"
            defaultValue={tournament.status}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          >
            <option value="UPCOMING">Upcoming</option>
            <option value="REGISTRATION_OPEN">Registration Open</option>
            <option value="LIVE">Live</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <Field
          label="Tournament Date (leave blank for 'Date to be announced')"
          name="tournament_date"
          type="date"
          defaultValue={tournament.tournament_date ?? ''}
        />
        <label className="flex items-center gap-2 text-sm font-semibold text-navy-900">
          <input type="checkbox" name="registration_open" defaultChecked={tournament.registration_open} />
          Registration Open
        </label>
      </FieldGroup>

      <FieldGroup title="Fees &amp; Match Format">
        <Field label="Registration Fee (₹)" name="registration_fee" type="number" defaultValue={tournament.registration_fee} />
        <Field label="Normal / League Overs" name="normal_overs" type="number" defaultValue={tournament.normal_overs} />
        <Field label="Semi-Final Overs" name="semi_final_overs" type="number" defaultValue={tournament.semi_final_overs} />
        <Field label="Final Overs" name="final_overs" type="number" defaultValue={tournament.final_overs} />
      </FieldGroup>

      <FieldGroup title="Scoring Engine">
        <Field
          label="Wicket Penalty (runs, negative)"
          name="wicket_penalty"
          type="number"
          defaultValue={tournament.wicket_penalty}
        />
        <Field label="Wide Run Value" name="wide_run_value" type="number" defaultValue={tournament.wide_run_value} />
        <Field label="No Ball Run Value" name="no_ball_run_value" type="number" defaultValue={tournament.no_ball_run_value} />
        <label className="flex items-center gap-2 text-sm font-semibold text-navy-900">
          <input type="checkbox" name="extras_allowed" defaultChecked={tournament.extras_allowed} />
          Extras (Wide / No Ball) Allowed
        </label>
      </FieldGroup>

      <FieldGroup title="Knockout Eligibility">
        <Field
          label="Maximum Knockout Matches per Player"
          name="max_knockout_matches_per_player"
          type="number"
          defaultValue={tournament.max_knockout_matches_per_player}
        />
      </FieldGroup>

      <FieldGroup title="Super Over (Tied Matches)">
        <Field
          label="First Super Over — balls per side"
          name="super_over_first_balls"
          type="number"
          defaultValue={tournament.super_over_first_balls}
        />
        <Field
          label="Further Super Overs (if still tied) — balls per side"
          name="super_over_repeat_balls"
          type="number"
          defaultValue={tournament.super_over_repeat_balls}
        />
      </FieldGroup>

      <FieldGroup title="Media">
        <Field label="Banner Image URL" name="banner_image_url" defaultValue={tournament.banner_image_url ?? ''} />
        <Field
          label="Gallery Image URLs (comma separated)"
          name="gallery_urls"
          defaultValue={tournament.gallery_urls?.join(', ') ?? ''}
        />
      </FieldGroup>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Settings saved.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-navy-900 py-3 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? 'Saving…' : 'Save Settings'}
      </button>
    </form>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
      <p className="mb-3 text-sm font-bold uppercase text-navy-900">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = 'text',
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase text-slate-600">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
      />
    </div>
  );
}
