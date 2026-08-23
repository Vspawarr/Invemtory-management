/*
  Warnings:

  - You are about to drop the column `context` on the `CropPhoto` table. All the data in the column will be lost.
  - Added the required column `category` to the `CropPhoto` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PhotoCategory" AS ENUM ('FIELD_VISIT', 'CROP_HEALTH', 'PEST', 'DISEASE', 'WEED', 'NUTRIENT_DEFICIENCY', 'WATER_CONDITION', 'GROWTH', 'TREATMENT_RESULT', 'HARVEST');

-- CreateEnum
CREATE TYPE "PhotoPhase" AS ENUM ('BEFORE', 'AFTER');

-- AlterTable
ALTER TABLE "CropPhoto" DROP COLUMN "context",
ADD COLUMN     "category" "PhotoCategory" NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "farmerId" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "landParcelId" TEXT,
ADD COLUMN     "observation" TEXT,
ADD COLUMN     "originalFilename" TEXT,
ADD COLUMN     "phase" "PhotoPhase",
ADD COLUMN     "timelineStageId" TEXT,
ADD COLUMN     "width" INTEGER;

-- DropEnum
DROP TYPE "PhotoContext";

-- CreateIndex
CREATE INDEX "CropPhoto_farmerId_idx" ON "CropPhoto"("farmerId");

-- CreateIndex
CREATE INDEX "CropPhoto_landParcelId_idx" ON "CropPhoto"("landParcelId");

-- CreateIndex
CREATE INDEX "CropPhoto_timelineStageId_idx" ON "CropPhoto"("timelineStageId");

-- CreateIndex
CREATE INDEX "CropPhoto_deletedAt_idx" ON "CropPhoto"("deletedAt");

-- AddForeignKey
ALTER TABLE "CropPhoto" ADD CONSTRAINT "CropPhoto_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropPhoto" ADD CONSTRAINT "CropPhoto_landParcelId_fkey" FOREIGN KEY ("landParcelId") REFERENCES "LandParcel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropPhoto" ADD CONSTRAINT "CropPhoto_timelineStageId_fkey" FOREIGN KEY ("timelineStageId") REFERENCES "CropTimelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
