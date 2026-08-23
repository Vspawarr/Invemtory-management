import "server-only";

import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/server/require-session";
import { assertOwnedByFarmer, requireAdmin } from "@/lib/server/auth-guards";
import { ForbiddenError } from "@/lib/server/errors";

export async function listFarmers(
  session: AppSession,
  opts: { search?: string; village?: string; skip?: number; take?: number } = {}
) {
  requireAdmin(session);
  const { search, village, skip = 0, take = 25 } = opts;

  const where = {
    deletedAt: null,
    ...(village ? { village } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
            { village: { contains: search, mode: "insensitive" as const } },
            { id: { contains: search } },
          ],
        }
      : {}),
  };

  const [farmers, total] = await Promise.all([
    prisma.farmer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        landParcels: { select: { id: true, areaAcres: true } },
        crops: { where: { deletedAt: null }, select: { id: true, status: true } },
      },
    }),
    prisma.farmer.count({ where }),
  ]);

  return { farmers, total };
}

/** Lightweight list (id, name, village, land parcels) used to populate the crop
 * creation wizard's farmer/land selectors — admin only. */
export async function listFarmersForCropWizard(session: AppSession) {
  requireAdmin(session);
  return prisma.farmer.findMany({
    where: { deletedAt: null },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      village: true,
      landParcels: { select: { id: true, name: true, areaAcres: true, village: true } },
    },
  });
}

export async function getFarmerById(session: AppSession, farmerId: string) {
  const farmer = await prisma.farmer.findUnique({
    where: { id: farmerId },
    include: {
      landParcels: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      documents: { select: { id: true, type: true, valueMasked: true, createdAt: true } },
      crops: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          cropMaster: true,
          landParcel: true,
          currentStage: { select: { id: true, stageNameSnapshot: true, sequenceSnapshot: true } },
          timelineStages: {
            orderBy: { sequenceSnapshot: "asc" },
            select: {
              sequenceSnapshot: true,
              stageNameSnapshot: true,
              expectedStartDate: true,
              expectedEndDate: true,
              actualStartDate: true,
              actualEndDate: true,
            },
          },
          healthRecords: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!farmer) return null;
  assertOwnedByFarmer(session, farmer.id);
  return farmer;
}

/**
 * A farmer's full relationship history in one call: treatments
 * (recommendation -> applications -> result -> feedback chain),
 * follow-ups, feedback, and purchases (transactions). Used by Farmer 360
 * and reused as-is by the farmer's own portal view — one aggregation, two
 * consumers, never a second copy of this query.
 */
export async function getFarmerHistory(session: AppSession, farmerId: string) {
  assertOwnedByFarmer(session, farmerId);

  const [recommendations, followups, feedback, transactions] = await Promise.all([
    prisma.recommendation.findMany({
      where: { crop: { farmerId } },
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
        crop: { select: { id: true, cropMaster: { select: { name: true } } } },
        timelineStage: { select: { stageNameSnapshot: true } },
        applications: { include: { treatmentResult: { include: { feedback: true } } } },
      },
    }),
    prisma.followup.findMany({
      where: { farmerId },
      orderBy: { dueDate: "desc" },
      include: {
        farmer: { select: { id: true, fullName: true, village: true, phone: true } },
        crop: { select: { id: true, cropMaster: { select: { name: true } } } },
      },
    }),
    prisma.farmerFeedback.findMany({
      where: { farmerId },
      orderBy: { createdAt: "desc" },
      include: {
        treatmentResult: {
          include: {
            application: {
              include: {
                recommendation: {
                  include: { product: true, crop: { select: { cropMaster: { select: { name: true } } } } },
                },
              },
            },
          },
        },
      },
    }),
    prisma.transaction.findMany({
      where: { farmerId },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: { select: { id: true, name: true } } } } },
    }),
  ]);

  return { recommendations, followups, feedback, transactions };
}

export async function getOwnFarmerProfile(session: AppSession) {
  if (session.user.role !== "FARMER" || !session.user.farmerId) {
    throw new ForbiddenError();
  }
  return getFarmerById(session, session.user.farmerId);
}

export type CreateFarmerInput = {
  fullName: string;
  fatherOrHusbandName?: string;
  phone: string;
  altPhone?: string;
  email?: string;
  gender?: string;
  dob?: Date;
  address?: string;
  village: string;
  taluka?: string;
  district?: string;
  state?: string;
  pincode?: string;
  notes?: string;
};

export async function createFarmer(session: AppSession, input: CreateFarmerInput) {
  requireAdmin(session);
  return prisma.farmer.create({ data: input });
}

export async function updateFarmer(
  session: AppSession,
  farmerId: string,
  input: Partial<CreateFarmerInput>
) {
  requireAdmin(session);
  return prisma.farmer.update({ where: { id: farmerId }, data: input });
}

const SUCCESSFUL_RESULTS = ["EXCELLENT", "GOOD"] as const;
const INACTIVE_CROP_STATUSES = ["COMPLETED", "HARVESTED", "FAILED", "CANCELLED"] as const;
const HARVESTED_CROP_STATUSES = ["HARVESTED", "COMPLETED"] as const;

export async function getFarmerStats(session: AppSession, farmerId: string) {
  assertOwnedByFarmer(session, farmerId);

  const [farmer, landParcels, crops, treatmentResults, feedback, pendingFollowups] = await Promise.all([
    prisma.farmer.findUnique({ where: { id: farmerId }, select: { createdAt: true } }),
    prisma.landParcel.findMany({ where: { farmerId, deletedAt: null }, select: { areaAcres: true } }),
    prisma.crop.findMany({ where: { farmerId, deletedAt: null }, select: { status: true } }),
    prisma.treatmentResult.findMany({
      where: { application: { recommendation: { crop: { farmerId } } } },
      select: { result: true },
    }),
    prisma.farmerFeedback.findMany({ where: { farmerId }, select: { rating: true } }),
    prisma.followup.count({ where: { farmerId, status: "PENDING" } }),
  ]);

  const totalLandAcres = landParcels.reduce((sum, p) => sum + Number(p.areaAcres), 0);
  const activeCrops = crops.filter((c) => !INACTIVE_CROP_STATUSES.includes(c.status as never)).length;
  const cropsHarvested = crops.filter((c) => HARVESTED_CROP_STATUSES.includes(c.status as never)).length;
  const treatmentSuccessRate =
    treatmentResults.length === 0
      ? null
      : Math.round(
          (treatmentResults.filter((r) => SUCCESSFUL_RESULTS.includes(r.result as never)).length /
            treatmentResults.length) *
            100
        );
  const avgSatisfaction =
    feedback.length === 0
      ? null
      : Math.round((feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length) * 10) / 10;

  return {
    totalLandAcres,
    totalCrops: crops.length,
    activeCrops,
    cropsHarvested,
    totalTreatments: treatmentResults.length,
    treatmentSuccessRate,
    avgSatisfaction,
    pendingFollowups,
    /** Null only if the farmer row itself somehow vanished mid-query — never a guess. */
    registeredAt: farmer?.createdAt ?? null,
  };
}

export async function archiveFarmer(session: AppSession, farmerId: string) {
  requireAdmin(session);
  return prisma.farmer.update({ where: { id: farmerId }, data: { deletedAt: new Date() } });
}
