/** Client+server-safe shape for one land parcel's Digital Farm plot — the
 * 3D scene (a Client Component) needs this type without importing the
 * server-only DAL module that produces it. Digital Farm is a visualization
 * layer only: every field here is read from existing domain data/logic
 * (crop timeline, health records, treatments) — nothing here computes new
 * business state. */
export interface Farm3DPlot {
  landParcelId: string;
  landParcelName: string;
  areaAcres: number;
  soilType: string | null;
  crop: {
    cropId: string;
    cropName: string;
    variety: string | null;
    status: string;
    stageName: string | null;
    needsReview: boolean;
    harvestReady: boolean;
    overallHealth: number | null;
    /** 0 (first stage) .. 1 (last stage) — a straight normalization of the
     * existing stage sequence/total-stage-count, used only to scale the
     * planting's visual size/density. Never a re-derivation of what the
     * current stage IS (that stays getCropStageDisplay's job). */
    stageProgress: number;
    expectedHarvestDate: Date | null;
    lastObservationDate: Date | null;
    latestTreatment: { productName: string; result: string | null; date: Date } | null;
  } | null;
}

export type CropVisualKind = "cotton" | "maize" | "ginger" | "onion" | "sugarcane" | "generic";

const CROP_KEYWORDS: Partial<Record<CropVisualKind, string[]>> = {
  cotton: ["cotton"],
  maize: ["maize", "corn"],
  ginger: ["ginger"],
  onion: ["onion"],
  sugarcane: ["sugarcane", "sugar cane", "sugar-cane"],
};

/** Maps a real crop name (from CropMaster, via the DB) to a visual planting
 * style — this is a rendering-style lookup over the fixed 5-crop taxonomy
 * the plan itself defines, not a hard-coded farmer/crop instance. Unknown
 * crop names fall back to a generic low row planting rather than guessing. */
export function getCropVisualKind(cropName: string): CropVisualKind {
  const normalized = cropName.toLowerCase();
  for (const kind of ["cotton", "maize", "ginger", "onion", "sugarcane"] as const) {
    if (CROP_KEYWORDS[kind]?.some((keyword) => normalized.includes(keyword))) return kind;
  }
  return "generic";
}

export function getCropEmoji(kind: CropVisualKind): string {
  switch (kind) {
    case "cotton":
      return "🌿";
    case "maize":
      return "🌽";
    case "ginger":
      return "🫚";
    case "onion":
      return "🧅";
    case "sugarcane":
      return "🎋";
    default:
      return "🌱";
  }
}
