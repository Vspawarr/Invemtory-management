"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";

export function InfoTile({
  label,
  value,
  icon,
  index = 0,
  subvalue,
  badge,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  index?: number;
  /** A second, smaller line under the value — e.g. "Actual: Not confirmed". */
  subvalue?: string;
  /** A status badge (e.g. "Needs review") shown beside the label. */
  badge?: { label: string; tone?: "warning" | "success" | "muted" };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="rounded-xl border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {subvalue && <p className="text-xs text-muted-foreground">{subvalue}</p>}
        {badge && (
          <Badge variant={badge.tone ?? "warning"} className="text-[10px]">
            {badge.label}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}
