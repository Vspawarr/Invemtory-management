import "server-only";

import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/server/require-session";
import { assertOwnedByFarmer, assertRecordAccess } from "@/lib/server/auth-guards";

const PHOTO_SELECT = {
  id: true,
  category: true,
  phase: true,
  cropId: true,
  farmerId: true,
  landParcelId: true,
  timelineStageId: true,
  timelineStage: { select: { stageNameSnapshot: true } },
  healthRecordId: true,
  applicationId: true,
  treatmentResultId: true,
  mimeType: true,
  sizeBytes: true,
  width: true,
  height: true,
  originalFilename: true,
  caption: true,
  observation: true,
  uploadedById: true,
  createdAt: true,
} as const;

/** Every read path below re-verifies ownership through the same guards used
 * everywhere else (`assertOwnedByFarmer`/`assertRecordAccess`) — access
 * control lives here, never in the UI, and the authenticated photo-serving
 * route (app/api/photos/[id]/route.ts) calls `getPhotoById` for exactly
 * this reason before it will stream a single byte. */

export async function listCropPhotos(
  session: AppSession,
  cropId: string,
  opts: { skip?: number; take?: number } = {}
) {
  const crop = await prisma.crop.findUnique({ where: { id: cropId }, select: { farmerId: true } });
  if (!crop) return { photos: [], total: 0 };
  assertRecordAccess(session, crop);

  const where = { cropId, deletedAt: null };
  const [photos, total] = await Promise.all([
    prisma.cropPhoto.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: opts.skip ?? 0,
      take: opts.take ?? 24,
      select: PHOTO_SELECT,
    }),
    prisma.cropPhoto.count({ where }),
  ]);
  return { photos, total };
}

export async function getPhotoById(session: AppSession, photoId: string) {
  const photo = await prisma.cropPhoto.findUnique({
    where: { id: photoId },
    select: { ...PHOTO_SELECT, storageKey: true, deletedAt: true },
  });
  if (!photo || photo.deletedAt) return null;
  assertRecordAccess(session, photo.farmerId ? { farmerId: photo.farmerId } : null);
  return photo;
}

export async function listFarmerPhotos(
  session: AppSession,
  farmerId: string,
  opts: { skip?: number; take?: number } = {}
) {
  assertOwnedByFarmer(session, farmerId);
  const where = { farmerId, deletedAt: null };
  const [photos, total] = await Promise.all([
    prisma.cropPhoto.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: opts.skip ?? 0,
      take: opts.take ?? 24,
      select: { ...PHOTO_SELECT, crop: { select: { id: true, cropMaster: { select: { name: true } } } } },
    }),
    prisma.cropPhoto.count({ where }),
  ]);
  return { photos, total };
}
