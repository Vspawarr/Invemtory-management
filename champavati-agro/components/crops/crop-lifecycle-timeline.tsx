"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Circle,
  FlaskConical,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PhotoLightbox } from "@/components/crops/photo-lightbox";
import type { GalleryPhoto } from "@/lib/photo-types";

export type TimelineStageVM = {
  id: string;
  stageNameSnapshot: string;
  localNameSnapshot: string;
  sequenceSnapshot: number;
  expectedStartDate: string;
  expectedEndDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  status: "UPCOMING" | "CURRENT" | "COMPLETED" | "DELAYED" | "NEEDS_REVIEW";
  criticalStageSnapshot: boolean;
  waterSensitiveSnapshot: boolean;
  weatherSensitiveSnapshot: boolean;
  monitoringActionsSnapshot: string | null;
  commonPestsSnapshot: string[];
  commonDiseasesSnapshot: string[];
  notes: string | null;
  adjustmentReason: string | null;
  hasTreatmentActivity?: boolean;
  hasHealthConcern?: boolean;
  /** Photos taken during this stage — drives the "📷 05 Aug" indicator and
   * the drawer's Field Photos section. Never affects timeline calculation. */
  photos?: GalleryPhoto[];
};

const STATUS_STYLES: Record<TimelineStageVM["status"], string> = {
  COMPLETED: "border-forest-500 bg-forest-500 text-white",
  CURRENT: "border-primary bg-primary text-primary-foreground",
  UPCOMING: "border-border bg-muted text-muted-foreground",
  DELAYED: "border-warmyellow-600 bg-warmyellow-500 text-white",
  NEEDS_REVIEW: "border-warmyellow-600 bg-warmyellow-500 text-white",
};

function StatusIcon({ status }: { status: TimelineStageVM["status"] }) {
  if (status === "COMPLETED") return <CheckCircle2 className="size-4" />;
  if (status === "DELAYED" || status === "NEEDS_REVIEW") return <AlertTriangle className="size-4" />;
  if (status === "CURRENT") return <span className="block size-2.5 rounded-full bg-current" />;
  return <Circle className="size-4" />;
}

export function CropLifecycleTimeline({
  stages,
  anchorLabel,
}: {
  stages: TimelineStageVM[];
  anchorLabel: string;
}) {
  const [selected, setSelected] = useState<TimelineStageVM | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sorted = [...stages].sort((a, b) => a.sequenceSnapshot - b.sequenceSnapshot);
  const anchorSequence = sorted.find((s) => {
    const start = new Date(s.expectedStartDate).getTime();
    const end = new Date(s.expectedEndDate).getTime();
    return start === end && s.criticalStageSnapshot;
  })?.sequenceSnapshot;

  return (
    <>
      <ol className="relative">
        {sorted.map((stage, i) => {
          const isAnchor = stage.sequenceSnapshot === anchorSequence;
          return (
            <motion.li
              key={stage.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.25 }}
              className="relative flex gap-4 pb-7 last:pb-0"
            >
              {i < sorted.length - 1 && (
                <span
                  className={cn(
                    "absolute top-7 left-[13px] h-full w-px",
                    stage.status === "COMPLETED" ? "bg-forest-500" : "bg-border"
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => setSelected(stage)}
                className="group relative z-10 mt-0.5 shrink-0"
                aria-label={`View ${stage.stageNameSnapshot} details`}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border-2 transition-transform group-hover:scale-110",
                    STATUS_STYLES[stage.status]
                  )}
                >
                  <StatusIcon status={stage.status} />
                </span>
                {stage.status === "CURRENT" && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-primary/40"
                    animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelected(stage)}
                className="flex-1 rounded-lg px-2 py-1 text-left transition-colors hover:bg-muted/60"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{stage.stageNameSnapshot}</p>
                  <span className="text-xs text-muted-foreground">{stage.localNameSnapshot}</span>
                  {isAnchor && (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Sparkles className="size-3" /> {anchorLabel}
                    </Badge>
                  )}
                  {stage.status === "CURRENT" && (
                    <Badge className="text-[10px]">Current</Badge>
                  )}
                  {stage.status === "DELAYED" && (
                    <Badge variant="warning" className="text-[10px]">
                      Delayed
                    </Badge>
                  )}
                  {stage.status === "NEEDS_REVIEW" && (
                    <Badge variant="warning" className="text-[10px]">
                      Needs review
                    </Badge>
                  )}
                  {stage.hasTreatmentActivity && (
                    <FlaskConical className="size-3.5 text-sky-600" aria-label="Treatment recorded" />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {format(new Date(stage.expectedStartDate), "d MMM")} –{" "}
                  {format(new Date(stage.expectedEndDate), "d MMM yyyy")}
                  {stage.actualStartDate && (
                    <span className="ml-2 text-forest-600">
                      · Actual: {format(new Date(stage.actualStartDate), "d MMM")}
                      {stage.actualEndDate && `–${format(new Date(stage.actualEndDate), "d MMM")}`}
                    </span>
                  )}
                </p>
                {stage.photos && stage.photos.length > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Camera className="size-3.5" />
                    {format(stage.photos[0].createdAt, "d MMM")}
                    {stage.photos.length > 1 && ` (+${stage.photos.length - 1} more)`}
                    {stage.photos[0].caption ? ` — ${stage.photos[0].caption}` : ""}
                  </p>
                )}
              </button>
            </motion.li>
          );
        })}
      </ol>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.stageNameSnapshot}</SheetTitle>
                <SheetDescription>{selected.localNameSnapshot}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 overflow-y-auto px-6 pb-6 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Expected</p>
                    <p className="font-medium">
                      {format(new Date(selected.expectedStartDate), "d MMM yyyy")} –{" "}
                      {format(new Date(selected.expectedEndDate), "d MMM yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Actual</p>
                    <p className="font-medium">
                      {selected.actualStartDate
                        ? `${format(new Date(selected.actualStartDate), "d MMM yyyy")}${
                            selected.actualEndDate
                              ? ` – ${format(new Date(selected.actualEndDate), "d MMM yyyy")}`
                              : ""
                          }`
                        : "Not recorded yet"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={selected.status === "COMPLETED" ? "success" : "outline"}>
                    {selected.status.replaceAll("_", " ")}
                  </Badge>
                  {selected.criticalStageSnapshot && <Badge variant="warning">Critical stage</Badge>}
                  {selected.waterSensitiveSnapshot && <Badge variant="info">Water-sensitive</Badge>}
                  {selected.weatherSensitiveSnapshot && <Badge variant="info">Weather-sensitive</Badge>}
                </div>

                {selected.monitoringActionsSnapshot && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Monitoring guidance</p>
                    <p className="rounded-lg bg-muted/60 p-3 text-sm">
                      {selected.monitoringActionsSnapshot}
                    </p>
                  </div>
                )}

                {(selected.commonPestsSnapshot.length > 0 || selected.commonDiseasesSnapshot.length > 0) && (
                  <div className="grid grid-cols-2 gap-3">
                    {selected.commonPestsSnapshot.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Common pests</p>
                        <p className="text-sm">{selected.commonPestsSnapshot.join(", ")}</p>
                      </div>
                    )}
                    {selected.commonDiseasesSnapshot.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Common diseases</p>
                        <p className="text-sm">{selected.commonDiseasesSnapshot.join(", ")}</p>
                      </div>
                    )}
                  </div>
                )}

                {selected.adjustmentReason && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Manual adjustment</p>
                      <p className="text-sm">{selected.adjustmentReason}</p>
                    </div>
                  </>
                )}

                {selected.notes && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm">{selected.notes}</p>
                  </div>
                )}

                {selected.photos && selected.photos.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Field photos</p>
                      <div className="grid grid-cols-3 gap-2">
                        {selected.photos.map((photo, i) => (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => setLightboxIndex(i)}
                            className="relative aspect-square overflow-hidden rounded-lg border"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element -- served from the authenticated /api/photos route */}
                            <img
                              src={`/api/photos/${photo.id}`}
                              alt={photo.caption ?? ""}
                              loading="lazy"
                              className="size-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {selected?.photos && lightboxIndex !== null && (
        <PhotoLightbox
          photos={selected.photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
