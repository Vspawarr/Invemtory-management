-- ============================================================================
-- SHIVSANKALP YUVA PRATISHTHAN CRICKET TOURNAMENT
-- Migration 0001: Core schema
-- ============================================================================
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- admin_users: mirrors auth.users for staff who may write data
-- ----------------------------------------------------------------------------
create table admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'ADMIN' check (role in ('ADMIN', 'SUPER_ADMIN')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- tournaments: single-row-per-tournament configurable settings
-- ----------------------------------------------------------------------------
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Shivsankalp Yuva Pratishthan Cricket Tournament',
  village text not null default 'Chapaner (Tekadi)',
  venue text not null default 'Chapaner (Tekadi), Maharashtra',
  format text not null default 'Open Double Wicket Cricket Tournament',
  registration_fee integer not null default 200,
  contact_number text not null default '8657777815',
  tournament_date date,
  status text not null default 'UPCOMING'
    check (status in ('UPCOMING', 'REGISTRATION_OPEN', 'LIVE', 'COMPLETED')),
  registration_open boolean not null default true,
  normal_overs integer not null default 2,
  semi_final_overs integer not null default 4,
  final_overs integer not null default 4,
  max_knockout_matches_per_player integer not null default 3,
  wicket_penalty integer not null default -2,
  wide_run_value integer not null default 1,
  no_ball_run_value integer not null default 1,
  extras_allowed boolean not null default true,
  banner_image_url text,
  gallery_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- tournament_rules: editable, ordered rule list shown on the public Rules page
-- ----------------------------------------------------------------------------
create table tournament_rules (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  order_index integer not null,
  rule_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- players
-- ----------------------------------------------------------------------------
create table players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  name text not null,
  mobile text not null,
  village text,
  age integer check (age is null or (age between 5 and 100)),
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- teams: exactly 2 players (enforced via team_players + trigger below)
-- ----------------------------------------------------------------------------
create table teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  team_name text not null,
  registration_status text not null default 'DRAFT'
    check (registration_status in ('DRAFT', 'READY', 'WITHDRAWN')),
  payment_status text not null default 'PENDING'
    check (payment_status in ('PENDING', 'PAID', 'REFUNDED', 'CANCELLED')),
  seed integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  position smallint not null check (position in (1, 2)),
  created_at timestamptz not null default now(),
  unique (team_id, player_id),
  unique (team_id, position)
);

-- ----------------------------------------------------------------------------
-- registrations
-- ----------------------------------------------------------------------------
create table registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  team_id uuid not null unique references teams (id) on delete cascade,
  registration_number text not null unique,
  registration_date timestamptz not null default now(),
  notes text,
  created_by uuid references admin_users (id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- payments
-- ----------------------------------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations (id) on delete cascade,
  team_id uuid not null references teams (id) on delete cascade,
  amount integer not null default 200,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'PAID', 'REFUNDED', 'CANCELLED')),
  payment_method text check (payment_method in ('CASH', 'UPI', 'BANK_TRANSFER', 'OTHER')),
  transaction_reference text,
  verified_by uuid references admin_users (id),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- matches
-- ----------------------------------------------------------------------------
create table matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  match_number integer not null,
  stage text not null default 'LEAGUE'
    check (stage in ('LEAGUE', 'PRE_KNOCKOUT', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL')),
  team_a_id uuid references teams (id),
  team_b_id uuid references teams (id),
  match_date date,
  match_time time,
  venue text,
  overs integer not null default 2,
  status text not null default 'SCHEDULED'
    check (status in ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED')),
  winner_team_id uuid references teams (id),
  share_code text not null unique,
  next_match_id uuid references matches (id),
  next_match_slot smallint check (next_match_slot in (1, 2)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint different_teams check (team_a_id is null or team_b_id is null or team_a_id <> team_b_id)
);

create unique index matches_tournament_number_idx on matches (tournament_id, match_number);

-- Is a given stage a knockout stage? LEAGUE and PRE_KNOCKOUT never count toward the
-- 3-knockout-match player limit; only QUARTER_FINAL / SEMI_FINAL / FINAL do.
create or replace function is_knockout_stage(p_stage text)
returns boolean language sql immutable as $$
  select p_stage in ('QUARTER_FINAL', 'SEMI_FINAL', 'FINAL');
$$;

-- ----------------------------------------------------------------------------
-- innings
-- ----------------------------------------------------------------------------
create table innings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches (id) on delete cascade,
  innings_number smallint not null check (innings_number in (1, 2)),
  batting_team_id uuid not null references teams (id),
  bowling_team_id uuid not null references teams (id),
  total_runs integer not null default 0,
  wickets integer not null default 0,
  balls_bowled integer not null default 0,
  target integer,
  status text not null default 'IN_PROGRESS'
    check (status in ('IN_PROGRESS', 'COMPLETED')),
  striker_id uuid references players (id),
  non_striker_id uuid references players (id),
  bowler_id uuid references players (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, innings_number)
);

-- ----------------------------------------------------------------------------
-- scoring_events: authoritative, append-only ball-by-ball log
-- ----------------------------------------------------------------------------
create table scoring_events (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null unique,
  match_id uuid not null references matches (id) on delete cascade,
  innings_id uuid not null references innings (id) on delete cascade,
  sequence_number integer not null,
  over_number integer not null,
  ball_number integer not null,
  event_type text not null
    check (event_type in ('RUN', 'WICKET', 'WIDE', 'NO_BALL', 'CORRECTION')),
  runs integer not null default 0,
  is_wicket boolean not null default false,
  dismissal_type text
    check (dismissal_type is null or dismissal_type in
      ('BOWLED', 'CAUGHT', 'RUN_OUT', 'LBW', 'STUMPED', 'HIT_WICKET', 'OTHER')),
  striker_id uuid references players (id),
  non_striker_id uuid references players (id),
  bowler_id uuid references players (id),
  is_undone boolean not null default false,
  undone_at timestamptz,
  undone_by uuid references admin_users (id),
  corrects_event_id uuid references scoring_events (id),
  reason text,
  admin_user_id uuid references admin_users (id),
  created_at timestamptz not null default now(),
  unique (innings_id, sequence_number)
);

-- ----------------------------------------------------------------------------
-- match_players: roster of who actually played, drives knockout eligibility
-- ----------------------------------------------------------------------------
create table match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches (id) on delete cascade,
  team_id uuid not null references teams (id),
  player_id uuid not null references players (id),
  is_knockout boolean not null default false,
  runs_scored integer not null default 0,
  wickets_taken integer not null default 0,
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

-- ----------------------------------------------------------------------------
-- match_results
-- ----------------------------------------------------------------------------
create table match_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references matches (id) on delete cascade,
  winner_team_id uuid references teams (id),
  loser_team_id uuid references teams (id),
  result_type text not null default 'WIN' check (result_type in ('WIN', 'TIE', 'NO_RESULT')),
  team_a_score integer not null default 0,
  team_b_score integer not null default 0,
  summary text,
  completed_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- player_statistics / team_statistics: materialized, kept in sync by triggers
-- ----------------------------------------------------------------------------
create table player_statistics (
  player_id uuid primary key references players (id) on delete cascade,
  matches_played integer not null default 0,
  runs_scored integer not null default 0,
  wickets_taken integer not null default 0,
  knockout_matches_played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  highest_score integer not null default 0,
  updated_at timestamptz not null default now()
);

create table team_statistics (
  team_id uuid primary key references teams (id) on delete cascade,
  matches_played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  runs_scored integer not null default 0,
  runs_conceded integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- audit_logs
-- ----------------------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  reason text,
  performed_by uuid references admin_users (id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index players_tournament_idx on players (tournament_id);
create index players_mobile_idx on players (mobile);
create index teams_tournament_idx on teams (tournament_id);
create index team_players_player_idx on team_players (player_id);
create index registrations_tournament_idx on registrations (tournament_id);
create index payments_team_idx on payments (team_id);
create index payments_status_idx on payments (status);
create index matches_tournament_idx on matches (tournament_id);
create index matches_status_idx on matches (status);
create index matches_stage_idx on matches (stage);
create index innings_match_idx on innings (match_id);
create index scoring_events_match_idx on scoring_events (match_id);
create index scoring_events_innings_idx on scoring_events (innings_id);
create index scoring_events_timestamp_idx on scoring_events (created_at);
create index match_players_match_idx on match_players (match_id);
create index match_players_player_idx on match_players (player_id);
create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);
create index audit_logs_timestamp_idx on audit_logs (created_at);
