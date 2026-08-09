import Link from 'next/link';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import StatusBadge from '@/components/ui/StatusBadge';
import ShareButtons from '@/components/public/ShareButtons';
import { getTournament, getMatchesByStatus } from '@/lib/queries';
import { STAGE_LABELS } from '@/lib/cricket';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const tournament = await getTournament();
  const [liveMatches, upcomingMatches, recentResults] = await Promise.all([
    getMatchesByStatus('LIVE'),
    getMatchesByStatus('SCHEDULED'),
    getMatchesByStatus('COMPLETED'),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const dateLabel = tournament?.tournament_date
    ? format(new Date(tournament.tournament_date), 'd MMMM yyyy')
    : 'DATE TO BE ANNOUNCED';

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      {/* Poster-style hero */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(242,183,5,0.18),_transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl px-4 py-10 text-center sm:py-16">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold-400">
            Chapaner
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase leading-tight sm:text-5xl">
            Shivsankalp Yuva Pratishthan
          </h1>
          <p className="mt-1 text-xl font-extrabold uppercase text-gold-300 sm:text-3xl">
            Cricket Tournament
          </p>
          <p className="mt-4 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide sm:text-sm">
            Open Double Wicket Tournament
          </p>

          <div className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-3 text-left sm:grid-cols-3">
            <PosterStat label="Entry Fee" value={`₹${tournament?.registration_fee ?? 200}`} />
            <PosterStat
              label="Match Overs"
              value={`${tournament?.normal_overs ?? 2} Overs`}
              hint="SF & Final: 4 overs"
            />
            <PosterStat label="Venue" value="Chapaner (Tekadi)" />
          </div>

          <div className="mx-auto mt-6 max-w-lg rounded-xl border-2 border-red-500 bg-red-600/20 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gold-300">Special Rule</p>
            <p className="text-lg font-black uppercase sm:text-xl">Every Wicket = &minus;2 Runs</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <StatusBadge status={tournament?.status ?? 'UPCOMING'} />
            <span className="text-sm font-semibold text-white/90">{dateLabel}</span>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {liveMatches[0] ? (
              <Link
                href={`/live/${liveMatches[0].share_code}`}
                className="w-full rounded-xl bg-red-600 px-6 py-3.5 text-center text-base font-black uppercase tracking-wide text-white shadow-lg active:scale-95 sm:w-auto"
              >
                ● Watch Live Score
              </Link>
            ) : (
              <Link
                href="/leaderboard"
                className="w-full rounded-xl bg-gold-500 px-6 py-3.5 text-center text-base font-black uppercase tracking-wide text-navy-900 shadow-lg active:scale-95 sm:w-auto"
              >
                View Leaderboard
              </Link>
            )}
            <a
              href={`tel:${tournament?.contact_number ?? '8657777815'}`}
              className="w-full rounded-xl border-2 border-white/40 px-6 py-3.5 text-center text-base font-bold uppercase tracking-wide text-white sm:w-auto"
            >
              Register: {tournament?.contact_number ?? '8657777815'}
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-8">
        {/* Live match */}
        {liveMatches.length > 0 && (
          <Section title="Live Match" accent="red">
            <div className="grid gap-4 sm:grid-cols-2">
              {liveMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </Section>
        )}

        {/* Upcoming */}
        <Section title="Upcoming Matches">
          {upcomingMatches.length === 0 ? (
            <EmptyNote text="No matches scheduled yet. Check back soon." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {upcomingMatches.slice(0, 6).map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </Section>

        {/* Recent results */}
        <Section title="Recent Results">
          {recentResults.length === 0 ? (
            <EmptyNote text="No results yet." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {recentResults.slice(0, 6).map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </Section>

        {/* Quick links */}
        <Section title="Tournament Info">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickLink href="/players" label="Players" icon="👤" />
            <QuickLink href="/teams" label="Teams / Pairs" icon="🤝" />
            <QuickLink href="/leaderboard" label="Leaderboard" icon="🏆" />
            <QuickLink href="/rules" label="Tournament Rules" icon="📋" />
          </div>
        </Section>

        {tournament?.gallery_urls && tournament.gallery_urls.length > 0 && (
          <Section title="Tournament Gallery">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {tournament.gallery_urls.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt="Tournament gallery"
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </Section>
        )}

        <Section title="Share This Tournament">
          <ShareButtons
            url={siteUrl}
            text="Shivsankalp Yuva Pratishthan Cricket Tournament - Chapaner (Tekadi)"
          />
        </Section>
      </main>

      <PublicFooter contactNumber={tournament?.contact_number} />
    </div>
  );
}

function PosterStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gold-300">{label}</p>
      <p className="text-lg font-black">{value}</p>
      {hint && <p className="text-[10px] text-white/60">{hint}</p>}
    </div>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: 'red';
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className={`mb-3 border-l-4 pl-3 text-lg font-extrabold uppercase tracking-wide text-navy-900 ${
          accent === 'red' ? 'border-red-600' : 'border-gold-500'
        }`}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm">{text}</p>;
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 rounded-xl bg-white p-4 text-center shadow-sm active:scale-95"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-bold text-navy-900">{label}</span>
    </Link>
  );
}

function MatchCard({
  match,
}: {
  match: {
    id: string;
    share_code: string;
    stage: string;
    status: string;
    team_a_name: string | null;
    team_b_name: string | null;
    match_date: string | null;
    match_time: string | null;
    venue: string | null;
  };
}) {
  return (
    <Link
      href={`/live/${match.share_code}`}
      className="block rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 active:scale-[0.98]"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-navy-600">
          {STAGE_LABELS[match.stage] ?? match.stage}
        </span>
        <StatusBadge status={match.status} />
      </div>
      <p className="text-base font-bold text-navy-900">
        {match.team_a_name ?? 'TBD'} <span className="text-slate-400">vs</span>{' '}
        {match.team_b_name ?? 'TBD'}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {match.match_date ? format(new Date(match.match_date), 'd MMM yyyy') : 'Date TBA'}
        {match.match_time ? ` · ${match.match_time.slice(0, 5)}` : ''}
        {match.venue ? ` · ${match.venue}` : ''}
      </p>
    </Link>
  );
}
