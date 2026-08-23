-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'FARMER');

-- CreateEnum
CREATE TYPE "AnchorType" AS ENUM ('SOWING', 'PLANTING', 'TRANSPLANTING');

-- CreateEnum
CREATE TYPE "PlantingType" AS ENUM ('SURU', 'PRE_SEASONAL', 'ADSALI', 'KHARIF', 'LATE_KHARIF', 'RABI');

-- CreateEnum
CREATE TYPE "CropStatus" AS ENUM ('PLANNED', 'SEEDED', 'GROWING', 'FLOWERING', 'DEVELOPMENT', 'HARVEST_READY', 'HARVESTED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TimelineStageStatus" AS ENUM ('UPCOMING', 'CURRENT', 'COMPLETED', 'DELAYED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('RECOMMENDED', 'PURCHASED', 'APPLIED', 'NOT_APPLIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TreatmentResultEnum" AS ENUM ('EXCELLENT', 'GOOD', 'MODERATE', 'NO_IMPROVEMENT', 'POOR', 'CROP_DAMAGED');

-- CreateEnum
CREATE TYPE "FollowupStatus" AS ENUM ('PENDING', 'COMPLETED', 'RESCHEDULED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FollowupPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('AADHAAR', 'PAN', 'OTHER');

-- CreateEnum
CREATE TYPE "PhotoContext" AS ENUM ('CROP', 'PEST', 'DISEASE', 'FIELD', 'TREATMENT', 'RESULT');

-- CreateEnum
CREATE TYPE "TxnStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RainfallStatus" AS ENUM ('NORMAL', 'DELAYED_MONSOON', 'DRY_SPELL', 'EXCESS_RAIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farmer" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "fatherOrHusbandName" TEXT,
    "phone" TEXT NOT NULL,
    "altPhone" TEXT,
    "gender" TEXT,
    "dob" TIMESTAMP(3),
    "address" TEXT,
    "village" TEXT NOT NULL,
    "taluka" TEXT NOT NULL DEFAULT 'Kannad',
    "district" TEXT NOT NULL DEFAULT 'Chhatrapati Sambhajinagar',
    "state" TEXT NOT NULL DEFAULT 'Maharashtra',
    "pincode" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farmer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmerDocument" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "valueMasked" TEXT NOT NULL,
    "valueEnc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandParcel" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surveyNo" TEXT,
    "areaAcres" DECIMAL(8,2) NOT NULL,
    "soilType" TEXT,
    "waterSource" TEXT,
    "village" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandParcel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropMaster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "localName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "anchorType" "AnchorType" NOT NULL,
    "anchorLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CropMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropPlantingWindow" (
    "id" TEXT NOT NULL,
    "cropMasterId" TEXT NOT NULL,
    "plantingType" "PlantingType" NOT NULL,
    "startMonth" INTEGER NOT NULL,
    "endMonth" INTEGER NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "CropPlantingWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropStageMaster" (
    "id" TEXT NOT NULL,
    "cropMasterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "localName" TEXT NOT NULL,
    "plantingType" "PlantingType",
    "sequence" INTEGER NOT NULL,
    "minStartOffsetDays" INTEGER NOT NULL,
    "defaultStartOffsetDays" INTEGER NOT NULL,
    "maxStartOffsetDays" INTEGER NOT NULL,
    "minEndOffsetDays" INTEGER NOT NULL,
    "defaultEndOffsetDays" INTEGER NOT NULL,
    "maxEndOffsetDays" INTEGER NOT NULL,
    "criticalStage" BOOLEAN NOT NULL,
    "waterSensitive" BOOLEAN NOT NULL,
    "weatherSensitive" BOOLEAN NOT NULL,
    "monitoringActions" TEXT,
    "commonPests" TEXT[],
    "commonDiseases" TEXT[],
    "sourceReference" TEXT,
    "confidenceLevel" "ConfidenceLevel" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CropStageMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crop" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "landParcelId" TEXT NOT NULL,
    "cropMasterId" TEXT NOT NULL,
    "variety" TEXT,
    "season" TEXT NOT NULL,
    "plantingType" "PlantingType",
    "areaAcres" DECIMAL(8,2) NOT NULL,
    "anchorDate" TIMESTAMP(3) NOT NULL,
    "anchorType" "AnchorType" NOT NULL,
    "irrigationAvailable" BOOLEAN NOT NULL DEFAULT true,
    "expectedHarvestDate" TIMESTAMP(3),
    "actualHarvestDate" TIMESTAMP(3),
    "status" "CropStatus" NOT NULL DEFAULT 'PLANNED',
    "currentStageId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropTimelineStage" (
    "id" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "stageMasterId" TEXT,
    "stageNameSnapshot" TEXT NOT NULL,
    "localNameSnapshot" TEXT NOT NULL,
    "sequenceSnapshot" INTEGER NOT NULL,
    "startOffsetDaysSnapshot" INTEGER NOT NULL,
    "endOffsetDaysSnapshot" INTEGER NOT NULL,
    "expectedStartDate" TIMESTAMP(3) NOT NULL,
    "expectedEndDate" TIMESTAMP(3) NOT NULL,
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "status" "TimelineStageStatus" NOT NULL DEFAULT 'UPCOMING',
    "criticalStageSnapshot" BOOLEAN NOT NULL,
    "waterSensitiveSnapshot" BOOLEAN NOT NULL,
    "weatherSensitiveSnapshot" BOOLEAN NOT NULL,
    "monitoringActionsSnapshot" TEXT,
    "commonPestsSnapshot" TEXT[],
    "commonDiseasesSnapshot" TEXT[],
    "notes" TEXT,
    "adjustmentReason" TEXT,
    "adjustedById" TEXT,
    "adjustedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CropTimelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropStageHistory" (
    "id" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "timelineStageId" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "CropStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropHealthRecord" (
    "id" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "timelineStageId" TEXT,
    "recordedById" TEXT NOT NULL,
    "overallHealth" INTEGER NOT NULL,
    "pestSeverity" INTEGER NOT NULL,
    "diseaseSeverity" INTEGER NOT NULL,
    "weedSeverity" INTEGER NOT NULL,
    "growthRating" INTEGER NOT NULL,
    "waterCondition" INTEGER NOT NULL,
    "nutrientDeficiency" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CropHealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "brand" TEXT,
    "manufacturer" TEXT,
    "activeIngredient" TEXT,
    "unit" TEXT NOT NULL,
    "packSize" TEXT NOT NULL,
    "mrp" DECIMAL(10,2) NOT NULL,
    "sellingPrice" DECIMAL(10,2) NOT NULL,
    "targetCropId" TEXT,
    "targetPest" TEXT,
    "description" TEXT,
    "usageNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "status" "TxnStatus" NOT NULL DEFAULT 'PAID',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionItem" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "TransactionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "timelineStageId" TEXT,
    "productId" TEXT NOT NULL,
    "recommendedById" TEXT NOT NULL,
    "targetPestOrDisease" TEXT,
    "dosage" TEXT,
    "applicationMethod" TEXT,
    "instructions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cropStageMasterId" TEXT,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'RECOMMENDED',
    "appliedDate" TIMESTAMP(3),
    "quantityUsed" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentResult" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "pestSeverityBefore" INTEGER,
    "pestSeverityAfter" INTEGER,
    "diseaseSeverityBefore" INTEGER,
    "diseaseSeverityAfter" INTEGER,
    "improvementPercent" INTEGER,
    "result" "TreatmentResultEnum" NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "TreatmentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmerFeedback" (
    "id" TEXT NOT NULL,
    "treatmentResultId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "satisfied" BOOLEAN NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmerFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Followup" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "cropId" TEXT,
    "feedbackId" TEXT,
    "reason" TEXT NOT NULL,
    "priority" "FollowupPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "FollowupStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Followup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherContext" (
    "id" TEXT NOT NULL,
    "cropId" TEXT,
    "village" TEXT,
    "rainfallStatus" "RainfallStatus" NOT NULL,
    "rainfallLast7Days" DOUBLE PRECISION,
    "rainfallLast14Days" DOUBLE PRECISION,
    "irrigationAvailable" BOOLEAN NOT NULL,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropPhoto" (
    "id" TEXT NOT NULL,
    "context" "PhotoContext" NOT NULL,
    "cropId" TEXT,
    "healthRecordId" TEXT,
    "applicationId" TEXT,
    "treatmentResultId" TEXT,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "caption" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CropPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_userId_key" ON "Farmer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_phone_key" ON "Farmer"("phone");

-- CreateIndex
CREATE INDEX "Farmer_village_idx" ON "Farmer"("village");

-- CreateIndex
CREATE INDEX "Farmer_phone_idx" ON "Farmer"("phone");

-- CreateIndex
CREATE INDEX "Farmer_deletedAt_idx" ON "Farmer"("deletedAt");

-- CreateIndex
CREATE INDEX "FarmerDocument_farmerId_idx" ON "FarmerDocument"("farmerId");

-- CreateIndex
CREATE INDEX "LandParcel_farmerId_idx" ON "LandParcel"("farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "CropMaster_name_key" ON "CropMaster"("name");

-- CreateIndex
CREATE INDEX "CropMaster_isActive_idx" ON "CropMaster"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CropPlantingWindow_cropMasterId_plantingType_key" ON "CropPlantingWindow"("cropMasterId", "plantingType");

-- CreateIndex
CREATE INDEX "CropStageMaster_cropMasterId_idx" ON "CropStageMaster"("cropMasterId");

-- CreateIndex
CREATE UNIQUE INDEX "CropStageMaster_cropMasterId_plantingType_sequence_key" ON "CropStageMaster"("cropMasterId", "plantingType", "sequence");

-- CreateIndex
CREATE INDEX "Crop_farmerId_idx" ON "Crop"("farmerId");

-- CreateIndex
CREATE INDEX "Crop_landParcelId_idx" ON "Crop"("landParcelId");

-- CreateIndex
CREATE INDEX "Crop_status_idx" ON "Crop"("status");

-- CreateIndex
CREATE INDEX "Crop_cropMasterId_idx" ON "Crop"("cropMasterId");

-- CreateIndex
CREATE INDEX "Crop_expectedHarvestDate_idx" ON "Crop"("expectedHarvestDate");

-- CreateIndex
CREATE INDEX "Crop_deletedAt_idx" ON "Crop"("deletedAt");

-- CreateIndex
CREATE INDEX "CropTimelineStage_cropId_idx" ON "CropTimelineStage"("cropId");

-- CreateIndex
CREATE INDEX "CropTimelineStage_status_idx" ON "CropTimelineStage"("status");

-- CreateIndex
CREATE INDEX "CropStageHistory_cropId_idx" ON "CropStageHistory"("cropId");

-- CreateIndex
CREATE INDEX "CropHealthRecord_cropId_idx" ON "CropHealthRecord"("cropId");

-- CreateIndex
CREATE INDEX "CropHealthRecord_timelineStageId_idx" ON "CropHealthRecord"("timelineStageId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "Product_targetCropId_idx" ON "Product"("targetCropId");

-- CreateIndex
CREATE INDEX "Transaction_farmerId_idx" ON "Transaction"("farmerId");

-- CreateIndex
CREATE INDEX "TransactionItem_transactionId_idx" ON "TransactionItem"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionItem_productId_idx" ON "TransactionItem"("productId");

-- CreateIndex
CREATE INDEX "Recommendation_cropId_idx" ON "Recommendation"("cropId");

-- CreateIndex
CREATE INDEX "Recommendation_productId_idx" ON "Recommendation"("productId");

-- CreateIndex
CREATE INDEX "Recommendation_timelineStageId_idx" ON "Recommendation"("timelineStageId");

-- CreateIndex
CREATE INDEX "Application_recommendationId_idx" ON "Application"("recommendationId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentResult_applicationId_key" ON "TreatmentResult"("applicationId");

-- CreateIndex
CREATE INDEX "TreatmentResult_applicationId_idx" ON "TreatmentResult"("applicationId");

-- CreateIndex
CREATE INDEX "TreatmentResult_result_idx" ON "TreatmentResult"("result");

-- CreateIndex
CREATE UNIQUE INDEX "FarmerFeedback_treatmentResultId_key" ON "FarmerFeedback"("treatmentResultId");

-- CreateIndex
CREATE INDEX "FarmerFeedback_farmerId_idx" ON "FarmerFeedback"("farmerId");

-- CreateIndex
CREATE INDEX "FarmerFeedback_treatmentResultId_idx" ON "FarmerFeedback"("treatmentResultId");

-- CreateIndex
CREATE INDEX "Followup_farmerId_idx" ON "Followup"("farmerId");

-- CreateIndex
CREATE INDEX "Followup_status_dueDate_idx" ON "Followup"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Followup_cropId_idx" ON "Followup"("cropId");

-- CreateIndex
CREATE INDEX "WeatherContext_cropId_idx" ON "WeatherContext"("cropId");

-- CreateIndex
CREATE INDEX "WeatherContext_village_idx" ON "WeatherContext"("village");

-- CreateIndex
CREATE INDEX "CropPhoto_cropId_idx" ON "CropPhoto"("cropId");

-- CreateIndex
CREATE INDEX "CropPhoto_healthRecordId_idx" ON "CropPhoto"("healthRecordId");

-- CreateIndex
CREATE INDEX "CropPhoto_applicationId_idx" ON "CropPhoto"("applicationId");

-- CreateIndex
CREATE INDEX "CropPhoto_treatmentResultId_idx" ON "CropPhoto"("treatmentResultId");

-- CreateIndex
CREATE INDEX "Notification_farmerId_idx" ON "Notification"("farmerId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerDocument" ADD CONSTRAINT "FarmerDocument_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandParcel" ADD CONSTRAINT "LandParcel_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropPlantingWindow" ADD CONSTRAINT "CropPlantingWindow_cropMasterId_fkey" FOREIGN KEY ("cropMasterId") REFERENCES "CropMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropStageMaster" ADD CONSTRAINT "CropStageMaster_cropMasterId_fkey" FOREIGN KEY ("cropMasterId") REFERENCES "CropMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crop" ADD CONSTRAINT "Crop_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crop" ADD CONSTRAINT "Crop_landParcelId_fkey" FOREIGN KEY ("landParcelId") REFERENCES "LandParcel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crop" ADD CONSTRAINT "Crop_cropMasterId_fkey" FOREIGN KEY ("cropMasterId") REFERENCES "CropMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crop" ADD CONSTRAINT "Crop_currentStageId_fkey" FOREIGN KEY ("currentStageId") REFERENCES "CropTimelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropTimelineStage" ADD CONSTRAINT "CropTimelineStage_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropTimelineStage" ADD CONSTRAINT "CropTimelineStage_stageMasterId_fkey" FOREIGN KEY ("stageMasterId") REFERENCES "CropStageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropTimelineStage" ADD CONSTRAINT "CropTimelineStage_adjustedById_fkey" FOREIGN KEY ("adjustedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropStageHistory" ADD CONSTRAINT "CropStageHistory_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropStageHistory" ADD CONSTRAINT "CropStageHistory_timelineStageId_fkey" FOREIGN KEY ("timelineStageId") REFERENCES "CropTimelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropHealthRecord" ADD CONSTRAINT "CropHealthRecord_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropHealthRecord" ADD CONSTRAINT "CropHealthRecord_timelineStageId_fkey" FOREIGN KEY ("timelineStageId") REFERENCES "CropTimelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropHealthRecord" ADD CONSTRAINT "CropHealthRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_targetCropId_fkey" FOREIGN KEY ("targetCropId") REFERENCES "CropMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_timelineStageId_fkey" FOREIGN KEY ("timelineStageId") REFERENCES "CropTimelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_recommendedById_fkey" FOREIGN KEY ("recommendedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_cropStageMasterId_fkey" FOREIGN KEY ("cropStageMasterId") REFERENCES "CropStageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentResult" ADD CONSTRAINT "TreatmentResult_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerFeedback" ADD CONSTRAINT "FarmerFeedback_treatmentResultId_fkey" FOREIGN KEY ("treatmentResultId") REFERENCES "TreatmentResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerFeedback" ADD CONSTRAINT "FarmerFeedback_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "FarmerFeedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherContext" ADD CONSTRAINT "WeatherContext_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherContext" ADD CONSTRAINT "WeatherContext_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropPhoto" ADD CONSTRAINT "CropPhoto_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropPhoto" ADD CONSTRAINT "CropPhoto_healthRecordId_fkey" FOREIGN KEY ("healthRecordId") REFERENCES "CropHealthRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropPhoto" ADD CONSTRAINT "CropPhoto_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropPhoto" ADD CONSTRAINT "CropPhoto_treatmentResultId_fkey" FOREIGN KEY ("treatmentResultId") REFERENCES "TreatmentResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropPhoto" ADD CONSTRAINT "CropPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
