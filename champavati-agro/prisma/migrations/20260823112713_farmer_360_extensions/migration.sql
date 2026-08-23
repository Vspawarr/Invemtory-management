-- CreateEnum
CREATE TYPE "LandOwnershipStatus" AS ENUM ('OWNED', 'LEASED', 'SHARECROPPED', 'OTHER');

-- AlterTable
ALTER TABLE "Farmer" ADD COLUMN     "email" TEXT,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "LandParcel" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "irrigationAvailable" BOOLEAN DEFAULT true,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "ownershipStatus" "LandOwnershipStatus" NOT NULL DEFAULT 'OWNED';

-- CreateIndex
CREATE INDEX "LandParcel_deletedAt_idx" ON "LandParcel"("deletedAt");
