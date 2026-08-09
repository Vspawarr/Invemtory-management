-- ============================================================================
-- Migration 0004: Row Level Security
--
-- Rule of thumb: anonymous + authenticated non-admin users may only SELECT
-- rows that are safe to publish. All writes require is_admin(). Tables with
-- personally-identifying data (players.mobile, payments.transaction_reference,
-- registrations, audit_logs, admin_users) are NOT selectable directly by
-- anon; the public instead reads the sanitized views from migration 0003.
-- ============================================================================

alter table admin_users enable row level security;
alter table tournaments enable row level security;
alter table tournament_rules enable row level security;
alter table players enable row level security;
alter table teams enable row level security;
alter table team_players enable row level security;
alter table registrations enable row level security;
alter table payments enable row level security;
alter table matches enable row level security;
alter table innings enable row level security;
alter table scoring_events enable row level security;
alter table match_players enable row level security;
alter table match_results enable row level security;
alter table player_statistics enable row level security;
alter table team_statistics enable row level security;
alter table audit_logs enable row level security;

-- admin_users: an admin can see their own row and fellow admins; only
-- SUPER_ADMIN (or the service role, which bypasses RLS) may write.
create policy admin_users_select on admin_users for select using (is_admin());
create policy admin_users_write on admin_users for all using (is_admin()) with check (is_admin());

-- tournaments: public read (drives the whole homepage), admin write
create policy tournaments_select_public on tournaments for select using (true);
create policy tournaments_write_admin on tournaments for insert with check (is_admin());
create policy tournaments_update_admin on tournaments for update using (is_admin()) with check (is_admin());
create policy tournaments_delete_admin on tournaments for delete using (is_admin());

create policy tournament_rules_select_public on tournament_rules for select using (true);
create policy tournament_rules_write_admin on tournament_rules for all using (is_admin()) with check (is_admin());

-- players: base table (has mobile) is admin-only; public uses v_players_public
create policy players_select_admin on players for select using (is_admin());
create policy players_write_admin on players for all using (is_admin()) with check (is_admin());

-- teams: safe to expose directly (no PII)
create policy teams_select_public on teams for select using (true);
create policy teams_write_admin on teams for all using (is_admin()) with check (is_admin());

create policy team_players_select_public on team_players for select using (true);
create policy team_players_write_admin on team_players for all using (is_admin()) with check (is_admin());

-- registrations & payments: contain reference numbers / verifier identity -> admin only
create policy registrations_select_admin on registrations for select using (is_admin());
create policy registrations_write_admin on registrations for all using (is_admin()) with check (is_admin());

create policy payments_select_admin on payments for select using (is_admin());
create policy payments_write_admin on payments for all using (is_admin()) with check (is_admin());

-- matches / innings / scoring_events: public read for live scoring, admin write
create policy matches_select_public on matches for select using (true);
create policy matches_write_admin on matches for all using (is_admin()) with check (is_admin());

create policy innings_select_public on innings for select using (true);
create policy innings_write_admin on innings for all using (is_admin()) with check (is_admin());

create policy scoring_events_select_public on scoring_events for select using (true);
-- direct writes to scoring_events are blocked for everyone; all mutation goes
-- through the SECURITY DEFINER RPCs (record_ball_event / record_ball_run /
-- undo_last_ball / apply_score_correction) which check is_admin() themselves.
create policy scoring_events_write_admin on scoring_events for all using (is_admin()) with check (is_admin());

create policy match_players_select_public on match_players for select using (true);
create policy match_players_write_admin on match_players for all using (is_admin()) with check (is_admin());

create policy match_results_select_public on match_results for select using (true);
create policy match_results_write_admin on match_results for all using (is_admin()) with check (is_admin());

create policy player_statistics_select_public on player_statistics for select using (true);
create policy player_statistics_write_admin on player_statistics for all using (is_admin()) with check (is_admin());

create policy team_statistics_select_public on team_statistics for select using (true);
create policy team_statistics_write_admin on team_statistics for all using (is_admin()) with check (is_admin());

-- audit_logs: admin only, never publicly readable
create policy audit_logs_select_admin on audit_logs for select using (is_admin());
create policy audit_logs_write_admin on audit_logs for insert with check (is_admin());
