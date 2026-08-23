import type { PlantingType, PrismaClient } from "@prisma/client";

import { calculateCropTimeline } from "@/lib/server/crop-timeline/calculator";
import { buildTimelineStageSnapshots } from "@/lib/server/crop-timeline/snapshot";
import { guessInitialCurrentStage } from "@/lib/server/crop-timeline/rules";
import type { StageConfig } from "@/lib/server/crop-timeline/types";

// Duplicated (not imported) from lib/server/dal/crop-master.ts: that module
// starts with `import "server-only"`, which throws by design outside
// Next.js's bundler — including under this plain tsx seed script. The
// Prisma query itself is tiny; keeping a local copy here avoids depending
// on Next-only code from a standalone Node script.
async function getStageConfigsFor(
  prisma: PrismaClient,
  cropMasterId: string,
  plantingType: PlantingType | null
): Promise<StageConfig[]> {
  const rows = await prisma.cropStageMaster.findMany({
    where: { cropMasterId, plantingType },
    orderBy: { sequence: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    localName: r.localName,
    plantingType: r.plantingType,
    sequence: r.sequence,
    minStartOffsetDays: r.minStartOffsetDays,
    defaultStartOffsetDays: r.defaultStartOffsetDays,
    maxStartOffsetDays: r.maxStartOffsetDays,
    minEndOffsetDays: r.minEndOffsetDays,
    defaultEndOffsetDays: r.defaultEndOffsetDays,
    maxEndOffsetDays: r.maxEndOffsetDays,
    criticalStage: r.criticalStage,
    waterSensitive: r.waterSensitive,
    weatherSensitive: r.weatherSensitive,
    monitoringActions: r.monitoringActions,
    commonPests: r.commonPests,
    commonDiseases: r.commonDiseases,
    sourceReference: r.sourceReference,
    confidenceLevel: r.confidenceLevel,
  }));
}

/**
 * Seed-time equivalent of createCropAction — reuses the SAME timeline
 * engine functions the real app uses (never a parallel implementation), so
 * seeded crops behave identically to ones created through the UI.
 *
 * `currentStageSequenceOverride` lets a handful of demo crops deliberately
 * simulate an under-monitored/delayed crop (admin hasn't confirmed
 * progression in a while) — this is curated demo variety, not fabricated
 * precision: it never invents exact dates, only which stage is "current."
 */
export async function seedCropWithTimeline(
  prisma: PrismaClient,
  params: {
    farmerId: string;
    landParcelId: string;
    cropMasterId: string;
    anchorType: "SOWING" | "PLANTING" | "TRANSPLANTING";
    variety?: string;
    season: string;
    plantingType?: PlantingType | null;
    areaAcres: number;
    anchorDate: Date;
    irrigationAvailable?: boolean;
    status: "PLANNED" | "SEEDED" | "GROWING" | "FLOWERING" | "DEVELOPMENT" | "HARVEST_READY" | "HARVESTED" | "COMPLETED" | "FAILED" | "CANCELLED";
    currentStageSequenceOverride?: number;
    actualHarvestDate?: Date;
    today?: Date;
  }
) {
  const today = params.today ?? new Date();
  const plantingType = params.plantingType ?? null;

  const stageConfigs = await getStageConfigsFor(prisma, params.cropMasterId, plantingType);
  const timeline = calculateCropTimeline(
    {
      cropMasterId: params.cropMasterId,
      anchorDate: params.anchorDate,
      anchorType: params.anchorType,
      plantingType,
      irrigationAvailable: params.irrigationAvailable ?? true,
    },
    stageConfigs
  );

  const snapshots = buildTimelineStageSnapshots(timeline, today);

  const crop = await prisma.crop.create({
    data: {
      farmerId: params.farmerId,
      landParcelId: params.landParcelId,
      cropMasterId: params.cropMasterId,
      variety: params.variety ?? null,
      season: params.season,
      plantingType,
      areaAcres: params.areaAcres,
      anchorDate: params.anchorDate,
      anchorType: params.anchorType,
      irrigationAvailable: params.irrigationAvailable ?? true,
      expectedHarvestDate: timeline.expectedHarvestDate,
      actualHarvestDate: params.actualHarvestDate ?? null,
      status: params.status,
      isDemo: true,
    },
  });

  const createdStages = [];
  for (const snap of snapshots) {
    createdStages.push(await prisma.cropTimelineStage.create({ data: { ...snap, cropId: crop.id } }));
  }

  const guessed = params.currentStageSequenceOverride
    ? createdStages.find((s) => s.sequenceSnapshot === params.currentStageSequenceOverride)
    : (() => {
        const g = guessInitialCurrentStage(
          timeline.stages.map((s) => ({ sequence: s.sequence, expectedStartDate: s.expectedStartDate })),
          today
        );
        return g ? createdStages.find((s) => s.sequenceSnapshot === g.sequence) : undefined;
      })();

  if (guessed) {
    await prisma.crop.update({ where: { id: crop.id }, data: { currentStageId: guessed.id } });
    await prisma.cropStageHistory.create({
      data: { cropId: crop.id, timelineStageId: guessed.id, notes: "Seeded demo data" },
    });
  }

  // If this crop is fully harvested/completed, mark every stage's actual
  // dates from its expected dates so it reads as genuinely COMPLETED, not
  // just "current stage = last."
  if (params.status === "HARVESTED" || params.status === "COMPLETED") {
    for (const stage of createdStages) {
      await prisma.cropTimelineStage.update({
        where: { id: stage.id },
        data: { actualStartDate: stage.expectedStartDate, actualEndDate: stage.expectedEndDate },
      });
    }
  }

  return { crop, timelineStages: createdStages };
}
