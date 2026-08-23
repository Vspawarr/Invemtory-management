"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/require-session";
import { requireAdmin, assertRecordAccess } from "@/lib/server/auth-guards";
import { logAudit } from "@/lib/server/audit";
import { toFriendlyMessage } from "@/lib/server/errors";
import type { ActionResult } from "./farmers";

const ratingSchema = z.coerce.number().int().min(1).max(5);

const healthRecordSchema = z.object({
  cropId: z.string(),
  overallHealth: ratingSchema,
  pestSeverity: ratingSchema,
  diseaseSeverity: ratingSchema,
  weedSeverity: ratingSchema,
  growthRating: ratingSchema,
  waterCondition: ratingSchema,
  nutrientDeficiency: ratingSchema,
  notes: z.string().optional(),
});

export async function addHealthRecordAction(
  input: z.infer<typeof healthRecordSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const data = healthRecordSchema.parse(input);

    const crop = await prisma.crop.findUnique({
      where: { id: data.cropId },
      select: { farmerId: true, currentStageId: true },
    });
    if (!crop) return { ok: false, error: "Crop not found." };
    assertRecordAccess(session, crop);

    const record = await prisma.cropHealthRecord.create({
      data: {
        cropId: data.cropId,
        timelineStageId: crop.currentStageId,
        recordedById: session.user.id,
        overallHealth: data.overallHealth,
        pestSeverity: data.pestSeverity,
        diseaseSeverity: data.diseaseSeverity,
        weedSeverity: data.weedSeverity,
        growthRating: data.growthRating,
        waterCondition: data.waterCondition,
        nutrientDeficiency: data.nutrientDeficiency,
        notes: data.notes || null,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "HEALTH_RECORD_CREATED",
      entityType: "CropHealthRecord",
      entityId: record.id,
      metadata: { cropId: data.cropId },
    });

    revalidatePath(`/admin/crops/${data.cropId}`);
    return { ok: true, data: { id: record.id } };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}
