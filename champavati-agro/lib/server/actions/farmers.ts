"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/require-session";
import { requireAdmin } from "@/lib/server/auth-guards";
import { logAudit } from "@/lib/server/audit";
import { addFarmerDocument } from "@/lib/server/documents";
import { toFriendlyMessage } from "@/lib/server/errors";

const farmerRegistrationSchema = z.object({
  fullName: z.string().min(2, "Enter the farmer's full name"),
  fatherOrHusbandName: z.string().optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  altPhone: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
  aadhaar: z
    .string()
    .regex(/^\d{12}$/, "Aadhaar must be 12 digits")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  village: z.string().min(1, "Village is required"),
  taluka: z.string().min(1),
  district: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().optional(),
  land: z
    .array(
      z.object({
        name: z.string().min(1, "Give this land parcel a name"),
        surveyNo: z.string().optional(),
        areaAcres: z.coerce.number().positive("Area must be greater than zero"),
        soilType: z.string().optional(),
        waterSource: z.string().optional(),
        village: z.string().min(1),
      })
    )
    .min(1, "Add at least one land parcel"),
});

export type FarmerRegistrationInput = z.infer<typeof farmerRegistrationSchema>;

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createFarmerWithLand(
  input: FarmerRegistrationInput
): Promise<ActionResult<{ farmerId: string }>> {
  try {
    const session = await requireSession();
    requireAdmin(session);

    const parsed = farmerRegistrationSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }
    const data = parsed.data;

    const farmer = await prisma.$transaction(async (tx) => {
      const created = await tx.farmer.create({
        data: {
          fullName: data.fullName,
          fatherOrHusbandName: data.fatherOrHusbandName || null,
          phone: data.phone,
          altPhone: data.altPhone || null,
          gender: data.gender || null,
          dob: data.dob ? new Date(data.dob) : null,
          address: data.address || null,
          village: data.village,
          taluka: data.taluka,
          district: data.district,
          state: data.state,
          pincode: data.pincode || null,
        },
      });

      await tx.landParcel.createMany({
        data: data.land.map((l) => ({
          farmerId: created.id,
          name: l.name,
          surveyNo: l.surveyNo || null,
          areaAcres: l.areaAcres,
          soilType: l.soilType || null,
          waterSource: l.waterSource || null,
          village: l.village,
        })),
      });

      return created;
    });

    if (data.aadhaar) {
      await addFarmerDocument(session, farmer.id, "AADHAAR", data.aadhaar);
    }

    await logAudit({
      userId: session.user.id,
      action: "FARMER_CREATED",
      entityType: "Farmer",
      entityId: farmer.id,
      metadata: { village: data.village, landParcels: data.land.length },
    });

    revalidatePath("/admin/farmers");
    return { ok: true, data: { farmerId: farmer.id } };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}

export async function archiveFarmerAction(farmerId: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    await prisma.farmer.update({ where: { id: farmerId }, data: { deletedAt: new Date() } });
    await logAudit({
      userId: session.user.id,
      action: "FARMER_ARCHIVED",
      entityType: "Farmer",
      entityId: farmerId,
    });
    revalidatePath("/admin/farmers");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}

const createLoginSchema = z.object({
  farmerId: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/** Admin grants a farmer portal access: creates a User (login = the farmer's
 * phone number) linked to the existing Farmer record. Farmers never self-register. */
export async function createFarmerLoginAction(
  input: z.infer<typeof createLoginSchema>
): Promise<ActionResult<{ email: string }>> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const data = createLoginSchema.parse(input);

    const farmer = await prisma.farmer.findUnique({ where: { id: data.farmerId } });
    if (!farmer) return { ok: false, error: "Farmer not found." };
    if (farmer.userId) return { ok: false, error: "This farmer already has portal access." };

    const passwordHash = await bcrypt.hash(data.password, 10);
    const loginEmail = `farmer-${farmer.phone}@champavatiagro.portal`;

    const user = await prisma.user.create({
      data: { email: loginEmail, phone: farmer.phone, passwordHash, role: "FARMER" },
    });
    await prisma.farmer.update({ where: { id: farmer.id }, data: { userId: user.id } });

    await logAudit({
      userId: session.user.id,
      action: "FARMER_MODIFIED",
      entityType: "Farmer",
      entityId: farmer.id,
      metadata: { portalAccessGranted: true },
    });

    revalidatePath(`/admin/farmers/${farmer.id}`);
    return { ok: true, data: { email: farmer.phone } };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}

export async function revealAadhaarAction(documentId: string): Promise<ActionResult<{ value: string }>> {
  try {
    const session = await requireSession();
    requireAdmin(session);
    const { revealFarmerDocument } = await import("@/lib/server/documents");
    const value = await revealFarmerDocument(session, documentId);
    if (!value) return { ok: false, error: "Document not found." };
    return { ok: true, data: { value } };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}
