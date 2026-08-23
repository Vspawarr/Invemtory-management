import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { Activity, CalendarClock, Landmark, Leaf, Stethoscope } from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { getCropById } from "@/lib/server/dal/crops";
import { computeCropStageStatuses, getCropStageDisplay } from "@/lib/server/crop-timeline/rules";
import { calculateCropAgeDays } from "@/lib/server/crop-timeline/crop-age";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { InfoTile } from "@/components/dashboard/info-tile";
import { CropLifecycleTimeline, type TimelineStageVM } from "@/components/crops/crop-lifecycle-timeline";
import { TreatmentJourney } from "@/components/crops/treatment-journey";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = { title: "My Crop — Champavati Agro" };

export default async function FarmerCropDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const crop = await getCropById(session, id);
  if (!crop) notFound();

  const today = new Date();
  const currentStageSequence = crop.currentStage?.sequenceSnapshot ?? null;
  const stageInput = crop.timelineStages.map((s) => ({
    sequence: s.sequenceSnapshot,
    expectedStartDate: s.expectedStartDate,
    expectedEndDate: s.expectedEndDate,
    actualStartDate: s.actualStartDate,
    actualEndDate: s.actualEndDate,
  }));
  const statused = computeCropStageStatuses(stageInput, currentStageSequence, today);
  const statusBySequence = new Map(statused.map((s) => [s.sequence, s.status]));
  const stageDisplay = getCropStageDisplay(stageInput, currentStageSequence, today);
  const expectedStage = crop.timelineStages.find((s) => s.sequenceSnapshot === stageDisplay.expectedSequence);
  const stageLabel = stageDisplay.needsReview
    ? `Expected stage: ${expectedStage?.stageNameSnapshot ?? "—"} (not confirmed)`
    : `Current stage: ${crop.currentStage?.stageNameSnapshot ?? "—"}`;

  const stages: TimelineStageVM[] = crop.timelineStages.map((s) => ({
    id: s.id,
    stageNameSnapshot: s.stageNameSnapshot,
    localNameSnapshot: s.localNameSnapshot,
    sequenceSnapshot: s.sequenceSnapshot,
    expectedStartDate: s.expectedStartDate.toISOString(),
    expectedEndDate: s.expectedEndDate.toISOString(),
    actualStartDate: s.actualStartDate?.toISOString() ?? null,
    actualEndDate: s.actualEndDate?.toISOString() ?? null,
    status: statusBySequence.get(s.sequenceSnapshot) ?? "UPCOMING",
    criticalStageSnapshot: s.criticalStageSnapshot,
    waterSensitiveSnapshot: s.waterSensitiveSnapshot,
    weatherSensitiveSnapshot: s.weatherSensitiveSnapshot,
    monitoringActionsSnapshot: s.monitoringActionsSnapshot,
    commonPestsSnapshot: s.commonPestsSnapshot,
    commonDiseasesSnapshot: s.commonDiseasesSnapshot,
    notes: s.notes,
    adjustmentReason: s.adjustmentReason,
  }));

  const cropAgeDays = calculateCropAgeDays(crop.anchorDate, today);
  const latestHealth = crop.healthRecords[0];

  return (
    <div className="space-y-6 p-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-semibold">
            {crop.cropMaster.name}
            {crop.variety ? ` — ${crop.variety}` : ""}
          </h1>
          <Badge variant="outline">{crop.status.replaceAll("_", " ")}</Badge>
          {stageDisplay.needsReview && <Badge variant="warning">Needs review</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{crop.landParcel.name}</p>
        <p className="mt-1 text-sm font-medium">{stageLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Crop age" value={cropAgeDays} suffix=" days" icon={<CalendarClock className="size-4" />} index={0} />
        <InfoTile
          label="Expected harvest"
          value={crop.expectedHarvestDate ? format(crop.expectedHarvestDate, "d MMM yyyy") : "—"}
          icon={<Leaf className="size-4" />}
          index={1}
        />
        <KpiCard
          label="Health"
          value={latestHealth?.overallHealth ?? null}
          suffix=" / 5"
          icon={<Activity className="size-4" />}
          tone="success"
          index={2}
        />
        <InfoTile label="Land" value={`${Number(crop.areaAcres).toFixed(1)} ac`} icon={<Landmark className="size-4" />} index={3} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crop timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {stages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No timeline available.</p>
          ) : (
            <CropLifecycleTimeline stages={stages} anchorLabel={crop.anchorType.replace("_", " ")} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Treatment history</CardTitle>
        </CardHeader>
        <CardContent>
          {crop.recommendations.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="No treatments yet"
              description="Treatments recorded by the shop will appear here."
              className="py-8"
            />
          ) : (
            <TreatmentJourney recommendations={crop.recommendations} editable={false} basePath="/farmer" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
