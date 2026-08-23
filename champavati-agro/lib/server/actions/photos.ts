"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/require-session";
import { requireAdmin, assertRecordAccess } from "@/lib/server/auth-guards";
import { logAudit } from "@/lib/server/audit";
import { toFriendlyMessage } from "@/lib/server/errors";
import { storage } from "@/lib/server/storage";
import { listCropPhotos } from "@/lib/server/dal/photos";
import {
  MAX_FILES_PER_UPLOAD,
  validateImageFile,
  generateStorageKey,
  sanitizeOriginalFilename,
  type ValidatedImage,
} from "@/lib/server/storage/validate";
import { PHOTO_CATEGORIES } from "@/lib/photo-categories";
import type { ActionResult } from "./farmers";

const uploadMetaSchema = z.object({
  cropId: z.string(),
  category: z.enum(PHOTO_CATEGORIES),
  phase: z.enum(["BEFORE", "AFTER"]).optional(),
  timelineStageId: z.string().optional(),
  healthRecordId: z.string().optional(),
  applicationId: z.string().optional(),
  treatmentResultId: z.string().optional(),
  caption: z.string().optional(),
  observation: z.string().optional(),
});

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Uploads one batch of photos, all sharing the same category/caption/
 * observation/context links (a single "moment" — a field visit, a health
 * observation, a before/after treatment pair). Every file is validated
 * (magic-byte sniffed, size-capped) BEFORE anything is written to storage
 * or the database, so a rejected file never leaves an orphaned upload or a
 * partial batch behind.
 */
export async function uploadCropPhotosAction(formData: FormData): Promise<ActionResult<{ ids: string[] }>> {
  try {
    const session = await requireSession();
    requireAdmin(session);

    const parsed = uploadMetaSchema.safeParse({
      cropId: readOptionalString(formData, "cropId"),
      category: readOptionalString(formData, "category"),
      phase: readOptionalString(formData, "phase"),
      timelineStageId: readOptionalString(formData, "timelineStageId"),
      healthRecordId: readOptionalString(formData, "healthRecordId"),
      applicationId: readOptionalString(formData, "applicationId"),
      treatmentResultId: readOptionalString(formData, "treatmentResultId"),
      caption: readOptionalString(formData, "caption"),
      observation: readOptionalString(formData, "observation"),
    });
    if (!parsed.success) {
      return { ok: false, error: "Please fix the highlighted fields." };
    }
    const meta = parsed.data;

    const crop = await prisma.crop.findUnique({
      where: { id: meta.cropId },
      select: { id: true, farmerId: true, landParcelId: true },
    });
    if (!crop) return { ok: false, error: "Crop not found." };
    assertRecordAccess(session, crop);

    const files = formData.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) return { ok: false, error: "Select at least one photo." };
    if (files.length > MAX_FILES_PER_UPLOAD) {
      return { ok: false, error: `Upload at most ${MAX_FILES_PER_UPLOAD} photos at a time.` };
    }

    let dims: { width?: number; height?: number }[] = [];
    const dimsRaw = formData.get("dims");
    if (typeof dimsRaw === "string") {
      try {
        dims = JSON.parse(dimsRaw);
      } catch {
        dims = [];
      }
    }

    // Pass 1: validate every file's actual content before touching storage or the DB.
    const validated: ValidatedImage[] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await validateImageFile(buffer);
      if ("error" in result) {
        return { ok: false, error: `${file.name || "A photo"}: ${result.error}` };
      }
      validated.push(result);
    }

    // Pass 2: only now write to storage + create rows, one file at a time,
    // rolling back the just-written file if its DB row fails to save.
    const created: string[] = [];
    for (let i = 0; i < validated.length; i++) {
      const v = validated[i];
      const key = generateStorageKey(v.ext);
      await storage.upload(key, v.buffer);
      try {
        const photo = await prisma.cropPhoto.create({
          data: {
            category: meta.category,
            phase: meta.phase ?? null,
            cropId: crop.id,
            farmerId: crop.farmerId,
            landParcelId: crop.landParcelId,
            timelineStageId: meta.timelineStageId || null,
            healthRecordId: meta.healthRecordId || null,
            applicationId: meta.applicationId || null,
            treatmentResultId: meta.treatmentResultId || null,
            storageKey: key,
            mimeType: v.mimeType,
            sizeBytes: v.buffer.byteLength,
            width: dims[i]?.width ?? null,
            height: dims[i]?.height ?? null,
            originalFilename: sanitizeOriginalFilename(files[i].name),
            caption: meta.caption || null,
            observation: meta.observation || null,
            uploadedById: session.user.id,
          },
        });
        created.push(photo.id);
      } catch (dbError) {
        await storage.delete(key).catch(() => {});
        throw dbError;
      }
    }

    await logAudit({
      userId: session.user.id,
      action: "PHOTO_UPLOADED",
      entityType: "Crop",
      entityId: crop.id,
      metadata: { count: created.length, category: meta.category },
    });

    revalidatePath(`/admin/crops/${crop.id}`);
    return { ok: true, data: { ids: created } };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}

export async function deleteCropPhotoAction(photoId: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    requireAdmin(session);

    const photo = await prisma.cropPhoto.findUnique({
      where: { id: photoId },
      select: { id: true, cropId: true, farmerId: true, deletedAt: true },
    });
    if (!photo || photo.deletedAt) return { ok: false, error: "Photo not found." };
    assertRecordAccess(session, photo.farmerId ? { farmerId: photo.farmerId } : null);

    // Soft-delete only — the row (and its audit trail) is preserved; the
    // stored file is left in place rather than hard-deleted alongside it.
    await prisma.cropPhoto.update({ where: { id: photoId }, data: { deletedAt: new Date() } });

    await logAudit({
      userId: session.user.id,
      action: "PHOTO_DELETED",
      entityType: "CropPhoto",
      entityId: photoId,
      metadata: { cropId: photo.cropId },
    });

    if (photo.cropId) revalidatePath(`/admin/crops/${photo.cropId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}

/** Thin server-action wrapper so client gallery components can page through
 * a crop's photos — the RBAC-checked `listCropPhotos` DAL call underneath
 * is the same one the initial server-rendered gallery uses, so a farmer
 * paging through their own crop's photos gets exactly the same guard a
 * direct URL-substitution attempt would hit. */
export async function loadMorePhotosAction(
  cropId: string,
  skip: number
): Promise<ActionResult<Awaited<ReturnType<typeof listCropPhotos>>>> {
  try {
    const session = await requireSession();
    const result = await listCropPhotos(session, cropId, { skip });
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: toFriendlyMessage(error) };
  }
}
