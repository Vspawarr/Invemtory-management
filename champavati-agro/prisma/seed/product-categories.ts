import type { PrismaClient } from "@prisma/client";

export const PRODUCT_CATEGORIES = [
  "Seeds",
  "Fertilizers",
  "Pesticides",
  "Fungicides",
  "Herbicides",
  "Insecticides",
  "Micronutrients",
  "Bio-fertilizers",
  "Growth Promoters",
  "Other",
];

export async function seedProductCategories(prisma: PrismaClient) {
  for (const name of PRODUCT_CATEGORIES) {
    await prisma.productCategory.upsert({ where: { name }, update: {}, create: { name } });
  }
}
