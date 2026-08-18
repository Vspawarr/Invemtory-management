-- ============================================================================
-- Migration 0015: Batting style, runs-off-the-bat on no-balls, and
-- automatic 50/100 milestone commentary
--
-- 1) players.batting_style: right/left hand, set once on the player's
--    profile. Used to mirror the field-position wagon wheel left/right for
--    left-handed batsmen (their off/leg sides are the visual opposite of a
--    right-hander's, viewed from the standard behind-the-bowler angle).
--
-- 2) record_ball_event gains an optional p_bat_runs param for NO_BALL
--    events: a no-ball can still be hit for 1/2/3/4/6 off the bat on top of
--    the fixed no-ball penalty, and those bat runs should be credited to
--    the striker (and can rotate strike on an odd count) just like a normal
--    delivery. WIDE and WICKET are unaffected -- no bat-runs concept there
--    in this simplified model.
--
-- 3) build_milestone_commentary: shared helper that both record_ball_run
--    and the no-ball path in record_ball_event call after crediting the
--    striker, so a ball that takes a batter past 50 or 100 automatically
--    gets "Fifty for <Name>!" / "Century for <Name>!" appended to whatever
--    commentary was recorded for that ball.
-- ============================================================================

alter table players
  add column batting_style text not null default 'RIGHT_HAND'
    check (batting_style in ('RIGHT_HAND', 'LEFT_HAND'));

create or replace function build_milestone_commentary(
  p_player_id uuid,
  p_old_runs integer,
  p_new_runs integer,
  p_commentary text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_milestone text;
begin
  if p_old_runs < 100 and p_new_runs >= 100 then
    select name into v_name from players where id = p_player_id;
    v_milestone := format('Century for %s!', coalesce(v_name, 'the batter'));
  elsif p_old_runs < 50 and p_new_runs >= 50 then
    select name into v_name from players where id = p_player_id;
    v_milestone := format('Fifty for %s!', coalesce(v_name, 'the batter'));
  end if;

  if v_milestone is null then
    return p_commentary;
  end if;
  if coalesce(p_commentary, '') = '' then
    return v_milestone;
  end if;
  return p_commentary || ' — ' || v_milestone;
end;
$$;

create or replace function record_ball_event(
  p_client_event_id uuid,
  p_match_id uuid,
  p_innings_id uuid,
  p_event_type text,
  p_dismissal_type text default null,
  p_striker_id uuid default null,
  p_non_striker_id uuid default null,
  p_bowler_id uuid default null,
  p_admin_user_id uuid default null,
  p_field_zone text default null,
  p_commentary text default null,
  p_bat_runs integer default null
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
  v_swap_for_bat_runs boolean := false;
  v_swap_strike boolean;
  v_final_commentary text := p_commentary;
  v_old_runs integer;
  v_new_runs integer;
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
    if p_bat_runs is not null and p_bat_runs not in (0, 1, 2, 3, 4, 6) then
      raise exception 'Invalid runs off the bat on a no-ball: %', p_bat_runs;
    end if;
    v_runs := v_tournament.no_ball_run_value + coalesce(p_bat_runs, 0);
    v_increments_ball := false;
  elsif p_event_type = 'RUN' then
    raise exception 'Use record_ball_run() for RUN events (needs explicit run count)';
  else
    raise exception 'Unsupported event_type % for record_ball_event', p_event_type;
  end if;

  v_seq := coalesce((select max(sequence_number) from scoring_events where innings_id = p_innings_id), 0) + 1;
  v_over := v_innings.balls_bowled / 6;
  v_ball := (v_innings.balls_bowled % 6) + 1;

  if p_event_type = 'NO_BALL' and p_striker_id is not null and coalesce(p_bat_runs, 0) > 0 then
    perform ensure_player_statistics_row(p_striker_id);
    update match_players set runs_scored = runs_scored + p_bat_runs
      where match_id = p_match_id and player_id = p_striker_id
      returning runs_scored into v_new_runs;
    v_old_runs := v_new_runs - p_bat_runs;
    v_final_commentary := build_milestone_commentary(p_striker_id, v_old_runs, v_new_runs, p_commentary);
    v_swap_for_bat_runs := (p_bat_runs % 2) <> 0;
  end if;

  insert into scoring_events (
    client_event_id, match_id, innings_id, sequence_number, over_number, ball_number,
    event_type, runs, is_wicket, dismissal_type, striker_id, non_striker_id, bowler_id, admin_user_id,
    field_zone, commentary
  ) values (
    p_client_event_id, p_match_id, p_innings_id, v_seq, v_over, v_ball,
    p_event_type, v_runs, v_is_wicket, p_dismissal_type, p_striker_id, p_non_striker_id, p_bowler_id, p_admin_user_id,
    p_field_zone, v_final_commentary
  ) returning * into v_result;

  v_new_balls := v_innings.balls_bowled + (case when v_increments_ball then 1 else 0 end);
  v_over_completed := v_increments_ball and (v_new_balls % 6 = 0);
  -- WICKET/WIDE never rotate strike on their own -- only end-of-over does.
  -- A no-ball hit for odd runs off the bat rotates strike same as a normal
  -- delivery (over_completed is always false here since no-balls don't
  -- advance the ball count, so this is effectively just the bat-runs check).
  v_swap_strike := v_over_completed <> v_swap_for_bat_runs;

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

  perform check_and_auto_complete_match(p_innings_id, p_admin_user_id);

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
  p_admin_user_id uuid default null,
  p_field_zone text default null,
  p_commentary text default null
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
  v_old_runs integer;
  v_new_runs integer;
  v_final_commentary text;
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

  v_final_commentary := p_commentary;
  if p_striker_id is not null then
    perform ensure_player_statistics_row(p_striker_id);
    update match_players set runs_scored = runs_scored + p_runs
      where match_id = p_match_id and player_id = p_striker_id
      returning runs_scored into v_new_runs;
    v_old_runs := v_new_runs - p_runs;
    v_final_commentary := build_milestone_commentary(p_striker_id, v_old_runs, v_new_runs, p_commentary);
  end if;

  insert into scoring_events (
    client_event_id, match_id, innings_id, sequence_number, over_number, ball_number,
    event_type, runs, is_wicket, striker_id, non_striker_id, bowler_id, admin_user_id,
    field_zone, commentary
  ) values (
    p_client_event_id, p_match_id, p_innings_id, v_seq, v_over, v_ball,
    'RUN', p_runs, false, p_striker_id, p_non_striker_id, p_bowler_id, p_admin_user_id,
    p_field_zone, v_final_commentary
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

  perform check_and_auto_complete_match(p_innings_id, p_admin_user_id);

  return v_result;
end;
$$;
