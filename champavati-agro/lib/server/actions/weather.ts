"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/require-session";
import { requireAdmin, assertRecordAccess } from "@/lib/server/auth-guards";
import { toFriendlyMessage } from "@/lib/server/errors";
import { optionalNumber } from "@/lib/server/zod-utils";
import type { ActionResult } from "./farmers";

const weatherSchema = z.object({
  cropId: z.string(),
  rainfallStatus: z.enum(["NORMAL", "DELAYED_MONSOON", "DRY_SPELL", "EXCESS_RAIN"]),
  rainfallLast7Days: optionalNumber(),
  rainfallLast14Days: optionalNumber(),
  irrigationAvailable: z.boolean(),
  notes: z.string().optional(),
});

export async function recordWeatherObservationAction(
  input: z.infer<typeof weatherSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const data = weatherSchema.parse(input);

    const crop = await prisma.crop.findUnique({ where: { id: data.cropId }, select: { farmerId: true } });
    if (!crop) return { ok: false, error: "Crop not found." };
    assertRecordAccess(session, crop);

    const entry = await prisma.weatherContext.create({
      data: {
        cropId: data.cropId,
        rainfallStatus: data.rainfallStatus,
        rainfallLast7Days: data.rainfallLast7Days,
        rainfallLast14Days: data.rainfallLast14Days,
        irrigationAvailable: data.irrigationAvailable,
        notes: data.notes || null,
        recordedById: session.user.id,
      },
    });

    revalidatePath(`/admin/crops/${data.cropId}`);
    return { ok: true, data: { id: entry.id } };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}
