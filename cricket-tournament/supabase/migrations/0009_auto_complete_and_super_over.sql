-- ============================================================================
-- Migration 0009: Auto-declared results + Super Over tie-breaker
--
-- Two behaviors, built into the scoring functions (not the frontend) so they
-- can't be skipped by a slow connection or a missed tap:
--
-- 1. The chasing team's innings stops the instant their total reaches the
--    target -- even mid-over -- and the match is declared immediately.
-- 2. If overs run out without the target being reached, final scores are
--    compared automatically and the result is saved with no manual click.
--
-- If both innings finish level, the match is NOT auto-completed (stats must
-- not apply to a tie that's about to be settled). Instead a Super Over
-- becomes available: a one-tap admin action creates a short extra match
-- (6 balls a side first, 3 balls a side for every Super Over after that if
-- it keeps tying), linked back to the original match. Once a Super Over
-- produces a real winner, that result -- and only that result -- is what
-- gets credited to the original match's stats and points table; the Super
-- Over match itself keeps its own scorecard for the record but is excluded
-- from knockout-eligibility counting and from points-table/stats crediting.
-- ============================================================================

alter table matches add column parent_match_id uuid references matches (id);
alter table matches add column is_super_over boolean not null default false;
alter table matches add column super_over_sequence integer;
alter table matches add column max_balls_override integer;

create unique index matches_super_over_sequence_uidx
  on matches (parent_match_id, super_over_sequence)
  where parent_match_id is not null;

alter table tournaments add column super_over_first_balls integer not null default 6;
alter table tournaments add column super_over_repeat_balls integer not null default 3;

-- ----------------------------------------------------------------------------
-- Effective balls-per-innings for a match: max_balls_override wins when set
-- (used by Super Overs, which aren't whole-over lengths), else overs * 6.
-- ----------------------------------------------------------------------------
create or replace function get_max_balls(p_match_id uuid)
returns integer language sql stable as $$
  select coalesce(max_balls_override, overs * 6) from matches where id = p_match_id;
$$;

-- ----------------------------------------------------------------------------
-- Knockout eligibility never applies to Super Overs, regardless of the
-- parent match's stage -- they're a tie-breaker mechanism, not an
-- additional knockout fixture.
-- ----------------------------------------------------------------------------
create or replace function check_knockout_eligibility(p_player_id uuid, p_match_id uuid)
returns boolean language plpgsql stable as $$
declare
  v_tournament_id uuid;
  v_stage text;
  v_is_super_over boolean;
  v_max integer;
  v_played integer;
begin
  select tournament_id, stage, is_super_over into v_tournament_id, v_stage, v_is_super_over
    from matches where id = p_match_id;
  if v_is_super_over or not is_knockout_stage(v_stage) then
    return true;
  end if;
  select max_knockout_matches_per_player into v_max from tournaments where id = v_tournament_id;
  select knockout_matches_played into v_played from player_statistics where player_id = p_player_id;
  v_played := coalesce(v_played, 0);
  return v_played < v_max;
end;
$$;

create or replace function enforce_knockout_eligibility()
returns trigger language plpgsql as $$
declare
  v_stage text;
  v_is_super_over boolean;
begin
  select stage, is_super_over into v_stage, v_is_super_over from matches where id = new.match_id;
  new.is_knockout := is_knockout_stage(v_stage) and not coalesce(v_is_super_over, false);
  if new.is_knockout and not check_knockout_eligibility(new.player_id, new.match_id) then
    raise exception
      'Player is not eligible for this knockout match. Maximum % knockout matches already completed.',
      (select max_knockout_matches_per_player from tournaments t
         join matches m on m.tournament_id = t.id where m.id = new.match_id)
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- complete_match: guarded against double-completion, and skips the
-- team_statistics/player_statistics increments for Super Over matches (those
-- are recorded for their own scorecard only -- the real stats crediting
-- happens on the original match once the tie is actually resolved).
-- ----------------------------------------------------------------------------
create or replace function complete_match(
  p_match_id uuid,
  p_winner_team_id uuid,
  p_result_type text,
  p_summary text,
  p_admin_user_id uuid
)
returns match_results
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match matches%rowtype;
  v_score_a integer := 0;
  v_score_b integer := 0;
  v_loser uuid;
  v_result match_results;
  v_player record;
begin
  if not is_admin() then
    raise exception 'Only tournament admins can complete matches' using errcode = '42501';
  end if;

  select * into v_match from matches where id = p_match_id for update;
  if not found then
    raise exception 'Match % not found', p_match_id;
  end if;
  if v_match.status = 'COMPLETED' then
    raise exception 'Match is already completed; statistics cannot be re-applied.' using errcode = 'P0001';
  end if;

  select coalesce(sum(total_runs), 0) into v_score_a from innings
    where match_id = p_match_id and batting_team_id = v_match.team_a_id;
  select coalesce(sum(total_runs), 0) into v_score_b from innings
    where match_id = p_match_id and batting_team_id = v_match.team_b_id;

  if p_winner_team_id = v_match.team_a_id then
    v_loser := v_match.team_b_id;
  elsif p_winner_team_id = v_match.team_b_id then
    v_loser := v_match.team_a_id;
  else
    v_loser := null;
  end if;

  update matches set status = 'COMPLETED', winner_team_id = p_winner_team_id where id = p_match_id;
  update innings set status = 'COMPLETED' where match_id = p_match_id;

  insert into match_results (match_id, winner_team_id, loser_team_id, result_type, team_a_score, team_b_score, summary)
    values (p_match_id, p_winner_team_id, v_loser, coalesce(p_result_type, 'WIN'), v_score_a, v_score_b, p_summary)
  on conflict (match_id) do update set
    winner_team_id = excluded.winner_team_id, loser_team_id = excluded.loser_team_id,
    result_type = excluded.result_type, team_a_score = excluded.team_a_score,
    team_b_score = excluded.team_b_score, summary = excluded.summary, completed_at = now()
  returning * into v_result;

  if not v_match.is_super_over then
    if v_match.team_a_id is not null then
      insert into team_statistics (team_id) values (v_match.team_a_id) on conflict do nothing;
      update team_statistics set
        matches_played = matches_played + 1,
        wins = wins + (case when p_winner_team_id = v_match.team_a_id then 1 else 0 end),
        losses = losses + (case when p_winner_team_id is not null and p_winner_team_id <> v_match.team_a_id then 1 else 0 end),
        runs_scored = runs_scored + v_score_a,
        runs_conceded = runs_conceded + v_score_b,
        updated_at = now()
      where team_id = v_match.team_a_id;
    end if;
    if v_match.team_b_id is not null then
      insert into team_statistics (team_id) values (v_match.team_b_id) on conflict do nothing;
      update team_statistics set
        matches_played = matches_played + 1,
        wins = wins + (case when p_winner_team_id = v_match.team_b_id then 1 else 0 end),
        losses = losses + (case when p_winner_team_id is not null and p_winner_team_id <> v_match.team_b_id then 1 else 0 end),
        runs_scored = runs_scored + v_score_b,
        runs_conceded = runs_conceded + v_score_a,
        updated_at = now()
      where team_id = v_match.team_b_id;
    end if;

    for v_player in select * from match_players where match_id = p_match_id loop
      perform ensure_player_statistics_row(v_player.player_id);
      update player_statistics set
        wins = wins + (case when p_winner_team_id = v_player.team_id then 1 else 0 end),
        losses = losses + (case when p_winner_team_id is not null and p_winner_team_id <> v_player.team_id then 1 else 0 end),
        runs_scored = runs_scored + v_player.runs_scored,
        wickets_taken = wickets_taken + v_player.wickets_taken,
        highest_score = greatest(highest_score, v_player.runs_scored),
        updated_at = now()
      where player_id = v_player.player_id;
    end loop;
  end if;

  insert into audit_logs (entity_type, entity_id, action, new_value, performed_by)
    values ('matches', p_match_id, 'COMPLETE_MATCH', to_jsonb(v_result), p_admin_user_id);

  return v_result;
end;
$$;

-- ----------------------------------------------------------------------------
-- The auto-declare brain. Called after every ball is recorded. Runs are
-- silent no-ops unless the second innings has genuinely just finished.
-- ----------------------------------------------------------------------------
create or replace function check_and_auto_complete_match(p_innings_id uuid, p_admin_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_innings innings%rowtype;
  v_match matches%rowtype;
  v_max_balls integer;
  v_innings1 innings%rowtype;
  v_winner uuid;
  v_winner_name text;
  v_margin integer;
  v_balls_remaining integer;
  v_summary text;
  v_tied boolean;
begin
  select * into v_innings from innings where id = p_innings_id;
  select * into v_match from matches where id = v_innings.match_id;
  if v_match.status = 'COMPLETED' then
    return;
  end if;
  v_max_balls := get_max_balls(v_match.id);

  if v_innings.innings_number = 1 then
    if v_innings.balls_bowled >= v_max_balls and v_innings.status <> 'COMPLETED' then
      update innings set status = 'COMPLETED' where id = p_innings_id;
    end if;
    return;
  end if;

  if v_innings.status = 'COMPLETED' then
    return;
  end if;

  if (v_innings.target is not null and v_innings.total_runs >= v_innings.target)
     or v_innings.balls_bowled >= v_max_balls then

    update innings set status = 'COMPLETED' where id = p_innings_id;
    select * into v_innings from innings where id = p_innings_id;
    select * into v_innings1 from innings where match_id = v_innings.match_id and innings_number = 1;

    v_tied := v_innings.total_runs = v_innings1.total_runs;

    if v_tied then
      if v_match.is_super_over then
        -- this Super Over tied too -- record it (no stats impact) so the
        -- admin sees "tied" and can start the next, shorter Super Over.
        perform complete_match(v_match.id, null, 'TIE', 'Super Over tied', p_admin_user_id);
      end if;
      -- The original match is intentionally left un-completed on a tie --
      -- stats must not apply until the tie is actually resolved.
      return;
    end if;

    if v_innings.total_runs > v_innings1.total_runs then
      v_winner := v_innings.batting_team_id;
      v_balls_remaining := v_max_balls - v_innings.balls_bowled;
      select team_name into v_winner_name from teams where id = v_winner;
      v_summary := format('%s won by %s ball%s remaining', v_winner_name, v_balls_remaining,
                           case when v_balls_remaining = 1 then '' else 's' end);
    else
      v_winner := v_innings.bowling_team_id;
      v_margin := v_innings1.total_runs - v_innings.total_runs;
      select team_name into v_winner_name from teams where id = v_winner;
      v_summary := format('%s won by %s run%s', v_winner_name, v_margin,
                           case when v_margin = 1 then '' else 's' end);
    end if;

    if v_match.is_super_over then
      -- record the Super Over's own result for its scorecard (stats skipped)
      perform complete_match(v_match.id, v_winner, 'WIN', v_summary, p_admin_user_id);
      -- ...and credit the ORIGINAL match's stats/points table exactly once
      perform complete_match(v_match.parent_match_id, v_winner, 'WIN',
        format('Match tied — %s won the Super Over', v_winner_name), p_admin_user_id);
    else
      perform complete_match(v_match.id, v_winner, 'WIN', v_summary, p_admin_user_id);
    end if;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- record_ball_event / record_ball_run: same bodies as migration 0007
-- (strike rotation), with a call to check_and_auto_complete_match() added
-- at the end of each.
-- ----------------------------------------------------------------------------
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
  v_swap_for_runs := (p_runs % 2) <> 0;
  v_swap_strike := v_over_completed <> v_swap_for_runs;

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

  perform check_and_auto_complete_match(p_innings_id, p_admin_user_id);

  return v_result;
end;
$$;

-- ----------------------------------------------------------------------------
-- start_super_over: one-tap creation of the next Super Over. p_tied_match_id
-- is whichever match/Super Over JUST tied (the original match if this is the
-- first Super Over, or the previous Super Over if it also tied) -- the app
-- is responsible for passing the latest one in the chain.
-- ----------------------------------------------------------------------------
create or replace function start_super_over(p_tied_match_id uuid, p_admin_user_id uuid)
returns matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tied_match matches%rowtype;
  v_root_match matches%rowtype;
  v_tied_innings1 innings%rowtype;
  v_tied_innings2 innings%rowtype;
  v_tournament tournaments%rowtype;
  v_sequence integer;
  v_balls integer;
  v_batting_team uuid;
  v_bowling_team uuid;
  v_match_number integer;
  v_new_match matches%rowtype;
begin
  if not is_admin() then
    raise exception 'Only tournament admins can start a Super Over' using errcode = '42501';
  end if;

  select * into v_tied_match from matches where id = p_tied_match_id;
  if not found then
    raise exception 'Match % not found', p_tied_match_id;
  end if;

  select * into v_tied_innings1 from innings where match_id = p_tied_match_id and innings_number = 1;
  select * into v_tied_innings2 from innings where match_id = p_tied_match_id and innings_number = 2;
  if v_tied_innings2 is null or v_tied_innings2.status <> 'COMPLETED'
     or v_tied_innings1.total_runs <> v_tied_innings2.total_runs then
    raise exception 'This match is not tied and awaiting a Super Over.' using errcode = 'P0001';
  end if;

  v_root_match := v_tied_match;
  if v_tied_match.parent_match_id is not null then
    select * into v_root_match from matches where id = v_tied_match.parent_match_id;
  end if;

  select * into v_tournament from tournaments where id = v_root_match.tournament_id;

  v_sequence := coalesce(v_tied_match.super_over_sequence, 0) + 1;
  v_balls := case when v_sequence = 1 then v_tournament.super_over_first_balls else v_tournament.super_over_repeat_balls end;

  -- team that batted second in the just-tied contest bats first here
  v_batting_team := v_tied_innings2.batting_team_id;
  v_bowling_team := v_tied_innings2.bowling_team_id;

  select coalesce(max(match_number), 0) + 1 into v_match_number
    from matches where tournament_id = v_root_match.tournament_id;

  insert into matches (
    tournament_id, match_number, stage, team_a_id, team_b_id, venue, overs,
    status, parent_match_id, is_super_over, super_over_sequence, max_balls_override
  ) values (
    v_root_match.tournament_id, v_match_number, v_root_match.stage, v_root_match.team_a_id, v_root_match.team_b_id,
    v_root_match.venue, greatest(1, v_balls / 6), 'LIVE', v_root_match.id, true, v_sequence, v_balls
  ) returning * into v_new_match;

  insert into match_players (match_id, team_id, player_id)
  select v_new_match.id, tp.team_id, tp.player_id
  from team_players tp
  where tp.team_id in (v_root_match.team_a_id, v_root_match.team_b_id);

  insert into innings (match_id, innings_number, batting_team_id, bowling_team_id, striker_id, non_striker_id)
  values (
    v_new_match.id, 1, v_batting_team, v_bowling_team,
    (select player_id from team_players where team_id = v_batting_team and position = 1),
    (select player_id from team_players where team_id = v_batting_team and position = 2)
  );

  insert into audit_logs (entity_type, entity_id, action, new_value, performed_by)
    values ('matches', v_new_match.id, 'START_SUPER_OVER', to_jsonb(v_new_match), p_admin_user_id);

  return v_new_match;
end;
$$;
