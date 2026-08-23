import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const DEMO_ADMIN_EMAIL = "admin@champavatiagro.in";
export const DEMO_ADMIN_PASSWORD = "Champavati@123";

export async function seedAdminUser(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email: DEMO_ADMIN_EMAIL },
    update: {},
    create: { email: DEMO_ADMIN_EMAIL, passwordHash, role: "ADMIN" },
  });
}

/** Creates a farmer portal login (phone + password) and links it to the Farmer row. */
export async function grantFarmerPortalAccess(
  prisma: PrismaClient,
  farmerId: string,
  phone: string,
  password: string
) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: `farmer-${phone}@champavatiagro.portal`,
      phone,
      passwordHash,
      role: "FARMER",
    },
  });
  await prisma.farmer.update({ where: { id: farmerId }, data: { userId: user.id } });
  return user;
}

export const DEMO_FARMER_PASSWORD = "Farmer@123";
