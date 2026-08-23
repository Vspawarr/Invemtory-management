/** Shared client+server-safe label maps for PhotoCategory/PhotoPhase — no
 * "server-only" import, since the upload dialog, gallery, and lightbox
 * (all client components) need these too. */

export const PHOTO_CATEGORIES = [
  "FIELD_VISIT",
  "CROP_HEALTH",
  "PEST",
  "DISEASE",
  "WEED",
  "NUTRIENT_DEFICIENCY",
  "WATER_CONDITION",
  "GROWTH",
  "TREATMENT_RESULT",
  "HARVEST",
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export const PHOTO_CATEGORY_LABEL: Record<PhotoCategory, string> = {
  FIELD_VISIT: "Field Visit",
  CROP_HEALTH: "Crop Health",
  PEST: "Pest",
  DISEASE: "Disease",
  WEED: "Weed",
  NUTRIENT_DEFICIENCY: "Nutrient Deficiency",
  WATER_CONDITION: "Water Condition",
  GROWTH: "Growth",
  TREATMENT_RESULT: "Treatment Result",
  HARVEST: "Harvest",
};

export type PhotoPhase = "BEFORE" | "AFTER";

export const PHOTO_PHASE_LABEL: Record<PhotoPhase, string> = {
  BEFORE: "Before",
  AFTER: "After",
};
