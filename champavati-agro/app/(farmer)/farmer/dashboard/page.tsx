import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { CalendarClock, Landmark, Sprout, Stethoscope } from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { getOwnFarmerProfile, getFarmerStats } from "@/lib/server/dal/farmers";
import { listCropsForCurrentUser } from "@/lib/server/dal/crops";
import { listFollowups } from "@/lib/server/dal/followups";
import { listRecommendations } from "@/lib/server/dal/treatments";
import { confirmedCurrentStageStatus, isStatusConcerning } from "@/lib/server/crop-timeline/rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = { title: "My Farm — Champavati Agro" };

export default async function FarmerDashboardPage() {
  const session = await requireSession();
  const farmer = await getOwnFarmerProfile(session);
  if (!farmer) return null;

  const [stats, crops, overdue, today, upcoming, recommendations] = await Promise.all([
    getFarmerStats(session, farmer.id),
    listCropsForCurrentUser(session),
    listFollowups(session, "overdue"),
    listFollowups(session, "today"),
    listFollowups(session, "upcoming"),
    listRecommendations(session),
  ]);

  const nextFollowup = [...overdue, ...today, ...upcoming][0];
  const recentTreatment = recommendations[0];
  const now = new Date();

  return (
    <div className="space-y-6 p-4">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="font-display text-xl font-semibold">{farmer.fullName}</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="My land" value={stats.totalLandAcres} decimals={1} suffix=" ac" icon={<Landmark className="size-4" />} index={0} />
        <KpiCard label="Active crops" value={stats.activeCrops} icon={<Sprout className="size-4" />} index={1} />
        <KpiCard
          label="Follow-ups"
          value={overdue.length + today.length}
          icon={<CalendarClock className="size-4" />}
          tone={overdue.length > 0 ? "warning" : "default"}
          index={2}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My crops</CardTitle>
        </CardHeader>
        <CardContent>
          {crops.length === 0 ? (
            <EmptyState
              icon={Sprout}
              title="No crops yet"
              description="Your crop cycles will appear here once the shop adds them."
              className="py-8"
            />
          ) : (
            <ul className="divide-y">
              {crops.slice(0, 4).map((crop) => (
                <li key={crop.id}>
                  <Link
                    href={`/farmer/crops/${crop.id}`}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{crop.cropMaster.name}</p>
                      <p className="text-xs text-muted-foreground">{crop.landParcel.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{crop.currentStage?.stageNameSnapshot ?? "—"}</Badge>
                      {crop.currentStage && isStatusConcerning(confirmedCurrentStageStatus(crop.currentStage, now)) && (
                        <Badge variant="warning" className="text-[10px]">
                          Review
                        </Badge>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next follow-up</CardTitle>
        </CardHeader>
        <CardContent>
          {!nextFollowup ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
          ) : (
            <div>
              <p className="text-sm font-medium">{nextFollowup.reason}</p>
              <p className="text-xs text-muted-foreground">Due {format(nextFollowup.dueDate, "d MMM yyyy")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent treatment</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentTreatment ? (
            <EmptyState
              icon={Stethoscope}
              title="No treatments yet"
              description="Recommendations from the shop will appear here."
              className="py-8"
            />
          ) : (
            <Link href={`/farmer/crops/${recentTreatment.crop.id}`} className="block">
              <p className="text-sm font-medium">{recentTreatment.product.name}</p>
              <p className="text-xs text-muted-foreground">
                {recentTreatment.crop.cropMaster.name} · {format(recentTreatment.createdAt, "d MMM yyyy")}
              </p>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
