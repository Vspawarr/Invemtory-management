"use client";

import { motion } from "framer-motion";
import { CalendarClock, Sprout, Users } from "lucide-react";

import { CountUp } from "@/components/dashboard/count-up";

export function DashboardHero({
  activeFarmers,
  activeCrops,
  cropsNearHarvest,
  pendingFollowups,
}: {
  activeFarmers: number;
  activeCrops: number;
  cropsNearHarvest: number;
  pendingFollowups: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-forest-900 px-6 py-8 sm:px-10 sm:py-10">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-20 -right-10 size-72 rounded-full bg-emerald-500/20 blur-3xl"
          animate={{ y: [0, 18, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 left-1/3 size-80 rounded-full bg-leaf-500/15 blur-3xl"
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10">
        <p className="text-xs font-medium tracking-widest text-emerald-200 uppercase">Champavati Agro</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
          Farmer &amp; Crop Intelligence
        </h1>
        <p className="mt-1 max-w-xl text-sm text-white/70">
          Know every farmer. Track every crop. Follow every treatment.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <HeroStat icon={<Users className="size-4" />} label="Active farmers" value={activeFarmers} />
          <HeroStat icon={<Sprout className="size-4" />} label="Active crops" value={activeCrops} />
          <HeroStat icon={<CalendarClock className="size-4" />} label="Near harvest" value={cropsNearHarvest} />
          <HeroStat icon={<CalendarClock className="size-4" />} label="Pending follow-ups" value={pendingFollowups} />
        </div>
      </div>
    </div>
  );
}

function HeroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-white/70">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1.5 font-display text-2xl font-semibold text-white">
        <CountUp value={value} />
      </p>
    </div>
  );
}
