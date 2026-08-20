import { prisma } from "@/lib/prisma";

export interface CategoryBreakdown {
  name: string;
  count: number;
}

export interface SourceBreakdown {
  source: string;
  count: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface BrandBreakdown {
  brand: string;
  count: number;
}

export interface MonthlyEnquiries {
  month: string;
  count: number;
}

export interface SubmissionFunnel {
  stage: string;
  count: number;
}

export async function getInventoryByCategory(): Promise<CategoryBreakdown[]> {
  const rows = await prisma.vehicle.groupBy({
    by: ["categoryId"],
    _count: { _all: true },
  });
  if (rows.length === 0) return [];
  const categories = await prisma.category.findMany({
    where: { id: { in: rows.map((r) => r.categoryId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  return rows
    .map((r) => ({ name: nameById.get(r.categoryId) ?? "Unknown", count: r._count._all }))
    .sort((a, b) => b.count - a.count);
}

export async function getInventoryBySource(): Promise<SourceBreakdown[]> {
  const rows = await prisma.vehicle.groupBy({ by: ["source"], _count: { _all: true } });
  return rows.map((r) => ({ source: r.source, count: r._count._all }));
}

export async function getInventoryByStatus(): Promise<StatusBreakdown[]> {
  const rows = await prisma.vehicle.groupBy({ by: ["status"], _count: { _all: true } });
  return rows.map((r) => ({ status: r.status, count: r._count._all })).sort((a, b) => b.count - a.count);
}

export async function getTopBrands(limit = 8): Promise<BrandBreakdown[]> {
  const rows = await prisma.vehicle.groupBy({
    by: ["brand"],
    _count: { _all: true },
    orderBy: { _count: { brand: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({ brand: r.brand, count: r._count._all }));
}

export async function getMonthlyEnquiries(months = 6): Promise<MonthlyEnquiries[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const enquiries = await prisma.enquiry.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    buckets.set(key, 0);
  }
  for (const e of enquiries) {
    const key = e.createdAt.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([month, count]) => ({ month, count }));
}

export async function getSubmissionFunnel(): Promise<SubmissionFunnel[]> {
  const [submitted, reviewed, approved, listed, sold] = await Promise.all([
    prisma.vehicleSubmission.count(),
    prisma.vehicleSubmission.count({ where: { reviewedAt: { not: null } } }),
    prisma.vehicleSubmission.count({ where: { status: "APPROVED" } }),
    prisma.vehicle.count({ where: { source: "CUSTOMER_SUBMITTED", status: { in: ["LISTED", "RESERVED", "SOLD"] } } }),
    prisma.vehicle.count({ where: { source: "CUSTOMER_SUBMITTED", status: "SOLD" } }),
  ]);
  return [
    { stage: "Submitted", count: submitted },
    { stage: "Reviewed", count: reviewed },
    { stage: "Approved", count: approved },
    { stage: "Listed", count: listed },
    { stage: "Sold", count: sold },
  ];
}
