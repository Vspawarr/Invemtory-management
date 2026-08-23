import "server-only";

import type { PlantingType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { StageConfig } from "@/lib/server/crop-timeline/types";

export async function listCropMasters() {
  return prisma.cropMaster.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { plantingWindows: true },
  });
}

export async function getCropMasterById(cropMasterId: string) {
  return prisma.cropMaster.findUnique({
    where: { id: cropMasterId },
    include: { plantingWindows: true },
  });
}

export async function getStageConfigsFor(
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

export async function getPlantingWindowFor(cropMasterId: string, plantingType: PlantingType) {
  return prisma.cropPlantingWindow.findUnique({
    where: { cropMasterId_plantingType: { cropMasterId, plantingType } },
  });
}
