"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/require-session";
import { requireAdmin } from "@/lib/server/auth-guards";
import { logAudit } from "@/lib/server/audit";
import { toFriendlyMessage } from "@/lib/server/errors";
import { validateStageConfig } from "@/lib/server/crop-timeline/validate-config";
import type { StageConfig } from "@/lib/server/crop-timeline/types";
import type { ActionResult } from "./farmers";

const updateStageSchema = z.object({
  stageId: z.string(),
  minStartOffsetDays: z.coerce.number().int(),
  defaultStartOffsetDays: z.coerce.number().int(),
  maxStartOffsetDays: z.coerce.number().int(),
  minEndOffsetDays: z.coerce.number().int(),
  defaultEndOffsetDays: z.coerce.number().int(),
  maxEndOffsetDays: z.coerce.number().int(),
  criticalStage: z.boolean(),
  waterSensitive: z.boolean(),
  weatherSensitive: z.boolean(),
  monitoringActions: z.string().optional(),
  commonPests: z.string().optional(),
  commonDiseases: z.string().optional(),
  sourceReference: z.string().optional(),
  confidenceLevel: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

/**
 * Edits one CropStageMaster row. Never writes a change in isolation — always
 * re-validates the FULL sibling group (same cropMasterId + plantingType)
 * before persisting, so an edit can never silently produce an overlapping
 * or inconsistent timeline. Changes here only affect timelines generated
 * AFTER this save — existing CropTimelineStage snapshots are untouched.
 */
export async function updateStageMasterAction(
  input: z.infer<typeof updateStageSchema>
): Promise<ActionResult<undefined>> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const data = updateStageSchema.parse(input);

    const target = await prisma.cropStageMaster.findUnique({ where: { id: data.stageId } });
    if (!target) return { ok: false, error: "Stage not found." };

    const siblings = await prisma.cropStageMaster.findMany({
      where: { cropMasterId: target.cropMasterId, plantingType: target.plantingType },
    });

    const pests = data.commonPests ? data.commonPests.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const diseases = data.commonDiseases
      ? data.commonDiseases.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const candidate: StageConfig[] = siblings.map((s) =>
      s.id === target.id
        ? {
            id: s.id,
            name: s.name,
            localName: s.localName,
            plantingType: s.plantingType,
            sequence: s.sequence,
            minStartOffsetDays: data.minStartOffsetDays,
            defaultStartOffsetDays: data.defaultStartOffsetDays,
            maxStartOffsetDays: data.maxStartOffsetDays,
            minEndOffsetDays: data.minEndOffsetDays,
            defaultEndOffsetDays: data.defaultEndOffsetDays,
            maxEndOffsetDays: data.maxEndOffsetDays,
            criticalStage: data.criticalStage,
            waterSensitive: data.waterSensitive,
            weatherSensitive: data.weatherSensitive,
            monitoringActions: data.monitoringActions || null,
            commonPests: pests,
            commonDiseases: diseases,
            sourceReference: data.sourceReference,
            confidenceLevel: data.confidenceLevel,
          }
        : {
            id: s.id,
            name: s.name,
            localName: s.localName,
            plantingType: s.plantingType,
            sequence: s.sequence,
            minStartOffsetDays: s.minStartOffsetDays,
            defaultStartOffsetDays: s.defaultStartOffsetDays,
            maxStartOffsetDays: s.maxStartOffsetDays,
            minEndOffsetDays: s.minEndOffsetDays,
            defaultEndOffsetDays: s.defaultEndOffsetDays,
            maxEndOffsetDays: s.maxEndOffsetDays,
            criticalStage: s.criticalStage,
            waterSensitive: s.waterSensitive,
            weatherSensitive: s.weatherSensitive,
            monitoringActions: s.monitoringActions,
            commonPests: s.commonPests,
            commonDiseases: s.commonDiseases,
            sourceReference: s.sourceReference,
            confidenceLevel: s.confidenceLevel,
          }
    );

    const validation = validateStageConfig(candidate);
    if (!validation.valid) {
      return {
        ok: false,
        error: `This change would make the timeline inconsistent: ${validation.errors.map((e) => e.message).join(" ")}`,
      };
    }

    await prisma.cropStageMaster.update({
      where: { id: data.stageId },
      data: {
        minStartOffsetDays: data.minStartOffsetDays,
        defaultStartOffsetDays: data.defaultStartOffsetDays,
        maxStartOffsetDays: data.maxStartOffsetDays,
        minEndOffsetDays: data.minEndOffsetDays,
        defaultEndOffsetDays: data.defaultEndOffsetDays,
        maxEndOffsetDays: data.maxEndOffsetDays,
        criticalStage: data.criticalStage,
        waterSensitive: data.waterSensitive,
        weatherSensitive: data.weatherSensitive,
        monitoringActions: data.monitoringActions || null,
        commonPests: pests,
        commonDiseases: diseases,
        sourceReference: data.sourceReference || null,
        confidenceLevel: data.confidenceLevel,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CROP_STAGE_MASTER_MODIFIED",
      entityType: "CropStageMaster",
      entityId: data.stageId,
    });

    revalidatePath("/admin/settings/crop-stages");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}
