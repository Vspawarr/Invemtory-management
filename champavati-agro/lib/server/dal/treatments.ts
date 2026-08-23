import "server-only";

import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/server/require-session";
import { farmerScopeFilter } from "@/lib/server/auth-guards";

export async function listRecommendations(session: AppSession, opts: { pendingOnly?: boolean } = {}) {
  const scope = farmerScopeFilter(session);
  const farmerFilter = "farmerId" in scope ? { crop: { farmerId: scope.farmerId } } : {};

  return prisma.recommendation.findMany({
    where: { ...farmerFilter },
    orderBy: { createdAt: "desc" },
    include: {
      product: true,
      crop: { include: { farmer: true, cropMaster: true } },
      applications: { include: { treatmentResult: true } },
    },
  }).then((recs) =>
    opts.pendingOnly
      ? recs.filter((r) => {
          const app = r.applications[0];
          return !app?.treatmentResult && app?.status === "APPLIED";
        })
      : recs
  );
}

export async function listFeedback(session: AppSession) {
  const scope = farmerScopeFilter(session);
  return prisma.farmerFeedback.findMany({
    where: { ...scope },
    orderBy: { createdAt: "desc" },
    include: {
      farmer: { select: { id: true, fullName: true } },
      treatmentResult: {
        include: {
          application: {
            include: { recommendation: { include: { product: true, crop: { include: { cropMaster: true } } } } },
          },
        },
      },
    },
  });
}
