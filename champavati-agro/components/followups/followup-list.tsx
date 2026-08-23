"use client";

import Link from "next/link";
import { format } from "date-fns";
import { CalendarClock, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { updateFollowupStatusAction } from "@/lib/server/actions/followups";

type Followup = {
  id: string;
  reason: string;
  priority: string;
  dueDate: Date;
  farmer: { id: string; fullName: string; village: string; phone: string };
  crop: { id: string; cropMaster: { name: string } } | null;
};

const PRIORITY_TONE: Record<string, "muted" | "warning" | "danger"> = {
  LOW: "muted",
  MEDIUM: "muted",
  HIGH: "warning",
  URGENT: "danger",
};

export function FollowupList({ followups, emptyMessage }: { followups: Followup[]; emptyMessage: string }) {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function complete(id: string) {
    setCompletingId(id);
    startTransition(async () => {
      const result = await updateFollowupStatusAction({ followupId: id, status: "COMPLETED" });
      setCompletingId(null);
      if (!result.ok) toast.error(result.error);
      else toast.success("Follow-up marked complete.");
    });
  }

  if (followups.length === 0) {
    return (
      <EmptyState icon={CalendarClock} title="Nothing here" description={emptyMessage} className="py-10" />
    );
  }

  return (
    <ul className="space-y-2">
      {followups.map((f) => (
        <li key={f.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/admin/farmers/${f.farmer.id}`} className="text-sm font-medium hover:underline">
                {f.farmer.fullName}
              </Link>
              <Badge variant={PRIORITY_TONE[f.priority]}>{f.priority}</Badge>
              {f.crop && (
                <Link href={`/admin/crops/${f.crop.id}`} className="text-xs text-muted-foreground hover:underline">
                  {f.crop.cropMaster.name}
                </Link>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {f.reason} · Due {format(f.dueDate, "d MMM yyyy")} · {f.farmer.village}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => complete(f.id)} disabled={completingId === f.id}>
            {completingId === f.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Done
          </Button>
        </li>
      ))}
    </ul>
  );
}
