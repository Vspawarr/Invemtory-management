-- ============================================================================
-- Migration 0013: Tournament records
--
-- Powers a "Records" section on the Statistics pages: batting milestones
-- (50s/100s), best single-match bowling figures (most wickets in a match --
-- the schema doesn't track runs conceded per bowler, so this is a wickets
-- count, not full "3/12"-style figures), highest team total, and biggest
-- win margins. Win margins are kept as two separate stats (runs vs balls
-- remaining) since a team batting first wins "by N runs" while a team
-- chasing wins "by N balls remaining" -- different units, not one scale.
-- Super Overs are excluded throughout: they're a tie-breaker mechanism, not
-- a full innings/match for record-keeping purposes.
-- ============================================================================

create or replace view v_player_milestones as
select
  mp.player_id,
  p.name,
  t.team_name,
  count(*) filter (where mp.runs_scored >= 50 and mp.runs_scored < 100) as fifties,
  count(*) filter (where mp.runs_scored >= 100) as hundreds
from match_players mp
join matches m on m.id = mp.match_id
join players p on p.id = mp.player_id
left join team_players tp on tp.player_id = p.id
left join teams t on t.id = tp.team_id
where p.is_active = true
  and m.status = 'COMPLETED'
  and coalesce(m.is_super_over, false) = false
group by mp.player_id, p.name, t.team_name
having count(*) filter (where mp.runs_scored >= 50) > 0
order by hundreds desc, fifties desc;

grant select on v_player_milestones to anon, authenticated;

create or replace view v_best_bowling as
with ranked as (
  select
    mp.player_id,
    mp.wickets_taken,
    m.match_number,
    m.match_date,
    case when mp.team_id = m.team_a_id then m.team_b_id else m.team_a_id end as opponent_team_id,
    row_number() over (
      partition by mp.player_id
      order by mp.wickets_taken desc, m.match_date desc nulls last, m.match_number desc
    ) as rn
  from match_players mp
  join matches m on m.id = mp.match_id
  where m.status = 'COMPLETED'
    and coalesce(m.is_super_over, false) = false
    and mp.wickets_taken > 0
)
select
  r.player_id,
  p.name,
  t.team_name,
  r.wickets_taken as best_wickets,
  ot.team_name as opponent_team_name,
  r.match_number,
  r.match_date
from ranked r
join players p on p.id = r.player_id
left join team_players tp on tp.player_id = p.id
left join teams t on t.id = tp.team_id
left join teams ot on ot.id = r.opponent_team_id
where r.rn = 1
order by best_wickets desc;

grant select on v_best_bowling to anon, authenticated;

create or replace view v_innings_records as
select
  i.match_id,
  m.match_number,
  m.match_date,
  m.stage,
  bt.team_name as batting_team_name,
  ct.team_name as bowling_team_name,
  i.total_runs,
  i.wickets,
  i.balls_bowled
from innings i
join matches m on m.id = i.match_id
join teams bt on bt.id = i.batting_team_id
join teams ct on ct.id = i.bowling_team_id
where m.status = 'COMPLETED'
  and coalesce(m.is_super_over, false) = false
  and i.status = 'COMPLETED'
order by i.total_runs desc;

grant select on v_innings_records to anon, authenticated;

create or replace view v_match_margins as
select
  mr.match_id,
  m.match_number,
  m.match_date,
  m.stage,
  wt.team_name as winner_team_name,
  lt.team_name as loser_team_name,
  mr.summary,
  (regexp_match(mr.summary, '(\d+)\s+runs?\b'))[1]::integer as margin_runs,
  (regexp_match(mr.summary, '(\d+)\s+balls?\s+remaining'))[1]::integer as margin_balls
from match_results mr
join matches m on m.id = mr.match_id
left join teams wt on wt.id = mr.winner_team_id
left join teams lt on lt.id = mr.loser_team_id
where mr.result_type = 'WIN'
  and coalesce(m.is_super_over, false) = false;

grant select on v_match_margins to anon, authenticated;
