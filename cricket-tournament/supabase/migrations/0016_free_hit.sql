-- ============================================================================
-- Migration 0016: Free Hit after a no-ball
--
-- The ball immediately after a no-ball is a Free Hit: if a wicket falls on
-- it, no runs are deducted (the wicket_penalty is skipped), though the
-- dismissal and bowler credit still record as normal in this simplified
-- model. If that next ball is itself a wide, the Free Hit carries over and
-- keeps applying until a legal delivery (a RUN or WICKET ball -- the same
-- balls that already advance the over count) is bowled.
--
-- innings.free_hit_active tracks whether the *next* ball is a free hit.
-- scoring_events.is_free_hit records whether *that particular* ball was
-- played under one (for the UI to tag it, and so undo_last_ball can restore
-- the innings' free-hit state to what it was before that ball).
--
-- Also fixes a gap from migration 0015: undo_last_ball only reversed a
-- striker's credited runs for plain RUN events, so undoing a no-ball that
-- was hit for a boundary left the striker's personal total wrong. The new
-- scoring_events.bat_runs column records exactly how many runs were
-- credited to the striker for RUN and NO_BALL events (vs. the full `runs`
-- column, which for a no-ball also includes the fixed penalty that isn't
-- credited to anyone), so undo can reverse precisely that amount.
-- ============================================================================

alter table innings add column free_hit_active boolean not null default false;
alter table scoring_events add column is_free_hit boolean not null default false;
alter table scoring_events add column bat_runs integer;

-- Surface free_hit_active on the public live-match view too, so the
-- viewer-facing scoreboard can show the same "Free Hit" banner as admin.
-- The two new columns are appended at the end of the select list --
-- CREATE OR REPLACE VIEW can only add columns after the existing ones, not
-- insert or reorder them, or Postgres rejects it with error 42P16.
create or replace view v_live_match_summary as
select
  m.id as match_id,
  m.share_code,
  m.stage,
  m.status,
  m.venue,
  m.overs,
  m.match_date,
  m.match_time,
  ta.id as team_a_id,
  ta.team_name as team_a_name,
  tb.id as team_b_id,
  tb.team_name as team_b_name,
  m.winner_team_id,
  mr.result_type,
  mr.summary as result_summary,
  i1.id as innings1_id,
  i1.innings_number as innings1_number,
  i1.batting_team_id as innings1_batting_team_id,
  i1.total_runs as innings1_runs,
  i1.wickets as innings1_wickets,
  i1.balls_bowled as innings1_balls,
  i1.status as innings1_status,
  i1.striker_id as innings1_striker_id,
  i1.non_striker_id as innings1_non_striker_id,
  i2.id as innings2_id,
  i2.innings_number as innings2_number,
  i2.batting_team_id as innings2_batting_team_id,
  i2.total_runs as innings2_runs,
  i2.wickets as innings2_wickets,
  i2.balls_bowled as innings2_balls,
  i2.status as innings2_status,
  i2.target as innings2_target,
  i2.striker_id as innings2_striker_id,
  i2.non_striker_id as innings2_non_striker_id,
  i1.free_hit_active as innings1_free_hit_active,
  i2.free_hit_active as innings2_free_hit_active
from matches m
left join teams ta on ta.id = m.team_a_id
left join teams tb on tb.id = m.team_b_id
left join match_results mr on mr.match_id = m.id
left join innings i1 on i1.match_id = m.id and i1.innings_number = 1
left join innings i2 on i2.match_id = m.id and i2.innings_number = 2;

grant select on v_live_match_summary to anon, authenticated;

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
  v_is_free_hit boolean;
  v_new_free_hit boolean;
  v_increments_ball boolean := true;
  v_seq integer;
  v_over integer;
  v_ball integer;
  v_new_balls integer;
  v_over_completed boolean;
  v_swap_for_bat_runs boolean := false;
  v_swap_strike boolean;
  v_final_commentary text := p_commentary;
  v_credited_runs integer;
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

  v_is_free_hit := v_innings.free_hit_active;

  select * into v_tournament from tournaments where id = (select tournament_id from matches where id = p_match_id);

  if p_event_type = 'WICKET' then
    v_is_wicket := true;
    v_runs := case when v_is_free_hit then 0 else v_tournament.wicket_penalty end;
    v_increments_ball := true;
    v_new_free_hit := false;
    if p_dismissal_type is null then
      raise exception 'dismissal_type is required for a WICKET event';
    end if;
  elsif p_event_type = 'WIDE' then
    v_runs := v_tournament.wide_run_value;
    v_increments_ball := false;
    v_new_free_hit := v_is_free_hit; -- carries over
  elsif p_event_type = 'NO_BALL' then
    if p_bat_runs is not null and p_bat_runs not in (0, 1, 2, 3, 4, 6) then
      raise exception 'Invalid runs off the bat on a no-ball: %', p_bat_runs;
    end if;
    v_runs := v_tournament.no_ball_run_value + coalesce(p_bat_runs, 0);
    v_increments_ball := false;
    v_new_free_hit := true; -- every no-ball grants/renews the free hit
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
    v_credited_runs := p_bat_runs;
  elsif p_event_type = 'NO_BALL' then
    v_credited_runs := 0;
  end if;

  insert into scoring_events (
    client_event_id, match_id, innings_id, sequence_number, over_number, ball_number,
    event_type, runs, is_wicket, dismissal_type, striker_id, non_striker_id, bowler_id, admin_user_id,
    field_zone, commentary, is_free_hit, bat_runs
  ) values (
    p_client_event_id, p_match_id, p_innings_id, v_seq, v_over, v_ball,
    p_event_type, v_runs, v_is_wicket, p_dismissal_type, p_striker_id, p_non_striker_id, p_bowler_id, p_admin_user_id,
    p_field_zone, v_final_commentary, v_is_free_hit, v_credited_runs
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
    bowler_id = coalesce(p_bowler_id, bowler_id),
    free_hit_active = v_new_free_hit
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
  v_is_free_hit boolean;
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

  v_is_free_hit := v_innings.free_hit_active;

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
    field_zone, commentary, is_free_hit, bat_runs
  ) values (
    p_client_event_id, p_match_id, p_innings_id, v_seq, v_over, v_ball,
    'RUN', p_runs, false, p_striker_id, p_non_striker_id, p_bowler_id, p_admin_user_id,
    p_field_zone, v_final_commentary, v_is_free_hit, p_runs
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
    bowler_id = coalesce(p_bowler_id, bowler_id),
    free_hit_active = false -- a RUN ball is always a legal delivery, ending any active free hit
  where id = p_innings_id;

  perform check_and_auto_complete_match(p_innings_id, p_admin_user_id);

  return v_result;
end;
$$;

-- Reversal now also restores the innings' free-hit state to whatever it was
-- before the undone ball (scoring_events.is_free_hit already records that),
-- and reverses exactly the runs that were credited to the striker via the
-- new bat_runs column -- correct for both plain RUN balls and a no-ball hit
-- for a boundary, where bat_runs is less than the ball's full `runs` value.
create or replace function undo_last_ball(p_innings_id uuid, p_admin_user_id uuid)
returns scoring_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event scoring_events;
begin
  if not is_admin() then
    raise exception 'Only tournament admins can undo scoring events' using errcode = '42501';
  end if;

  select * into v_event from scoring_events
    where innings_id = p_innings_id and is_undone = false and event_type <> 'CORRECTION'
    order by sequence_number desc limit 1 for update;

  if not found then
    raise exception 'No ball to undo for this innings';
  end if;

  update scoring_events set is_undone = true, undone_at = now(), undone_by = p_admin_user_id
    where id = v_event.id;

  update innings set
    total_runs = total_runs - v_event.runs,
    wickets = wickets - (case when v_event.is_wicket then 1 else 0 end),
    balls_bowled = balls_bowled - (case when v_event.event_type in ('RUN', 'WICKET') then 1 else 0 end),
    free_hit_active = v_event.is_free_hit
  where id = p_innings_id;

  if v_event.bat_runs is not null and v_event.striker_id is not null then
    update match_players set runs_scored = runs_scored - v_event.bat_runs
      where match_id = v_event.match_id and player_id = v_event.striker_id;
  end if;

  insert into audit_logs (entity_type, entity_id, action, old_value, performed_by)
    values ('scoring_events', v_event.id, 'UNDO', to_jsonb(v_event), p_admin_user_id);

  return v_event;
end;
$$;
