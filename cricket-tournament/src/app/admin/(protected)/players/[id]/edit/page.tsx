import { notFound } from 'next/navigation';
import PlayerForm from '@/components/admin/PlayerForm';
import { updatePlayer } from '@/lib/actions/players';
import { getAdminPlayer } from '@/lib/actions/queries-admin';

export const dynamic = 'force-dynamic';

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await getAdminPlayer(id);
  if (!player) notFound();

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-black uppercase text-navy-900">Edit Player</h1>
      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <PlayerForm player={player} action={updatePlayer.bind(null, id)} />
      </div>
    </div>
  );
}
