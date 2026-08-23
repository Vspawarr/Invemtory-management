"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PlantingType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/require-session";
import { requireAdmin, assertOwnedByFarmer } from "@/lib/server/auth-guards";
import { logAudit } from "@/lib/server/audit";
import { toFriendlyMessage } from "@/lib/server/errors";
import { getStageConfigsFor, getPlantingWindowFor } from "@/lib/server/dal/crop-master";
import { calculateCropTimeline } from "@/lib/server/crop-timeline/calculator";
import { buildTimelineStageSnapshots } from "@/lib/server/crop-timeline/snapshot";
import { checkPlantingWindow } from "@/lib/server/crop-timeline/planting-window";
import { guessInitialCurrentStage } from "@/lib/server/crop-timeline/rules";
import { TimelineConfigError } from "@/lib/server/crop-timeline/types";
import type { ActionResult } from "./farmers";

const timelineInputSchema = z.object({
  cropMasterId: z.string(),
  plantingType: z.string().optional(),
  anchorDate: z.string().min(1, "Enter the anchor date"),
});

export type TimelinePreviewStage = {
  stageMasterId: string;
  name: string;
  localName: string;
  sequence: number;
  expectedStartDate: string;
  expectedEndDate: string;
  criticalStage: boolean;
  waterSensitive: boolean;
  weatherSensitive: boolean;
  monitoringActions: string | null;
};

export async function previewCropTimeline(
  input: z.infer<typeof timelineInputSchema>
): Promise<
  ActionResult<{
    stages: TimelinePreviewStage[];
    expectedHarvestDate: string;
    plantingWindowWarning?: string;
  }>
> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const parsed = timelineInputSchema.parse(input);

    const plantingType = (parsed.plantingType || null) as PlantingType | null;
    const anchorDate = new Date(parsed.anchorDate);
    if (Number.isNaN(anchorDate.getTime())) {
      return { ok: false, error: "That date doesn't look valid." };
    }

    const cropMaster = await prisma.cropMaster.findUnique({ where: { id: parsed.cropMasterId } });
    if (!cropMaster) return { ok: false, error: "Unknown crop." };

    const stageConfigs = await getStageConfigsFor(parsed.cropMasterId, plantingType);
    if (stageConfigs.length === 0) {
      return { ok: false, error: "No stage configuration exists for this crop / planting type yet." };
    }

    let plantingWindowWarning: string | undefined;
    if (plantingType) {
      const window = await getPlantingWindowFor(parsed.cropMasterId, plantingType);
      if (window) {
        const check = checkPlantingWindow(anchorDate, window, plantingType.replaceAll("_", " "));
        plantingWindowWarning = check.message;
      }
    }

    const timeline = calculateCropTimeline(
      {
        cropMasterId: parsed.cropMasterId,
        anchorDate,
        anchorType: cropMaster.anchorType,
        plantingType,
        irrigationAvailable: true,
      },
      stageConfigs
    );

    return {
      ok: true,
      data: {
        stages: timeline.stages.map((s) => ({
          stageMasterId: s.stageMasterId,
          name: s.name,
          localName: s.localName,
          sequence: s.sequence,
          expectedStartDate: s.expectedStartDate.toISOString(),
          expectedEndDate: s.expectedEndDate.toISOString(),
          criticalStage: s.criticalStage,
          waterSensitive: s.waterSensitive,
          weatherSensitive: s.weatherSensitive,
          monitoringActions: s.monitoringActions,
        })),
        expectedHarvestDate: timeline.expectedHarvestDate.toISOString(),
        plantingWindowWarning,
      },
    };
  } catch (error) {
    if (error instanceof TimelineConfigError) {
      return { ok: false, error: "This crop's stage configuration is inconsistent — contact an admin to fix it before creating this crop." };
    }
    return { ok: false, error: toFriendlyMessage(error) };
  }
}

const createCropSchema = z.object({
  farmerId: z.string(),
  landParcelId: z.string(),
  cropMasterId: z.string(),
  variety: z.string().optional(),
  season: z.string().min(1, "Season is required"),
  plantingType: z.string().optional(),
  areaAcres: z.coerce.number().positive("Area must be greater than zero"),
  anchorDate: z.string().min(1),
  irrigationAvailable: z.boolean().default(true),
});

export type CreateCropInput = z.infer<typeof createCropSchema>;

const advanceStageSchema = z.object({
  cropId: z.string(),
  timelineStageId: z.string(),
  reason: z.string().min(3, "A reason is required when advancing or adjusting a stage"),
  markActualStart: z.boolean().default(true),
});

/**
 * Admin explicitly advances (or moves back) the crop's current stage. This
 * is the progression evidence that lets computeCropStageStatuses treat
 * earlier stages as COMPLETED without inventing exact actual dates for
 * each one — the admin is asserting "the crop has reached this stage,"
 * which is real evidence, not fabricated data. A reason is always
 * required and every change is audit-logged; nothing changes silently.
 */
export async function advanceCropStageAction(
  input: z.infer<typeof advanceStageSchema>
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const data = advanceStageSchema.parse(input);

    const crop = await prisma.crop.findUnique({ where: { id: data.cropId }, select: { farmerId: true } });
    if (!crop) return { ok: false, error: "Crop not found." };
    assertOwnedByFarmer(session, crop.farmerId);

    const stage = await prisma.cropTimelineStage.findUnique({ where: { id: data.timelineStageId } });
    if (!stage || stage.cropId !== data.cropId) return { ok: false, error: "That stage doesn't belong to this crop." };

    await prisma.$transaction(async (tx) => {
      await tx.crop.update({ where: { id: data.cropId }, data: { currentStageId: stage.id } });

      if (data.markActualStart && !stage.actualStartDate) {
        await tx.cropTimelineStage.update({
          where: { id: stage.id },
          data: {
            actualStartDate: new Date(),
            adjustmentReason: data.reason,
            adjustedById: session.user.id,
            adjustedAt: new Date(),
          },
        });
      }

      await tx.cropStageHistory.create({
        data: { cropId: data.cropId, timelineStageId: stage.id, notes: data.reason },
      });
    });

    await logAudit({
      userId: session.user.id,
      action: "CROP_STAGE_ADVANCED",
      entityType: "Crop",
      entityId: data.cropId,
      metadata: { timelineStageId: stage.id, reason: data.reason },
    });

    revalidatePath(`/admin/crops/${data.cropId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}

const adjustStageDatesSchema = z.object({
  cropId: z.string(),
  timelineStageId: z.string(),
  actualStartDate: z.string().optional(),
  actualEndDate: z.string().optional(),
  reason: z.string().min(3, "A reason is required for a manual adjustment"),
});

/** Manual override of a stage's actual dates — always requires a reason,
 * always audit-logged, never overwrites the expected dates. */
export async function adjustStageDatesAction(
  input: z.infer<typeof adjustStageDatesSchema>
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const data = adjustStageDatesSchema.parse(input);

    const stage = await prisma.cropTimelineStage.findUnique({
      where: { id: data.timelineStageId },
      include: { crop: { select: { farmerId: true } } },
    });
    if (!stage) return { ok: false, error: "Stage not found." };
    assertOwnedByFarmer(session, stage.crop.farmerId);

    await prisma.cropTimelineStage.update({
      where: { id: stage.id },
      data: {
        actualStartDate: data.actualStartDate ? new Date(data.actualStartDate) : stage.actualStartDate,
        actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : stage.actualEndDate,
        adjustmentReason: data.reason,
        adjustedById: session.user.id,
        adjustedAt: new Date(),
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CROP_TIMELINE_ADJUSTED",
      entityType: "CropTimelineStage",
      entityId: stage.id,
      metadata: { reason: data.reason },
    });

    revalidatePath(`/admin/crops/${data.cropId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}

export async function createCropAction(
  input: CreateCropInput
): Promise<ActionResult<{ cropId: string }>> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const data = createCropSchema.parse(input);
    assertOwnedByFarmer(session, data.farmerId);

    const landParcel = await prisma.landParcel.findUnique({ where: { id: data.landParcelId } });
    if (!landParcel || landParcel.farmerId !== data.farmerId) {
      return { ok: false, error: "That land parcel doesn't belong to this farmer." };
    }

    const cropMaster = await prisma.cropMaster.findUnique({ where: { id: data.cropMasterId } });
    if (!cropMaster) return { ok: false, error: "Unknown crop." };

    const anchorDate = new Date(data.anchorDate);
    if (Number.isNaN(anchorDate.getTime())) {
      return { ok: false, error: "That date doesn't look valid." };
    }

    const plantingType = (data.plantingType || null) as PlantingType | null;
    const stageConfigs = await getStageConfigsFor(data.cropMasterId, plantingType);
    if (stageConfigs.length === 0) {
      return { ok: false, error: "No stage configuration exists for this crop / planting type yet." };
    }

    const timeline = calculateCropTimeline(
      {
        cropMasterId: data.cropMasterId,
        anchorDate,
        anchorType: cropMaster.anchorType,
        plantingType,
        irrigationAvailable: data.irrigationAvailable,
      },
      stageConfigs
    );

    const snapshots = buildTimelineStageSnapshots(timeline);
    const current = guessInitialCurrentStage(
      timeline.stages.map((s) => ({ sequence: s.sequence, expectedStartDate: s.expectedStartDate })),
      new Date()
    );

    const result = await prisma.$transaction(async (tx) => {
      const crop = await tx.crop.create({
        data: {
          farmerId: data.farmerId,
          landParcelId: data.landParcelId,
          cropMasterId: data.cropMasterId,
          variety: data.variety || null,
          season: data.season,
          plantingType,
          areaAcres: data.areaAcres,
          anchorDate,
          anchorType: cropMaster.anchorType,
          irrigationAvailable: data.irrigationAvailable,
          expectedHarvestDate: timeline.expectedHarvestDate,
          status: "PLANNED",
        },
      });

      for (const snap of snapshots) {
        await tx.cropTimelineStage.create({ data: { ...snap, cropId: crop.id } });
      }

      const createdStages = await tx.cropTimelineStage.findMany({ where: { cropId: crop.id } });
      const currentRow = current
        ? createdStages.find((s) => s.sequenceSnapshot === current.sequence)
        : undefined;

      if (currentRow) {
        await tx.crop.update({ where: { id: crop.id }, data: { currentStageId: currentRow.id } });
        await tx.cropStageHistory.create({
          data: { cropId: crop.id, timelineStageId: currentRow.id, notes: "Crop created" },
        });
      }

      return crop;
    });

    await logAudit({
      userId: session.user.id,
      action: "CROP_CREATED",
      entityType: "Crop",
      entityId: result.id,
      metadata: { cropMasterId: data.cropMasterId, farmerId: data.farmerId },
    });

    revalidatePath("/admin/crops");
    revalidatePath(`/admin/farmers/${data.farmerId}`);
    return { ok: true, data: { cropId: result.id } };
  } catch (error) {
    if (error instanceof TimelineConfigError) {
      return { ok: false, error: "This crop's stage configuration is inconsistent — contact an admin to fix it before creating this crop." };
    }
    return { ok: false, error: toFriendlyMessage(error) };
  }
}
