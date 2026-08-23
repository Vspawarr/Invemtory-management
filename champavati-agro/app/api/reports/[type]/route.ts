import { NextResponse } from "next/server";

import { requireSession } from "@/lib/server/require-session";
import { requireAdmin } from "@/lib/server/auth-guards";
import {
  getFarmerActivityReport,
  getCropStatusReport,
  getTreatmentOutcomesReport,
  getProductEffectivenessReport,
} from "@/lib/server/dal/reports";
import { toCsv, type CsvColumn } from "@/lib/server/reports/csv";
import { ForbiddenError, UnauthenticatedError } from "@/lib/server/errors";

type ReportType = "farmers" | "crops" | "treatments" | "products";

const FARMER_COLUMNS: CsvColumn<Awaited<ReturnType<typeof getFarmerActivityReport>>[number]>[] = [
  { header: "Farmer", value: (r) => r.fullName },
  { header: "Phone", value: (r) => r.phone },
  { header: "Village", value: (r) => r.village },
  { header: "Taluka", value: (r) => r.taluka },
  { header: "Total land (acres)", value: (r) => r.totalLandAcres.toFixed(2) },
  { header: "Total crops", value: (r) => r.totalCrops },
  { header: "Active crops", value: (r) => r.activeCrops },
  { header: "Total treatments", value: (r) => r.totalTreatments },
  { header: "Treatment success rate (%)", value: (r) => r.treatmentSuccessRate },
  { header: "Avg satisfaction (/5)", value: (r) => r.avgSatisfaction },
  { header: "Pending follow-ups", value: (r) => r.pendingFollowups },
  { header: "Farmer since", value: (r) => r.relationshipSince },
  { header: "Relationship duration", value: (r) => r.relationshipDuration },
];

const CROP_COLUMNS: CsvColumn<Awaited<ReturnType<typeof getCropStatusReport>>[number]>[] = [
  { header: "Farmer", value: (r) => r.farmerName },
  { header: "Village", value: (r) => r.village },
  { header: "Crop", value: (r) => r.cropName },
  { header: "Variety", value: (r) => r.variety },
  { header: "Land parcel", value: (r) => r.landParcel },
  { header: "Area (acres)", value: (r) => r.areaAcres.toFixed(2) },
  { header: "Status", value: (r) => r.status },
  { header: "Crop age (days)", value: (r) => r.cropAgeDays },
  { header: "Current/expected stage", value: (r) => r.currentStage },
  { header: "Needs review", value: (r) => (r.needsReview ? "Yes" : "No") },
  { header: "Expected harvest", value: (r) => r.expectedHarvestDate },
  { header: "Actual harvest", value: (r) => r.actualHarvestDate },
  { header: "Overall health (/5)", value: (r) => r.overallHealth },
];

const TREATMENT_COLUMNS: CsvColumn<Awaited<ReturnType<typeof getTreatmentOutcomesReport>>[number]>[] = [
  { header: "Date", value: (r) => r.observedAt },
  { header: "Farmer", value: (r) => r.farmerName },
  { header: "Village", value: (r) => r.village },
  { header: "Crop", value: (r) => r.cropName },
  { header: "Product", value: (r) => r.productName },
  { header: "Brand", value: (r) => r.productBrand },
  { header: "Target pest/disease", value: (r) => r.targetPestOrDisease },
  { header: "Result", value: (r) => r.result },
  { header: "Improvement (%)", value: (r) => r.improvementPercent },
  { header: "Farmer rating (/5)", value: (r) => r.farmerRating },
  { header: "Farmer satisfied", value: (r) => (r.farmerSatisfied === null ? "" : r.farmerSatisfied ? "Yes" : "No") },
];

const PRODUCT_COLUMNS: CsvColumn<Awaited<ReturnType<typeof getProductEffectivenessReport>>[number]>[] = [
  { header: "Product", value: (r) => r.productName },
  { header: "Brand", value: (r) => r.brand },
  { header: "Category", value: (r) => r.category },
  { header: "Times recommended", value: (r) => r.timesRecommended },
  { header: "Times applied", value: (r) => r.timesApplied },
  { header: "Results recorded", value: (r) => r.resultsRecorded },
  { header: "Success rate (%)", value: (r) => r.successRate },
  { header: "Avg improvement (%)", value: (r) => r.avgImprovementPercent },
  { header: "Avg farmer rating (/5)", value: (r) => r.avgFarmerRating },
];

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;

  try {
    const session = await requireSession();
    requireAdmin(session);

    let csv: string;
    let filename: string;

    switch (type as ReportType) {
      case "farmers":
        csv = toCsv(await getFarmerActivityReport(session), FARMER_COLUMNS);
        filename = "farmer-activity-report.csv";
        break;
      case "crops":
        csv = toCsv(await getCropStatusReport(session), CROP_COLUMNS);
        filename = "crop-status-report.csv";
        break;
      case "treatments":
        csv = toCsv(await getTreatmentOutcomesReport(session), TREATMENT_COLUMNS);
        filename = "treatment-outcomes-report.csv";
        break;
      case "products":
        csv = toCsv(await getProductEffectivenessReport(session), PRODUCT_COLUMNS);
        filename = "product-effectiveness-report.csv";
        break;
      default:
        return new NextResponse("Unknown report type", { status: 404 });
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError) return new NextResponse("Unauthorized", { status: 401 });
    if (error instanceof ForbiddenError) return new NextResponse("Forbidden", { status: 403 });
    throw error;
  }
}
