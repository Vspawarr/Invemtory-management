import MatchForm from '@/components/admin/MatchForm';
import { createMatch } from '@/lib/actions/matches';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function NewMatchPage() {
  const supabase = await createClient();
  const [{ data: teams }, { data: tournament }] = await Promise.all([
    supabase.from('teams').select('*').eq('is_active', true).order('team_name'),
    supabase.from('tournaments').select('*').order('created_at', { ascending: false }).limit(1).single(),
  ]);

  if (!tournament) return null;

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-black uppercase text-navy-900">Create Match</h1>
      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <MatchForm teams={teams ?? []} tournament={tournament} action={createMatch} />
      </div>
    </div>
  );
}
