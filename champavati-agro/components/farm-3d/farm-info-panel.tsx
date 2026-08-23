"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Camera, Sprout, Stethoscope, X } from "lucide-react";

import { farmPlotColorCss, farmPlotStatusLabel } from "@/lib/farm-3d-colors";
import { getCropEmoji, getCropVisualKind } from "@/lib/farm-3d-types";
import type { Farm3DPlot } from "@/lib/farm-3d-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TREATMENT_RESULT_LABELS: Record<string, string> = {
  EXCELLENT: "Excellent",
  GOOD: "Good",
  MODERATE: "Moderate",
  NO_IMPROVEMENT: "No improvement",
  POOR: "Poor",
  CROP_DAMAGED: "Crop damaged",
};

/** The Digital Farm's selection info panel — a lightweight summary built
 * only from real Farm3DPlot data, never a duplicate of Crop 360. "Open
 * Crop 360" is the ONLY navigation trigger; selecting a field in the 3D
 * scene never navigates on its own. */
export function FarmInfoPanel({ plot, onClose }: { plot: Farm3DPlot; onClose: () => void }) {
  const crop = plot.crop;
  const statusColor = farmPlotColorCss(plot);
  const emoji = crop ? getCropEmoji(getCropVisualKind(crop.cropName)) : "🟤";

  return (
    <Card className="border-primary/30">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Selected field</p>
            <h3 className="font-display text-base font-semibold">{plot.landParcelName}</h3>
          </div>
          <Button size="icon" variant="ghost" className="-mt-1 -mr-1 size-7" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        <Badge style={{ backgroundColor: statusColor, color: "white" }} className="border-0">
          {farmPlotStatusLabel(plot)}
        </Badge>

        <dl className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Area</dt>
            <dd>{plot.areaAcres.toFixed(2)} ac</dd>
          </div>
          {crop ? (
            <>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Crop</dt>
                <dd>
                  {emoji} {crop.cropName}
                  {crop.variety ? ` (${crop.variety})` : ""}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Stage</dt>
                <dd>{crop.stageName ?? "—"}</dd>
              </div>
              {crop.overallHealth !== null && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Health rating</dt>
                  <dd>{crop.overallHealth} / 5</dd>
                </div>
              )}
              {crop.expectedHarvestDate && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Expected harvest</dt>
                  <dd>{format(crop.expectedHarvestDate, "d MMM yyyy")}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <Camera className="size-3.5" /> Last observation
                </dt>
                <dd>{crop.lastObservationDate ? format(crop.lastObservationDate, "d MMM yyyy") : "None recorded"}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <Stethoscope className="size-3.5" /> Latest treatment
                </dt>
                <dd className="text-right">
                  {crop.latestTreatment
                    ? `${crop.latestTreatment.productName} — ${
                        TREATMENT_RESULT_LABELS[crop.latestTreatment.result ?? ""] ?? crop.latestTreatment.result
                      }`
                    : "None recorded"}
                </dd>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 pt-1 text-muted-foreground">
              <Sprout className="size-4" />
              No active crop on this land parcel.
            </div>
          )}
        </dl>

        {crop && (
          <Button asChild size="sm" className="w-full">
            <Link href={`/admin/crops/${crop.cropId}`}>
              Open Crop 360
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
