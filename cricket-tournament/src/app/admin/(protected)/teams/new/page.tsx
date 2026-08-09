import TeamForm from '@/components/admin/TeamForm';
import { createTeam } from '@/lib/actions/teams';
import { getAvailablePlayers } from '@/lib/actions/queries-admin';

export const dynamic = 'force-dynamic';

export default async function NewTeamPage() {
  const players = await getAvailablePlayers();

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-black uppercase text-navy-900">Add Team</h1>
      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <TeamForm players={players} action={createTeam} />
      </div>
    </div>
  );
}
