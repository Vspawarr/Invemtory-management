-- ============================================================================
-- Migration 0010: Points table (league stage)
--
-- Win = 1 point, Loss = 0, no points for a tie or no-result (all
-- configurable). Ranked by points, then true Net Run Rate:
-- (runs scored / overs faced) - (runs conceded / overs bowled), computed
-- across LEAGUE / PRE_KNOCKOUT stage matches only -- knockout matches are
-- win-or-out and don't feed the points table, and Super Overs are excluded
-- since they're a tie-breaker mechanism, not a standings fixture.
-- ============================================================================

alter table tournaments add column points_win integer not null default 1;
alter table tournaments add column points_loss integer not null default 0;
alter table tournaments add column points_tie integer not null default 0;
alter table tournaments add column points_no_result integer not null default 0;

create or replace view v_points_table as
with league_matches as (
  select m.id, m.team_a_id, m.team_b_id
  from matches m
  where m.stage in ('LEAGUE', 'PRE_KNOCKOUT')
    and coalesce(m.is_super_over, false) = false
    and m.status = 'COMPLETED'
    and m.team_a_id is not null
    and m.team_b_id is not null
),
team_results as (
  select lm.team_a_id as team_id, lm.id as match_id, mr.winner_team_id, mr.result_type
  from league_matches lm join match_results mr on mr.match_id = lm.id
  union all
  select lm.team_b_id as team_id, lm.id as match_id, mr.winner_team_id, mr.result_type
  from league_matches lm join match_results mr on mr.match_id = lm.id
),
team_results_agg as (
  select
    team_id,
    count(*) as matches_played,
    count(*) filter (where winner_team_id = team_id) as wins,
    count(*) filter (where winner_team_id is not null and winner_team_id <> team_id) as losses,
    count(*) filter (where result_type = 'TIE') as ties,
    count(*) filter (where result_type = 'NO_RESULT') as no_results
  from team_results
  group by team_id
),
team_innings as (
  select lm.team_a_id as team_id,
    i_for.total_runs as runs_for, i_for.balls_bowled as balls_faced,
    i_against.total_runs as runs_against, i_against.balls_bowled as balls_bowled
  from league_matches lm
  join innings i_for on i_for.match_id = lm.id and i_for.batting_team_id = lm.team_a_id
  join innings i_against on i_against.match_id = lm.id and i_against.batting_team_id = lm.team_b_id
  union all
  select lm.team_b_id as team_id,
    i_for.total_runs, i_for.balls_bowled,
    i_against.total_runs, i_against.balls_bowled
  from league_matches lm
  join innings i_for on i_for.match_id = lm.id and i_for.batting_team_id = lm.team_b_id
  join innings i_against on i_against.match_id = lm.id and i_against.batting_team_id = lm.team_a_id
),
team_innings_agg as (
  select team_id,
    sum(runs_for) as runs_for,
    sum(balls_faced) as balls_faced,
    sum(runs_against) as runs_against,
    sum(balls_bowled) as balls_bowled
  from team_innings
  group by team_id
),
tp as (
  select points_win, points_loss, points_tie, points_no_result from tournaments limit 1
)
select
  t.id as team_id,
  t.team_name,
  coalesce(tr.matches_played, 0) as matches_played,
  coalesce(tr.wins, 0) as wins,
  coalesce(tr.losses, 0) as losses,
  coalesce(tr.ties, 0) as ties,
  coalesce(tr.no_results, 0) as no_results,
  coalesce(tr.wins, 0) * tp.points_win
    + coalesce(tr.losses, 0) * tp.points_loss
    + coalesce(tr.ties, 0) * tp.points_tie
    + coalesce(tr.no_results, 0) * tp.points_no_result as points,
  coalesce(ti.runs_for, 0) as runs_for,
  coalesce(ti.balls_faced, 0) as balls_faced,
  coalesce(ti.runs_against, 0) as runs_against,
  coalesce(ti.balls_bowled, 0) as balls_bowled,
  case when coalesce(ti.balls_faced, 0) > 0 and coalesce(ti.balls_bowled, 0) > 0
    then round(
      (ti.runs_for::numeric / (ti.balls_faced::numeric / 6))
      - (ti.runs_against::numeric / (ti.balls_bowled::numeric / 6)),
      3
    )
    else 0 end as net_run_rate
from teams t
cross join tp
left join team_results_agg tr on tr.team_id = t.id
left join team_innings_agg ti on ti.team_id = t.id
where t.is_active = true
order by points desc, net_run_rate desc;

grant select on v_points_table to anon, authenticated;
