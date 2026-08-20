"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notify";
import { getStorage } from "@/lib/storage";
import { validateImageFile } from "@/lib/storage/validate";
import { submissionSchema } from "@/schemas/submission";
import { generateVehicleSlug } from "@/lib/slug";
import {
  formatReferenceNumber,
  generateTrackingToken,
  hashTrackingToken,
} from "@/lib/reference-number";
import type { ActionResult } from "./auth";

const MIN_SUBMISSION_IMAGES = 4;
const MAX_SUBMISSION_IMAGES = 15;

export interface SubmissionSuccess {
  referenceNumber: string;
  trackingToken: string;
}

export async function createSubmission(formData: FormData): Promise<ActionResult<SubmissionSuccess>> {
  const allowed = await checkRateLimit("submission");
  if (!allowed) {
    return { ok: false, error: "Too many submissions from this connection. Please try again later." };
  }

  const parsed = submissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (parsed.data.website) {
    // Honeypot triggered. Pretend success without persisting anything.
    return {
      ok: true,
      data: { referenceNumber: "AAC-0000-000000", trackingToken: "invalid" },
    };
  }

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length < MIN_SUBMISSION_IMAGES) {
    return { ok: false, error: `Please upload at least ${MIN_SUBMISSION_IMAGES} photos.` };
  }
  if (files.length > MAX_SUBMISSION_IMAGES) {
    return { ok: false, error: `You can upload up to ${MAX_SUBMISSION_IMAGES} photos.` };
  }

  const storage = getStorage();
  const uploaded: { url: string; storageKey: string }[] = [];
  for (const file of files) {
    const validated = await validateImageFile(file);
    if (!validated.ok) return { ok: false, error: validated.error };
    const stored = await storage.put(validated.image.buffer, validated.image.extension, validated.image.mimeType);
    uploaded.push(stored);
  }

  const data = parsed.data;

  // Reuse an existing seller record by phone where possible, otherwise create one.
  const seller = await prisma.vehicleSeller.upsert({
    where: { phone: data.phone },
    create: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      city: data.city,
      state: data.state || null,
      preferredContact: data.preferredContact,
    },
    update: {
      name: data.name,
      email: data.email || null,
      city: data.city,
      state: data.state || null,
      preferredContact: data.preferredContact,
    },
  });

  const { token, tokenHash } = generateTrackingToken();
  const placeholderRef = `TEMP-${crypto.randomUUID()}`;

  const submission = await prisma.vehicleSubmission.create({
    data: {
      referenceNumber: placeholderRef,
      sellerId: seller.id,
      vehicleType: data.vehicleType,
      brand: data.brand,
      model: data.model,
      variant: data.variant || null,
      year: data.year,
      registrationYear: data.registrationYear ?? null,
      registrationNumber: data.registrationNumber || null,
      kilometres: data.kilometres,
      fuelType: data.fuelType,
      transmission: data.transmission,
      engine: data.engine || null,
      color: data.color || null,
      owners: data.owners,
      condition: data.condition,
      expectedPrice: data.expectedPrice,
      isPriceNegotiable: data.isPriceNegotiable,
      city: data.city,
      state: data.state || null,
      pincode: data.pincode || null,
      vehicleLocation: data.vehicleLocation || null,
      description: data.description || null,
      rcAvailable: data.rcAvailable,
      insuranceAvailable: data.insuranceAvailable,
      pucAvailable: data.pucAvailable,
      serviceHistoryAvailable: data.serviceHistoryAvailable,
      hasLoan: data.hasLoan,
      consentAt: new Date(),
      publicTrackingTokenHash: tokenHash,
      trackingTokenCreatedAt: new Date(),
      images: {
        create: uploaded.map((img, i) => ({
          url: img.url,
          storageKey: img.storageKey,
          sortOrder: i,
          isPrimary: i === 0,
        })),
      },
    },
  });

  const referenceNumber = formatReferenceNumber(submission.seq);
  await prisma.vehicleSubmission.update({
    where: { id: submission.id },
    data: { referenceNumber },
  });

  await createNotification({
    type: "NEW_SUBMISSION",
    title: "New vehicle submission",
    body: `${data.name} submitted a ${data.year} ${data.brand} ${data.model} (${referenceNumber})`,
    link: `/admin/submissions/${submission.id}`,
    emailAdmin: true,
  });

  // Never log the plaintext token — audit metadata only records the reference.
  await logAudit({ action: "SUBMISSION_CREATED", entity: "VehicleSubmission", entityId: submission.id, metadata: { referenceNumber } });

  return { ok: true, data: { referenceNumber, trackingToken: token } };
}

// ─── Public status lookup (secured by reference + tracking token) ─────────

export interface PublicSubmissionStatus {
  referenceNumber: string;
  vehicleTitle: string;
  status: string;
  createdAt: Date;
  requestMoreInfoMessage: string | null;
}

export async function getPublicSubmissionStatus(
  referenceNumber: string,
  token: string
): Promise<PublicSubmissionStatus | null> {
  const allowed = await checkRateLimit("status-lookup");
  if (!allowed || !referenceNumber || !token) return null;

  const tokenHash = hashTrackingToken(token);
  const submission = await prisma.vehicleSubmission.findFirst({
    where: { referenceNumber, publicTrackingTokenHash: tokenHash },
    select: {
      referenceNumber: true,
      brand: true,
      model: true,
      year: true,
      status: true,
      createdAt: true,
      requestMoreInfoMessage: true,
    },
  });
  if (!submission) return null;

  return {
    referenceNumber: submission.referenceNumber,
    vehicleTitle: `${submission.year} ${submission.brand} ${submission.model}`,
    status: submission.status,
    createdAt: submission.createdAt,
    requestMoreInfoMessage: submission.status === "MORE_INFORMATION_REQUIRED" ? submission.requestMoreInfoMessage : null,
  };
}

// ─── Admin review actions ──────────────────────────────────────────────────

export async function markSubmissionUnderReview(id: string): Promise<ActionResult> {
  const user = await assertAdmin();
  await prisma.vehicleSubmission.update({
    where: { id },
    data: { status: "UNDER_REVIEW", reviewedAt: new Date(), reviewedById: user.id },
  });
  await logAudit({ userId: user.id, action: "SUBMISSION_REVIEWED", entity: "VehicleSubmission", entityId: id });
  revalidatePath(`/admin/submissions/${id}`);
  revalidatePath("/admin/submissions");
  return { ok: true, data: undefined };
}

export async function requestMoreInformation(id: string, message: string): Promise<ActionResult> {
  const user = await assertAdmin();
  if (!message.trim()) return { ok: false, error: "Enter a message describing what is needed." };

  await prisma.vehicleSubmission.update({
    where: { id },
    data: {
      status: "MORE_INFORMATION_REQUIRED",
      requestMoreInfoMessage: message.trim(),
      reviewedAt: new Date(),
      reviewedById: user.id,
    },
  });
  await logAudit({ userId: user.id, action: "SUBMISSION_MORE_INFO_REQUESTED", entity: "VehicleSubmission", entityId: id });
  revalidatePath(`/admin/submissions/${id}`);
  revalidatePath("/admin/submissions");
  return { ok: true, data: undefined };
}

export async function rejectSubmission(id: string, reason: string): Promise<ActionResult> {
  const user = await assertAdmin();
  if (!reason.trim()) return { ok: false, error: "Select or enter a rejection reason." };

  await prisma.vehicleSubmission.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectionReason: reason.trim(),
      reviewedAt: new Date(),
      reviewedById: user.id,
    },
  });
  await logAudit({ userId: user.id, action: "SUBMISSION_REJECTED", entity: "VehicleSubmission", entityId: id });
  revalidatePath(`/admin/submissions/${id}`);
  revalidatePath("/admin/submissions");
  return { ok: true, data: undefined };
}

export async function saveSubmissionAdminNotes(id: string, notes: string): Promise<ActionResult> {
  const user = await assertAdmin();
  await prisma.vehicleSubmission.update({ where: { id }, data: { adminNotes: notes } });
  await logAudit({ userId: user.id, action: "SUBMISSION_NOTES_SAVED", entity: "VehicleSubmission", entityId: id });
  return { ok: true, data: undefined };
}

export interface ApproveSubmissionInput {
  categoryId: string;
  listingPrice: number;
  adminValuation?: number;
  negotiatedPrice?: number;
  isPriceNegotiable: boolean;
  description?: string;
  city: string;
  state?: string;
  location?: string;
  featureIds: string[];
  isFeatured: boolean;
}

export async function approveAndListSubmission(
  id: string,
  input: ApproveSubmissionInput
): Promise<ActionResult<{ vehicleId: string; slug: string }>> {
  const user = await assertAdmin();

  const submission = await prisma.vehicleSubmission.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } }, seller: true, vehicle: true },
  });
  if (!submission) return { ok: false, error: "Submission not found." };
  if (submission.vehicle) return { ok: false, error: "This submission has already been listed." };

  const slug = await generateVehicleSlug({
    brand: submission.brand,
    model: submission.model,
    variant: submission.variant,
    year: submission.year,
    city: input.city,
  });

  const now = new Date();

  const vehicle = await prisma.$transaction(async (tx) => {
    const created = await tx.vehicle.create({
      data: {
        slug,
        source: "CUSTOMER_SUBMITTED",
        listingType: "CUSTOMER_CONSIGNMENT",
        status: "LISTED",
        categoryId: input.categoryId,
        vehicleType: submission.vehicleType,
        brand: submission.brand,
        model: submission.model,
        variant: submission.variant,
        year: submission.year,
        registrationYear: submission.registrationYear,
        registrationNumber: submission.registrationNumber,
        price: input.listingPrice,
        ownerExpectedPrice: submission.expectedPrice,
        adminValuation: input.adminValuation,
        negotiatedPrice: input.negotiatedPrice,
        isPriceNegotiable: input.isPriceNegotiable,
        kilometres: submission.kilometres,
        fuelType: submission.fuelType,
        transmission: submission.transmission,
        engine: submission.engine,
        owners: submission.owners,
        color: submission.color,
        condition: submission.condition,
        location: input.location || null,
        city: input.city,
        state: input.state || null,
        description: input.description || submission.description,
        rcAvailable: submission.rcAvailable,
        insuranceAvailable: submission.insuranceAvailable,
        pucAvailable: submission.pucAvailable,
        serviceHistoryAvailable: submission.serviceHistoryAvailable,
        hasLoan: submission.hasLoan,
        isFeatured: input.isFeatured,
        sellerId: submission.sellerId,
        submissionId: submission.id,
        approvedAt: now,
        approvedById: user.id,
        listedAt: now,
        images: {
          create: submission.images.map((img) => ({
            url: img.url,
            storageKey: img.storageKey,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
          })),
        },
        features: { create: input.featureIds.map((featureId) => ({ featureId })) },
      },
    });

    await tx.vehicleSubmission.update({
      where: { id: submission.id },
      data: { status: "APPROVED", reviewedAt: now, reviewedById: user.id },
    });

    return created;
  });

  await createNotification({
    type: "VEHICLE_APPROVED",
    title: "Vehicle approved and listed",
    body: `${submission.year} ${submission.brand} ${submission.model} is now live`,
    link: `/vehicles/${vehicle.slug}`,
  });
  await logAudit({
    userId: user.id,
    action: "SUBMISSION_APPROVED_AND_LISTED",
    entity: "Vehicle",
    entityId: vehicle.id,
    metadata: { submissionId: submission.id, referenceNumber: submission.referenceNumber },
  });

  revalidatePath(`/admin/submissions/${id}`);
  revalidatePath("/admin/submissions");
  revalidatePath("/admin/vehicles");
  revalidatePath("/vehicles");
  revalidatePath("/");

  return { ok: true, data: { vehicleId: vehicle.id, slug: vehicle.slug } };
}

export interface DuplicateMatch {
  id: string;
  type: "submission" | "vehicle";
  reference: string;
  reason: string;
}

export async function findPossibleDuplicates(submissionId: string): Promise<DuplicateMatch[]> {
  await assertAdmin();
  const submission = await prisma.vehicleSubmission.findUnique({
    where: { id: submissionId },
    include: { seller: true },
  });
  if (!submission) return [];

  const matches: DuplicateMatch[] = [];

  if (submission.registrationNumber) {
    const byReg = await prisma.vehicleSubmission.findMany({
      where: { registrationNumber: submission.registrationNumber, id: { not: submission.id } },
      select: { id: true, referenceNumber: true },
    });
    matches.push(...byReg.map((m) => ({ id: m.id, type: "submission" as const, reference: m.referenceNumber, reason: "Same registration number" })));

    const vByReg = await prisma.vehicle.findMany({
      where: { registrationNumber: submission.registrationNumber },
      select: { id: true, slug: true },
    });
    matches.push(...vByReg.map((m) => ({ id: m.id, type: "vehicle" as const, reference: m.slug, reason: "Same registration number" })));
  }

  const bySeller = await prisma.vehicleSubmission.findMany({
    where: { sellerId: submission.sellerId, id: { not: submission.id } },
    select: { id: true, referenceNumber: true },
  });
  matches.push(...bySeller.map((m) => ({ id: m.id, type: "submission" as const, reference: m.referenceNumber, reason: "Same seller mobile number" })));

  const bySpec = await prisma.vehicleSubmission.findMany({
    where: {
      id: { not: submission.id },
      brand: submission.brand,
      model: submission.model,
      year: submission.year,
      kilometres: { gte: submission.kilometres - 500, lte: submission.kilometres + 500 },
    },
    select: { id: true, referenceNumber: true },
  });
  matches.push(...bySpec.map((m) => ({ id: m.id, type: "submission" as const, reference: m.referenceNumber, reason: "Same brand, model, year and similar KM" })));

  // De-duplicate by id
  const seen = new Set<string>();
  return matches.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
}
