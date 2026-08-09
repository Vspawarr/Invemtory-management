import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
  totalTeams: number;
  totalPlayers: number;
  paidTeams: number;
  pendingTeams: number;
  refundedTeams: number;
  cancelledTeams: number;
  amountCollected: number;
  registrationFee: number;
  matchesScheduled: number;
  matchesCompleted: number;
  matchesLive: number;
  matchesTotal: number;
  knockoutTeams: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [
    tournamentRes,
    teamsRes,
    playersRes,
    paidRes,
    pendingRes,
    refundedRes,
    cancelledRes,
    scheduledRes,
    completedRes,
    liveRes,
    totalMatchesRes,
  ] = await Promise.all([
    supabase.from('tournaments').select('registration_fee').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('players').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('payment_status', 'PAID'),
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('payment_status', 'PENDING'),
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('payment_status', 'REFUNDED'),
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('payment_status', 'CANCELLED'),
    supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'SCHEDULED'),
    supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
    supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'LIVE'),
    supabase.from('matches').select('id', { count: 'exact', head: true }),
  ]);

  const registrationFee = tournamentRes.data?.registration_fee ?? 200;
  const paidTeams = paidRes.count ?? 0;

  const { data: knockoutMatches } = await supabase
    .from('matches')
    .select('team_a_id, team_b_id')
    .in('stage', ['QUARTER_FINAL', 'SEMI_FINAL', 'FINAL']);
  const knockoutTeamIds = new Set<string>();
  for (const m of knockoutMatches ?? []) {
    if (m.team_a_id) knockoutTeamIds.add(m.team_a_id);
    if (m.team_b_id) knockoutTeamIds.add(m.team_b_id);
  }

  return {
    totalTeams: teamsRes.count ?? 0,
    totalPlayers: playersRes.count ?? 0,
    paidTeams,
    pendingTeams: pendingRes.count ?? 0,
    refundedTeams: refundedRes.count ?? 0,
    cancelledTeams: cancelledRes.count ?? 0,
    amountCollected: paidTeams * registrationFee,
    registrationFee,
    matchesScheduled: scheduledRes.count ?? 0,
    matchesCompleted: completedRes.count ?? 0,
    matchesLive: liveRes.count ?? 0,
    matchesTotal: totalMatchesRes.count ?? 0,
    knockoutTeams: knockoutTeamIds.size,
  };
}
