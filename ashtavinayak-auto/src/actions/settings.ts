"use server";

import { z } from "zod";
import { checkboxBoolean } from "@/lib/zod-helpers";
import { assertSuperAdmin } from "@/lib/auth-guard";
import { saveSettings } from "@/lib/settings";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "./auth";

const settingsSchema = z.object({
  businessName: z.string().trim().min(1),
  businessPhone: z.string().trim().optional().or(z.literal("")),
  businessWhatsApp: z.string().trim().optional().or(z.literal("")),
  businessEmail: z.string().trim().optional().or(z.literal("")),
  businessAddress: z.string().trim().optional().or(z.literal("")),
  businessCity: z.string().trim().optional().or(z.literal("")),
  businessState: z.string().trim().optional().or(z.literal("")),
  businessPincode: z.string().trim().optional().or(z.literal("")),
  googleMapsUrl: z.string().trim().optional().or(z.literal("")),
  businessHours: z.string().trim().optional().or(z.literal("")),
  socialFacebook: z.string().trim().optional().or(z.literal("")),
  socialInstagram: z.string().trim().optional().or(z.literal("")),
  socialYoutube: z.string().trim().optional().or(z.literal("")),
  heroHeading: z.string().trim().optional().or(z.literal("")),
  heroSubtitle: z.string().trim().optional().or(z.literal("")),
  aboutSection: z.string().trim().optional().or(z.literal("")),
  featuredVehicleCount: z.coerce.number().int().min(1).max(24),
  showVehicleSourcePublicly: checkboxBoolean,
  siteTitle: z.string().trim().optional().or(z.literal("")),
  siteDescription: z.string().trim().optional().or(z.literal("")),
});

export async function updateSettings(formData: FormData): Promise<ActionResult> {
  const user = await assertSuperAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await saveSettings(parsed.data);
  await logAudit({ userId: user.id, action: "SETTINGS_UPDATED", entity: "Setting" });
  return { ok: true, data: undefined };
}
