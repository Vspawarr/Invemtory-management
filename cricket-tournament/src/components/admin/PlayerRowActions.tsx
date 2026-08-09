'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { setPlayerActive, deletePlayer } from '@/lib/actions/players';

export default function PlayerRowActions({ playerId, isActive }: { playerId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex justify-end gap-2 text-xs font-bold">
      <Link href={`/admin/players/${playerId}/edit`} className="text-navy-600 hover:underline">
        Edit
      </Link>
      <button
        disabled={pending}
        onClick={() => startTransition(() => setPlayerActive(playerId, !isActive))}
        className={isActive ? 'text-amber-600 hover:underline' : 'text-emerald-600 hover:underline'}
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (confirm('Delete this player permanently? This cannot be undone.')) {
            startTransition(() => deletePlayer(playerId));
          }
        }}
        className="text-red-600 hover:underline"
      >
        Delete
      </button>
    </div>
  );
}
