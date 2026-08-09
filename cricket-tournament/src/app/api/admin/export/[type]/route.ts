import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { toCsv, csvResponse } from '@/lib/csv';
import {
  getAdminPlayers,
  getAdminTeams,
  getAdminRegistrations,
  getAdminPayments,
  getAdminMatches,
} from '@/lib/actions/queries-admin';
import { getPlayerLeaderboard, getTeamLeaderboard } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

  const { type } = await params;

  switch (type) {
    case 'players': {
      const rows = await getAdminPlayers();
      const csv = toCsv(
        rows.map((p) => ({ ...p, team_name: p.team?.team_name ?? '' })),
        [
          { key: 'name', label: 'Name' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'village', label: 'Village' },
          { key: 'age', label: 'Age' },
          { key: 'team_name', label: 'Team' },
          { key: 'is_active', label: 'Active' },
        ]
      );
      return csvResponse(csv, 'players.csv');
    }
    case 'teams': {
      const rows = await getAdminTeams();
      const csv = toCsv(
        rows.map((t) => ({
          ...t,
          player1: t.players[0]?.name ?? '',
          player2: t.players[1]?.name ?? '',
        })),
        [
          { key: 'team_name', label: 'Team Name' },
          { key: 'player1', label: 'Player 1' },
          { key: 'player2', label: 'Player 2' },
          { key: 'registration_status', label: 'Registration Status' },
          { key: 'payment_status', label: 'Payment Status' },
          { key: 'seed', label: 'Seed' },
        ]
      );
      return csvResponse(csv, 'teams.csv');
    }
    case 'registrations': {
      const rows = await getAdminRegistrations();
      const csv = toCsv(
        rows.map((r) => ({
          ...r,
          team_name: r.team.team_name,
          player1: r.team.players[0]?.name ?? '',
          player2: r.team.players[1]?.name ?? '',
          payment_status: r.payment?.status ?? 'PENDING',
        })),
        [
          { key: 'registration_number', label: 'Registration #' },
          { key: 'team_name', label: 'Team' },
          { key: 'player1', label: 'Player 1' },
          { key: 'player2', label: 'Player 2' },
          { key: 'registration_date', label: 'Registration Date' },
          { key: 'payment_status', label: 'Payment Status' },
          { key: 'notes', label: 'Notes' },
        ]
      );
      return csvResponse(csv, 'registrations.csv');
    }
    case 'payments': {
      const rows = await getAdminPayments();
      const csv = toCsv(rows, [
        { key: 'registration_number', label: 'Registration #' },
        { key: 'team_name', label: 'Team' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'payment_method', label: 'Method' },
        { key: 'transaction_reference', label: 'Reference' },
        { key: 'paid_at', label: 'Paid At' },
        { key: 'notes', label: 'Notes' },
      ]);
      return csvResponse(csv, 'payments.csv');
    }
    case 'matches': {
      const rows = await getAdminMatches();
      const csv = toCsv(rows, [
        { key: 'match_number', label: 'Match #' },
        { key: 'stage', label: 'Stage' },
        { key: 'team_a_name', label: 'Team A' },
        { key: 'team_b_name', label: 'Team B' },
        { key: 'match_date', label: 'Date' },
        { key: 'match_time', label: 'Time' },
        { key: 'venue', label: 'Venue' },
        { key: 'overs', label: 'Overs' },
        { key: 'status', label: 'Status' },
      ]);
      return csvResponse(csv, 'matches.csv');
    }
    case 'results': {
      const supabase = await createClient();
      const { data } = await supabase
        .from('match_results')
        .select('*, match:matches(match_number, stage), winner:teams!match_results_winner_team_id_fkey(team_name)');
      const rows = (data ?? []).map((r) => {
        const raw = r as unknown as {
          match: { match_number: number; stage: string } | null;
          winner: { team_name: string } | null;
          result_type: string;
          team_a_score: number;
          team_b_score: number;
          summary: string | null;
        };
        return {
          match_number: raw.match?.match_number,
          stage: raw.match?.stage,
          winner: raw.winner?.team_name ?? '',
          result_type: raw.result_type,
          team_a_score: raw.team_a_score,
          team_b_score: raw.team_b_score,
          summary: raw.summary,
        };
      });
      const csv = toCsv(rows, [
        { key: 'match_number', label: 'Match #' },
        { key: 'stage', label: 'Stage' },
        { key: 'winner', label: 'Winner' },
        { key: 'result_type', label: 'Result Type' },
        { key: 'team_a_score', label: 'Team A Score' },
        { key: 'team_b_score', label: 'Team B Score' },
        { key: 'summary', label: 'Summary' },
      ]);
      return csvResponse(csv, 'match-results.csv');
    }
    case 'player-statistics':
    case 'leaderboard': {
      const rows = await getPlayerLeaderboard();
      const csv = toCsv(rows, [
        { key: 'name', label: 'Player' },
        { key: 'team_name', label: 'Team' },
        { key: 'matches_played', label: 'Matches' },
        { key: 'runs_scored', label: 'Runs' },
        { key: 'wickets_taken', label: 'Wickets' },
        { key: 'knockout_matches_played', label: 'Knockout Matches Played' },
        { key: 'knockout_matches_remaining', label: 'Knockout Matches Remaining' },
        { key: 'wins', label: 'Wins' },
        { key: 'losses', label: 'Losses' },
        { key: 'highest_score', label: 'Highest Score' },
        { key: 'average_runs', label: 'Average Runs' },
      ]);
      return csvResponse(csv, 'player-leaderboard.csv');
    }
    case 'team-leaderboard': {
      const rows = await getTeamLeaderboard();
      const csv = toCsv(rows, [
        { key: 'team_name', label: 'Team' },
        { key: 'matches_played', label: 'Matches' },
        { key: 'wins', label: 'Wins' },
        { key: 'losses', label: 'Losses' },
        { key: 'runs_scored', label: 'Runs For' },
        { key: 'runs_conceded', label: 'Runs Against' },
        { key: 'net_run_differential', label: 'Net Run Differential' },
      ]);
      return csvResponse(csv, 'team-leaderboard.csv');
    }
    default:
      return NextResponse.json({ error: 'Unknown export type' }, { status: 400 });
  }
}
