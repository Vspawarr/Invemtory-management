'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminMatchRow } from '@/lib/actions/queries-admin';
import type { MatchPlayerWithName } from '@/lib/actions/queries-match';
import { addMatchRoster, startMatch, completeMatchAction, cancelMatch } from '@/lib/actions/matches';
import { isKnockoutStage } from '@/lib/cricket';
import type { ResultType } from '@/types/database';

interface TeamRosterInfo {
  id: string;
  team_name: string;
  players: { id: string; name: string }[];
}

export default function MatchDetailPanel({
  match,
  teamA,
  teamB,
  roster,
  hasInnings,
  latestInningsStatus,
}: {
  match: AdminMatchRow;
  teamA: TeamRosterInfo | null;
  teamB: TeamRosterInfo | null;
  roster: MatchPlayerWithName[];
  hasInnings: boolean;
  latestInningsStatus: 'IN_PROGRESS' | 'COMPLETED' | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rosterMessage, setRosterMessage] = useState<string | null>(null);
  const [battingTeamId, setBattingTeamId] = useState('');
  const [winnerTeamId, setWinnerTeamId] = useState('');
  const [resultType, setResultType] = useState<ResultType>('WIN');
  const [summary, setSummary] = useState('');
  const [manualOverrideOpen, setManualOverrideOpen] = useState(false);
  const autoAddAttemptedRef = useRef(false);

  // Players are added to a scheduled match's roster automatically as soon as
  // both teams are known -- no manual "Add Both Teams' Players" click needed
  // for the common case. The button below stays as a manual retry (e.g.
  // after a blocked knockout player is resolved, or a team's roster changes).
  useEffect(() => {
    if (
      autoAddAttemptedRef.current ||
      match.status !== 'SCHEDULED' ||
      !match.team_a_id ||
      !match.team_b_id ||
      roster.length > 0
    ) {
      return;
    }
    autoAddAttemptedRef.current = true;
    startTransition(async () => {
      try {
        const result = await addMatchRoster(match.id);
        if (result.blocked.length > 0) {
          setRosterMessage(
            result.blocked
              .map((b) => `${b.name}: Player is not eligible for this knockout match. Maximum knockout matches already completed.`)
              .join(' ')
          );
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not automatically add players to this match.');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id, match.status, match.team_a_id, match.team_b_id, roster.length]);

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

  const rosterComplete = teamA && teamB
    ? teamA.players.every((p) => roster.some((r) => r.player_id === p.id)) &&
      teamB.players.every((p) => roster.some((r) => r.player_id === p.id))
    : false;

  return (
    <div className="space-y-6">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}

      {isKnockoutStage(match.stage) && (
        <div className="rounded-xl border border-gold-500 bg-gold-300/20 p-4 text-xs font-semibold text-navy-900">
          This is a knockout-stage match. Players who have already played 3 knockout matches will be
          automatically blocked from this match&apos;s roster.
        </div>
      )}

      {/* Roster */}
      {match.status === 'SCHEDULED' && (
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
          <p className="mb-3 text-sm font-bold text-navy-900">Match Roster</p>
          {roster.length > 0 ? (
            <ul className="mb-3 space-y-1 text-sm text-slate-600">
              {roster.map((r) => (
                <li key={r.id}>✓ {r.player_name}</li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-slate-500">No players added to this match yet.</p>
          )}
          <button
            disabled={pending || !match.team_a_id || !match.team_b_id}
            onClick={() =>
              run(async () => {
                const result = await addMatchRoster(match.id);
                if (result.blocked.length > 0) {
                  setRosterMessage(
                    result.blocked
                      .map((b) => `${b.name}: Player is not eligible for this knockout match. Maximum knockout matches already completed.`)
                      .join(' ')
                  );
                } else {
                  setRosterMessage(null);
                }
              })
            }
            className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Add Both Teams&apos; Players
          </button>
          {rosterMessage && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              ⚠ {rosterMessage}
            </p>
          )}
        </div>
      )}

      {/* Start match */}
      {match.status === 'SCHEDULED' && !hasInnings && (
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
          <p className="mb-3 text-sm font-bold text-navy-900">Start Match (Toss)</p>
          <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Batting First</label>
          <select
            value={battingTeamId}
            onChange={(e) => setBattingTeamId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          >
            <option value="">— Select team —</option>
            {teamA && <option value={teamA.id}>{teamA.team_name}</option>}
            {teamB && <option value={teamB.id}>{teamB.team_name}</option>}
          </select>
          <button
            disabled={pending || !battingTeamId || !rosterComplete}
            onClick={() => {
              const battingTeam = battingTeamId === teamA?.id ? teamA : teamB;
              if (!battingTeam || battingTeam.players.length < 2) {
                setError('The batting team must have exactly 2 rostered players.');
                return;
              }
              run(() => startMatch(match.id, battingTeamId, battingTeam.players[0].id, battingTeam.players[1].id));
            }}
            className="mt-3 w-full rounded-lg bg-red-600 py-3 text-sm font-black uppercase text-white disabled:opacity-50"
          >
            Start Match
          </button>
          {!rosterComplete && (
            <p className="mt-2 text-xs text-slate-400">Add the match roster before starting.</p>
          )}
        </div>
      )}

      {match.status === 'LIVE' && (
        <div className="rounded-xl bg-red-50 p-4 text-center shadow-sm">
          <p className="mb-2 text-sm font-bold text-red-700">Match is live.</p>
          <a
            href={`/admin/live-scoring/${match.id}`}
            className="inline-block rounded-lg bg-red-600 px-6 py-3 text-sm font-black uppercase text-white"
          >
            Go to Live Scoring →
          </a>
        </div>
      )}

      {match.status === 'LIVE' && hasInnings && latestInningsStatus === 'COMPLETED' && (
        <div className="rounded-xl border-2 border-gold-500 bg-white p-4 shadow-sm sm:p-6">
          <p className="mb-1 text-sm font-bold text-navy-900">Complete Match</p>
          <p className="mb-3 text-xs text-slate-500">
            Both innings have finished but a result wasn&apos;t declared automatically (e.g. a tie, or an
            unusual finish). Confirm the winner below.
          </p>
          <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Winner</label>
          <select
            value={winnerTeamId}
            onChange={(e) => setWinnerTeamId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          >
            <option value="">— Select winner —</option>
            {teamA && <option value={teamA.id}>{teamA.team_name}</option>}
            {teamB && <option value={teamB.id}>{teamB.team_name}</option>}
            <option value="">Tie / No Result</option>
          </select>
          <div className="mt-3 flex gap-2">
            {(['WIN', 'TIE', 'NO_RESULT'] as ResultType[]).map((rt) => (
              <button
                key={rt}
                onClick={() => setResultType(rt)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase ${
                  resultType === rt ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {rt.replace('_', ' ')}
              </button>
            ))}
          </div>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Result summary, e.g. Team A won by 8 runs"
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
          <button
            disabled={pending}
            onClick={() =>
              run(() => completeMatchAction(match.id, winnerTeamId || null, resultType, summary))
            }
            className="mt-3 w-full rounded-lg bg-emerald-600 py-3 text-sm font-black uppercase text-white disabled:opacity-50"
          >
            Confirm Result &amp; Complete Match
          </button>
        </div>
      )}

      {match.status === 'LIVE' && hasInnings && latestInningsStatus !== 'COMPLETED' && (
        <div>
          {!manualOverrideOpen ? (
            <button
              onClick={() => setManualOverrideOpen(true)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 hover:underline"
            >
              Match abandoned or needs to be ended early?
            </button>
          ) : (
            <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
              <p className="mb-1 text-sm font-bold text-navy-900">Manually End Match</p>
              <p className="mb-3 text-xs text-slate-500">
                Only use this to abandon the match early (e.g. rain). Otherwise the result is declared
                automatically as soon as the target is reached or overs run out.
              </p>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Winner</label>
              <select
                value={winnerTeamId}
                onChange={(e) => setWinnerTeamId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="">— Select winner —</option>
                {teamA && <option value={teamA.id}>{teamA.team_name}</option>}
                {teamB && <option value={teamB.id}>{teamB.team_name}</option>}
                <option value="">Tie / No Result</option>
              </select>
              <div className="mt-3 flex gap-2">
                {(['WIN', 'TIE', 'NO_RESULT'] as ResultType[]).map((rt) => (
                  <button
                    key={rt}
                    onClick={() => setResultType(rt)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase ${
                      resultType === rt ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rt.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Result summary, e.g. Team A abandoned, ASD won by default"
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
              <button
                disabled={pending}
                onClick={() =>
                  run(() => completeMatchAction(match.id, winnerTeamId || null, resultType, summary))
                }
                className="mt-3 w-full rounded-lg bg-emerald-600 py-3 text-sm font-black uppercase text-white disabled:opacity-50"
              >
                Confirm Result &amp; Complete Match
              </button>
              <button
                onClick={() => setManualOverrideOpen(false)}
                className="mt-2 w-full rounded-lg py-2 text-xs font-bold text-slate-500"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {match.status === 'SCHEDULED' && (
        <button
          disabled={pending}
          onClick={() => {
            if (confirm('Cancel this match?')) run(() => cancelMatch(match.id));
          }}
          className="text-xs font-bold text-red-600 hover:underline"
        >
          Cancel Match
        </button>
      )}
    </div>
  );
}
