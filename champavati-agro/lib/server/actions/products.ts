"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/require-session";
import { requireAdmin } from "@/lib/server/auth-guards";
import { logAudit } from "@/lib/server/audit";
import { toFriendlyMessage } from "@/lib/server/errors";
import type { ActionResult } from "./farmers";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  activeIngredient: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  packSize: z.string().min(1, "Pack size is required"),
  mrp: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
  targetCropId: z.string().optional(),
  targetPest: z.string().optional(),
  description: z.string().optional(),
  usageNotes: z.string().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

export async function createProductAction(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const data = productSchema.parse(input);

    const product = await prisma.product.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        brand: data.brand || null,
        manufacturer: data.manufacturer || null,
        activeIngredient: data.activeIngredient || null,
        unit: data.unit,
        packSize: data.packSize,
        mrp: data.mrp,
        sellingPrice: data.sellingPrice,
        targetCropId: data.targetCropId || null,
        targetPest: data.targetPest || null,
        description: data.description || null,
        usageNotes: data.usageNotes || null,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "PRODUCT_CREATED",
      entityType: "Product",
      entityId: product.id,
    });

    revalidatePath("/admin/products");
    return { ok: true, data: { id: product.id } };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}

export async function archiveProductAction(productId: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    await prisma.product.update({ where: { id: productId }, data: { deletedAt: new Date(), isActive: false } });
    await logAudit({
      userId: session.user.id,
      action: "PRODUCT_ARCHIVED",
      entityType: "Product",
      entityId: productId,
    });
    revalidatePath("/admin/products");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}
