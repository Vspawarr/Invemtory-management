-- ============================================================================
-- Migration 0007: Automatic strike rotation
--
-- Standard cricket running-between-wickets rule: the striker and non-striker
-- swap ends when an odd number of runs (1 or 3) is scored off the bat, and
-- also swap at the end of every completed over (so the same batsman doesn't
-- face every ball). These two triggers combine with an XOR: if both happen
-- on the same ball (e.g. a single off the last ball of the over), they
-- cancel out and the striker stays the same for the next over.
--
-- Wickets alone do not rotate strike (a wicket is a team-score adjustment
-- per the tournament's -2 rule, not a change of batsman -- see README §3),
-- but a wicket ball still counts toward the over, so it can still trigger
-- the end-of-over swap. Wide/no-ball extras never rotate strike (no running
-- is tracked for them in this simplified model).
--
-- This replaces record_ball_run() and record_ball_event() from migration
-- 0002 with versions that add strike rotation; everything else (idempotency,
-- locking, batting-run tracking) is unchanged.
-- ============================================================================

create or replace function record_ball_event(
  p_client_event_id uuid,
  p_match_id uuid,
  p_innings_id uuid,
  p_event_type text,
  p_dismissal_type text default null,
  p_striker_id uuid default null,
  p_non_striker_id uuid default null,
  p_bowler_id uuid default null,
  p_admin_user_id uuid default null
)
returns scoring_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing scoring_events;
  v_tournament tournaments%rowtype;
  v_innings innings%rowtype;
  v_runs integer;
  v_is_wicket boolean := false;
  v_increments_ball boolean := true;
  v_seq integer;
  v_over integer;
  v_ball integer;
  v_new_balls integer;
  v_over_completed boolean;
  v_swap_strike boolean;
  v_result scoring_events;
begin
  if not is_admin() then
    raise exception 'Only tournament admins can record scoring events' using errcode = '42501';
  end if;

  select * into v_existing from scoring_events where client_event_id = p_client_event_id;
  if found then
    return v_existing;
  end if;

  select * into v_innings from innings where id = p_innings_id for update;
  if not found then
    raise exception 'Innings % not found', p_innings_id;
  end if;
  if v_innings.status = 'COMPLETED' then
    raise exception 'Innings is already completed; cannot add more balls';
  end if;

  select * into v_tournament from tournaments where id = (select tournament_id from matches where id = p_match_id);

  if p_event_type = 'WICKET' then
    v_is_wicket := true;
    v_runs := v_tournament.wicket_penalty;
    v_increments_ball := true;
    if p_dismissal_type is null then
      raise exception 'dismissal_type is required for a WICKET event';
    end if;
  elsif p_event_type = 'WIDE' then
    v_runs := v_tournament.wide_run_value;
    v_increments_ball := false;
  elsif p_event_type = 'NO_BALL' then
    v_runs := v_tournament.no_ball_run_value;
    v_increments_ball := false;
  elsif p_event_type = 'RUN' then
    raise exception 'Use record_ball_run() for RUN events (needs explicit run count)';
  else
    raise exception 'Unsupported event_type % for record_ball_event', p_event_type;
  end if;

  v_seq := coalesce((select max(sequence_number) from scoring_events where innings_id = p_innings_id), 0) + 1;
  v_over := v_innings.balls_bowled / 6;
  v_ball := (v_innings.balls_bowled % 6) + 1;

  insert into scoring_events (
    client_event_id, match_id, innings_id, sequence_number, over_number, ball_number,
    event_type, runs, is_wicket, dismissal_type, striker_id, non_striker_id, bowler_id, admin_user_id
  ) values (
    p_client_event_id, p_match_id, p_innings_id, v_seq, v_over, v_ball,
    p_event_type, v_runs, v_is_wicket, p_dismissal_type, p_striker_id, p_non_striker_id, p_bowler_id, p_admin_user_id
  ) returning * into v_result;

  v_new_balls := v_innings.balls_bowled + (case when v_increments_ball then 1 else 0 end);
  v_over_completed := v_increments_ball and (v_new_balls % 6 = 0);
  -- WICKET/WIDE/NO_BALL never rotate strike on their own -- only end-of-over does.
  v_swap_strike := v_over_completed;

  update innings set
    total_runs = total_runs + v_runs,
    wickets = wickets + (case when v_is_wicket then 1 else 0 end),
    balls_bowled = v_new_balls,
    striker_id = case when v_swap_strike then coalesce(p_non_striker_id, non_striker_id)
                       else coalesce(p_striker_id, striker_id) end,
    non_striker_id = case when v_swap_strike then coalesce(p_striker_id, striker_id)
                           else coalesce(p_non_striker_id, non_striker_id) end,
    bowler_id = coalesce(p_bowler_id, bowler_id)
  where id = p_innings_id;

  if v_is_wicket and p_bowler_id is not null then
    update match_players set wickets_taken = wickets_taken + 1
      where match_id = p_match_id and player_id = p_bowler_id;
  end if;

  return v_result;
end;
$$;

create or replace function record_ball_run(
  p_client_event_id uuid,
  p_match_id uuid,
  p_innings_id uuid,
  p_runs integer,
  p_striker_id uuid,
  p_non_striker_id uuid default null,
  p_bowler_id uuid default null,
  p_admin_user_id uuid default null
)
returns scoring_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing scoring_events;
  v_innings innings%rowtype;
  v_seq integer;
  v_over integer;
  v_ball integer;
  v_new_balls integer;
  v_over_completed boolean;
  v_swap_for_runs boolean;
  v_swap_strike boolean;
  v_result scoring_events;
begin
  if not is_admin() then
    raise exception 'Only tournament admins can record scoring events' using errcode = '42501';
  end if;
  if p_runs < 0 or p_runs > 6 or p_runs = 5 then
    raise exception 'Invalid run value: %', p_runs;
  end if;

  select * into v_existing from scoring_events where client_event_id = p_client_event_id;
  if found then
    return v_existing;
  end if;

  select * into v_innings from innings where id = p_innings_id for update;
  if not found then
    raise exception 'Innings % not found', p_innings_id;
  end if;
  if v_innings.status = 'COMPLETED' then
    raise exception 'Innings is already completed; cannot add more balls';
  end if;

  v_seq := coalesce((select max(sequence_number) from scoring_events where innings_id = p_innings_id), 0) + 1;
  v_over := v_innings.balls_bowled / 6;
  v_ball := (v_innings.balls_bowled % 6) + 1;

  insert into scoring_events (
    client_event_id, match_id, innings_id, sequence_number, over_number, ball_number,
    event_type, runs, is_wicket, striker_id, non_striker_id, bowler_id, admin_user_id
  ) values (
    p_client_event_id, p_match_id, p_innings_id, v_seq, v_over, v_ball,
    'RUN', p_runs, false, p_striker_id, p_non_striker_id, p_bowler_id, p_admin_user_id
  ) returning * into v_result;

  v_new_balls := v_innings.balls_bowled + 1;
  v_over_completed := (v_new_balls % 6 = 0);
  v_swap_for_runs := (p_runs % 2) <> 0; -- odd runs (1 or 3) rotate strike
  v_swap_strike := v_over_completed <> v_swap_for_runs; -- XOR: cancel out if both happen

  update innings set
    total_runs = total_runs + p_runs,
    balls_bowled = v_new_balls,
    striker_id = case when v_swap_strike then coalesce(p_non_striker_id, non_striker_id)
                       else coalesce(p_striker_id, striker_id) end,
    non_striker_id = case when v_swap_strike then coalesce(p_striker_id, striker_id)
                           else coalesce(p_non_striker_id, non_striker_id) end,
    bowler_id = coalesce(p_bowler_id, bowler_id)
  where id = p_innings_id;

  if p_striker_id is not null then
    perform ensure_player_statistics_row(p_striker_id);
    update match_players set runs_scored = runs_scored + p_runs
      where match_id = p_match_id and player_id = p_striker_id;
  end if;

  return v_result;
end;
$$;
