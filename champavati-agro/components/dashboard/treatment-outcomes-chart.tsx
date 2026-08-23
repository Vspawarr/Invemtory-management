"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const OUTCOME_META: Record<string, { label: string; color: string }> = {
  EXCELLENT: { label: "Excellent", color: "var(--color-emerald-500)" },
  GOOD: { label: "Good", color: "var(--color-forest-500)" },
  MODERATE: { label: "Moderate", color: "var(--color-warmyellow-500)" },
  NO_IMPROVEMENT: { label: "No improvement", color: "var(--color-warmyellow-600)" },
  POOR: { label: "Poor", color: "var(--color-earth-600)" },
  CROP_DAMAGED: { label: "Crop damaged", color: "var(--color-danger)" },
};

export function TreatmentOutcomesChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    key,
    name: OUTCOME_META[key]?.label ?? key,
    value,
    color: OUTCOME_META[key]?.color ?? "var(--color-muted-foreground)",
  }));

  if (chartData.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No treatment results recorded yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={entry.color} stroke="var(--color-card)" strokeWidth={2} />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
