"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type PickerItem = { id: string; label: string; sublabel?: string; href: string };

/**
 * Shared entry point for quick actions that are inherently scoped to a
 * single crop or treatment result (Record Health, Recommend Product, Record
 * Feedback) rather than to the farmer directly. Picking an item navigates to
 * the SAME existing crop-level / treatment-level page and form that Crop
 * 360° already uses — this dialog never re-implements those forms, it just
 * gives Farmer 360° a real entry point into them.
 */
export function ActionPickerDialog({
  triggerLabel,
  triggerIcon,
  title,
  description,
  items,
  emptyMessage,
}: {
  triggerLabel: string;
  /** A rendered icon element (e.g. `<Activity className="size-4" />`) — never
   * a component reference, since this is a Client Component and a Server
   * Component parent can't pass a function/component across that boundary. */
  triggerIcon: React.ReactNode;
  title: string;
  description?: string;
  items: PickerItem[];
  emptyMessage: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {triggerIcon} {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {items.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center"
            )}
          >
            <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {triggerIcon}
            </span>
            <h3 className="font-display text-sm font-semibold">{emptyMessage}</h3>
            <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
              Add or advance a crop first, then this action will have somewhere to go.
            </p>
          </div>
        ) : (
          <ul className="max-h-80 space-y-1.5 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                  className="flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                >
                  <span>
                    <span className="font-medium">{item.label}</span>
                    {item.sublabel && <span className="ml-2 text-xs text-muted-foreground">{item.sublabel}</span>}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
