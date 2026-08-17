-- ============================================================================
-- Migration 0008: Live-updating leaderboard views
--
-- v_player_leaderboard / v_team_leaderboard previously read runs_scored /
-- wickets_taken / runs_conceded from player_statistics / team_statistics,
-- which are only populated by complete_match() once a match finishes. That
-- meant the public and admin leaderboards showed 0 runs/wickets for the
-- entire duration of a live match, even though match_players.runs_scored
-- and .wickets_taken (and innings.total_runs) are already updated ball by
-- ball. This migration switches those columns to aggregate live from
-- match_players / innings directly, so the leaderboard is accurate while a
-- match is still in progress, not just after it's completed.
--
-- matches_played / knockout_matches_played / wins / losses are left as-is:
-- matches_played and knockout_matches_played already update live (via the
-- trigger on match_players insert/delete), and wins/losses genuinely can't
-- be known until a match is completed, so those stay sourced from
-- player_statistics / team_statistics.
-- ============================================================================

create or replace view v_player_leaderboard as
select
  p.id as player_id,
  p.name,
  p.village,
  t.id as team_id,
  t.team_name,
  coalesce(ps.matches_played, 0) as matches_played,
  coalesce(mp_agg.runs_scored, 0) as runs_scored,
  coalesce(mp_agg.wickets_taken, 0) as wickets_taken,
  coalesce(ps.knockout_matches_played, 0) as knockout_matches_played,
  coalesce(ps.wins, 0) as wins,
  coalesce(ps.losses, 0) as losses,
  coalesce(mp_agg.highest_score, 0) as highest_score,
  case when coalesce(ps.matches_played, 0) > 0
    then round(coalesce(mp_agg.runs_scored, 0)::numeric / ps.matches_played, 2)
    else 0 end as average_runs,
  greatest(0, (select max_knockout_matches_per_player from tournaments limit 1) - coalesce(ps.knockout_matches_played, 0)) as knockout_matches_remaining
from players p
left join player_statistics ps on ps.player_id = p.id
left join team_players tp on tp.player_id = p.id
left join teams t on t.id = tp.team_id
left join (
  select player_id,
    sum(runs_scored)::integer as runs_scored,
    sum(wickets_taken)::integer as wickets_taken,
    max(runs_scored) as highest_score
  from match_players
  group by player_id
) mp_agg on mp_agg.player_id = p.id
where p.is_active = true
order by coalesce(mp_agg.runs_scored, 0) desc, coalesce(mp_agg.wickets_taken, 0) desc;

create or replace view v_team_leaderboard as
select
  t.id as team_id,
  t.team_name,
  jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name) order by tp.position) filter (where p.id is not null) as players,
  coalesce(ts.matches_played, 0) as matches_played,
  coalesce(ts.wins, 0) as wins,
  coalesce(ts.losses, 0) as losses,
  coalesce(runs_for.total, 0) as runs_scored,
  coalesce(runs_against.total, 0) as runs_conceded,
  coalesce(runs_for.total, 0) - coalesce(runs_against.total, 0) as net_run_differential
from teams t
left join team_statistics ts on ts.team_id = t.id
left join team_players tp on tp.team_id = t.id
left join players p on p.id = tp.player_id
left join (
  select batting_team_id as team_id, sum(total_runs)::integer as total
  from innings
  group by batting_team_id
) runs_for on runs_for.team_id = t.id
left join (
  select bowling_team_id as team_id, sum(total_runs)::integer as total
  from innings
  group by bowling_team_id
) runs_against on runs_against.team_id = t.id
where t.is_active = true
group by t.id, ts.matches_played, ts.wins, ts.losses, runs_for.total, runs_against.total
order by coalesce(ts.wins, 0) desc, net_run_differential desc;
