import SettingsForm from '@/components/admin/SettingsForm';
import { updateTournamentSettings } from '@/lib/actions/settings';
import { getTournament } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const tournament = await getTournament();
  if (!tournament) return <p>Tournament not configured.</p>;

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-black uppercase text-navy-900">Tournament Settings</h1>
      <SettingsForm tournament={tournament} action={updateTournamentSettings.bind(null, tournament.id)} />
    </div>
  );
}
