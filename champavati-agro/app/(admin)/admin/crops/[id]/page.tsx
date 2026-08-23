import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import {
  Activity,
  CalendarClock,
  Landmark,
  Leaf,
  MapPin,
  Plus,
  Stethoscope,
  User,
} from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { getCropById } from "@/lib/server/dal/crops";
import { listCropPhotos } from "@/lib/server/dal/photos";
import { computeCropStageStatuses, getCropStageDisplay } from "@/lib/server/crop-timeline/rules";
import { calculateCropAgeDays } from "@/lib/server/crop-timeline/crop-age";
import { AdvanceStageDialog } from "@/components/crops/advance-stage-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { InfoTile } from "@/components/dashboard/info-tile";
import { CropLifecycleTimeline, type TimelineStageVM } from "@/components/crops/crop-lifecycle-timeline";
import { HealthRecordsPanel } from "@/components/crops/health-records-panel";
import { WeatherPanel } from "@/components/crops/weather-panel";
import { TreatmentJourney } from "@/components/crops/treatment-journey";
import { PhotoGallery } from "@/components/crops/photo-gallery";
import { PhotoUploadDialog } from "@/components/crops/photo-upload-dialog";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = { title: "Crop 360° — Champavati Agro" };

const STATUS_TONE: Record<string, "success" | "warning" | "muted"> = {
  PLANNED: "muted",
  SEEDED: "muted",
  GROWING: "success",
  FLOWERING: "success",
  DEVELOPMENT: "success",
  HARVEST_READY: "warning",
  HARVESTED: "muted",
  COMPLETED: "muted",
  FAILED: "warning",
  CANCELLED: "muted",
};

export default async function CropProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const crop = await getCropById(session, id);
  if (!crop) notFound();
  const { photos, total: totalPhotos } = await listCropPhotos(session, crop.id, { take: 100 });

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

  const photosByStage = new Map<string, typeof photos>();
  for (const photo of photos) {
    if (!photo.timelineStageId) continue;
    photosByStage.set(photo.timelineStageId, [...(photosByStage.get(photo.timelineStageId) ?? []), photo]);
  }

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
    photos: photosByStage.get(s.id),
  }));

  const cropAgeDays = calculateCropAgeDays(crop.anchorDate, today);
  const latestHealth = crop.healthRecords[0];

  const stageTile = stageDisplay.needsReview
    ? {
        label: "Expected stage",
        value: expectedStage?.stageNameSnapshot ?? "—",
        subvalue: "Actual stage: Not confirmed",
        badge: { label: "Needs review", tone: "warning" as const },
      }
    : {
        label: "Current stage",
        value: crop.currentStage?.stageNameSnapshot ?? "—",
        subvalue: undefined,
        badge: undefined,
      };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold">
              {crop.cropMaster.name}
              {crop.variety ? ` — ${crop.variety}` : ""}
            </h1>
            <Badge variant={STATUS_TONE[crop.status] ?? "muted"}>{crop.status.replaceAll("_", " ")}</Badge>
            {stageDisplay.needsReview && <Badge variant="warning">Needs review</Badge>}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link href={`/admin/farmers/${crop.farmer.id}`} className="flex items-center gap-1 hover:underline">
              <User className="size-3.5" /> {crop.farmer.fullName}
            </Link>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {crop.landParcel.name}
            </span>
            <span className="flex items-center gap-1">
              <Landmark className="size-3.5" /> {Number(crop.areaAcres).toFixed(2)} acres
            </span>
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Crop age" value={cropAgeDays} suffix=" days" icon={<CalendarClock className="size-4" />} index={0} />
        <InfoTile
          label="Expected harvest"
          value={crop.expectedHarvestDate ? format(crop.expectedHarvestDate, "d MMM yyyy") : "—"}
          icon={<Leaf className="size-4" />}
          index={1}
        />
        <KpiCard
          label="Overall health"
          value={latestHealth?.overallHealth ?? null}
          suffix=" / 5"
          icon={<Activity className="size-4" />}
          tone="success"
          index={2}
        />
        <InfoTile
          label={stageTile.label}
          value={stageTile.value}
          subvalue={stageTile.subvalue}
          badge={stageTile.badge}
          icon={<Stethoscope className="size-4" />}
          index={3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Crop lifecycle timeline</CardTitle>
              {stages.length > 0 && (
                <AdvanceStageDialog
                  cropId={crop.id}
                  stages={crop.timelineStages.map((s) => ({
                    id: s.id,
                    stageNameSnapshot: s.stageNameSnapshot,
                    sequenceSnapshot: s.sequenceSnapshot,
                  }))}
                  currentStageId={crop.currentStageId}
                />
              )}
            </CardHeader>
            <CardContent>
              {stages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No timeline generated for this crop.</p>
              ) : (
                <CropLifecycleTimeline stages={stages} anchorLabel={crop.anchorType.replace("_", " ")} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Crop photos</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{totalPhotos} photo{totalPhotos === 1 ? "" : "s"}</span>
                <PhotoUploadDialog
                  cropId={crop.id}
                  stages={crop.timelineStages.map((s) => ({ id: s.id, label: s.stageNameSnapshot }))}
                  defaultStageId={crop.currentStageId}
                />
              </div>
            </CardHeader>
            <CardContent>
              <PhotoGallery
                key={totalPhotos}
                cropId={crop.id}
                initialPhotos={photos}
                initialTotal={totalPhotos}
                editable
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Treatment journey</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/crops/${crop.id}/recommendations/new`}>
                  <Plus className="size-4" /> Recommend product
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {crop.recommendations.length === 0 ? (
                <EmptyState
                  icon={Stethoscope}
                  title="No treatment recorded for this crop yet"
                  description="When a problem is observed, record a recommendation to start the treatment journey."
                />
              ) : (
                <TreatmentJourney recommendations={crop.recommendations} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <HealthRecordsPanel cropId={crop.id} records={crop.healthRecords} />
          <WeatherPanel cropId={crop.id} entries={crop.weatherContexts} />
        </div>
      </div>
    </div>
  );
}
