-- ============================================================================
-- Migration 0002: Functions & triggers
-- ============================================================================

-- ----------------------------------------------------------------------------
-- generic updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_tournaments_updated_at before update on tournaments
  for each row execute function set_updated_at();
create trigger trg_tournament_rules_updated_at before update on tournament_rules
  for each row execute function set_updated_at();
create trigger trg_players_updated_at before update on players
  for each row execute function set_updated_at();
create trigger trg_teams_updated_at before update on teams
  for each row execute function set_updated_at();
create trigger trg_payments_updated_at before update on payments
  for each row execute function set_updated_at();
create trigger trg_matches_updated_at before update on matches
  for each row execute function set_updated_at();
create trigger trg_innings_updated_at before update on innings
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- is_admin(): true if the current auth user is a registered admin
-- ----------------------------------------------------------------------------
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$;

-- ----------------------------------------------------------------------------
-- team_players: enforce max 2 players per team; READY requires exactly 2
-- ----------------------------------------------------------------------------
create or replace function enforce_team_player_limit()
returns trigger language plpgsql as $$
declare
  player_count integer;
begin
  select count(*) into player_count from team_players where team_id = new.team_id;
  if player_count >= 2 then
    raise exception 'Team already has 2 players assigned (double wicket teams must have exactly 2)';
  end if;
  return new;
end;
$$;

create trigger trg_team_players_limit before insert on team_players
  for each row execute function enforce_team_player_limit();

create or replace function enforce_team_ready_requires_two_players()
returns trigger language plpgsql as $$
declare
  player_count integer;
begin
  if new.registration_status = 'READY' then
    select count(*) into player_count from team_players where team_id = new.id;
    if player_count <> 2 then
      raise exception 'Team must have exactly 2 players before it can be marked READY (has %)', player_count;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_teams_ready_check before insert or update of registration_status on teams
  for each row execute function enforce_team_ready_requires_two_players();

-- ----------------------------------------------------------------------------
-- registration_number generator: REG-0001, REG-0002, ...
-- ----------------------------------------------------------------------------
create sequence if not exists registration_number_seq start 1;

create or replace function generate_registration_number()
returns trigger language plpgsql as $$
begin
  if new.registration_number is null then
    new.registration_number := 'REG-' || lpad(nextval('registration_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger trg_registrations_number before insert on registrations
  for each row execute function generate_registration_number();

-- keep team.payment_status in sync with its latest payment row
create or replace function sync_team_payment_status()
returns trigger language plpgsql as $$
begin
  update teams set payment_status = new.status where id = new.team_id;
  return new;
end;
$$;

create trigger trg_payments_sync_team after insert or update of status on payments
  for each row execute function sync_team_payment_status();

-- ----------------------------------------------------------------------------
-- match share_code generator: short, URL-friendly code for /live/[matchId]
-- ----------------------------------------------------------------------------
create or replace function generate_share_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  exists_already boolean;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    select exists(select 1 from matches where share_code = code) into exists_already;
    exit when not exists_already;
  end loop;
  return code;
end;
$$;

create or replace function set_match_share_code()
returns trigger language plpgsql as $$
begin
  if new.share_code is null then
    new.share_code := generate_share_code();
  end if;
  return new;
end;
$$;

create trigger trg_matches_share_code before insert on matches
  for each row execute function set_match_share_code();

-- ----------------------------------------------------------------------------
-- Knockout eligibility: a player may play at most N knockout matches
-- (N = tournaments.max_knockout_matches_per_player). League/pre-knockout
-- matches never count. Enforced server-side so the UI cannot be bypassed.
-- ----------------------------------------------------------------------------
create or replace function check_knockout_eligibility(p_player_id uuid, p_match_id uuid)
returns boolean language plpgsql stable as $$
declare
  v_tournament_id uuid;
  v_stage text;
  v_max integer;
  v_played integer;
begin
  select tournament_id, stage into v_tournament_id, v_stage from matches where id = p_match_id;
  if not is_knockout_stage(v_stage) then
    return true; -- limit only applies to knockout matches
  end if;
  select max_knockout_matches_per_player into v_max
    from tournaments where id = v_tournament_id;
  select knockout_matches_played into v_played
    from player_statistics where player_id = p_player_id;
  v_played := coalesce(v_played, 0);
  return v_played < v_max;
end;
$$;

create or replace function enforce_knockout_eligibility()
returns trigger language plpgsql as $$
declare
  v_stage text;
  v_max integer;
  v_played integer;
begin
  select stage into v_stage from matches where id = new.match_id;
  new.is_knockout := is_knockout_stage(v_stage);
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

create trigger trg_match_players_knockout_check before insert on match_players
  for each row execute function enforce_knockout_eligibility();

-- when a match_players row is added/removed for a knockout match, keep the
-- player's knockout_matches_played counter in player_statistics accurate
create or replace function ensure_player_statistics_row(p_player_id uuid)
returns void language plpgsql as $$
begin
  insert into player_statistics (player_id) values (p_player_id)
  on conflict (player_id) do nothing;
end;
$$;

create or replace function recompute_player_knockout_count()
returns trigger language plpgsql as $$
declare
  v_player_id uuid;
begin
  v_player_id := coalesce(new.player_id, old.player_id);
  perform ensure_player_statistics_row(v_player_id);
  update player_statistics
    set knockout_matches_played = (
          select count(*) from match_players
          where player_id = v_player_id and is_knockout = true
        ),
        matches_played = (
          select count(*) from match_players where player_id = v_player_id
        ),
        updated_at = now()
    where player_id = v_player_id;
  return coalesce(new, old);
end;
$$;

create trigger trg_match_players_stats_count after insert or delete on match_players
  for each row execute function recompute_player_knockout_count();

-- ----------------------------------------------------------------------------
-- Ball-by-ball scoring engine
-- ----------------------------------------------------------------------------

-- Record one ball event atomically. Idempotent on client_event_id: calling
-- again with the same client_event_id (e.g. after a network retry) returns
-- the original event instead of creating a duplicate.
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
  if v_increments_ball then
    v_over := v_innings.balls_bowled / 6;
    v_ball := (v_innings.balls_bowled % 6) + 1;
  else
    v_over := v_innings.balls_bowled / 6;
    v_ball := (v_innings.balls_bowled % 6) + 1; -- extras are logged against the ball being re-bowled
  end if;

  insert into scoring_events (
    client_event_id, match_id, innings_id, sequence_number, over_number, ball_number,
    event_type, runs, is_wicket, dismissal_type, striker_id, non_striker_id, bowler_id, admin_user_id
  ) values (
    p_client_event_id, p_match_id, p_innings_id, v_seq, v_over, v_ball,
    p_event_type, v_runs, v_is_wicket, p_dismissal_type, p_striker_id, p_non_striker_id, p_bowler_id, p_admin_user_id
  ) returning * into v_result;

  update innings set
    total_runs = total_runs + v_runs,
    wickets = wickets + (case when v_is_wicket then 1 else 0 end),
    balls_bowled = balls_bowled + (case when v_increments_ball then 1 else 0 end),
    striker_id = coalesce(p_striker_id, striker_id),
    non_striker_id = coalesce(p_non_striker_id, non_striker_id),
    bowler_id = coalesce(p_bowler_id, bowler_id)
  where id = p_innings_id;

  -- Wicket credit is only attributed to a bowling-side player when the admin
  -- explicitly selects one (double-wicket cricket has no fixed bowler rotation
  -- in the source rules, so we never guess this attribution).
  if v_is_wicket and p_bowler_id is not null then
    update match_players set wickets_taken = wickets_taken + 1
      where match_id = p_match_id and player_id = p_bowler_id;
  end if;

  return v_result;
end;
$$;

-- Record runs off the bat (0/1/2/3/4/6). Batting runs are tracked separately
-- from wicket deductions per match_players.runs_scored (never mixed).
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

  update innings set
    total_runs = total_runs + p_runs,
    balls_bowled = balls_bowled + 1,
    striker_id = coalesce(p_striker_id, striker_id),
    non_striker_id = coalesce(p_non_striker_id, non_striker_id),
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

-- Undo the most recent (non-undone) ball for an innings. Soft-deletes the
-- event (is_undone = true) so audit history is preserved, and reverses its
-- effect on the innings score / batting stats.
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
    balls_bowled = balls_bowled - (case when v_event.event_type in ('RUN', 'WICKET') then 1 else 0 end)
  where id = p_innings_id;

  if v_event.event_type = 'RUN' and v_event.striker_id is not null then
    update match_players set runs_scored = runs_scored - v_event.runs
      where match_id = v_event.match_id and player_id = v_event.striker_id;
  end if;

  insert into audit_logs (entity_type, entity_id, action, old_value, performed_by)
    values ('scoring_events', v_event.id, 'UNDO', to_jsonb(v_event), p_admin_user_id);

  return v_event;
end;
$$;

-- Score correction: records the old/new values, reason, and admin, and
-- applies the delta to the innings total. The original event is left intact
-- for audit purposes; a CORRECTION event captures the adjustment.
create or replace function apply_score_correction(
  p_client_event_id uuid,
  p_original_event_id uuid,
  p_new_runs integer,
  p_reason text,
  p_admin_user_id uuid
)
returns scoring_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing scoring_events;
  v_original scoring_events;
  v_delta integer;
  v_seq integer;
  v_result scoring_events;
begin
  if not is_admin() then
    raise exception 'Only tournament admins can correct scores' using errcode = '42501';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required for score corrections';
  end if;

  select * into v_existing from scoring_events where client_event_id = p_client_event_id;
  if found then
    return v_existing;
  end if;

  select * into v_original from scoring_events where id = p_original_event_id for update;
  if not found then
    raise exception 'Original event % not found', p_original_event_id;
  end if;

  v_delta := p_new_runs - v_original.runs;
  v_seq := coalesce((select max(sequence_number) from scoring_events where innings_id = v_original.innings_id), 0) + 1;

  insert into scoring_events (
    client_event_id, match_id, innings_id, sequence_number, over_number, ball_number,
    event_type, runs, striker_id, non_striker_id, bowler_id,
    corrects_event_id, reason, admin_user_id
  ) values (
    p_client_event_id, v_original.match_id, v_original.innings_id, v_seq, v_original.over_number, v_original.ball_number,
    'CORRECTION', v_delta, v_original.striker_id, v_original.non_striker_id, v_original.bowler_id,
    v_original.id, p_reason, p_admin_user_id
  ) returning * into v_result;

  update innings set total_runs = total_runs + v_delta where id = v_original.innings_id;

  if v_original.event_type = 'RUN' and v_original.striker_id is not null then
    update match_players set runs_scored = runs_scored + v_delta
      where match_id = v_original.match_id and player_id = v_original.striker_id;
  end if;

  insert into audit_logs (entity_type, entity_id, action, old_value, new_value, reason, performed_by)
    values ('scoring_events', v_original.id, 'CORRECTION',
            jsonb_build_object('runs', v_original.runs),
            jsonb_build_object('runs', p_new_runs),
            p_reason, p_admin_user_id);

  return v_result;
end;
$$;

-- ----------------------------------------------------------------------------
-- Match completion: record result, update team/player win-loss statistics
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

  -- team statistics
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

  -- player win/loss + highest score
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

  insert into audit_logs (entity_type, entity_id, action, new_value, performed_by)
    values ('matches', p_match_id, 'COMPLETE_MATCH', to_jsonb(v_result), p_admin_user_id);

  return v_result;
end;
$$;
