"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";

export function ComingSoon({
  icon,
  title,
  description,
  cta,
}: {
  /** A rendered icon element (e.g. `<Box className="size-8" />`) — never a
   * component reference, since this is a Client Component and a Server
   * Component caller can't pass a function/component across that boundary. */
  icon: React.ReactNode;
  title: string;
  description: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <motion.span
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
      >
        {icon}
      </motion.span>
      <Badge variant="secondary" className="mb-3">
        Coming soon
      </Badge>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}
