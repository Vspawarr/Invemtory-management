"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkboxBoolean } from "@/lib/zod-helpers";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "./auth";

const featureSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  sortOrder: z.coerce.number().int().default(0),
  isActive: checkboxBoolean,
});

export async function createFeature(formData: FormData): Promise<ActionResult> {
  const user = await assertRole("SUPER_ADMIN", "ADMIN");
  const parsed = featureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const existing = await prisma.feature.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { ok: false, error: "This feature already exists." };

  const feature = await prisma.feature.create({ data: parsed.data });
  await logAudit({ userId: user.id, action: "FEATURE_CREATED", entity: "Feature", entityId: feature.id });
  revalidatePath("/admin/features");
  return { ok: true, data: undefined };
}

export async function updateFeature(id: string, formData: FormData): Promise<ActionResult> {
  const user = await assertRole("SUPER_ADMIN", "ADMIN");
  const parsed = featureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await prisma.feature.update({ where: { id }, data: parsed.data });
  await logAudit({ userId: user.id, action: "FEATURE_UPDATED", entity: "Feature", entityId: id });
  revalidatePath("/admin/features");
  return { ok: true, data: undefined };
}

export async function deleteFeature(id: string): Promise<ActionResult> {
  const user = await assertRole("SUPER_ADMIN", "ADMIN");
  await prisma.feature.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "FEATURE_DELETED", entity: "Feature", entityId: id });
  revalidatePath("/admin/features");
  return { ok: true, data: undefined };
}
