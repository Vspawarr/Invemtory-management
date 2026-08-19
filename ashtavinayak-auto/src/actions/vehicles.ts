"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { generateVehicleSlug } from "@/lib/slug";
import { getStorage } from "@/lib/storage";
import { validateImageFile, MIN_IMAGES, MAX_IMAGES } from "@/lib/storage/validate";
import { vehicleFormSchema } from "@/schemas/vehicle";
import type { ActionResult } from "./auth";

function readVehicleForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const featureIds = formData.getAll("featureIds").map(String);
  return { ...raw, featureIds };
}

async function processImages(
  formData: FormData
): Promise<{ ok: true; images: { url: string; storageKey: string }[] } | { ok: false; error: string }> {
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: true, images: [] };
  if (files.length > MAX_IMAGES) {
    return { ok: false, error: `A vehicle can have at most ${MAX_IMAGES} photos.` };
  }
  const storage = getStorage();
  const uploaded: { url: string; storageKey: string }[] = [];
  for (const file of files) {
    const validated = await validateImageFile(file);
    if (!validated.ok) return { ok: false, error: validated.error };
    const stored = await storage.put(validated.image.buffer, validated.image.extension, validated.image.mimeType);
    uploaded.push(stored);
  }
  return { ok: true, images: uploaded };
}

export async function createVehicle(
  formData: FormData
): Promise<ActionResult<{ id: string; slug: string }>> {
  const user = await assertAdmin();

  const intent = String(formData.get("intent") || "draft"); // "draft" | "publish"
  const parsed = vehicleFormSchema.safeParse(readVehicleForm(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existingImages = await processImages(formData);
  if (existingImages.ok === false) return { ok: false, error: existingImages.error };
  if (intent === "publish" && existingImages.images.length < MIN_IMAGES) {
    return { ok: false, error: "Add at least one photo before publishing." };
  }

  const { featureIds, ...data } = parsed.data;
  const slug = await generateVehicleSlug({
    brand: data.brand,
    model: data.model,
    variant: data.variant,
    year: data.year,
    city: data.city,
  });

  const now = new Date();
  const vehicle = await prisma.vehicle.create({
    data: {
      ...data,
      variant: data.variant || null,
      registrationNumber: data.registrationNumber || null,
      engine: data.engine || null,
      mileage: data.mileage || null,
      color: data.color || null,
      location: data.location || null,
      state: data.state || null,
      description: data.description || null,
      slug,
      source: "BUSINESS_STOCK",
      listingType: "BUSINESS_STOCK",
      status: intent === "publish" ? "LISTED" : "DRAFT",
      listedAt: intent === "publish" ? now : null,
      isDemo: false,
      images: {
        create: existingImages.images.map((img, i) => ({
          url: img.url,
          storageKey: img.storageKey,
          sortOrder: i,
          isPrimary: i === 0,
        })),
      },
      features: { create: featureIds.map((featureId) => ({ featureId })) },
    },
  });

  await logAudit({
    userId: user.id,
    action: intent === "publish" ? "VEHICLE_PUBLISHED" : "VEHICLE_CREATED",
    entity: "Vehicle",
    entityId: vehicle.id,
  });

  revalidatePath("/admin/vehicles");
  revalidatePath("/vehicles");
  revalidatePath("/");
  return { ok: true, data: { id: vehicle.id, slug: vehicle.slug } };
}

export async function updateVehicle(id: string, formData: FormData): Promise<ActionResult> {
  const user = await assertAdmin();

  const parsed = vehicleFormSchema.safeParse(readVehicleForm(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const newImages = await processImages(formData);
  if (newImages.ok === false) return { ok: false, error: newImages.error };

  const existing = await prisma.vehicle.findUnique({ where: { id }, include: { images: true } });
  if (!existing) return { ok: false, error: "Vehicle not found." };

  const { featureIds, ...data } = parsed.data;
  const startOrder = existing.images.length;

  await prisma.$transaction([
    prisma.vehicle.update({
      where: { id },
      data: {
        ...data,
        variant: data.variant || null,
        registrationNumber: data.registrationNumber || null,
        engine: data.engine || null,
        mileage: data.mileage || null,
        color: data.color || null,
        location: data.location || null,
        state: data.state || null,
        description: data.description || null,
        images: newImages.images.length
          ? {
              create: newImages.images.map((img, i) => ({
                url: img.url,
                storageKey: img.storageKey,
                sortOrder: startOrder + i,
                isPrimary: existing.images.length === 0 && i === 0,
              })),
            }
          : undefined,
      },
    }),
    prisma.vehicleFeature.deleteMany({ where: { vehicleId: id } }),
    ...(featureIds.length
      ? [
          prisma.vehicleFeature.createMany({
            data: featureIds.map((featureId) => ({ vehicleId: id, featureId })),
          }),
        ]
      : []),
  ]);

  await logAudit({ userId: user.id, action: "VEHICLE_UPDATED", entity: "Vehicle", entityId: id });
  revalidatePath("/admin/vehicles");
  revalidatePath(`/admin/vehicles/${id}/edit`);
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${existing.slug}`);
  return { ok: true, data: undefined };
}

async function transitionStatus(
  id: string,
  status: "LISTED" | "RESERVED" | "SOLD" | "ARCHIVED" | "DRAFT",
  auditAction: string
): Promise<ActionResult> {
  const user = await assertAdmin();
  const now = new Date();
  const dateField =
    status === "LISTED" ? { listedAt: now } : status === "RESERVED" ? { reservedAt: now } : status === "SOLD" ? { soldAt: now } : {};

  const vehicle = await prisma.vehicle.update({ where: { id }, data: { status, ...dateField } });
  await logAudit({ userId: user.id, action: auditAction, entity: "Vehicle", entityId: id });
  revalidatePath("/admin/vehicles");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicle.slug}`);
  revalidatePath("/");
  return { ok: true, data: undefined };
}

export async function publishVehicle(id: string) {
  return transitionStatus(id, "LISTED", "VEHICLE_PUBLISHED");
}
export async function reserveVehicle(id: string) {
  return transitionStatus(id, "RESERVED", "VEHICLE_RESERVED");
}
export async function markVehicleSold(id: string) {
  return transitionStatus(id, "SOLD", "VEHICLE_SOLD");
}
export async function archiveVehicle(id: string) {
  return transitionStatus(id, "ARCHIVED", "VEHICLE_ARCHIVED");
}

export async function toggleFeaturedVehicle(id: string, featured: boolean): Promise<ActionResult> {
  const user = await assertAdmin();
  await prisma.vehicle.update({ where: { id }, data: { isFeatured: featured } });
  await logAudit({
    userId: user.id,
    action: featured ? "VEHICLE_FEATURED" : "VEHICLE_UNFEATURED",
    entity: "Vehicle",
    entityId: id,
  });
  revalidatePath("/admin/vehicles");
  revalidatePath("/");
  return { ok: true, data: undefined };
}

export async function deleteVehicle(id: string): Promise<ActionResult> {
  const user = await assertAdmin();
  const vehicle = await prisma.vehicle.findUnique({ where: { id }, include: { images: true } });
  if (!vehicle) return { ok: false, error: "Vehicle not found." };

  const storage = getStorage();
  await Promise.all(
    vehicle.images.map((img) => (img.storageKey ? storage.delete(img.storageKey) : Promise.resolve()))
  );
  await prisma.vehicle.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "VEHICLE_DELETED", entity: "Vehicle", entityId: id });
  revalidatePath("/admin/vehicles");
  revalidatePath("/vehicles");
  revalidatePath("/");
  return { ok: true, data: undefined };
}

export async function duplicateVehicle(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await assertAdmin();
  const source = await prisma.vehicle.findUnique({
    where: { id },
    include: { images: true, features: true },
  });
  if (!source) return { ok: false, error: "Vehicle not found." };

  const slug = await generateVehicleSlug({
    brand: source.brand,
    model: source.model,
    variant: source.variant,
    year: source.year,
    city: source.city,
  });

  const copy = await prisma.vehicle.create({
    data: {
      slug,
      source: source.source,
      listingType: source.listingType,
      status: "DRAFT",
      categoryId: source.categoryId,
      vehicleType: source.vehicleType,
      brand: source.brand,
      model: source.model,
      variant: source.variant,
      year: source.year,
      registrationYear: source.registrationYear,
      price: source.price,
      isPriceNegotiable: source.isPriceNegotiable,
      kilometres: source.kilometres,
      fuelType: source.fuelType,
      transmission: source.transmission,
      engine: source.engine,
      mileage: source.mileage,
      owners: source.owners,
      color: source.color,
      condition: source.condition,
      location: source.location,
      city: source.city,
      state: source.state,
      description: source.description,
      rcAvailable: source.rcAvailable,
      insuranceAvailable: source.insuranceAvailable,
      pucAvailable: source.pucAvailable,
      serviceHistoryAvailable: source.serviceHistoryAvailable,
      hasLoan: source.hasLoan,
      isDemo: source.isDemo,
      images: {
        create: source.images.map((img) => ({
          url: img.url,
          storageKey: null, // duplicated record does not own the original file
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
          altText: img.altText,
        })),
      },
      features: { create: source.features.map((f) => ({ featureId: f.featureId })) },
    },
  });

  await logAudit({ userId: user.id, action: "VEHICLE_DUPLICATED", entity: "Vehicle", entityId: copy.id });
  revalidatePath("/admin/vehicles");
  return { ok: true, data: { id: copy.id } };
}

export async function removeVehicleImage(imageId: string): Promise<ActionResult> {
  const user = await assertAdmin();
  const image = await prisma.vehicleImage.findUnique({ where: { id: imageId } });
  if (!image) return { ok: false, error: "Image not found." };

  const storage = getStorage();
  if (image.storageKey) await storage.delete(image.storageKey);
  await prisma.vehicleImage.delete({ where: { id: imageId } });

  await logAudit({ userId: user.id, action: "VEHICLE_IMAGE_REMOVED", entity: "Vehicle", entityId: image.vehicleId });
  revalidatePath(`/admin/vehicles/${image.vehicleId}/edit`);
  return { ok: true, data: undefined };
}

export async function setPrimaryVehicleImage(imageId: string): Promise<ActionResult> {
  await assertAdmin();
  const image = await prisma.vehicleImage.findUnique({ where: { id: imageId } });
  if (!image) return { ok: false, error: "Image not found." };

  await prisma.$transaction([
    prisma.vehicleImage.updateMany({ where: { vehicleId: image.vehicleId }, data: { isPrimary: false } }),
    prisma.vehicleImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ]);
  revalidatePath(`/admin/vehicles/${image.vehicleId}/edit`);
  return { ok: true, data: undefined };
}

export async function reorderVehicleImage(imageId: string, direction: "up" | "down"): Promise<ActionResult> {
  await assertAdmin();
  const image = await prisma.vehicleImage.findUnique({ where: { id: imageId } });
  if (!image) return { ok: false, error: "Image not found." };

  const siblings = await prisma.vehicleImage.findMany({
    where: { vehicleId: image.vehicleId },
    orderBy: { sortOrder: "asc" },
  });
  const index = siblings.findIndex((s) => s.id === imageId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= siblings.length) return { ok: true, data: undefined };

  const target = siblings[targetIndex];
  await prisma.$transaction([
    prisma.vehicleImage.update({ where: { id: image.id }, data: { sortOrder: target.sortOrder } }),
    prisma.vehicleImage.update({ where: { id: target.id }, data: { sortOrder: image.sortOrder } }),
  ]);
  revalidatePath(`/admin/vehicles/${image.vehicleId}/edit`);
  return { ok: true, data: undefined };
}
