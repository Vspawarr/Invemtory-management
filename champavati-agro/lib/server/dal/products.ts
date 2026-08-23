import "server-only";

import { prisma } from "@/lib/prisma";

export async function listProductCategories() {
  return prisma.productCategory.findMany({ orderBy: { name: "asc" } });
}

export async function listProducts(opts: { search?: string; categoryId?: string } = {}) {
  return prisma.product.findMany({
    where: {
      deletedAt: null,
      ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
      ...(opts.search
        ? {
            OR: [
              { name: { contains: opts.search, mode: "insensitive" as const } },
              { brand: { contains: opts.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: { category: true, targetCrop: true },
  });
}

export async function listActiveProducts() {
  return prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
    include: { category: true },
  });
}
