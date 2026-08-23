import type { Metadata } from "next";

import { requireSession } from "@/lib/server/require-session";
import { listFollowups } from "@/lib/server/dal/followups";
import { listFarmersForCropWizard } from "@/lib/server/dal/farmers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowupList } from "@/components/followups/followup-list";
import { AddFollowupDialog } from "@/components/followups/add-followup-dialog";

export const metadata: Metadata = { title: "Follow-ups — Champavati Agro" };

export default async function FollowupsPage() {
  const session = await requireSession();
  const [today, upcoming, overdue, farmers] = await Promise.all([
    listFollowups(session, "today"),
    listFollowups(session, "upcoming"),
    listFollowups(session, "overdue"),
    listFarmersForCropWizard(session),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Follow-ups</h1>
          <p className="text-sm text-muted-foreground">
            {overdue.length} overdue · {today.length} today · {upcoming.length} upcoming
          </p>
        </div>
        <AddFollowupDialog farmers={farmers.map((f) => ({ id: f.id, fullName: f.fullName }))} />
      </div>

      <Tabs defaultValue="overdue">
        <TabsList>
          <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
          <TabsTrigger value="today">Today ({today.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="overdue" className="mt-4">
          <FollowupList followups={overdue} emptyMessage="No overdue follow-ups. Good work." />
        </TabsContent>
        <TabsContent value="today" className="mt-4">
          <FollowupList followups={today} emptyMessage="Nothing due today." />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4">
          <FollowupList followups={upcoming} emptyMessage="Nothing scheduled in the next 30 days." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
