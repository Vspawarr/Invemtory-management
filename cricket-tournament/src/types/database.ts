// Hand-written types mirroring supabase/migrations/*.sql.
// If the schema changes, update this file (or swap in `supabase gen types typescript`).

export type TournamentStatus = 'UPCOMING' | 'REGISTRATION_OPEN' | 'LIVE' | 'COMPLETED';
export type RegistrationStatus = 'DRAFT' | 'READY' | 'WITHDRAWN';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
export type MatchStage = 'LEAGUE' | 'PRE_KNOCKOUT' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';
export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
export type InningsStatus = 'IN_PROGRESS' | 'COMPLETED';
export type EventType = 'RUN' | 'WICKET' | 'WIDE' | 'NO_BALL' | 'CORRECTION';
export type DismissalType =
  | 'BOWLED'
  | 'CAUGHT'
  | 'RUN_OUT'
  | 'LBW'
  | 'STUMPED'
  | 'HIT_WICKET'
  | 'OTHER';
export type ResultType = 'WIN' | 'TIE' | 'NO_RESULT';

export type Tournament = {
  id: string;
  name: string;
  village: string;
  venue: string;
  format: string;
  registration_fee: number;
  contact_number: string;
  tournament_date: string | null;
  status: TournamentStatus;
  registration_open: boolean;
  normal_overs: number;
  semi_final_overs: number;
  final_overs: number;
  max_knockout_matches_per_player: number;
  wicket_penalty: number;
  wide_run_value: number;
  no_ball_run_value: number;
  extras_allowed: boolean;
  banner_image_url: string | null;
  gallery_urls: string[];
  super_over_first_balls: number;
  super_over_repeat_balls: number;
  created_at: string;
  updated_at: string;
}

export type TournamentRule = {
  id: string;
  tournament_id: string;
  order_index: number;
  rule_text: string;
}

export type Player = {
  id: string;
  tournament_id: string;
  name: string;
  mobile: string;
  village: string | null;
  age: number | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type Team = {
  id: string;
  tournament_id: string;
  team_name: string;
  registration_status: RegistrationStatus;
  payment_status: PaymentStatus;
  seed: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TeamPlayer = {
  id: string;
  team_id: string;
  player_id: string;
  position: 1 | 2;
}

export type Registration = {
  id: string;
  tournament_id: string;
  team_id: string;
  registration_number: string;
  registration_date: string;
  notes: string | null;
  created_by: string | null;
}

export type Payment = {
  id: string;
  registration_id: string;
  team_id: string;
  amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod | null;
  transaction_reference: string | null;
  verified_by: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type Match = {
  id: string;
  tournament_id: string;
  match_number: number;
  stage: MatchStage;
  team_a_id: string | null;
  team_b_id: string | null;
  match_date: string | null;
  match_time: string | null;
  venue: string | null;
  overs: number;
  status: MatchStatus;
  winner_team_id: string | null;
  share_code: string;
  next_match_id: string | null;
  next_match_slot: 1 | 2 | null;
  parent_match_id: string | null;
  is_super_over: boolean;
  super_over_sequence: number | null;
  max_balls_override: number | null;
  created_at: string;
  updated_at: string;
}

export type Innings = {
  id: string;
  match_id: string;
  innings_number: 1 | 2;
  batting_team_id: string;
  bowling_team_id: string;
  total_runs: number;
  wickets: number;
  balls_bowled: number;
  target: number | null;
  status: InningsStatus;
  striker_id: string | null;
  non_striker_id: string | null;
  bowler_id: string | null;
}

export type ScoringEvent = {
  id: string;
  client_event_id: string;
  match_id: string;
  innings_id: string;
  sequence_number: number;
  over_number: number;
  ball_number: number;
  event_type: EventType;
  runs: number;
  is_wicket: boolean;
  dismissal_type: DismissalType | null;
  striker_id: string | null;
  non_striker_id: string | null;
  bowler_id: string | null;
  is_undone: boolean;
  corrects_event_id: string | null;
  reason: string | null;
  admin_user_id: string | null;
  field_zone: string | null;
  commentary: string | null;
  created_at: string;
}

export type MatchPlayer = {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  is_knockout: boolean;
  runs_scored: number;
  wickets_taken: number;
}

export type MatchResult = {
  id: string;
  match_id: string;
  winner_team_id: string | null;
  loser_team_id: string | null;
  result_type: ResultType;
  team_a_score: number;
  team_b_score: number;
  summary: string | null;
  completed_at: string;
}

export type PlayerStatistics = {
  player_id: string;
  matches_played: number;
  runs_scored: number;
  wickets_taken: number;
  knockout_matches_played: number;
  wins: number;
  losses: number;
  highest_score: number;
}

export type TeamStatistics = {
  team_id: string;
  matches_played: number;
  wins: number;
  losses: number;
  runs_scored: number;
  runs_conceded: number;
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

// ---- Public view row shapes ----

export type PublicPlayer = {
  id: string;
  tournament_id: string;
  name: string;
  village: string | null;
  age: number | null;
  photo_url: string | null;
  is_active: boolean;
  team_id: string | null;
  team_name: string | null;
}

export type PublicTeam = {
  id: string;
  tournament_id: string;
  team_name: string;
  registration_status: RegistrationStatus;
  payment_status: PaymentStatus;
  seed: number | null;
  is_active: boolean;
  players: { id: string; name: string; village: string | null }[] | null;
}

export type PublicMatch = {
  id: string;
  tournament_id: string;
  match_number: number;
  stage: MatchStage;
  match_date: string | null;
  match_time: string | null;
  venue: string | null;
  overs: number;
  status: MatchStatus;
  share_code: string;
  winner_team_id: string | null;
  team_a_name: string | null;
  team_b_name: string | null;
  team_a_id: string | null;
  team_b_id: string | null;
}

export type PlayerLeaderboardRow = {
  player_id: string;
  name: string;
  village: string | null;
  team_id: string | null;
  team_name: string | null;
  matches_played: number;
  runs_scored: number;
  wickets_taken: number;
  knockout_matches_played: number;
  wins: number;
  losses: number;
  highest_score: number;
  average_runs: number;
  knockout_matches_remaining: number;
}

export type TeamLeaderboardRow = {
  team_id: string;
  team_name: string;
  players: { id: string; name: string }[] | null;
  matches_played: number;
  wins: number;
  losses: number;
  runs_scored: number;
  runs_conceded: number;
  net_run_differential: number;
}

export type PlayerStatsRow = {
  player_id: string;
  name: string;
  village: string | null;
  team_id: string | null;
  team_name: string | null;
  matches_played: number;
  runs_scored: number;
  wickets_taken: number;
  highest_score: number;
  fours: number;
  sixes: number;
  balls_faced: number;
  average_runs: number;
  strike_rate: number;
}

export type PointsTableRow = {
  team_id: string;
  team_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  ties: number;
  no_results: number;
  points: number;
  runs_for: number;
  balls_faced: number;
  runs_against: number;
  balls_bowled: number;
  net_run_rate: number;
}

export type LiveMatchSummary = {
  match_id: string;
  share_code: string;
  stage: MatchStage;
  status: MatchStatus;
  venue: string | null;
  overs: number;
  match_date: string | null;
  match_time: string | null;
  team_a_id: string | null;
  team_a_name: string | null;
  team_b_id: string | null;
  team_b_name: string | null;
  winner_team_id: string | null;
  result_type: ResultType | null;
  result_summary: string | null;
  innings1_id: string | null;
  innings1_number: number | null;
  innings1_batting_team_id: string | null;
  innings1_runs: number | null;
  innings1_wickets: number | null;
  innings1_balls: number | null;
  innings1_status: InningsStatus | null;
  innings1_striker_id: string | null;
  innings1_non_striker_id: string | null;
  innings2_id: string | null;
  innings2_number: number | null;
  innings2_batting_team_id: string | null;
  innings2_runs: number | null;
  innings2_wickets: number | null;
  innings2_balls: number | null;
  innings2_status: InningsStatus | null;
  innings2_target: number | null;
  innings2_striker_id: string | null;
  innings2_non_striker_id: string | null;
}

// Helpers to satisfy @supabase/postgrest-js's GenericTable / GenericView /
// GenericFunction shapes without hand-writing Insert/Update/Relationships
// for every table. Insert/Update are intentionally permissive (Partial<Row>)
// since this project relies on RLS + RPCs, not generated-type strictness, to
// enforce write rules.
type Table<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};
type View<Row extends Record<string, unknown>> = {
  Row: Row;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      tournaments: Table<Tournament>;
      tournament_rules: Table<TournamentRule>;
      players: Table<Player>;
      teams: Table<Team>;
      team_players: Table<TeamPlayer>;
      registrations: Table<Registration>;
      payments: Table<Payment>;
      matches: Table<Match>;
      innings: Table<Innings>;
      scoring_events: Table<ScoringEvent>;
      match_players: Table<MatchPlayer>;
      match_results: Table<MatchResult>;
      player_statistics: Table<PlayerStatistics>;
      team_statistics: Table<TeamStatistics>;
      admin_users: Table<AdminUser>;
    };
    Views: {
      v_players_public: View<PublicPlayer>;
      v_teams_public: View<PublicTeam>;
      v_matches_public: View<PublicMatch>;
      v_player_leaderboard: View<PlayerLeaderboardRow>;
      v_team_leaderboard: View<TeamLeaderboardRow>;
      v_points_table: View<PointsTableRow>;
      v_player_stats: View<PlayerStatsRow>;
      v_live_match_summary: View<LiveMatchSummary>;
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      check_knockout_eligibility: {
        Args: { p_player_id: string; p_match_id: string };
        Returns: boolean;
      };
      record_ball_run: {
        Args: {
          p_client_event_id: string;
          p_match_id: string;
          p_innings_id: string;
          p_runs: number;
          p_striker_id: string;
          p_non_striker_id?: string | null;
          p_bowler_id?: string | null;
          p_admin_user_id?: string | null;
          p_field_zone?: string | null;
          p_commentary?: string | null;
        };
        Returns: ScoringEvent;
      };
      record_ball_event: {
        Args: {
          p_client_event_id: string;
          p_match_id: string;
          p_innings_id: string;
          p_event_type: string;
          p_dismissal_type?: string | null;
          p_striker_id?: string | null;
          p_non_striker_id?: string | null;
          p_bowler_id?: string | null;
          p_admin_user_id?: string | null;
          p_field_zone?: string | null;
          p_commentary?: string | null;
        };
        Returns: ScoringEvent;
      };
      undo_last_ball: {
        Args: { p_innings_id: string; p_admin_user_id: string };
        Returns: ScoringEvent;
      };
      apply_score_correction: {
        Args: {
          p_client_event_id: string;
          p_original_event_id: string;
          p_new_runs: number;
          p_reason: string;
          p_admin_user_id: string;
        };
        Returns: ScoringEvent;
      };
      complete_match: {
        Args: {
          p_match_id: string;
          p_winner_team_id: string | null;
          p_result_type: string;
          p_summary: string | null;
          p_admin_user_id: string;
        };
        Returns: MatchResult;
      };
      start_super_over: {
        Args: { p_tied_match_id: string; p_admin_user_id: string };
        Returns: Match;
      };
    };
  };
}
