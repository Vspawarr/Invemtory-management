import RulesEditor from '@/components/admin/RulesEditor';
import { getTournament, getTournamentRules } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AdminRulesPage() {
  const [tournament, rules] = await Promise.all([getTournament(), getTournamentRules()]);
  if (!tournament) return <p>Tournament not configured.</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-black uppercase text-navy-900">Tournament Rules</h1>
        <p className="text-sm text-slate-500">Shown on the public Rules page. Reorder, edit, or add rules below.</p>
      </div>
      <RulesEditor tournamentId={tournament.id} rules={rules} />
    </div>
  );
}
