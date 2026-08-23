"use client";

import { motion } from "framer-motion";

import { CountUp } from "@/components/dashboard/count-up";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  decimals = 0,
  suffix = "",
  icon,
  tone = "default",
  href,
  index = 0,
}: {
  label: string;
  value: number | null;
  decimals?: number;
  suffix?: string;
  /** A rendered icon element (e.g. `<Landmark className="size-4" />`) — never a
   * component reference, since Server Components can't pass functions across
   * the client boundary. */
  icon: React.ReactNode;
  tone?: "default" | "warning" | "success";
  href?: string;
  index?: number;
}) {
  const Wrapper = href ? "a" : "div";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <Wrapper
        {...(href ? { href } : {})}
        className={cn(
          "block rounded-xl border bg-card p-5 shadow-sm transition-all duration-200",
          href && "hover:-translate-y-0.5 hover:shadow-md"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </span>
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              tone === "warning" && "bg-warning/15 text-earth-600",
              tone === "success" && "bg-success/15 text-forest-700",
              tone === "default" && "bg-primary/10 text-primary"
            )}
          >
            {icon}
          </span>
        </div>
        <p className="mt-3 font-display text-3xl font-semibold">
          {value === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <CountUp value={value} decimals={decimals} suffix={suffix} />
          )}
        </p>
      </Wrapper>
    </motion.div>
  );
}
