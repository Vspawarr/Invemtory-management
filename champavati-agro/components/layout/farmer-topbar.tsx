"use client";

import { signOut } from "next-auth/react";
import { Leaf, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FarmerTopbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Leaf className="size-3.5" />
        </span>
        <p className="font-display text-sm font-semibold">Champavati Agro</p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
        <LogOut className="size-4" />
      </Button>
    </header>
  );
}
