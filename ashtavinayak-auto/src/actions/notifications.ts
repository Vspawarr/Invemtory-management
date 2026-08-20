"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth-guard";
import type { ActionResult } from "./auth";

export async function markNotificationRead(id: string): Promise<ActionResult> {
  await assertAdmin();
  await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  revalidatePath("/admin/notifications");
  revalidatePath("/admin", "layout");
  return { ok: true, data: undefined };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  await assertAdmin();
  await prisma.notification.updateMany({ where: { readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/admin/notifications");
  revalidatePath("/admin", "layout");
  return { ok: true, data: undefined };
}
