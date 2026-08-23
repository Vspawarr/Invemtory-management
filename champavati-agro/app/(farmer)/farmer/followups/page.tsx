import type { Metadata } from "next";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { listFollowups } from "@/lib/server/dal/followups";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = { title: "Follow-ups — Champavati Agro" };

const PRIORITY_TONE: Record<string, "muted" | "warning" | "danger"> = {
  LOW: "muted",
  MEDIUM: "muted",
  HIGH: "warning",
  URGENT: "danger",
};

export default async function FarmerFollowupsPage() {
  const session = await requireSession();
  const [overdue, today, upcoming] = await Promise.all([
    listFollowups(session, "overdue"),
    listFollowups(session, "today"),
    listFollowups(session, "upcoming"),
  ]);
  const all = [...overdue, ...today, ...upcoming];

  return (
    <div className="space-y-4 p-4">
      <h1 className="font-display text-xl font-semibold">Follow-ups</h1>

      {all.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Nothing scheduled" description="No follow-ups right now." />
      ) : (
        <div className="space-y-3">
          {all.map((f) => (
            <Card key={f.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{f.reason}</p>
                  <Badge variant={PRIORITY_TONE[f.priority]}>{f.priority}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Due {format(f.dueDate, "d MMM yyyy")}
                  {f.crop ? ` · ${f.crop.cropMaster.name}` : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
