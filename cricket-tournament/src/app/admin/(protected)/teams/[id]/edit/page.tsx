import { notFound } from 'next/navigation';
import TeamEditor from '@/components/admin/TeamEditor';
import { getAdminTeam, getAvailablePlayers } from '@/lib/actions/queries-admin';

export const dynamic = 'force-dynamic';

export default async function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await getAdminTeam(id);
  if (!team) notFound();

  const availablePlayers = await getAvailablePlayers(id);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-black uppercase text-navy-900">Manage Team</h1>
      <TeamEditor team={team} availablePlayers={availablePlayers} />
    </div>
  );
}
