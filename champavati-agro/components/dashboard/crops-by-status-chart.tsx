"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  SEEDED: "Seeded",
  GROWING: "Growing",
  FLOWERING: "Flowering",
  DEVELOPMENT: "Development",
  HARVEST_READY: "Harvest ready",
  HARVESTED: "Harvested",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export function CropsByStatusChart({ data }: { data: { status: string; count: number }[] }) {
  const chartData = data
    .map((d) => ({ status: STATUS_LABELS[d.status] ?? d.status, count: d.count }))
    .sort((a, b) => b.count - a.count);

  if (chartData.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No crop data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="status"
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          cursor={{ fill: "var(--color-muted)" }}
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" fill="var(--color-forest-500)" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
