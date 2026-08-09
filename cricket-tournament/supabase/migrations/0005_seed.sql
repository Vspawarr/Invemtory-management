-- ============================================================================
-- Migration 0005: Seed data
--
-- Creates the single tournament row (this app is built for one tournament at
-- a time) and the rule list exactly as provided in the tournament brief.
-- Everything here is editable afterwards from Admin > Tournament Settings /
-- Admin > Rules.
-- ============================================================================

insert into tournaments (
  name, village, venue, format, registration_fee, contact_number,
  tournament_date, status, registration_open,
  normal_overs, semi_final_overs, final_overs,
  max_knockout_matches_per_player, wicket_penalty
) values (
  'Shivsankalp Yuva Pratishthan Cricket Tournament',
  'Chapaner (Tekadi)',
  'Chapaner (Tekadi), Maharashtra',
  'Open Double Wicket Cricket Tournament',
  200,
  '8657777815',
  null,
  'UPCOMING',
  true,
  2, 4, 4,
  3, -2
);

insert into tournament_rules (tournament_id, order_index, rule_text)
select id, ordinality, rule_text
from tournaments, unnest(array[
  'Open Double Wicket Tournament: every team consists of exactly 2 players.',
  'Registration fee is Rs. 200 per team.',
  'Normal (league / pre-knockout) matches are played over 2 overs per innings.',
  'Semi-final matches are played over 4 overs per innings.',
  'Final match is played over 4 overs per innings.',
  'Every wicket results in a deduction of 2 runs from the batting team''s score.',
  'Any type of dismissal (bowled, caught, run out, LBW, stumped, hit wicket, or other) results in the same -2 run penalty.',
  'A player may play a maximum of 3 knockout matches (quarter-final, semi-final, final combined).',
  'The knockout match count applies only from the start of the knockout stage; league and pre-knockout matches do not count toward this limit.',
  'The organizers'' decision on any matter, including scoring disputes, eligibility, and results, is final.'
]) with ordinality as t(rule_text, ordinality)
where not exists (select 1 from tournament_rules);
