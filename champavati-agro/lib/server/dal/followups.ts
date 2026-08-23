import "server-only";

import { startOfDay, endOfDay, addDays } from "date-fns";

import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/server/require-session";
import { farmerScopeFilter, requireAdmin } from "@/lib/server/auth-guards";

export async function listFollowups(session: AppSession, bucket: "today" | "upcoming" | "overdue" | "all") {
  const scope = farmerScopeFilter(session);
  const now = new Date();

  const dateFilter =
    bucket === "today"
      ? { dueDate: { gte: startOfDay(now), lte: endOfDay(now) } }
      : bucket === "upcoming"
        ? { dueDate: { gt: endOfDay(now), lte: endOfDay(addDays(now, 30)) } }
        : bucket === "overdue"
          ? { dueDate: { lt: startOfDay(now) } }
          : {};

  return prisma.followup.findMany({
    where: {
      ...scope,
      status: bucket === "all" ? undefined : "PENDING",
      ...dateFilter,
    },
    orderBy: { dueDate: "asc" },
    include: {
      farmer: { select: { id: true, fullName: true, village: true, phone: true } },
      crop: { select: { id: true, cropMaster: { select: { name: true } } } },
    },
  });
}

export async function countPendingFollowups(session: AppSession) {
  const scope = farmerScopeFilter(session);
  return prisma.followup.count({ where: { ...scope, status: "PENDING" } });
}

export async function createFollowupDirect(
  session: AppSession,
  input: {
    farmerId: string;
    cropId?: string;
    reason: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate: Date;
  }
) {
  requireAdmin(session);
  return prisma.followup.create({ data: input });
}
