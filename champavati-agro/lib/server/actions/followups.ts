"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/require-session";
import { requireAdmin, assertRecordAccess } from "@/lib/server/auth-guards";
import { logAudit } from "@/lib/server/audit";
import { toFriendlyMessage } from "@/lib/server/errors";
import type { ActionResult } from "./farmers";

const followupSchema = z.object({
  farmerId: z.string(),
  cropId: z.string().optional(),
  reason: z.string().min(2, "Give a short reason"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string().min(1, "Due date is required"),
});

export async function createFollowupAction(
  input: z.infer<typeof followupSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const data = followupSchema.parse(input);

    const followup = await prisma.followup.create({
      data: {
        farmerId: data.farmerId,
        cropId: data.cropId || null,
        reason: data.reason,
        priority: data.priority,
        dueDate: new Date(data.dueDate),
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "FOLLOWUP_CREATED",
      entityType: "Followup",
      entityId: followup.id,
    });

    revalidatePath("/admin/followups");
    if (data.cropId) revalidatePath(`/admin/crops/${data.cropId}`);
    return { ok: true, data: { id: followup.id } };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}

const updateFollowupSchema = z.object({
  followupId: z.string(),
  status: z.enum(["PENDING", "COMPLETED", "RESCHEDULED", "CANCELLED"]),
  dueDate: z.string().optional(),
});

export async function updateFollowupStatusAction(
  input: z.infer<typeof updateFollowupSchema>
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const data = updateFollowupSchema.parse(input);

    const followup = await prisma.followup.findUnique({ where: { id: data.followupId } });
    if (!followup) return { ok: false, error: "Follow-up not found." };
    assertRecordAccess(session, followup);

    await prisma.followup.update({
      where: { id: data.followupId },
      data: {
        status: data.status,
        completedAt: data.status === "COMPLETED" ? new Date() : followup.completedAt,
        dueDate: data.dueDate ? new Date(data.dueDate) : followup.dueDate,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "FOLLOWUP_UPDATED",
      entityType: "Followup",
      entityId: data.followupId,
      metadata: { status: data.status },
    });

    revalidatePath("/admin/followups");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}
