'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Player } from '@/types/database';
import type { AdminTeamRow } from '@/lib/actions/queries-admin';
import {
  assignPlayerToTeam,
  removePlayerFromTeam,
  setTeamStatus,
  setTeamSeed,
  updateTeamName,
} from '@/lib/actions/teams';

export default function TeamEditor({
  team,
  availablePlayers,
}: {
  team: AdminTeamRow;
  availablePlayers: Player[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamNameLocal] = useState(team.team_name);
  const [seed, setSeed] = useState(team.seed?.toString() ?? '');

  const locked = team.registration_status === 'READY';
  const player1 = team.players[0];
  const player2 = team.players[1];

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    });
  }

  return (
    <div className="space-y-6">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}

      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Team Name</label>
        <div className="flex gap-2">
          <input
            value={teamName}
            onChange={(e) => setTeamNameLocal(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
          />
          <button
            disabled={pending}
            onClick={() => run(() => updateTeamName(team.id, teamName))}
            className="rounded-lg bg-slate-200 px-4 text-sm font-bold text-navy-900"
          >
            Save
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-navy-900">Players (exactly 2 required for READY)</p>
          {locked && (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-700">
              Locked (set status to DRAFT to change players)
            </span>
          )}
        </div>
        <PlayerSlot
          label="Player 1"
          current={player1}
          disabled={locked || pending}
          players={availablePlayers}
          onAssign={(playerId) => run(() => assignPlayerToTeam(team.id, playerId, 1))}
          onRemove={() => run(() => removePlayerFromTeam(team.id, 1))}
        />
        <div className="mt-3">
          <PlayerSlot
            label="Player 2"
            current={player2}
            disabled={locked || pending}
            players={availablePlayers}
            onAssign={(playerId) => run(() => assignPlayerToTeam(team.id, playerId, 2))}
            onRemove={() => run(() => removePlayerFromTeam(team.id, 2))}
          />
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <p className="mb-3 text-sm font-bold text-navy-900">Registration Status</p>
        <div className="flex flex-wrap gap-2">
          {(['DRAFT', 'READY', 'WITHDRAWN'] as const).map((status) => (
            <button
              key={status}
              disabled={pending}
              onClick={() => run(() => setTeamStatus(team.id, status))}
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase ${
                team.registration_status === status
                  ? 'bg-navy-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          A team cannot be marked READY unless it has exactly 2 players assigned.
        </p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Seed / Rank (optional)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
          />
          <button
            disabled={pending}
            onClick={() => run(() => setTeamSeed(team.id, seed ? Number(seed) : null))}
            className="rounded-lg bg-slate-200 px-4 text-sm font-bold text-navy-900"
          >
            Save
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm sm:p-6">
        Payment status: <span className="font-bold text-navy-900">{team.payment_status}</span>. Manage payments from
        the Payments section.
      </div>
    </div>
  );
}

function PlayerSlot({
  label,
  current,
  players,
  disabled,
  onAssign,
  onRemove,
}: {
  label: string;
  current?: { id: string; name: string; mobile: string };
  players: Player[];
  disabled?: boolean;
  onAssign: (playerId: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs font-bold uppercase text-slate-500">{label}</span>
      {current ? (
        <>
          <span className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-navy-900">
            {current.name}
          </span>
          <button
            disabled={disabled}
            onClick={onRemove}
            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-50"
          >
            Remove
          </button>
        </>
      ) : (
        <select
          disabled={disabled}
          defaultValue=""
          onChange={(e) => e.target.value && onAssign(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
        >
          <option value="">— Select player —</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.village ? `(${p.village})` : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
