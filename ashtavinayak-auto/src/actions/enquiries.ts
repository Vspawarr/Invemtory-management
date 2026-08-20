"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { enquirySchema, callbackSchema } from "@/schemas/enquiry";
import { checkRateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notify";
import { getSessionUser, assertAdmin } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import type { EnquiryStatus, CallbackStatus } from "@prisma/client";
import type { ActionResult } from "./auth";

export async function createEnquiry(formData: FormData): Promise<ActionResult> {
  const allowed = await checkRateLimit("enquiry");
  if (!allowed) return { ok: false, error: "Too many requests. Please try again later." };

  const parsed = enquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (parsed.data.website) {
    // Honeypot triggered — silently accept without persisting.
    return { ok: true, data: undefined };
  }

  const user = await getSessionUser();
  const vehicle = parsed.data.vehicleId
    ? await prisma.vehicle.findUnique({ where: { id: parsed.data.vehicleId }, select: { id: true, brand: true, model: true, year: true } })
    : null;

  const enquiry = await prisma.enquiry.create({
    data: {
      vehicleId: vehicle?.id,
      userId: user?.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      message: parsed.data.message || null,
    },
  });

  await createNotification({
    type: "NEW_ENQUIRY",
    title: "New buyer enquiry",
    body: vehicle ? `${parsed.data.name} enquired about ${vehicle.year} ${vehicle.brand} ${vehicle.model}` : `${parsed.data.name} sent an enquiry`,
    link: `/admin/enquiries/${enquiry.id}`,
    emailAdmin: true,
  });

  return { ok: true, data: undefined };
}

export async function createCallbackRequest(formData: FormData): Promise<ActionResult> {
  const allowed = await checkRateLimit("callback");
  if (!allowed) return { ok: false, error: "Too many requests. Please try again later." };

  const parsed = callbackSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (parsed.data.website) {
    return { ok: true, data: undefined };
  }

  await prisma.callbackRequest.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      preferredTime: parsed.data.preferredTime || null,
      message: parsed.data.message || null,
      vehicleId: parsed.data.vehicleId || null,
    },
  });

  await createNotification({
    type: "NEW_CALLBACK",
    title: "New callback request",
    body: `${parsed.data.name} requested a callback`,
    link: `/admin/callbacks`,
    emailAdmin: true,
  });

  return { ok: true, data: undefined };
}

// ─── Admin management ──────────────────────────────────────────────────────

export async function updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<ActionResult> {
  const user = await assertAdmin();
  await prisma.enquiry.update({ where: { id }, data: { status, assignedToId: user.id } });
  await logAudit({ userId: user.id, action: "ENQUIRY_STATUS_UPDATED", entity: "Enquiry", entityId: id, metadata: { status } });
  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin/enquiries");
  return { ok: true, data: undefined };
}

export async function saveEnquiryNotes(id: string, notes: string): Promise<ActionResult> {
  const user = await assertAdmin();
  await prisma.enquiry.update({ where: { id }, data: { internalNotes: notes } });
  await logAudit({ userId: user.id, action: "ENQUIRY_NOTES_SAVED", entity: "Enquiry", entityId: id });
  revalidatePath(`/admin/enquiries/${id}`);
  return { ok: true, data: undefined };
}

export async function updateCallbackStatus(id: string, status: CallbackStatus): Promise<ActionResult> {
  const user = await assertAdmin();
  await prisma.callbackRequest.update({ where: { id }, data: { status } });
  await logAudit({ userId: user.id, action: "CALLBACK_STATUS_UPDATED", entity: "CallbackRequest", entityId: id, metadata: { status } });
  revalidatePath("/admin/callbacks");
  return { ok: true, data: undefined };
}
