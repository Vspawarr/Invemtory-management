"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkboxBoolean } from "@/lib/zod-helpers";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "./auth";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens."),
  vehicleType: z.enum(["CAR", "BIKE", "SCOOTER", "BUS", "COMMERCIAL", "OTHER"]),
  description: z.string().trim().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  isActive: checkboxBoolean,
});

export async function createCategory(formData: FormData): Promise<ActionResult> {
  const user = await assertRole("SUPER_ADMIN", "ADMIN");
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const existing = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { ok: false, error: "A category with this slug already exists." };

  const category = await prisma.category.create({ data: parsed.data });
  await logAudit({ userId: user.id, action: "CATEGORY_CREATED", entity: "Category", entityId: category.id });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true, data: undefined };
}

export async function updateCategory(id: string, formData: FormData): Promise<ActionResult> {
  const user = await assertRole("SUPER_ADMIN", "ADMIN");
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await prisma.category.update({ where: { id }, data: parsed.data });
  await logAudit({ userId: user.id, action: "CATEGORY_UPDATED", entity: "Category", entityId: id });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true, data: undefined };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const user = await assertRole("SUPER_ADMIN", "ADMIN");
  const inUse = await prisma.vehicle.count({ where: { categoryId: id } });
  if (inUse > 0) {
    return { ok: false, error: `Cannot delete: ${inUse} vehicle(s) use this category.` };
  }
  await prisma.category.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "CATEGORY_DELETED", entity: "Category", entityId: id });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true, data: undefined };
}
