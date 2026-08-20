"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/auth-guard";
import type { ActionResult } from "./auth";

export async function toggleFavourite(vehicleId: string): Promise<ActionResult<{ favourited: boolean }>> {
  const user = await assertUser();

  const existing = await prisma.favourite.findUnique({
    where: { userId_vehicleId: { userId: user.id, vehicleId } },
  });

  if (existing) {
    await prisma.favourite.delete({ where: { id: existing.id } });
    revalidatePath("/account/favourites");
    return { ok: true, data: { favourited: false } };
  }

  await prisma.favourite.create({ data: { userId: user.id, vehicleId } });
  revalidatePath("/account/favourites");
  return { ok: true, data: { favourited: true } };
}
