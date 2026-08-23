import "server-only";

import type { CropStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/server/require-session";
import { assertRecordAccess, farmerScopeFilter } from "@/lib/server/auth-guards";

export async function listCropsForCurrentUser(
  session: AppSession,
  filters: { farmerId?: string; status?: CropStatus[]; search?: string } = {}
) {
  const scope = farmerScopeFilter(session);
  // An admin may additionally narrow to one farmer; a farmer session's scope
  // already pins farmerId and can't be widened by a caller-supplied filter.
  const farmerId =
    session.user.role === "ADMIN" ? filters.farmerId : (scope as { farmerId: string }).farmerId;

  return prisma.crop.findMany({
    where: {
      deletedAt: null,
      ...(farmerId ? { farmerId } : {}),
      ...(filters.status ? { status: { in: filters.status } } : {}),
      ...(filters.search
        ? {
            OR: [
              { variety: { contains: filters.search, mode: "insensitive" } },
              { farmer: { fullName: { contains: filters.search, mode: "insensitive" } } },
              { cropMaster: { name: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      farmer: { select: { id: true, fullName: true, village: true } },
      landParcel: { select: { id: true, name: true } },
      cropMaster: true,
      currentStage: true,
    },
  });
}

export async function getCropById(session: AppSession, cropId: string) {
  const crop = await prisma.crop.findUnique({
    where: { id: cropId },
    include: {
      farmer: true,
      landParcel: true,
      cropMaster: true,
      currentStage: true,
      timelineStages: { orderBy: { sequenceSnapshot: "asc" } },
      healthRecords: { orderBy: { createdAt: "desc" }, include: { photos: true } },
      recommendations: {
        orderBy: { createdAt: "desc" },
        include: {
          product: true,
          timelineStage: true,
          applications: {
            include: { treatmentResult: { include: { feedback: true, photos: true } }, photos: true },
          },
        },
      },
      followups: { orderBy: { dueDate: "asc" } },
      photos: true,
      weatherContexts: { orderBy: { recordedAt: "desc" }, take: 5 },
    },
  });
  if (!crop) return null;
  assertRecordAccess(session, crop);
  return crop;
}

export async function getCropTimeline(session: AppSession, cropId: string) {
  const crop = await prisma.crop.findUnique({
    where: { id: cropId },
    select: { farmerId: true },
  });
  if (!crop) return null;
  assertRecordAccess(session, crop);

  return prisma.cropTimelineStage.findMany({
    where: { cropId },
    orderBy: { sequenceSnapshot: "asc" },
  });
}
