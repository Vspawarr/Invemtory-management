-- ============================================================================
-- Migration 0011: Player statistics view (batting, bowling, 4s/6s)
--
-- Powers the Stats tab (public + admin). Fours/sixes are counted directly
-- from the ball-by-ball log (not previously tracked anywhere), and, like
-- migration 0008's leaderboard fix, everything here is live-accurate during
-- an in-progress match rather than only after completion.
-- ============================================================================

create or replace view v_player_stats as
with ball_stats as (
  select
    e.striker_id as player_id,
    count(*) filter (where e.event_type = 'RUN' and e.runs = 4) as fours,
    count(*) filter (where e.event_type = 'RUN' and e.runs = 6) as sixes,
    count(*) filter (where e.event_type in ('RUN', 'WICKET')) as balls_faced
  from scoring_events e
  where e.is_undone = false and e.striker_id is not null
  group by e.striker_id
),
match_agg as (
  select player_id,
    sum(runs_scored) as runs_scored,
    sum(wickets_taken) as wickets_taken,
    max(runs_scored) as highest_score
  from match_players
  group by player_id
)
select
  p.id as player_id,
  p.name,
  p.village,
  t.id as team_id,
  t.team_name,
  coalesce(ps.matches_played, 0) as matches_played,
  coalesce(ma.runs_scored, 0) as runs_scored,
  coalesce(ma.wickets_taken, 0) as wickets_taken,
  coalesce(ma.highest_score, 0) as highest_score,
  coalesce(bs.fours, 0) as fours,
  coalesce(bs.sixes, 0) as sixes,
  coalesce(bs.balls_faced, 0) as balls_faced,
  case when coalesce(ps.matches_played, 0) > 0
    then round(coalesce(ma.runs_scored, 0)::numeric / ps.matches_played, 2)
    else 0 end as average_runs,
  case when coalesce(bs.balls_faced, 0) > 0
    then round(coalesce(ma.runs_scored, 0)::numeric / bs.balls_faced * 100, 1)
    else 0 end as strike_rate
from players p
left join player_statistics ps on ps.player_id = p.id
left join team_players tp on tp.player_id = p.id
left join teams t on t.id = tp.team_id
left join match_agg ma on ma.player_id = p.id
left join ball_stats bs on bs.player_id = p.id
where p.is_active = true;

grant select on v_player_stats to anon, authenticated;
