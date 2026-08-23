import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Beaker, ClipboardCheck, MessageSquareHeart, Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Recommendation = {
  id: string;
  createdAt: Date;
  targetPestOrDisease: string | null;
  dosage: string | null;
  notes: string | null;
  product: { id: string; name: string; brand: string | null };
  timelineStage: { stageNameSnapshot: string } | null;
  /** Only present when this journey spans multiple crops (e.g. Farmer 360°,
   * where each entry needs to say which crop it belongs to) — Crop 360°
   * omits it since the crop is already implied by the page. */
  crop?: { cropMaster: { name: string } };
  applications: {
    id: string;
    status: string;
    appliedDate: Date | null;
    treatmentResult: {
      id: string;
      result: string;
      improvementPercent: number | null;
      feedback: { id: string; rating: number; comments: string | null } | null;
      photos?: { id: string; phase: "BEFORE" | "AFTER" | null }[];
    } | null;
  }[];
};

const RESULT_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  EXCELLENT: "success",
  GOOD: "success",
  MODERATE: "warning",
  NO_IMPROVEMENT: "warning",
  POOR: "danger",
  CROP_DAMAGED: "danger",
};

const STATUS_TONE: Record<string, "muted" | "warning" | "success" | "danger"> = {
  RECOMMENDED: "muted",
  PURCHASED: "warning",
  APPLIED: "success",
  NOT_APPLIED: "danger",
  CANCELLED: "danger",
};

export function TreatmentJourney({
  recommendations,
  editable = true,
  basePath = "/admin",
}: {
  recommendations: Recommendation[];
  /** Farmers get a read-mostly view — only the feedback link is actionable for them. */
  editable?: boolean;
  basePath?: string;
}) {
  return (
    <div className="space-y-6">
      {recommendations.map((rec, i) => {
        const application = rec.applications[0];
        const result = application?.treatmentResult;
        return (
          <div key={rec.id}>
            {i > 0 && <Separator className="mb-6" />}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{format(rec.createdAt, "d MMM yyyy")}</span>
              {rec.crop && <Badge variant="secondary">{rec.crop.cropMaster.name}</Badge>}
              {rec.timelineStage && <Badge variant="outline">{rec.timelineStage.stageNameSnapshot}</Badge>}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Stethoscope className="size-4 text-muted-foreground" />
                {rec.targetPestOrDisease || "Problem observed"}
              </span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
              <span className="flex items-center gap-1.5">
                <Beaker className="size-4 text-muted-foreground" />
                {rec.product.name}
                {rec.product.brand ? ` (${rec.product.brand})` : ""}
              </span>
              {application && (
                <>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  <Badge variant={STATUS_TONE[application.status] ?? "muted"}>
                    {application.status.replaceAll("_", " ")}
                  </Badge>
                </>
              )}
              {result && (
                <>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  <span className="flex items-center gap-1.5">
                    <ClipboardCheck className="size-4 text-muted-foreground" />
                    <Badge variant={RESULT_TONE[result.result] ?? "muted"}>
                      {result.result.replaceAll("_", " ")}
                      {result.improvementPercent !== null ? ` · ${result.improvementPercent}%` : ""}
                    </Badge>
                  </span>
                </>
              )}
              {result?.feedback && (
                <>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  <span className="flex items-center gap-1.5">
                    <MessageSquareHeart className="size-4 text-muted-foreground" />
                    {result.feedback.rating}/5
                  </span>
                </>
              )}
            </div>

            {rec.dosage && <p className="mt-1 text-xs text-muted-foreground">Dosage: {rec.dosage}</p>}

            {result?.photos && result.photos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-3">
                {(["BEFORE", "AFTER"] as const).map((phase) => {
                  const phasePhotos = result.photos!.filter((p) => p.phase === phase);
                  if (phasePhotos.length === 0) return null;
                  return (
                    <div key={phase}>
                      <p className="mb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                        {phase === "BEFORE" ? "Before" : "After"}
                      </p>
                      <div className="flex gap-1.5">
                        {phasePhotos.map((p) => (
                          <a key={p.id} href={`/api/photos/${p.id}`} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element -- served from the authenticated /api/photos route */}
                            <img
                              src={`/api/photos/${p.id}`}
                              alt={`${phase} treatment photo`}
                              className="size-14 rounded-md border object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-2 flex gap-3 text-xs">
              {editable && application && !["APPLIED", "NOT_APPLIED", "CANCELLED"].includes(application.status) && (
                <Link href={`/admin/applications/${application.id}/update`} className="text-primary hover:underline">
                  Update application status
                </Link>
              )}
              {editable && application?.status === "APPLIED" && !result && (
                <Link href={`/admin/applications/${application.id}/result`} className="text-primary hover:underline">
                  Record result
                </Link>
              )}
              {result && !result.feedback && (
                <Link href={`${basePath}/treatment-results/${result.id}/feedback`} className="text-primary hover:underline">
                  {editable ? "Record farmer feedback" : "Share your feedback"}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
