"use client";

import { AlertTriangle, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ErrorState({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isForbidden = /access|forbidden|permission/i.test(error.message);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        {isForbidden ? <ShieldOff className="size-7" /> : <AlertTriangle className="size-7" />}
      </span>
      <h2 className="font-display text-lg font-semibold">
        {isForbidden ? "You don't have access to this" : "Something went wrong"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {isForbidden
          ? "This record belongs to someone else, or you're not signed in with the right account."
          : "We couldn't load this page right now. Please try again."}
      </p>
      {!isForbidden && (
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      )}
    </div>
  );
}
