import { createClient } from '@/lib/supabase/server';
import type { Player, Team, Payment, Registration, Match, MatchPlayer } from '@/types/database';

export type AdminPlayerRow = Player & {
  team: { id: string; team_name: string; payment_status: string } | null;
}

export async function getAdminPlayers(search?: string): Promise<AdminPlayerRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from('players')
    .select('*, team_players(team:teams(id, team_name, payment_status))')
    .order('name', { ascending: true });

  if (search) {
    query = query.or(`name.ilike.%${search}%,mobile.ilike.%${search}%,village.ilike.%${search}%`);
  }

  const { data } = await query;
  return (data ?? []).map((row) => {
    const raw = row as unknown as Player & {
      team_players: { team: { id: string; team_name: string; payment_status: string } | null }[];
    };
    return {
      ...(raw as Player),
      team: raw.team_players?.[0]?.team ?? null,
    };
  });
}

export async function getAdminPlayer(id: string): Promise<Player | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('players').select('*').eq('id', id).maybeSingle();
  return data;
}

export type AdminTeamRow = Team & {
  players: { id: string; name: string; mobile: string }[];
}

export async function getAdminTeams(search?: string): Promise<AdminTeamRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from('teams')
    .select('*, team_players(position, player:players(id, name, mobile))')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('team_name', `%${search}%`);
  }

  const { data } = await query;
  return (data ?? []).map((row) => {
    const raw = row as unknown as Team & {
      team_players: { position: number; player: { id: string; name: string; mobile: string } | null }[];
    };
    return {
      ...(raw as Team),
      players: (raw.team_players ?? [])
        .sort((a, b) => a.position - b.position)
        .map((tp) => tp.player)
        .filter((p): p is { id: string; name: string; mobile: string } => !!p),
    };
  });
}

export async function getAdminTeam(id: string): Promise<AdminTeamRow | null> {
  const teams = await getAdminTeams();
  return teams.find((t) => t.id === id) ?? null;
}

export async function getAvailablePlayers(excludeTeamId?: string): Promise<Player[]> {
  const supabase = await createClient();
  const { data: assigned } = await supabase.from('team_players').select('player_id, team_id');
  const assignedIds = new Set(
    (assigned ?? []).filter((a) => a.team_id !== excludeTeamId).map((a) => a.player_id)
  );
  const { data: players } = await supabase.from('players').select('*').eq('is_active', true).order('name');
  return (players ?? []).filter((p) => !assignedIds.has(p.id));
}

export type AdminRegistrationRow = Registration & {
  team: Team & { players: { name: string }[] };
  payment: Payment | null;
}

export async function getAdminRegistrations(): Promise<AdminRegistrationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('registrations')
    .select('*, team:teams(*, team_players(player:players(name))), payments(*)')
    .order('registration_date', { ascending: false });

  return (data ?? []).map((row) => {
    const raw = row as unknown as Registration & {
      team: Team & { team_players: { player: { name: string } | null }[] };
      payments: Payment[];
    };
    return {
      ...(raw as Registration),
      team: {
        ...raw.team,
        players: (raw.team.team_players ?? []).map((tp) => tp.player).filter((p): p is { name: string } => !!p),
      },
      payment: raw.payments?.[0] ?? null,
    };
  });
}

export async function getTeamsWithoutRegistration(): Promise<Team[]> {
  const supabase = await createClient();
  const { data: registered } = await supabase.from('registrations').select('team_id');
  const registeredIds = new Set((registered ?? []).map((r) => r.team_id));
  const { data: teams } = await supabase.from('teams').select('*').eq('is_active', true).order('team_name');
  return (teams ?? []).filter((t) => !registeredIds.has(t.id));
}

export type AdminPaymentRow = Payment & {
  team_name: string;
  registration_number: string;
}

export async function getAdminPayments(): Promise<AdminPaymentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('payments')
    .select('*, team:teams(team_name), registration:registrations(registration_number)')
    .order('created_at', { ascending: false });

  return (data ?? []).map((row) => {
    const raw = row as unknown as Payment & {
      team: { team_name: string } | null;
      registration: { registration_number: string } | null;
    };
    return {
      ...(raw as Payment),
      team_name: raw.team?.team_name ?? '—',
      registration_number: raw.registration?.registration_number ?? '—',
    };
  });
}

export type AdminMatchRow = Match & {
  team_a_name: string | null;
  team_b_name: string | null;
}

export async function getAdminMatches(): Promise<AdminMatchRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('matches')
    .select('*, team_a:teams!matches_team_a_id_fkey(team_name), team_b:teams!matches_team_b_id_fkey(team_name)')
    .order('match_number', { ascending: true });

  return (data ?? []).map((row) => {
    const raw = row as unknown as Match & {
      team_a: { team_name: string } | null;
      team_b: { team_name: string } | null;
    };
    return {
      ...(raw as Match),
      team_a_name: raw.team_a?.team_name ?? null,
      team_b_name: raw.team_b?.team_name ?? null,
    };
  });
}

export async function getAdminMatch(id: string): Promise<AdminMatchRow | null> {
  const matches = await getAdminMatches();
  return matches.find((m) => m.id === id) ?? null;
}

export async function getMatchRoster(matchId: string): Promise<MatchPlayer[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('match_players').select('*').eq('match_id', matchId);
  return data ?? [];
}
