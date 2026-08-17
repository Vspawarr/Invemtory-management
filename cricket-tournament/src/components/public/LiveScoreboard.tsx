'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ShareButtons from '@/components/public/ShareButtons';
import ScoreCard from '@/components/ScoreCard';
import BallByBall from '@/components/BallByBall';
import { ballsToOversLabel, runRate, requiredRunRate, formatEventLabel, DISMISSAL_LABELS, STAGE_LABELS } from '@/lib/cricket';
import type { LiveMatchSummary, ScoringEvent } from '@/types/database';
import type { MatchPlayerWithName } from '@/lib/actions/queries-match';

export default function LiveScoreboard({
  matchId,
  shareCode,
  initialMatch,
  initialEvents,
  playerNames,
  initialMatchPlayers,
  siteUrl,
}: {
  matchId: string;
  shareCode: string;
  initialMatch: LiveMatchSummary;
  initialEvents: ScoringEvent[];
  playerNames: Record<string, string>;
  initialMatchPlayers: MatchPlayerWithName[];
  siteUrl: string;
}) {
  const [match, setMatch] = useState(initialMatch);
  const [events, setEvents] = useState(initialEvents);
  const [matchPlayers, setMatchPlayers] = useState(initialMatchPlayers);
  const [connected, setConnected] = useState(true);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    async function refetch() {
      const { data: m } = await supabase
        .from('v_live_match_summary')
        .select('*')
        .eq('match_id', matchId)
        .maybeSingle();
      if (m) setMatch(m);

      const activeInningsId = m?.innings2_id && m.innings2_status === 'IN_PROGRESS' ? m.innings2_id : m?.innings1_id;
      if (activeInningsId) {
        const { data: ev } = await supabase
          .from('scoring_events')
          .select('*')
          .eq('innings_id', activeInningsId)
          .eq('is_undone', false)
          .order('sequence_number', { ascending: false })
          .limit(200);
        setEvents((ev ?? []).reverse());
      }

      const { data: mp } = await supabase
        .from('match_players')
        .select('*, player:players(name)')
        .eq('match_id', matchId);
      if (mp) {
        setMatchPlayers(
          (mp as unknown as (MatchPlayerWithName & { player: { name: string } | null })[]).map((row) => ({
            ...row,
            player_name: row.player?.name ?? 'Unknown',
          }))
        );
      }
    }

    const channel = supabase
      .channel(`live-match-${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scoring_events', filter: `match_id=eq.${matchId}` }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'innings', filter: `match_id=eq.${matchId}` }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results', filter: `match_id=eq.${matchId}` }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_players', filter: `match_id=eq.${matchId}` }, refetch)
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, supabase]);

  const isSecondInnings = !!match.innings2_id && match.innings2_status !== null;
  const activeInnings = isSecondInnings && match.innings2_status === 'IN_PROGRESS'
    ? {
        runs: match.innings2_runs ?? 0,
        wickets: match.innings2_wickets ?? 0,
        balls: match.innings2_balls ?? 0,
        battingTeamId: match.innings2_batting_team_id,
        strikerId: match.innings2_striker_id,
        nonStrikerId: match.innings2_non_striker_id,
        target: match.innings2_target,
      }
    : {
        runs: match.innings1_runs ?? 0,
        wickets: match.innings1_wickets ?? 0,
        balls: match.innings1_balls ?? 0,
        battingTeamId: match.innings1_batting_team_id,
        strikerId: match.innings1_striker_id,
        nonStrikerId: match.innings1_non_striker_id,
        target: null as number | null,
      };

  const battingTeamName = activeInnings.battingTeamId === match.team_a_id ? match.team_a_name : match.team_b_name;
  const bowlingTeamName = activeInnings.battingTeamId === match.team_a_id ? match.team_b_name : match.team_a_name;
  const oversLabel = ballsToOversLabel(activeInnings.balls);
  const crr = runRate(activeInnings.runs, activeInnings.balls);
  const ballsRemaining = match.overs * 6 - activeInnings.balls;
  const rrr = activeInnings.target
    ? requiredRunRate(activeInnings.target, activeInnings.runs, ballsRemaining)
    : null;

  const lastEvent = events[events.length - 1];
  const isLive = match.status === 'LIVE';
  const liveUrl = `${siteUrl}/live/${shareCode}`;

  function scoreForTeam(teamId: string | null) {
    if (!teamId) return null;
    if (match.innings1_batting_team_id === teamId) {
      return { runs: match.innings1_runs ?? 0, wickets: match.innings1_wickets ?? 0 };
    }
    if (match.innings2_batting_team_id === teamId) {
      return { runs: match.innings2_runs ?? 0, wickets: match.innings2_wickets ?? 0 };
    }
    return null;
  }
  const teamAScore = scoreForTeam(match.team_a_id);
  const teamBScore = scoreForTeam(match.team_b_id);

  function scorecardFor(teamId: string | null) {
    if (!teamId) return [];
    return matchPlayers
      .filter((mp) => mp.team_id === teamId)
      .map((mp) => ({
        id: mp.player_id,
        name: mp.player_name,
        runs: mp.runs_scored,
        isStriker: mp.player_id === activeInnings.strikerId,
        isNonStriker: mp.player_id === activeInnings.nonStrikerId,
      }));
  }
  const isCompleted = match.status === 'COMPLETED';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold uppercase tracking-wide text-navy-600">
          {STAGE_LABELS[match.stage] ?? match.stage}
          {match.venue ? ` · ${match.venue}` : ''}
        </span>
        <ConnectionDot connected={connected} />
      </div>

      {/* Scoreboard */}
      <div className="overflow-hidden rounded-2xl bg-navy-900 text-white shadow-lg">
        <div className="flex items-center justify-between bg-navy-950 px-4 py-2">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-red-500">
              <span className="live-pulse h-2 w-2 rounded-full bg-red-500" /> Live
            </span>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wide text-white/60">
              {match.status}
            </span>
          )}
          <span className="text-xs font-semibold text-white/60">Match Overs: {match.overs}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 px-4 py-5 text-center">
          <TeamScore
            name={match.team_a_name}
            isBatting={activeInnings.battingTeamId === match.team_a_id && match.status === 'LIVE'}
            runs={teamAScore?.runs ?? null}
            wickets={teamAScore?.wickets ?? null}
          />
          <TeamScore
            name={match.team_b_name}
            isBatting={activeInnings.battingTeamId === match.team_b_id && match.status === 'LIVE'}
            runs={teamBScore?.runs ?? null}
            wickets={teamBScore?.wickets ?? null}
          />
        </div>

        {match.status === 'LIVE' && (
          <div className="grid grid-cols-3 gap-2 border-t border-white/10 px-4 py-3 text-center text-xs">
            <Stat label="Overs" value={`${oversLabel} / ${match.overs}`} />
            <Stat label="Run Rate" value={crr.toFixed(2)} />
            {rrr !== null ? (
              <Stat label="Req. Rate" value={rrr.toFixed(2)} />
            ) : (
              <Stat label="Batting" value={battingTeamName ?? '—'} />
            )}
          </div>
        )}

        {activeInnings.target && match.status === 'LIVE' && (
          <p className="border-t border-white/10 px-4 py-2 text-center text-xs font-semibold text-gold-300">
            Target: {activeInnings.target} · {bowlingTeamName} need {Math.max(0, (activeInnings.target ?? 0) - activeInnings.runs)} runs from {ballsRemaining} balls
          </p>
        )}

        {match.status === 'COMPLETED' && (
          <div className="border-t border-white/10 px-4 py-3 text-center">
            <p className="text-sm font-black uppercase text-gold-400">Result</p>
            <p className="text-base font-bold">{match.result_summary || 'Match completed'}</p>
          </div>
        )}
      </div>

      {/* Current players */}
      {match.status === 'LIVE' && (activeInnings.strikerId || activeInnings.nonStrikerId) && (
        <div className="flex gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <PlayerChip label="Striker" name={activeInnings.strikerId ? playerNames[activeInnings.strikerId] : undefined} active />
          <PlayerChip label="Partner" name={activeInnings.nonStrikerId ? playerNames[activeInnings.nonStrikerId] : undefined} />
        </div>
      )}

      {/* Wicket / last-ball highlight */}
      {lastEvent && lastEvent.is_wicket && (
        <div className="rounded-xl border-2 border-red-600 bg-red-50 p-4 text-center">
          <p className="text-2xl font-black uppercase text-red-600">Wicket</p>
          <p className="text-3xl font-black text-red-600">-2 Runs</p>
          <p className="mt-1 text-xs font-semibold text-red-700">
            {lastEvent.dismissal_type ? DISMISSAL_LABELS[lastEvent.dismissal_type] : ''} · 2 runs deducted for wicket (tournament rule)
          </p>
        </div>
      )}

      {/* Last balls */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Last Balls</p>
        <div className="flex flex-wrap gap-2">
          {events.length === 0 && <span className="text-xs text-slate-400">No balls bowled yet.</span>}
          {events.slice(-12).map((e) => (
            <span
              key={e.id}
              className={`grid h-9 w-9 place-items-center rounded-full text-xs font-black ${
                e.is_wicket
                  ? 'bg-red-600 text-white'
                  : e.event_type === 'WIDE' || e.event_type === 'NO_BALL'
                  ? 'bg-gold-500 text-navy-900'
                  : e.runs >= 4
                  ? 'bg-navy-900 text-gold-400'
                  : 'bg-slate-200 text-navy-900'
              }`}
              title={e.event_type}
            >
              {formatEventLabel(e)}
            </span>
          ))}
        </div>
      </div>

      {/* Scorecard(s) -- both teams once the match is complete, just the batting team while live */}
      {isCompleted ? (
        <>
          <ScoreCard teamName={match.team_a_name ?? 'Team A'} players={scorecardFor(match.team_a_id)} events={events} />
          <ScoreCard teamName={match.team_b_name ?? 'Team B'} players={scorecardFor(match.team_b_id)} events={events} />
        </>
      ) : (
        battingTeamName && (
          <ScoreCard teamName={`${battingTeamName} — Batting`} players={scorecardFor(activeInnings.battingTeamId)} events={events} />
        )
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Full Ball-by-Ball</p>
        <BallByBall events={events} playerNames={playerNames} />
      </div>

      <ShareButtons url={liveUrl} text={`Live: ${match.team_a_name} vs ${match.team_b_name}`} />
    </div>
  );
}

function TeamScore({
  name,
  runs,
  wickets,
  isBatting,
}: {
  name: string | null;
  runs: number | null;
  wickets: number | null;
  isBatting: boolean;
}) {
  return (
    <div className={isBatting ? 'rounded-lg bg-white/10 py-2' : ''}>
      <p className="truncate text-sm font-bold text-white/90">{name ?? 'TBD'}</p>
      <p className="text-3xl font-black">
        {runs !== null ? runs : '-'}
        {wickets !== null && <span className="text-lg font-bold text-white/70">/{wickets}</span>}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-white/50">{label}</p>
      <p className="font-bold text-gold-300">{value}</p>
    </div>
  );
}

function PlayerChip({ label, name, active }: { label: string; name?: string; active?: boolean }) {
  return (
    <div className="flex-1">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`truncate text-sm font-bold ${active ? 'text-red-600' : 'text-navy-900'}`}>
        {name ?? '—'} {active && '*'}
      </p>
    </div>
  );
}

function ConnectionDot({ connected }: { connected: boolean }) {
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
      <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {connected ? 'Live updates on' : 'Reconnecting…'}
    </span>
  );
}
