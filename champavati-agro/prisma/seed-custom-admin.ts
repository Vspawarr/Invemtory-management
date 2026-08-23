import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/** One-off bootstrap for a real (non-demo) admin account, driven entirely
 * by env vars — never a literal credential in source control. No-ops
 * cleanly if the vars aren't set, so it's safe to leave wired into a build
 * step temporarily without any risk on deployments that don't set them. */
async function main() {
  const email = process.env.CUSTOM_ADMIN_EMAIL;
  const password = process.env.CUSTOM_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("CUSTOM_ADMIN_EMAIL/CUSTOM_ADMIN_PASSWORD not set — skipping custom admin bootstrap.");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: "ADMIN", isActive: true },
      create: { email, passwordHash, role: "ADMIN" },
    });
    console.log(`Custom admin account ready: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
