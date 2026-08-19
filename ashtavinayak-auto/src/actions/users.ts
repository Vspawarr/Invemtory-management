"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkboxBoolean } from "@/lib/zod-helpers";
import { prisma } from "@/lib/prisma";
import { assertSuperAdmin } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "./auth";

const adminCreateSchema = z.object({
  name: z.string().trim().min(2, "Enter a name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "SALES"]),
});

export async function createAdmin(formData: FormData): Promise<ActionResult> {
  const actor = await assertSuperAdmin();
  const parsed = adminCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { ok: false, error: "A user with this email already exists." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const admin = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    },
  });
  await logAudit({
    userId: actor.id,
    action: "ADMIN_CREATED",
    entity: "User",
    entityId: admin.id,
    metadata: { role: admin.role },
  });
  revalidatePath("/admin/users");
  return { ok: true, data: undefined };
}

const adminUpdateSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "ADMIN", "SALES"]),
  isActive: checkboxBoolean,
});

export async function updateAdmin(id: string, formData: FormData): Promise<ActionResult> {
  const actor = await assertSuperAdmin();
  const parsed = adminUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields." };
  }

  if (id === actor.id && parsed.data.role !== "SUPER_ADMIN") {
    return { ok: false, error: "You cannot remove your own super admin role." };
  }
  if (id === actor.id && !parsed.data.isActive) {
    return { ok: false, error: "You cannot deactivate your own account." };
  }

  const before = await prisma.user.findUnique({ where: { id } });
  await prisma.user.update({ where: { id }, data: parsed.data });
  await logAudit({
    userId: actor.id,
    action: "ADMIN_ROLE_CHANGED",
    entity: "User",
    entityId: id,
    metadata: { from: before?.role, to: parsed.data.role, isActive: parsed.data.isActive },
  });
  revalidatePath("/admin/users");
  return { ok: true, data: undefined };
}

export async function deleteAdmin(id: string): Promise<ActionResult> {
  const actor = await assertSuperAdmin();
  if (id === actor.id) return { ok: false, error: "You cannot delete your own account." };

  const superAdminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
  const target = await prisma.user.findUnique({ where: { id } });
  if (target?.role === "SUPER_ADMIN" && superAdminCount <= 1) {
    return { ok: false, error: "At least one super admin must remain." };
  }

  await prisma.user.delete({ where: { id } });
  await logAudit({ userId: actor.id, action: "ADMIN_DELETED", entity: "User", entityId: id });
  revalidatePath("/admin/users");
  return { ok: true, data: undefined };
}
