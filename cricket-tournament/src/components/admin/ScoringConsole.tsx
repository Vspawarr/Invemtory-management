'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { startSecondInnings, endInnings, setBatsmen, swapStrike } from '@/lib/actions/matches';
import { ballsToOversLabel, formatEventLabel, DISMISSAL_LABELS } from '@/lib/cricket';
import ScoreCard from '@/components/ScoreCard';
import BallByBall from '@/components/BallByBall';
import FieldPositionModal, { WIDE_COMMENTARY_CHIPS } from '@/components/admin/FieldPositionModal';
import type { Innings, ScoringEvent, DismissalType, AdminUser, MatchStatus } from '@/types/database';
import type { MatchPlayerWithName } from '@/lib/actions/queries-match';

interface RosterPlayer {
  id: string;
  name: string;
  bowlingStyle?: string | null;
  battingStyle?: 'RIGHT_HAND' | 'LEFT_HAND' | null;
}

type PendingAction =
  | { type: 'RUN'; runs: number }
  | { type: 'EXTRA'; eventType: 'WIDE' | 'NO_BALL'; batRuns?: number }
  | { type: 'WICKET'; dismissal: DismissalType };

// For these dismissal types the ball never reaches a fielder (it hits the
// stumps, pad, or wicket directly), so a wagon-wheel "where did it go" tap
// doesn't apply -- only CAUGHT and RUN_OUT (and the catch-all OTHER) involve
// an actual field position.
const NO_FIELD_ZONE_DISMISSALS: DismissalType[] = ['BOWLED', 'LBW', 'STUMPED', 'HIT_WICKET'];

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function useOnlineStatus() {
  return useSyncExternalStore(
    subscribeOnlineStatus,
    () => navigator.onLine,
    () => true
  );
}

export default function ScoringConsole({
  matchId,
  matchOvers,
  matchMaxBallsOverride,
  teamAId,
  teamAName,
  teamBName,
  initialInnings,
  battingRoster,
  bowlingRoster,
  admin,
  initialEvents,
  initialMatchPlayers,
}: {
  matchId: string;
  matchOvers: number;
  matchMaxBallsOverride?: number | null;
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
  initialInnings: Innings;
  battingRoster: RosterPlayer[];
  bowlingRoster: RosterPlayer[];
  admin: AdminUser;
  initialEvents: ScoringEvent[];
  initialMatchPlayers: MatchPlayerWithName[];
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [innings, setInnings] = useState(initialInnings);
  const [events, setEvents] = useState(initialEvents);
  const [matchPlayers, setMatchPlayers] = useState(initialMatchPlayers);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const online = useOnlineStatus();
  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [noBallModalOpen, setNoBallModalOpen] = useState(false);
  const [correctingEvent, setCorrectingEvent] = useState<ScoringEvent | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [bowlerId, setBowlerId] = useState('');
  const [bowlerPromptOpen, setBowlerPromptOpen] = useState(false);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('LIVE');
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  const [otherInningsTotal, setOtherInningsTotal] = useState<number | null>(null);
  const [startingSuperOver, setStartingSuperOver] = useState(false);
  // Synchronous lock (refs update immediately, unlike state) so a second tap
  // arriving before React re-renders can't slip past the `submitting` check.
  const submitLockRef = useRef(false);
  // Tracks the last-seen balls_bowled so we can detect "an over just
  // completed" after a refresh, to trigger the bowler-change prompt.
  const prevBallsBowledRef = useRef(initialInnings.balls_bowled);

  const maxBalls = matchMaxBallsOverride ?? matchOvers * 6;

  async function refreshInnings() {
    const { data } = await supabase.from('innings').select('*').eq('id', innings.id).single();
    if (data) {
      const overJustCompleted =
        data.balls_bowled > prevBallsBowledRef.current &&
        data.balls_bowled % 6 === 0 &&
        data.balls_bowled < maxBalls &&
        data.status !== 'COMPLETED';
      prevBallsBowledRef.current = data.balls_bowled;
      setInnings(data);
      if (overJustCompleted) {
        // A bowler can't bowl two overs in a row -- if only one other
        // bowler is available (true for this tournament's 2-player teams),
        // just assign them automatically instead of prompting.
        const eligible = bowlingRoster.filter((p) => p.id !== bowlerId);
        if (eligible.length === 1) {
          setBowlerId(eligible[0].id);
        } else {
          setBowlerPromptOpen(true);
        }
      }

      if (data.innings_number === 2) {
        const { data: firstInnings } = await supabase
          .from('innings')
          .select('total_runs')
          .eq('match_id', matchId)
          .eq('innings_number', 1)
          .maybeSingle();
        setOtherInningsTotal(firstInnings?.total_runs ?? null);
      }
    }
    const { data: ev } = await supabase
      .from('scoring_events')
      .select('*')
      .eq('innings_id', innings.id)
      .eq('is_undone', false)
      .order('sequence_number', { ascending: false })
      .limit(200);
    setEvents((ev ?? []).reverse());

    const { data: mp } = await supabase
      .from('match_players')
      .select('*, player:players(name, bowling_style, batting_style)')
      .eq('match_id', matchId);
    if (mp) {
      setMatchPlayers(
        (
          mp as unknown as (MatchPlayerWithName & {
            player: { name: string; bowling_style: string | null; batting_style: 'RIGHT_HAND' | 'LEFT_HAND' } | null;
          })[]
        ).map((row) => ({
          ...row,
          player_name: row.player?.name ?? 'Unknown',
          player_bowling_style: row.player?.bowling_style ?? null,
          player_batting_style: row.player?.batting_style ?? 'RIGHT_HAND',
        }))
      );
    }

    const { data: m } = await supabase.from('matches').select('status').eq('id', matchId).maybeSingle();
    if (m) setMatchStatus(m.status);
    const { data: mr } = await supabase
      .from('match_results')
      .select('summary')
      .eq('match_id', matchId)
      .maybeSingle();
    setResultSummary(mr?.summary ?? null);
  }

  async function handleStartSuperOver() {
    setStartingSuperOver(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('start_super_over', {
        p_tied_match_id: matchId,
        p_admin_user_id: admin.id,
      });
      if (rpcError) throw new Error(rpcError.message);
      if (data) router.push(`/admin/live-scoring/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start Super Over.');
      setStartingSuperOver(false);
    }
  }

  const battingTeamName = innings.batting_team_id === teamAId ? teamAName : teamBName;
  const bowlingTeamName = innings.batting_team_id === teamAId ? teamBName : teamAName;
  const oversLabel = ballsToOversLabel(innings.balls_bowled);
  const inningsOver = innings.balls_bowled >= maxBalls || innings.status === 'COMPLETED';
  const isTiedAwaitingSuperOver =
    innings.innings_number === 2 &&
    innings.status === 'COMPLETED' &&
    matchStatus !== 'COMPLETED' &&
    otherInningsTotal !== null &&
    innings.total_runs === otherInningsTotal;
  const strikerName = battingRoster.find((p) => p.id === innings.striker_id)?.name;
  const nonStrikerName = battingRoster.find((p) => p.id === innings.non_striker_id)?.name;
  const strikerBattingStyle = battingRoster.find((p) => p.id === innings.striker_id)?.battingStyle;

  const scorecardPlayers = battingRoster.map((p) => ({
    id: p.id,
    name: p.name,
    runs: matchPlayers.find((mp) => mp.player_id === p.id)?.runs_scored ?? 0,
    isStriker: p.id === innings.striker_id,
    isNonStriker: p.id === innings.non_striker_id,
  }));
  const playerNames = Object.fromEntries(matchPlayers.map((mp) => [mp.player_id, mp.player_name]));

  // Guards against duplicate taps: a synchronous ref lock blocks a second tap
  // that arrives before React re-renders with submitting=true, and disables
  // the whole button grid while a request is in flight.
  function guardedSubmit(fn: (clientEventId: string) => Promise<void>) {
    if (submitting || submitLockRef.current) return;
    submitLockRef.current = true;
    if (!online) {
      submitLockRef.current = false;
      setError('You are offline. Reconnect before recording this ball to avoid losing it.');
      return;
    }
    if (!innings.striker_id) {
      submitLockRef.current = false;
      setError('Set the current batsmen before scoring.');
      return;
    }
    if (!bowlerId) {
      submitLockRef.current = false;
      setError('Select the bowler before scoring this ball.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const clientEventId = crypto.randomUUID();
    fn(clientEventId)
      .then(() => refreshInnings())
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to record ball. Please retry.'))
      .finally(() => {
        setSubmitting(false);
        submitLockRef.current = false;
      });
  }

  // Every scoring ball -- runs, extras, and wickets alike -- routes through
  // the field-position diagram before it's actually submitted. The prompt*
  // functions do the same pre-flight checks guardedSubmit would (online,
  // striker, bowler) so the admin isn't sent through picking a field zone
  // and commentary only to be blocked at the very end.
  function precheckCanScore(): boolean {
    if (!online) {
      setError('You are offline. Reconnect before recording this ball to avoid losing it.');
      return false;
    }
    if (!innings.striker_id) {
      setError('Set the current batsmen before scoring.');
      return false;
    }
    if (!bowlerId) {
      setError('Select the bowler before scoring this ball.');
      return false;
    }
    setError(null);
    return true;
  }

  function promptRun(runs: number) {
    if (!precheckCanScore()) return;
    setPendingAction({ type: 'RUN', runs });
  }

  function promptExtra(eventType: 'WIDE') {
    if (!precheckCanScore()) return;
    setPendingAction({ type: 'EXTRA', eventType });
  }

  function promptNoBall(batRuns: number) {
    setNoBallModalOpen(false);
    if (!precheckCanScore()) return;
    setPendingAction({ type: 'EXTRA', eventType: 'NO_BALL', batRuns });
  }

  function promptWicket(dismissal: DismissalType) {
    setWicketModalOpen(false);
    if (!precheckCanScore()) return;
    setPendingAction({ type: 'WICKET', dismissal });
  }

  function handleFieldPositionConfirm(zone: string | null, commentary: string | null) {
    const action = pendingAction;
    setPendingAction(null);
    if (!action) return;

    if (action.type === 'RUN') {
      guardedSubmit(async (clientEventId) => {
        const { error: rpcError } = await supabase.rpc('record_ball_run', {
          p_client_event_id: clientEventId,
          p_match_id: matchId,
          p_innings_id: innings.id,
          p_runs: action.runs,
          p_striker_id: innings.striker_id!,
          p_non_striker_id: innings.non_striker_id,
          p_bowler_id: bowlerId || null,
          p_admin_user_id: admin.id,
          p_field_zone: zone,
          p_commentary: commentary,
        });
        if (rpcError) throw new Error(rpcError.message);
      });
    } else if (action.type === 'EXTRA') {
      guardedSubmit(async (clientEventId) => {
        const { error: rpcError } = await supabase.rpc('record_ball_event', {
          p_client_event_id: clientEventId,
          p_match_id: matchId,
          p_innings_id: innings.id,
          p_event_type: action.eventType,
          p_striker_id: innings.striker_id,
          p_non_striker_id: innings.non_striker_id,
          p_bowler_id: bowlerId || null,
          p_admin_user_id: admin.id,
          p_field_zone: zone,
          p_commentary: commentary,
          p_bat_runs: action.eventType === 'NO_BALL' ? action.batRuns ?? 0 : null,
        });
        if (rpcError) throw new Error(rpcError.message);
      });
    } else {
      guardedSubmit(async (clientEventId) => {
        const { error: rpcError } = await supabase.rpc('record_ball_event', {
          p_client_event_id: clientEventId,
          p_match_id: matchId,
          p_innings_id: innings.id,
          p_event_type: 'WICKET',
          p_dismissal_type: action.dismissal,
          p_striker_id: innings.striker_id,
          p_non_striker_id: innings.non_striker_id,
          p_bowler_id: bowlerId || null,
          p_admin_user_id: admin.id,
          p_field_zone: zone,
          p_commentary: commentary,
        });
        if (rpcError) throw new Error(rpcError.message);
      });
    }
  }

  async function submitCorrection(eventId: string, newRuns: number, reason: string) {
    setSubmitting(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('apply_score_correction', {
        p_client_event_id: crypto.randomUUID(),
        p_original_event_id: eventId,
        p_new_runs: newRuns,
        p_reason: reason,
        p_admin_user_id: admin.id,
      });
      if (rpcError) throw new Error(rpcError.message);
      await refreshInnings();
      setCorrectingEvent(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Correction failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUndo() {
    if (!confirm('Undo the last ball? This will reverse the score.')) return;
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('undo_last_ball', {
        p_innings_id: innings.id,
        p_admin_user_id: admin.id,
      });
      if (rpcError) throw new Error(rpcError.message);
      await refreshInnings();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Undo failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const lastEvent = events[events.length - 1];

  return (
    <div className="space-y-4 pb-6">
      {!online && (
        <div className="rounded-lg bg-amber-100 px-3 py-2 text-center text-xs font-bold text-amber-800">
          ⚠ Offline — scoring paused. Reconnect to continue; nothing is lost.
        </div>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>
      )}

      {/* Sticky score header */}
      <div className="sticky top-14 z-30 overflow-hidden rounded-2xl bg-navy-900 text-white shadow-lg lg:top-0">
        <div className="flex items-center justify-between bg-navy-950 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-red-500">
          <span className="flex items-center gap-1.5">
            <span className="live-pulse h-2 w-2 rounded-full bg-red-500" /> Live Scoring
          </span>
          <span className="text-white/50">{battingTeamName} batting</span>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-4xl font-black">
            {innings.total_runs}
            <span className="text-2xl text-white/60">/{innings.wickets}</span>
          </p>
          <p className="text-sm font-semibold text-gold-300">
            Overs {oversLabel} / {matchOvers} · vs {bowlingTeamName}
          </p>
        </div>
        {innings.free_hit_active && (
          <p className="border-t border-white/10 bg-gold-500 px-4 py-2 text-center text-xs font-black uppercase tracking-wide text-navy-900">
            ⚡ Free Hit — no run penalty if a wicket falls
          </p>
        )}
        {innings.innings_number === 2 && innings.target !== null && (
          <p className="border-t border-white/10 px-4 py-2 text-center text-xs font-semibold text-gold-300">
            Target: {innings.target} · {battingTeamName} need {Math.max(0, innings.target - innings.total_runs)} runs
            from {Math.max(0, maxBalls - innings.balls_bowled)} balls
          </p>
        )}
      </div>

      {/* Current players */}
      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase text-slate-400">Striker</p>
            <p className="truncate text-sm font-bold text-red-600">{strikerName ?? 'Not set'}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase text-slate-400">Partner</p>
            <p className="truncate text-sm font-bold text-navy-900">{nonStrikerName ?? 'Not set'}</p>
          </div>
          <button
            disabled={submitting || !innings.striker_id || !innings.non_striker_id}
            onClick={() =>
              guardedNoScoreAction(() =>
                swapStrike(innings.id, innings.striker_id!, innings.non_striker_id!).then(refreshInnings)
              )
            }
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-navy-900 disabled:opacity-50"
          >
            ⇄ Swap
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <select
            value={innings.striker_id ?? ''}
            onChange={(e) =>
              guardedNoScoreAction(() =>
                setBatsmen(innings.id, e.target.value || null, innings.non_striker_id).then(refreshInnings)
              )
            }
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
          >
            <option value="">Set striker…</option>
            {battingRoster.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={innings.non_striker_id ?? ''}
            onChange={(e) =>
              guardedNoScoreAction(() =>
                setBatsmen(innings.id, innings.striker_id, e.target.value || null).then(refreshInnings)
              )
            }
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
          >
            <option value="">Set partner…</option>
            {battingRoster.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <select
          value={bowlerId}
          onChange={(e) => setBowlerId(e.target.value)}
          required
          className={`mt-2 w-full rounded-lg border px-2 py-1.5 text-xs ${
            bowlerId ? 'border-slate-300' : 'border-red-400 bg-red-50'
          }`}
        >
          <option value="">Select bowler (required)…</option>
          {bowlingRoster.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.bowlingStyle ? ` — ${p.bowlingStyle}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Wicket highlight */}
      {lastEvent && lastEvent.is_wicket && (
        <div className="rounded-xl border-2 border-red-600 bg-red-50 p-3 text-center">
          <p className="text-xl font-black uppercase text-red-600">
            Wicket · {lastEvent.runs === 0 ? 'No Run Penalty (Free Hit)' : `${lastEvent.runs} Runs`}{' '}
            {lastEvent.dismissal_type ? `(${DISMISSAL_LABELS[lastEvent.dismissal_type]})` : ''}
          </p>
        </div>
      )}

      {/* Last balls -- tap any ball to correct a scoring mistake */}
      <div>
        <div className="flex flex-wrap gap-1.5">
          {events
            .filter((e) => e.event_type !== 'CORRECTION')
            .slice(-12)
            .map((e) => (
              <button
                key={e.id}
                onClick={() => setCorrectingEvent(e)}
                className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-black ${
                  e.is_wicket
                    ? 'bg-red-600 text-white'
                    : e.event_type === 'WIDE' || e.event_type === 'NO_BALL'
                    ? 'bg-gold-500 text-navy-900'
                    : 'bg-slate-200 text-navy-900'
                }`}
              >
                {formatEventLabel(e)}
              </button>
            ))}
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Tap a ball above to correct a scoring mistake.</p>
      </div>

      <ScoreCard teamName={`${battingTeamName} — Batting`} players={scorecardPlayers} events={events} />

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Full Ball-by-Ball</p>
        <BallByBall events={events} playerNames={playerNames} />
      </div>

      {inningsOver ? (
        <InningsControls
          matchId={matchId}
          innings={innings}
          bowlingRoster={bowlingRoster}
          onEnded={() => router.refresh()}
          matchStatus={matchStatus}
          resultSummary={resultSummary}
          isTiedAwaitingSuperOver={isTiedAwaitingSuperOver}
          onStartSuperOver={handleStartSuperOver}
          startingSuperOver={startingSuperOver}
        />
      ) : (
        <>
          {/* Scoring buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 6].map((r) => (
              <button
                key={r}
                disabled={submitting}
                onClick={() => promptRun(r)}
                className={`rounded-xl py-5 text-2xl font-black shadow-sm active:scale-95 disabled:opacity-50 ${
                  r === 4 || r === 6 ? 'bg-navy-900 text-gold-400' : 'bg-white text-navy-900 ring-1 ring-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              disabled={submitting}
              onClick={() => setWicketModalOpen(true)}
              className="rounded-xl bg-red-600 py-5 text-lg font-black uppercase text-white shadow-sm active:scale-95 disabled:opacity-50"
            >
              Wicket
            </button>
            <button
              disabled={submitting}
              onClick={() => promptExtra('WIDE')}
              className="rounded-xl bg-gold-500 py-5 text-sm font-black uppercase text-navy-900 shadow-sm active:scale-95 disabled:opacity-50"
            >
              Wide
            </button>
            <button
              disabled={submitting}
              onClick={() => setNoBallModalOpen(true)}
              className="rounded-xl bg-gold-500 py-5 text-sm font-black uppercase text-navy-900 shadow-sm active:scale-95 disabled:opacity-50"
            >
              No Ball
            </button>
          </div>
          <button
            disabled={submitting || events.length === 0}
            onClick={handleUndo}
            className="w-full rounded-xl border-2 border-navy-900 py-3 text-sm font-black uppercase text-navy-900 disabled:opacity-40"
          >
            ↺ Undo Last Ball
          </button>
        </>
      )}

      {wicketModalOpen && (
        <WicketModal
          onSelect={promptWicket}
          onClose={() => setWicketModalOpen(false)}
          freeHitActive={innings.free_hit_active}
        />
      )}

      {pendingAction && (
        <FieldPositionModal
          title={
            pendingAction.type === 'RUN'
              ? `${pendingAction.runs} Run${pendingAction.runs === 1 ? '' : 's'}`
              : pendingAction.type === 'EXTRA'
              ? pendingAction.eventType === 'WIDE'
                ? 'Wide'
                : `No Ball${pendingAction.batRuns ? ` + ${pendingAction.batRuns}` : ''}`
              : `Wicket — ${DISMISSAL_LABELS[pendingAction.dismissal]}`
          }
          showFieldZone={
            pendingAction.type === 'RUN' ||
            (pendingAction.type === 'EXTRA' && pendingAction.eventType === 'NO_BALL') ||
            (pendingAction.type === 'WICKET' && !NO_FIELD_ZONE_DISMISSALS.includes(pendingAction.dismissal))
          }
          commentaryChips={
            pendingAction.type === 'EXTRA' && pendingAction.eventType === 'WIDE' ? WIDE_COMMENTARY_CHIPS : undefined
          }
          mirrored={strikerBattingStyle === 'LEFT_HAND'}
          onConfirm={handleFieldPositionConfirm}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {noBallModalOpen && (
        <NoBallModal onSelect={promptNoBall} onClose={() => setNoBallModalOpen(false)} />
      )}

      {correctingEvent && (
        <CorrectionModal
          event={correctingEvent}
          onSubmit={submitCorrection}
          onClose={() => setCorrectingEvent(null)}
        />
      )}

      {bowlerPromptOpen && (
        <BowlerPromptModal
          bowlingRoster={bowlingRoster.filter((p) => p.id !== bowlerId)}
          onSelect={(id) => {
            setBowlerId(id);
            setBowlerPromptOpen(false);
          }}
          onSkip={() => setBowlerPromptOpen(false)}
        />
      )}
    </div>
  );

  function guardedNoScoreAction(fn: () => Promise<void>) {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    fn()
      .catch((e) => setError(e instanceof Error ? e.message : 'Action failed.'))
      .finally(() => setSubmitting(false));
  }
}

function WicketModal({
  onSelect,
  onClose,
  freeHitActive,
}: {
  onSelect: (dismissal: DismissalType) => void;
  onClose: () => void;
  freeHitActive: boolean;
}) {
  const options: DismissalType[] = ['BOWLED', 'CAUGHT', 'RUN_OUT', 'LBW', 'STUMPED', 'HIT_WICKET', 'OTHER'];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-4 sm:rounded-2xl">
        <p className="mb-3 text-center text-sm font-black uppercase text-red-600">
          Select Dismissal Type {freeHitActive ? '(Free Hit — no runs deducted)' : '(-2 Runs)'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {options.map((d) => (
            <button
              key={d}
              onClick={() => onSelect(d)}
              className="rounded-lg bg-slate-100 py-3 text-sm font-bold text-navy-900 hover:bg-red-50"
            >
              {DISMISSAL_LABELS[d]}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-3 w-full rounded-lg py-2 text-xs font-bold text-slate-500">
          Cancel
        </button>
      </div>
    </div>
  );
}

function NoBallModal({ onSelect, onClose }: { onSelect: (batRuns: number) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-4 sm:rounded-2xl">
        <p className="mb-1 text-center text-sm font-black uppercase text-navy-900">No Ball</p>
        <p className="mb-3 text-center text-xs text-slate-500">
          Runs off the bat, on top of the no-ball penalty
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 6].map((r) => (
            <button
              key={r}
              onClick={() => onSelect(r)}
              className={`rounded-lg py-3 text-lg font-black ${
                r === 4 || r === 6 ? 'bg-navy-900 text-gold-400' : 'bg-slate-100 text-navy-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-3 w-full rounded-lg py-2 text-xs font-bold text-slate-500">
          Cancel
        </button>
      </div>
    </div>
  );
}

function BowlerPromptModal({
  bowlingRoster,
  onSelect,
  onSkip,
}: {
  bowlingRoster: RosterPlayer[];
  onSelect: (playerId: string) => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-4 sm:rounded-2xl">
        <p className="mb-1 text-center text-sm font-black uppercase text-navy-900">Over Complete</p>
        <p className="mb-3 text-center text-xs text-slate-500">Who&apos;s bowling the next over?</p>
        <div className="grid grid-cols-2 gap-2">
          {bowlingRoster.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="rounded-lg bg-slate-100 py-3 text-center text-sm font-bold text-navy-900 hover:bg-gold-500/20"
            >
              {p.name}
              {p.bowlingStyle && <span className="block text-[10px] font-semibold text-slate-500">{p.bowlingStyle}</span>}
            </button>
          ))}
        </div>
        <button onClick={onSkip} className="mt-3 w-full rounded-lg py-2 text-xs font-bold text-slate-500">
          Skip for now
        </button>
      </div>
    </div>
  );
}

function CorrectionModal({
  event,
  onSubmit,
  onClose,
}: {
  event: ScoringEvent;
  onSubmit: (eventId: string, newRuns: number, reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [newRuns, setNewRuns] = useState(event.runs.toString());
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-4 sm:rounded-2xl">
        <p className="mb-1 text-center text-sm font-black uppercase text-navy-900">Correct This Ball</p>
        <p className="mb-3 text-center text-xs text-slate-500">
          Ball {event.over_number}.{event.ball_number} · currently {event.runs} run(s)
        </p>
        <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Corrected Runs</label>
        <input
          type="number"
          value={newRuns}
          onChange={(e) => setNewRuns(e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
        <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Reason (required)</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Accidental 4 entered instead of 2"
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
        <button
          disabled={saving || !reason.trim() || newRuns === ''}
          onClick={() => {
            setSaving(true);
            onSubmit(event.id, Number(newRuns), reason.trim()).finally(() => setSaving(false));
          }}
          className="w-full rounded-lg bg-navy-900 py-3 text-sm font-black uppercase text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Apply Correction'}
        </button>
        <button onClick={onClose} className="mt-2 w-full rounded-lg py-2 text-xs font-bold text-slate-500">
          Cancel
        </button>
      </div>
    </div>
  );
}

function InningsControls({
  matchId,
  innings,
  bowlingRoster,
  onEnded,
  matchStatus,
  resultSummary,
  isTiedAwaitingSuperOver,
  onStartSuperOver,
  startingSuperOver,
}: {
  matchId: string;
  innings: Innings;
  bowlingRoster: RosterPlayer[];
  onEnded: () => void;
  matchStatus: MatchStatus;
  resultSummary: string | null;
  isTiedAwaitingSuperOver: boolean;
  onStartSuperOver: () => void;
  startingSuperOver: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strikerId, setStrikerId] = useState('');
  const [nonStrikerId, setNonStrikerId] = useState('');

  if (innings.innings_number === 1) {
    return (
      <div className="rounded-xl bg-white p-4 text-center shadow-sm">
        <p className="mb-3 text-sm font-bold text-navy-900">First innings complete.</p>
        {error && <p className="mb-2 text-xs font-semibold text-red-600">{error}</p>}
        <p className="mb-1 text-xs text-slate-500">Select the second innings openers ({bowlingRoster.length ? 'bowling side now bats' : ''}):</p>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <select value={strikerId} onChange={(e) => setStrikerId(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-xs">
            <option value="">Striker…</option>
            {bowlingRoster.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select value={nonStrikerId} onChange={(e) => setNonStrikerId(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-xs">
            <option value="">Partner…</option>
            {bowlingRoster.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          disabled={pending || !strikerId || !nonStrikerId}
          onClick={() => {
            setPending(true);
            setError(null);
            endInnings(innings.id)
              .then(() => startSecondInnings(matchId, strikerId, nonStrikerId))
              .then(onEnded)
              .catch((e) => setError(e instanceof Error ? e.message : 'Failed to start 2nd innings.'))
              .finally(() => setPending(false));
          }}
          className="w-full rounded-xl bg-navy-900 py-3 text-sm font-black uppercase text-white disabled:opacity-50"
        >
          Start 2nd Innings
        </button>
      </div>
    );
  }

  if (matchStatus === 'COMPLETED') {
    return (
      <div className="rounded-xl bg-emerald-50 p-4 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Match Complete</p>
        <p className="mt-1 text-lg font-black text-emerald-800">{resultSummary ?? 'Result recorded'}</p>
      </div>
    );
  }

  if (isTiedAwaitingSuperOver) {
    return (
      <div className="rounded-xl border-2 border-gold-500 bg-gold-300/10 p-4 text-center shadow-sm">
        <p className="text-lg font-black uppercase text-navy-900">Match Tied!</p>
        <p className="mt-1 mb-3 text-xs text-slate-600">
          Scores are level after both innings. Start a Super Over to decide the winner.
        </p>
        <button
          disabled={startingSuperOver}
          onClick={onStartSuperOver}
          className="w-full rounded-xl bg-red-600 py-3 text-sm font-black uppercase text-white disabled:opacity-50"
        >
          {startingSuperOver ? 'Starting…' : '⚡ Start Super Over'}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-emerald-50 p-4 text-center shadow-sm">
      <p className="text-sm font-bold text-emerald-700">
        Innings complete. Go to the match page to confirm the winner and complete the match.
      </p>
    </div>
  );
}
