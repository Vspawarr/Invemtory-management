"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/require-session";
import { requireAdmin, assertRecordAccess } from "@/lib/server/auth-guards";
import { logAudit } from "@/lib/server/audit";
import { toFriendlyMessage } from "@/lib/server/errors";
import { optionalNumber } from "@/lib/server/zod-utils";
import type { ActionResult } from "./farmers";

const recommendationSchema = z.object({
  cropId: z.string(),
  productId: z.string().min(1, "Select a product"),
  targetPestOrDisease: z.string().optional(),
  dosage: z.string().optional(),
  applicationMethod: z.string().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional(),
});

export async function createRecommendationAction(
  input: z.infer<typeof recommendationSchema>
): Promise<ActionResult<{ recommendationId: string }>> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const data = recommendationSchema.parse(input);

    const crop = await prisma.crop.findUnique({
      where: { id: data.cropId },
      select: { farmerId: true, currentStageId: true },
    });
    if (!crop) return { ok: false, error: "Crop not found." };
    assertRecordAccess(session, crop);

    const recommendation = await prisma.$transaction(async (tx) => {
      const rec = await tx.recommendation.create({
        data: {
          cropId: data.cropId,
          timelineStageId: crop.currentStageId,
          productId: data.productId,
          recommendedById: session.user.id,
          targetPestOrDisease: data.targetPestOrDisease || null,
          dosage: data.dosage || null,
          applicationMethod: data.applicationMethod || null,
          instructions: data.instructions || null,
          notes: data.notes || null,
        },
      });
      await tx.application.create({
        data: { recommendationId: rec.id, status: "RECOMMENDED" },
      });
      return rec;
    });

    await logAudit({
      userId: session.user.id,
      action: "RECOMMENDATION_CREATED",
      entityType: "Recommendation",
      entityId: recommendation.id,
      metadata: { cropId: data.cropId, productId: data.productId },
    });

    revalidatePath(`/admin/crops/${data.cropId}`);
    return { ok: true, data: { recommendationId: recommendation.id } };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}

const applicationStatusSchema = z.object({
  applicationId: z.string(),
  status: z.enum(["RECOMMENDED", "PURCHASED", "APPLIED", "NOT_APPLIED", "CANCELLED"]),
  appliedDate: z.string().optional(),
  quantityUsed: optionalNumber(),
  notes: z.string().optional(),
});

export async function updateApplicationStatusAction(
  input: z.infer<typeof applicationStatusSchema>
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const data = applicationStatusSchema.parse(input);

    const application = await prisma.application.findUnique({
      where: { id: data.applicationId },
      include: { recommendation: { include: { crop: { select: { id: true, farmerId: true } } } } },
    });
    if (!application) return { ok: false, error: "Application not found." };
    assertRecordAccess(session, application.recommendation.crop);

    await prisma.application.update({
      where: { id: data.applicationId },
      data: {
        status: data.status,
        appliedDate: data.appliedDate ? new Date(data.appliedDate) : application.appliedDate,
        quantityUsed: data.quantityUsed ?? application.quantityUsed,
        notes: data.notes || application.notes,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "APPLICATION_UPDATED",
      entityType: "Application",
      entityId: data.applicationId,
      metadata: { status: data.status },
    });

    revalidatePath(`/admin/crops/${application.recommendation.crop.id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}

const treatmentResultSchema = z.object({
  applicationId: z.string(),
  pestSeverityBefore: optionalNumber(z.number().int().min(1).max(5)),
  pestSeverityAfter: optionalNumber(z.number().int().min(1).max(5)),
  diseaseSeverityBefore: optionalNumber(z.number().int().min(1).max(5)),
  diseaseSeverityAfter: optionalNumber(z.number().int().min(1).max(5)),
  improvementPercent: optionalNumber(z.number().int().min(0).max(100)),
  result: z.enum(["EXCELLENT", "GOOD", "MODERATE", "NO_IMPROVEMENT", "POOR", "CROP_DAMAGED"]),
  notes: z.string().optional(),
});

export async function createTreatmentResultAction(
  input: z.infer<typeof treatmentResultSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const data = treatmentResultSchema.parse(input);

    const application = await prisma.application.findUnique({
      where: { id: data.applicationId },
      include: { recommendation: { include: { crop: { select: { id: true, farmerId: true } } } } },
    });
    if (!application) return { ok: false, error: "Application not found." };
    assertRecordAccess(session, application.recommendation.crop);

    const result = await prisma.treatmentResult.create({
      data: {
        applicationId: data.applicationId,
        pestSeverityBefore: data.pestSeverityBefore,
        pestSeverityAfter: data.pestSeverityAfter,
        diseaseSeverityBefore: data.diseaseSeverityBefore,
        diseaseSeverityAfter: data.diseaseSeverityAfter,
        improvementPercent: data.improvementPercent,
        result: data.result,
        notes: data.notes || null,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "TREATMENT_RESULT_CREATED",
      entityType: "TreatmentResult",
      entityId: result.id,
    });

    revalidatePath(`/admin/crops/${application.recommendation.crop.id}`);
    return { ok: true, data: { id: result.id } };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}

const feedbackSchema = z.object({
  treatmentResultId: z.string(),
  rating: z.coerce.number().int().min(1).max(5),
  satisfied: z.boolean(),
  comments: z.string().optional(),
});

export async function createFeedbackAction(
  input: z.infer<typeof feedbackSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    const data = feedbackSchema.parse(input);

    const treatmentResult = await prisma.treatmentResult.findUnique({
      where: { id: data.treatmentResultId },
      include: {
        application: {
          include: { recommendation: { include: { crop: { select: { id: true, farmerId: true } } } } },
        },
      },
    });
    if (!treatmentResult) return { ok: false, error: "Treatment result not found." };
    const farmerId = treatmentResult.application.recommendation.crop.farmerId;
    assertRecordAccess(session, { farmerId });

    const feedback = await prisma.farmerFeedback.create({
      data: {
        treatmentResultId: data.treatmentResultId,
        farmerId,
        rating: data.rating,
        satisfied: data.satisfied,
        comments: data.comments || null,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "FEEDBACK_CREATED",
      entityType: "FarmerFeedback",
      entityId: feedback.id,
    });

    revalidatePath(`/admin/crops/${treatmentResult.application.recommendation.crop.id}`);
    return { ok: true, data: { id: feedback.id } };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}
