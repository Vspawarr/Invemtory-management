import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import { getTournament, getTournamentRules } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function RulesPage() {
  const [tournament, rules] = await Promise.all([getTournament(), getTournamentRules()]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-black uppercase text-navy-900">Tournament Rules</h1>
        <p className="mt-1 text-sm text-slate-500">
          {tournament?.format ?? 'Open Double Wicket Cricket Tournament'}
        </p>

        <ol className="mt-6 space-y-3">
          {rules.map((rule, i) => (
            <li
              key={rule.id}
              className="flex gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <p className="text-sm font-medium text-navy-900">{rule.rule_text}</p>
            </li>
          ))}
        </ol>

        {rules.length === 0 && (
          <p className="mt-6 rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm">
            Rules will be published here shortly.
          </p>
        )}
      </main>
      <PublicFooter contactNumber={tournament?.contact_number} />
    </div>
  );
}
