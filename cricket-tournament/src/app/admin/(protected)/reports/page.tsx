const REPORTS = [
  { type: 'players', label: 'Player List' },
  { type: 'teams', label: 'Team List' },
  { type: 'registrations', label: 'Registration List' },
  { type: 'payments', label: 'Payment Report' },
  { type: 'matches', label: 'Match List' },
  { type: 'results', label: 'Match Results' },
  { type: 'leaderboard', label: 'Player Statistics / Leaderboard' },
  { type: 'team-leaderboard', label: 'Team Leaderboard' },
];

export default function AdminReportsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black uppercase text-navy-900">Reports</h1>
        <p className="text-sm text-slate-500">Export tournament data as CSV.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <a
            key={r.type}
            href={`/api/admin/export/${r.type}`}
            className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 active:scale-[0.98]"
          >
            <span className="text-sm font-bold text-navy-900">{r.label}</span>
            <span className="rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-bold text-white">Download CSV</span>
          </a>
        ))}
      </div>
    </div>
  );
}
