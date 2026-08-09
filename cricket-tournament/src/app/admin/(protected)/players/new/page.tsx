import PlayerForm from '@/components/admin/PlayerForm';
import { createPlayer } from '@/lib/actions/players';

export const dynamic = 'force-dynamic';

export default function NewPlayerPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-black uppercase text-navy-900">Add Player</h1>
      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
        <PlayerForm action={createPlayer} />
      </div>
    </div>
  );
}
