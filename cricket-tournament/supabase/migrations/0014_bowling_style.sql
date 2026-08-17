-- ============================================================================
-- Migration 0014: Bowler style on player profiles
--
-- Adds an optional "bowling style" (Right-arm Fast, Left-arm Spin, etc.) to
-- each player, set once on their profile rather than re-asked every over --
-- it then shows automatically next to their name in the bowler picker and
-- the "who's bowling next" prompt.
-- ============================================================================

alter table players add column bowling_style text;
