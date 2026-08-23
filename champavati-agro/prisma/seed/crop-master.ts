import type { PrismaClient } from "@prisma/client";

import { CROP_DEFINITIONS } from "@/lib/server/crop-timeline/crop-definitions";

/**
 * Upserts CropMaster + CropStageMaster + CropPlantingWindow from the single
 * source-of-truth module (lib/server/crop-timeline/crop-definitions.ts).
 * Idempotent — safe to re-run.
 */
export async function seedCropMaster(prisma: PrismaClient) {
  for (const crop of CROP_DEFINITIONS) {
    const cropMaster = await prisma.cropMaster.upsert({
      where: { name: crop.name },
      update: { localName: crop.localName, anchorType: crop.anchorType, anchorLabel: crop.anchorLabel },
      create: {
        name: crop.name,
        localName: crop.localName,
        anchorType: crop.anchorType,
        anchorLabel: crop.anchorLabel,
      },
    });

    for (const [plantingTypeKey, defs] of Object.entries(crop.stagesByPlantingType)) {
      const plantingType = plantingTypeKey === "none" ? null : (plantingTypeKey as never);
      for (const def of defs) {
        // Prisma can't query a compound-unique `where` with a null component
        // (plantingType is nullable), so upsert-by-compound-key doesn't work
        // here — find first, then create or update explicitly.
        const existing = await prisma.cropStageMaster.findFirst({
          where: { cropMasterId: cropMaster.id, plantingType, sequence: def.sequence },
          select: { id: true },
        });

        const fields = {
          name: def.name,
          localName: def.localName,
          minStartOffsetDays: def.minStartOffsetDays,
          defaultStartOffsetDays: def.defaultStartOffsetDays,
          maxStartOffsetDays: def.maxStartOffsetDays,
          minEndOffsetDays: def.minEndOffsetDays,
          defaultEndOffsetDays: def.defaultEndOffsetDays,
          maxEndOffsetDays: def.maxEndOffsetDays,
          criticalStage: def.criticalStage,
          waterSensitive: def.waterSensitive,
          weatherSensitive: def.weatherSensitive,
          monitoringActions: def.monitoringActions,
          commonPests: def.commonPests,
          commonDiseases: def.commonDiseases,
          sourceReference: def.sourceReference,
          confidenceLevel: def.confidenceLevel,
        };

        if (existing) {
          await prisma.cropStageMaster.update({ where: { id: existing.id }, data: fields });
        } else {
          await prisma.cropStageMaster.create({
            data: { cropMasterId: cropMaster.id, plantingType, sequence: def.sequence, ...fields },
          });
        }
      }
    }

    for (const window of crop.plantingWindows ?? []) {
      await prisma.cropPlantingWindow.upsert({
        where: {
          cropMasterId_plantingType: { cropMasterId: cropMaster.id, plantingType: window.plantingType },
        },
        update: { startMonth: window.startMonth, endMonth: window.endMonth, label: window.label },
        create: {
          cropMasterId: cropMaster.id,
          plantingType: window.plantingType,
          startMonth: window.startMonth,
          endMonth: window.endMonth,
          label: window.label,
        },
      });
    }
  }
}
