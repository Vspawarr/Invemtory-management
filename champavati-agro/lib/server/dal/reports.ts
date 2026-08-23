import "server-only";

import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/server/require-session";
import { requireAdmin } from "@/lib/server/auth-guards";
import { getCropStageDisplay } from "@/lib/server/crop-timeline/rules";
import { calculateCropAgeDays } from "@/lib/server/crop-timeline/crop-age";
import { formatRelationshipDuration } from "@/lib/server/farmer-relationship";

const SUCCESSFUL_RESULTS = ["EXCELLENT", "GOOD"] as const;
const INACTIVE_CROP_STATUSES = new Set(["COMPLETED", "HARVESTED", "FAILED", "CANCELLED"]);

/** One row per farmer — their whole relationship at a glance. Reuses the
 * same aggregation shape as getFarmerStats (dal/farmers.ts), just computed
 * for every farmer in one pass instead of one at a time. */
export async function getFarmerActivityReport(session: AppSession) {
  requireAdmin(session);
  const today = new Date();

  const [farmers, treatmentResults] = await Promise.all([
    prisma.farmer.findMany({
      where: { deletedAt: null },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        phone: true,
        village: true,
        taluka: true,
        createdAt: true,
        landParcels: { where: { deletedAt: null }, select: { areaAcres: true } },
        crops: { where: { deletedAt: null }, select: { id: true, status: true } },
        feedback: { select: { rating: true } },
        followups: { where: { status: "PENDING" }, select: { id: true } },
      },
    }),
    prisma.treatmentResult.findMany({
      select: {
        result: true,
        application: { select: { recommendation: { select: { crop: { select: { farmerId: true } } } } } },
      },
    }),
  ]);

  const resultsByFarmer = new Map<string, { result: string }[]>();
  for (const r of treatmentResults) {
    const farmerId = r.application.recommendation.crop.farmerId;
    resultsByFarmer.set(farmerId, [...(resultsByFarmer.get(farmerId) ?? []), { result: r.result }]);
  }

  return farmers.map((f) => {
    const results = resultsByFarmer.get(f.id) ?? [];
    const successRate =
      results.length === 0
        ? null
        : Math.round((results.filter((r) => SUCCESSFUL_RESULTS.includes(r.result as never)).length / results.length) * 100);
    const avgSatisfaction =
      f.feedback.length === 0
        ? null
        : Math.round((f.feedback.reduce((sum, x) => sum + x.rating, 0) / f.feedback.length) * 10) / 10;

    return {
      farmerId: f.id,
      fullName: f.fullName,
      phone: f.phone,
      village: f.village,
      taluka: f.taluka,
      totalLandAcres: f.landParcels.reduce((sum, p) => sum + Number(p.areaAcres), 0),
      totalCrops: f.crops.length,
      activeCrops: f.crops.filter((c) => !INACTIVE_CROP_STATUSES.has(c.status)).length,
      totalTreatments: results.length,
      treatmentSuccessRate: successRate,
      avgSatisfaction,
      pendingFollowups: f.followups.length,
      relationshipSince: f.createdAt,
      relationshipDuration: formatRelationshipDuration(f.createdAt, today),
    };
  });
}

/** One row per crop cycle — status/stage/health at a glance, using the same
 * getCropStageDisplay reconciliation as Crop 360 and Farmer 360, never a
 * second definition of "needs review." */
export async function getCropStatusReport(session: AppSession) {
  requireAdmin(session);
  const today = new Date();

  const crops = await prisma.crop.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      farmer: { select: { fullName: true, village: true } },
      cropMaster: { select: { name: true } },
      landParcel: { select: { name: true } },
      currentStage: { select: { stageNameSnapshot: true, sequenceSnapshot: true } },
      timelineStages: {
        select: {
          sequenceSnapshot: true,
          stageNameSnapshot: true,
          expectedStartDate: true,
          expectedEndDate: true,
          actualStartDate: true,
          actualEndDate: true,
        },
      },
      healthRecords: { orderBy: { createdAt: "desc" }, take: 1, select: { overallHealth: true } },
    },
  });

  return crops.map((crop) => {
    const stageInput = crop.timelineStages.map((s) => ({
      sequence: s.sequenceSnapshot,
      expectedStartDate: s.expectedStartDate,
      expectedEndDate: s.expectedEndDate,
      actualStartDate: s.actualStartDate,
      actualEndDate: s.actualEndDate,
    }));
    const currentStageSequence = crop.currentStage?.sequenceSnapshot ?? null;
    const display = getCropStageDisplay(stageInput, currentStageSequence, today);
    const expectedStage = crop.timelineStages.find((s) => s.sequenceSnapshot === display.expectedSequence);

    return {
      cropId: crop.id,
      farmerName: crop.farmer.fullName,
      village: crop.farmer.village,
      cropName: crop.cropMaster.name,
      variety: crop.variety,
      landParcel: crop.landParcel.name,
      areaAcres: Number(crop.areaAcres),
      status: crop.status,
      cropAgeDays: calculateCropAgeDays(crop.anchorDate, today),
      currentStage: display.needsReview
        ? (expectedStage?.stageNameSnapshot ?? null)
        : (crop.currentStage?.stageNameSnapshot ?? null),
      needsReview: display.needsReview,
      expectedHarvestDate: crop.expectedHarvestDate,
      actualHarvestDate: crop.actualHarvestDate,
      overallHealth: crop.healthRecords[0]?.overallHealth ?? null,
    };
  });
}

/** One row per recorded treatment result — the Problem -> Product -> Result
 * -> Feedback chain flattened for reporting. */
export async function getTreatmentOutcomesReport(session: AppSession) {
  requireAdmin(session);

  const results = await prisma.treatmentResult.findMany({
    orderBy: { observedAt: "desc" },
    include: {
      application: {
        include: {
          recommendation: {
            include: {
              product: { select: { name: true, brand: true } },
              crop: { include: { farmer: { select: { fullName: true, village: true } }, cropMaster: { select: { name: true } } } },
            },
          },
        },
      },
      feedback: { select: { rating: true, satisfied: true } },
    },
  });

  return results.map((r) => ({
    treatmentResultId: r.id,
    observedAt: r.observedAt,
    farmerName: r.application.recommendation.crop.farmer.fullName,
    village: r.application.recommendation.crop.farmer.village,
    cropName: r.application.recommendation.crop.cropMaster.name,
    productName: r.application.recommendation.product.name,
    productBrand: r.application.recommendation.product.brand,
    targetPestOrDisease: r.application.recommendation.targetPestOrDisease,
    result: r.result,
    improvementPercent: r.improvementPercent,
    farmerRating: r.feedback?.rating ?? null,
    farmerSatisfied: r.feedback?.satisfied ?? null,
  }));
}

/** One row per product — how well it actually performs across every
 * recommendation it's been part of. Never inferred from anything but
 * admin-recorded TreatmentResult rows. */
export async function getProductEffectivenessReport(session: AppSession) {
  requireAdmin(session);

  const recommendations = await prisma.recommendation.findMany({
    select: {
      productId: true,
      product: { select: { name: true, brand: true, category: { select: { name: true } } } },
      applications: {
        select: {
          status: true,
          treatmentResult: { select: { result: true, improvementPercent: true, feedback: { select: { rating: true } } } },
        },
      },
    },
  });

  const byProduct = new Map<
    string,
    { name: string; brand: string | null; category: string; recommended: number; applied: number; results: { result: string; improvementPercent: number | null; rating: number | null }[] }
  >();

  for (const rec of recommendations) {
    const entry = byProduct.get(rec.productId) ?? {
      name: rec.product.name,
      brand: rec.product.brand,
      category: rec.product.category.name,
      recommended: 0,
      applied: 0,
      results: [],
    };
    entry.recommended += 1;
    for (const app of rec.applications) {
      if (app.status === "APPLIED") entry.applied += 1;
      if (app.treatmentResult) {
        entry.results.push({
          result: app.treatmentResult.result,
          improvementPercent: app.treatmentResult.improvementPercent,
          rating: app.treatmentResult.feedback?.rating ?? null,
        });
      }
    }
    byProduct.set(rec.productId, entry);
  }

  return Array.from(byProduct.entries())
    .map(([productId, p]) => {
      const successRate =
        p.results.length === 0
          ? null
          : Math.round((p.results.filter((r) => SUCCESSFUL_RESULTS.includes(r.result as never)).length / p.results.length) * 100);
      const improvements = p.results.map((r) => r.improvementPercent).filter((v): v is number => v !== null);
      const ratings = p.results.map((r) => r.rating).filter((v): v is number => v !== null);
      return {
        productId,
        productName: p.name,
        brand: p.brand,
        category: p.category,
        timesRecommended: p.recommended,
        timesApplied: p.applied,
        resultsRecorded: p.results.length,
        successRate,
        avgImprovementPercent:
          improvements.length === 0 ? null : Math.round((improvements.reduce((s, v) => s + v, 0) / improvements.length) * 10) / 10,
        avgFarmerRating: ratings.length === 0 ? null : Math.round((ratings.reduce((s, v) => s + v, 0) / ratings.length) * 10) / 10,
      };
    })
    .sort((a, b) => b.timesRecommended - a.timesRecommended);
}
