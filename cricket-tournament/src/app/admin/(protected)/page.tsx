import Link from 'next/link';
import StatCard from '@/components/admin/StatCard';
import DashboardCharts from '@/components/admin/DashboardCharts';
import { getDashboardStats } from '@/lib/admin-queries';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase text-navy-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Tournament overview at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Registered Teams" value={stats.totalTeams} accent="navy" />
        <StatCard label="Registered Players" value={stats.totalPlayers} accent="navy" />
        <StatCard
          label="Amount Collected"
          value={`₹${stats.amountCollected.toLocaleString('en-IN')}`}
          accent="gold"
          hint={`${stats.paidTeams} paid x ₹${stats.registrationFee}`}
        />
        <StatCard label="Pending Payments" value={stats.pendingTeams} accent="red" />
        <StatCard label="Matches Scheduled" value={stats.matchesScheduled} accent="navy" />
        <StatCard label="Matches Completed" value={stats.matchesCompleted} accent="emerald" />
        <StatCard label="Live Now" value={stats.matchesLive} accent="red" />
        <StatCard label="Knockout Teams" value={stats.knockoutTeams} accent="gold" />
      </div>

      <DashboardCharts stats={stats} />

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-bold text-navy-900">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          <QuickAction href="/admin/players" label="Add Player" />
          <QuickAction href="/admin/teams" label="Add Team" />
          <QuickAction href="/admin/matches" label="Create Match" />
          <QuickAction href="/admin/live-scoring" label="Start Live Scoring" />
          <QuickAction href="/admin/reports" label="Export Reports" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold uppercase text-white active:scale-95"
    >
      {label}
    </Link>
  );
}
