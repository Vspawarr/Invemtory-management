import { notFound } from 'next/navigation';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import LiveScoreboard from '@/components/public/LiveScoreboard';
import { getTournament, getMatchByShareCode } from '@/lib/queries';
import { getRecentEvents, getTeamRoster } from '@/lib/queries-live';

export const dynamic = 'force-dynamic';

export default async function LiveMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId: shareCode } = await params;
  const [tournament, match] = await Promise.all([getTournament(), getMatchByShareCode(shareCode)]);

  if (!match) notFound();

  const activeInningsId =
    match.innings2_id && match.innings2_status === 'IN_PROGRESS' ? match.innings2_id : match.innings1_id;

  const [events, rosterA, rosterB] = await Promise.all([
    activeInningsId ? getRecentEvents(activeInningsId) : Promise.resolve([]),
    match.team_a_id ? getTeamRoster(match.team_a_id) : Promise.resolve(null),
    match.team_b_id ? getTeamRoster(match.team_b_id) : Promise.resolve(null),
  ]);

  const playerNames: Record<string, string> = {};
  for (const roster of [rosterA, rosterB]) {
    for (const p of roster?.players ?? []) {
      playerNames[p.id] = p.name;
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-navy-600">
          Shivsankalp Yuva Pratishthan Cricket Tournament
        </p>
        <LiveScoreboard
          matchId={match.match_id}
          shareCode={match.share_code}
          initialMatch={match}
          initialEvents={events}
          playerNames={playerNames}
          siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}
        />
      </main>
      <PublicFooter contactNumber={tournament?.contact_number} />
    </div>
  );
}
