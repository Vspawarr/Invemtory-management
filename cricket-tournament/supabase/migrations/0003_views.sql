-- ============================================================================
-- Migration 0003: Public-safe views
--
-- These views intentionally omit sensitive columns (mobile numbers, payment
-- transaction references, verifier identities, admin ids). They are owned by
-- the migration role (not by anon/authenticated), so PostgREST/Supabase
-- exposes them read-only through the views' own grants below rather than the
-- underlying tables' RLS -- the standard Supabase pattern for column-level
-- public exposure.
-- ============================================================================

create view v_players_public as
select
  p.id,
  p.tournament_id,
  p.name,
  p.village,
  p.age,
  p.photo_url,
  p.is_active,
  t.id as team_id,
  t.team_name
from players p
left join team_players tp on tp.player_id = p.id
left join teams t on t.id = tp.team_id
where p.is_active = true;

create view v_teams_public as
select
  t.id,
  t.tournament_id,
  t.team_name,
  t.registration_status,
  t.payment_status,
  t.seed,
  t.is_active,
  jsonb_agg(
    jsonb_build_object('id', p.id, 'name', p.name, 'village', p.village)
    order by tp.position
  ) filter (where p.id is not null) as players
from teams t
left join team_players tp on tp.team_id = t.id
left join players p on p.id = tp.player_id
group by t.id;

create view v_matches_public as
select
  m.id,
  m.tournament_id,
  m.match_number,
  m.stage,
  m.match_date,
  m.match_time,
  m.venue,
  m.overs,
  m.status,
  m.share_code,
  m.winner_team_id,
  ta.team_name as team_a_name,
  tb.team_name as team_b_name,
  m.team_a_id,
  m.team_b_id
from matches m
left join teams ta on ta.id = m.team_a_id
left join teams tb on tb.id = m.team_b_id;

create view v_player_leaderboard as
select
  p.id as player_id,
  p.name,
  p.village,
  t.id as team_id,
  t.team_name,
  coalesce(ps.matches_played, 0) as matches_played,
  coalesce(ps.runs_scored, 0) as runs_scored,
  coalesce(ps.wickets_taken, 0) as wickets_taken,
  coalesce(ps.knockout_matches_played, 0) as knockout_matches_played,
  coalesce(ps.wins, 0) as wins,
  coalesce(ps.losses, 0) as losses,
  coalesce(ps.highest_score, 0) as highest_score,
  case when coalesce(ps.matches_played, 0) > 0
    then round(coalesce(ps.runs_scored, 0)::numeric / ps.matches_played, 2)
    else 0 end as average_runs,
  greatest(0, (select max_knockout_matches_per_player from tournaments limit 1) - coalesce(ps.knockout_matches_played, 0)) as knockout_matches_remaining
from players p
left join player_statistics ps on ps.player_id = p.id
left join team_players tp on tp.player_id = p.id
left join teams t on t.id = tp.team_id
where p.is_active = true
order by coalesce(ps.runs_scored, 0) desc, coalesce(ps.wickets_taken, 0) desc;

create view v_team_leaderboard as
select
  t.id as team_id,
  t.team_name,
  jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name) order by tp.position) filter (where p.id is not null) as players,
  coalesce(ts.matches_played, 0) as matches_played,
  coalesce(ts.wins, 0) as wins,
  coalesce(ts.losses, 0) as losses,
  coalesce(ts.runs_scored, 0) as runs_scored,
  coalesce(ts.runs_conceded, 0) as runs_conceded,
  coalesce(ts.runs_scored, 0) - coalesce(ts.runs_conceded, 0) as net_run_differential
from teams t
left join team_statistics ts on ts.team_id = t.id
left join team_players tp on tp.team_id = t.id
left join players p on p.id = tp.player_id
where t.is_active = true
group by t.id, ts.matches_played, ts.wins, ts.losses, ts.runs_scored, ts.runs_conceded
order by coalesce(ts.wins, 0) desc, net_run_differential desc;

-- live match summary: everything the /live/[matchId] page needs in one row
create view v_live_match_summary as
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
  i2.non_striker_id as innings2_non_striker_id
from matches m
left join teams ta on ta.id = m.team_a_id
left join teams tb on tb.id = m.team_b_id
left join match_results mr on mr.match_id = m.id
left join innings i1 on i1.match_id = m.id and i1.innings_number = 1
left join innings i2 on i2.match_id = m.id and i2.innings_number = 2;

grant select on
  v_players_public, v_teams_public, v_matches_public,
  v_player_leaderboard, v_team_leaderboard, v_live_match_summary
to anon, authenticated;
