import type { Metadata } from "next";
import { AlertTriangle, Bug, Landmark, ThumbsUp, Users } from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { getDashboardStats } from "@/lib/server/dal/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { CropsByStatusChart } from "@/components/dashboard/crops-by-status-chart";
import { TreatmentOutcomesChart } from "@/components/dashboard/treatment-outcomes-chart";

export const metadata: Metadata = { title: "Dashboard — Champavati Agro" };

export default async function AdminDashboardPage() {
  const session = await requireSession();
  const stats = await getDashboardStats(session);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <DashboardHero
        activeFarmers={stats.activeFarmers}
        activeCrops={stats.activeCrops}
        cropsNearHarvest={stats.cropsNearHarvest}
        pendingFollowups={stats.pendingFollowups}
      />

      <QuickActions />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total farmers" value={stats.totalFarmers} icon={<Users className="size-4" />} index={0} />
        <KpiCard
          label="Total acreage"
          value={stats.totalAcreage}
          decimals={1}
          suffix=" ac"
          icon={<Landmark className="size-4" />}
          index={1}
        />
        <KpiCard
          label="Delayed crops"
          value={stats.delayedCrops}
          icon={<AlertTriangle className="size-4" />}
          tone={stats.delayedCrops > 0 ? "warning" : "default"}
          href="/admin/crops"
          index={2}
        />
        <KpiCard
          label="Pest issues"
          value={stats.cropsWithPestIssues}
          icon={<Bug className="size-4" />}
          tone={stats.cropsWithPestIssues > 0 ? "warning" : "default"}
          index={3}
        />
        <KpiCard
          label="Treatment success"
          value={stats.treatmentSuccessRate}
          suffix="%"
          icon={<ThumbsUp className="size-4" />}
          tone="success"
          href="/admin/treatments"
          index={4}
        />
        <KpiCard
          label="Satisfaction"
          value={stats.avgSatisfaction}
          decimals={1}
          suffix=" / 5"
          icon={<ThumbsUp className="size-4" />}
          tone="success"
          href="/admin/feedback"
          index={5}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Crops by status</CardTitle>
          </CardHeader>
          <CardContent>
            <CropsByStatusChart data={stats.cropsByStatus} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Treatment outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <TreatmentOutcomesChart data={stats.treatmentOutcomes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
