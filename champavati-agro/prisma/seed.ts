import { PrismaClient } from "@prisma/client";

import { seedCropMaster } from "./seed/crop-master";
import { seedProductCategories } from "./seed/product-categories";
import { seedProducts } from "./seed/products";
import { seedAdminUser } from "./seed/users";
import { seedFarmersAndCrops } from "./seed/farmers-and-crops";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding crop master data (crops, stages, planting windows)…");
  await seedCropMaster(prisma);

  console.log("Seeding product categories…");
  await seedProductCategories(prisma);

  console.log("Seeding products…");
  await seedProducts(prisma);

  console.log("Seeding admin user…");
  const admin = await seedAdminUser(prisma);

  console.log("Seeding demo farmers, land, crops, treatments, follow-ups…");
  await seedFarmersAndCrops(prisma, admin.id);

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
