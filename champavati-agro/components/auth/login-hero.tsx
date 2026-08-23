"use client";

import { motion } from "framer-motion";
import { Leaf, Sprout, TrendingUp } from "lucide-react";

const points = [
  { icon: Sprout, label: "Every farmer, every land parcel, every crop cycle" },
  { icon: TrendingUp, label: "Full treatment journey from problem to result" },
  { icon: Leaf, label: "Real-time crop health and follow-up intelligence" },
];

export function LoginHero() {
  return (
    <div className="relative hidden overflow-hidden bg-forest-900 lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-24 -left-16 size-96 rounded-full bg-emerald-500/20 blur-3xl"
          animate={{ y: [0, 24, 0], x: [0, 12, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 size-[28rem] rounded-full bg-leaf-500/15 blur-3xl"
          animate={{ y: [0, -20, 0], x: [0, -16, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.35))]" />
      </div>

      <div className="relative z-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-emerald-200 uppercase">
          Champavati Agro
        </span>
        <h1 className="mt-6 font-display text-4xl leading-tight font-semibold text-white">
          Farmer &amp; Crop
          <br />
          Intelligence
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
          Better records. Better crop decisions. Chapaner, Tal. Kannad, Dist. Chhatrapati
          Sambhajinagar.
        </p>
      </div>

      <ul className="relative z-10 space-y-4">
        {points.map(({ icon: Icon, label }, i) => (
          <motion.li
            key={label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 * i + 0.2, duration: 0.4 }}
            className="flex items-center gap-3 text-sm text-white/85"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <Icon className="size-4 text-emerald-300" />
            </span>
            {label}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
