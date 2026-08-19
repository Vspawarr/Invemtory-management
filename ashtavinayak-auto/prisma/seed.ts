/**
 * Seed data. Everything created here is clearly demo/development data:
 * - the bootstrap admin comes from ADMIN_EMAIL / ADMIN_PASSWORD env vars
 * - vehicles/submissions carry isDemo: true and demo-labelled descriptions
 * This file is safe to re-run (idempotent upserts).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("[seed] ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin bootstrap.");
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    create: {
      name: "Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
    },
    update: { passwordHash, role: "SUPER_ADMIN", isActive: true },
  });
  console.log(`[seed] Admin user ready: ${email}`);
}

const CATEGORIES = [
  { name: "Cars", slug: "cars", vehicleType: "CAR" as const, sortOrder: 1 },
  { name: "Bikes", slug: "bikes", vehicleType: "BIKE" as const, sortOrder: 2 },
  { name: "Scooters", slug: "scooters", vehicleType: "SCOOTER" as const, sortOrder: 3 },
  { name: "Buses", slug: "buses", vehicleType: "BUS" as const, sortOrder: 4 },
  { name: "Commercial Vehicles", slug: "commercial-vehicles", vehicleType: "COMMERCIAL" as const, sortOrder: 5 },
  { name: "Other Vehicles", slug: "other-vehicles", vehicleType: "OTHER" as const, sortOrder: 6 },
];

async function seedCategories() {
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: { name: cat.name, vehicleType: cat.vehicleType, sortOrder: cat.sortOrder },
    });
  }
  console.log(`[seed] ${CATEGORIES.length} categories ready.`);
}

const FEATURES = [
  "Air Conditioning",
  "Power Steering",
  "Power Windows",
  "ABS",
  "Airbags",
  "Reverse Camera",
  "Parking Sensors",
  "Alloy Wheels",
  "Bluetooth",
  "Sunroof",
  "Cruise Control",
];

async function seedFeatures() {
  for (const [i, name] of FEATURES.entries()) {
    await prisma.feature.upsert({
      where: { name },
      create: { name, sortOrder: i },
      update: { sortOrder: i },
    });
  }
  console.log(`[seed] ${FEATURES.length} features ready.`);
}

async function main() {
  await seedAdmin();
  await seedCategories();
  await seedFeatures();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
