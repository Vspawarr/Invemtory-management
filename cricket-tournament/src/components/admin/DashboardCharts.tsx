'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { DashboardStats } from '@/lib/admin-queries';

export default function DashboardCharts({ stats }: { stats: DashboardStats }) {
  const paymentData = [
    { name: 'Paid', value: stats.paidTeams },
    { name: 'Pending', value: stats.pendingTeams },
    { name: 'Refunded', value: stats.refundedTeams },
    { name: 'Cancelled', value: stats.cancelledTeams },
  ];

  const matchData = [
    { name: 'Scheduled', value: stats.matchesScheduled },
    { name: 'Live', value: stats.matchesLive },
    { name: 'Completed', value: stats.matchesCompleted },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartCard title="Registration Payment Status">
        <BarChart data={paymentData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#0b1a35" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
      <ChartCard title="Matches by Status">
        <BarChart data={matchData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#f2b705" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="mb-2 text-sm font-bold text-navy-900">{title}</p>
      <ResponsiveContainer width="100%" height={220}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
