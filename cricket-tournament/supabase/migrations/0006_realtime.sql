-- ============================================================================
-- Migration 0006: Realtime
--
-- Add the tables the public live-score page needs to watch to the
-- supabase_realtime publication so postgres_changes subscriptions fire.
-- ============================================================================
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table innings;
alter publication supabase_realtime add table scoring_events;
alter publication supabase_realtime add table match_results;
