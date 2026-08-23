import "server-only";

import { addDays } from "date-fns";

import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/server/require-session";
import { requireAdmin } from "@/lib/server/auth-guards";
import { computeCropStageStatuses, isStatusConcerning } from "@/lib/server/crop-timeline/rules";

const ACTIVE_CROP_STATUSES = [
  "SEEDED",
  "GROWING",
  "FLOWERING",
  "DEVELOPMENT",
  "HARVEST_READY",
] as const;
const SUCCESSFUL_RESULTS = ["EXCELLENT", "GOOD"] as const;
const NEAR_HARVEST_DAYS = 14;
const PEST_SEVERITY_THRESHOLD = 4;

export async function getDashboardStats(session: AppSession) {
  requireAdmin(session);
  const today = new Date();
  const nearHarvestCutoff = addDays(today, NEAR_HARVEST_DAYS);

  const [
    totalFarmers,
    farmersWithActiveCrop,
    activeCrops,
    landAgg,
    nearHarvestCount,
    treatmentResults,
    feedback,
    pendingFollowups,
    recentPestHealth,
    cropsForDelayCheck,
    cropsByStatusRaw,
  ] = await Promise.all([
    prisma.farmer.count({ where: { deletedAt: null } }),
    prisma.farmer.count({
      where: { deletedAt: null, crops: { some: { status: { in: [...ACTIVE_CROP_STATUSES] }, deletedAt: null } } },
    }),
    prisma.crop.count({ where: { deletedAt: null, status: { in: [...ACTIVE_CROP_STATUSES] } } }),
    prisma.landParcel.aggregate({ _sum: { areaAcres: true } }),
    prisma.crop.count({
      where: {
        deletedAt: null,
        status: { in: [...ACTIVE_CROP_STATUSES] },
        expectedHarvestDate: { gte: today, lte: nearHarvestCutoff },
      },
    }),
    prisma.treatmentResult.findMany({ select: { result: true } }),
    prisma.farmerFeedback.findMany({ select: { rating: true } }),
    prisma.followup.count({ where: { status: "PENDING" } }),
    prisma.cropHealthRecord.findMany({
      where: { pestSeverity: { gte: PEST_SEVERITY_THRESHOLD } },
      distinct: ["cropId"],
      select: { cropId: true },
    }),
    prisma.crop.findMany({
      where: { deletedAt: null, status: { in: [...ACTIVE_CROP_STATUSES] } },
      select: {
        id: true,
        currentStage: { select: { sequenceSnapshot: true } },
        timelineStages: {
          select: {
            sequenceSnapshot: true,
            expectedStartDate: true,
            expectedEndDate: true,
            actualStartDate: true,
            actualEndDate: true,
          },
        },
      },
    }),
    prisma.crop.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const treatmentSuccessRate =
    treatmentResults.length === 0
      ? null
      : Math.round(
          (treatmentResults.filter((r) => SUCCESSFUL_RESULTS.includes(r.result as never)).length /
            treatmentResults.length) *
            100
        );

  const avgSatisfaction =
    feedback.length === 0
      ? null
      : Math.round((feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length) * 10) / 10;

  // Delayed crops: same rule engine as Crop 360°/farmer portal — one definition, reused everywhere.
  const delayedCropsCount = cropsForDelayCheck.filter((crop) => {
    const statuses = computeCropStageStatuses(
      crop.timelineStages.map((s) => ({
        sequence: s.sequenceSnapshot,
        expectedStartDate: s.expectedStartDate,
        expectedEndDate: s.expectedEndDate,
        actualStartDate: s.actualStartDate,
        actualEndDate: s.actualEndDate,
      })),
      crop.currentStage?.sequenceSnapshot ?? null,
      today
    );
    const current = statuses.find((s) => s.sequence === (crop.currentStage?.sequenceSnapshot ?? -1));
    return current ? isStatusConcerning(current.status) : false;
  }).length;

  return {
    totalFarmers,
    activeFarmers: farmersWithActiveCrop,
    activeCrops,
    totalAcreage: Number(landAgg._sum.areaAcres ?? 0),
    cropsNearHarvest: nearHarvestCount,
    delayedCrops: delayedCropsCount,
    cropsWithPestIssues: recentPestHealth.length,
    pendingFollowups,
    treatmentSuccessRate,
    avgSatisfaction,
    cropsByStatus: cropsByStatusRaw.map((c) => ({ status: c.status, count: c._count._all })),
    treatmentOutcomes: treatmentResults.reduce<Record<string, number>>((acc, r) => {
      acc[r.result] = (acc[r.result] ?? 0) + 1;
      return acc;
    }, {}),
  };
}
