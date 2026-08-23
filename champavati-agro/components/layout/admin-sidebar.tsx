"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

import { ADMIN_NAV } from "@/lib/nav-config";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card lg:flex">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Leaf className="size-4" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">Champavati Agro</p>
          <p className="text-[11px] text-muted-foreground">Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {ADMIN_NAV.map((item) => {
            const active = pathname.startsWith(item.href.split("?")[0]);
            return (
              <li key={item.href}>
                <Link
                  href={item.comingSoon ? item.href : item.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-nav-active"
                      className="absolute inset-0 rounded-lg bg-primary/10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <item.icon className="relative z-10 size-4" />
                  <span className="relative z-10">{item.label}</span>
                  {item.comingSoon && (
                    <Badge variant="muted" className="relative z-10 ml-auto text-[10px]">
                      Soon
                    </Badge>
                  )}
                </Link>
                {item.children && active && (
                  <ul className="mt-1 ml-8 space-y-0.5 border-l pl-3">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
