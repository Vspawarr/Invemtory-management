import "server-only";

import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/server/require-session";
import { requireAdmin } from "@/lib/server/auth-guards";
import { getCropStageDisplay } from "@/lib/server/crop-timeline/rules";
import type { Farm3DPlot } from "@/lib/farm-3d-types";

const INACTIVE_CROP_STATUSES = new Set(["COMPLETED", "HARVESTED", "FAILED", "CANCELLED"]);

/** Lightweight farmer list for the Digital Farm's picker — admin only. */
export async function listFarmersForFarm3D(session: AppSession) {
  requireAdmin(session);
  return prisma.farmer.findMany({
    where: { deletedAt: null },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, village: true },
  });
}

/** One entry per land parcel, with its current active crop (if any) and
 * enough state to render/color a 3D field plot and its selection info
 * panel — reuses getCropStageDisplay, the same stage reconciliation every
 * other page already uses, so the Digital Farm never shows a stage that
 * disagrees with Crop 360. Digital Farm is a visualization layer only:
 * this function computes zero new business logic — stageProgress is a
 * plain normalization of the existing stage sequence for visual sizing. */
export async function getFarmer3DData(session: AppSession, farmerId: string): Promise<Farm3DPlot[]> {
  requireAdmin(session);
  const today = new Date();

  const landParcels = await prisma.landParcel.findMany({
    where: { farmerId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      crops: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          cropMaster: { select: { name: true } },
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
          healthRecords: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { overallHealth: true, createdAt: true },
          },
          photos: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
          recommendations: {
            orderBy: { createdAt: "desc" },
            take: 3,
            select: {
              product: { select: { name: true } },
              applications: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  treatmentResult: { select: { result: true, observedAt: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  return landParcels.map((parcel) => {
    // The most recent crop that isn't a finished/cancelled cycle — that's
    // "what's growing here right now." Falls back to the most recent crop
    // of any status so a just-harvested field still shows something real.
    const crop =
      parcel.crops.find((c) => !INACTIVE_CROP_STATUSES.has(c.status)) ?? parcel.crops[0] ?? null;

    let cropSummary: Farm3DPlot["crop"] = null;
    if (crop) {
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

      const totalStages = crop.timelineStages.length;
      const bestSequence = display.needsReview
        ? (display.expectedSequence ?? display.confirmedSequence)
        : (display.confirmedSequence ?? display.expectedSequence);
      const stageProgress =
        totalStages > 1 && bestSequence !== null
          ? Math.min(1, Math.max(0, (bestSequence - 1) / (totalStages - 1)))
          : 1;

      const lastObservationDate = [crop.healthRecords[0]?.createdAt, crop.photos[0]?.createdAt]
        .filter((d): d is Date => d != null)
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

      const latestTreatmentEntry = crop.recommendations
        .map((r) => ({ productName: r.product.name, application: r.applications[0] ?? null }))
        .find((r) => r.application?.treatmentResult != null);
      const latestTreatment = latestTreatmentEntry?.application?.treatmentResult
        ? {
            productName: latestTreatmentEntry.productName,
            result: latestTreatmentEntry.application.treatmentResult.result,
            date: latestTreatmentEntry.application.treatmentResult.observedAt,
          }
        : null;

      cropSummary = {
        cropId: crop.id,
        cropName: crop.cropMaster.name,
        variety: crop.variety,
        status: crop.status,
        stageName: display.needsReview
          ? (expectedStage?.stageNameSnapshot ?? null)
          : (crop.currentStage?.stageNameSnapshot ?? null),
        needsReview: display.needsReview,
        harvestReady: crop.status === "HARVEST_READY",
        overallHealth: crop.healthRecords[0]?.overallHealth ?? null,
        stageProgress,
        expectedHarvestDate: crop.expectedHarvestDate,
        lastObservationDate,
        latestTreatment,
      };
    }

    return {
      landParcelId: parcel.id,
      landParcelName: parcel.name,
      areaAcres: Number(parcel.areaAcres),
      soilType: parcel.soilType,
      crop: cropSummary,
    };
  });
}
