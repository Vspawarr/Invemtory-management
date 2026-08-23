import type { Farm3DPlot } from "@/lib/farm-3d-types";

/**
 * Three.js's own Color.setStyle() parser (three/src/math/Color.js) only
 * recognizes rgb()/rgba()/hsl()/hsla() function syntax, hex, and named
 * colors — an oklch() string matches its function-call regex but falls
 * into the parser's `default` branch and is silently dropped, leaving the
 * material at its default white/gray. This is a Three.js-internal parser
 * limitation, not a browser CSS issue (real CSS and <canvas> 2D fillStyle
 * both resolve oklch() correctly). These hex values are the resolved
 * equivalents of the exact oklch() tokens in app/globals.css (verified via
 * browser canvas pixel-readback), for use ONLY in Three.js material props.
 */
export const FARM_3D_HEX = {
  healthy: "#318454", // --forest-500
  review: "#ce871b", // --warmyellow-600 (--warning-500)
  poor: "#db4241", // --danger-500
  harvestReady: "#e0af3b", // --warmyellow-500 — gold highlight, distinct from "needs review"
  empty: "#b48769", // --earth-400
  soil: "#734a2e", // --earth-600
  soilLight: "#966543", // --earth-500
  ground: "#88c99e", // --forest-300 — grass tone for the base plane
  boundary: "#1b683e", // --forest-600 — hedge/boundary vegetation
  foliage: "#20b46b", // --emerald-500 — tree canopy / dense crop foliage
  foliageLight: "#56d089", // --emerald-400
  trunk: "#734a2e", // --earth-600
  sky: "#7cc1e9", // --sky-400
  skyHorizon: "#d1f1db", // --forest-100 — soft haze near the horizon
  selectionRing: "#07502c", // --forest-700
} as const;

/** The same design tokens as real oklch() strings, for HTML/CSS-rendered
 * elements (legend swatches, Html labels) which resolve oklch() natively
 * — never used inside a Three.js material color prop. */
export const FARM_3D_CSS = {
  healthy: "oklch(0.55 0.11 155)", // --forest-500
  review: "oklch(0.68 0.14 70)", // --warmyellow-600
  poor: "oklch(0.6 0.19 25)", // --danger-500
  harvestReady: "oklch(0.78 0.14 85)", // --warmyellow-500
  empty: "oklch(0.66 0.07 55)", // --earth-400
} as const;

export type FarmPlotStatusKind = "healthy" | "review" | "poor" | "harvestReady" | "empty";

/** One shared definition of "what state is this plot in" — feeds both the
 * Three.js material color (via FARM_3D_HEX) and the legend/CSS color (via
 * FARM_3D_CSS), so the two never disagree. */
export function farmPlotStatus(plot: Farm3DPlot): FarmPlotStatusKind {
  if (!plot.crop) return "empty";
  if (plot.crop.harvestReady) return "harvestReady";
  if (plot.crop.needsReview) return "review";
  if (plot.crop.overallHealth !== null && plot.crop.overallHealth <= 2) return "poor";
  if (plot.crop.overallHealth === 3) return "review";
  return "healthy";
}

export function farmPlotColorHex(plot: Farm3DPlot): string {
  return FARM_3D_HEX[farmPlotStatus(plot)];
}

export function farmPlotColorCss(plot: Farm3DPlot): string {
  return FARM_3D_CSS[farmPlotStatus(plot)];
}

const STATUS_LABELS: Record<FarmPlotStatusKind, string> = {
  healthy: "Healthy",
  review: "Needs Review",
  poor: "Poor Health",
  harvestReady: "Harvest Ready",
  empty: "No Active Crop",
};

export function farmPlotStatusLabel(plot: Farm3DPlot): string {
  return STATUS_LABELS[farmPlotStatus(plot)];
}
