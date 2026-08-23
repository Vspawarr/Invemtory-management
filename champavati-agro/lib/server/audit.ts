import "server-only";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "LOGIN"
  | "FARMER_CREATED"
  | "FARMER_MODIFIED"
  | "FARMER_ARCHIVED"
  | "LAND_PARCEL_CREATED"
  | "CROP_CREATED"
  | "CROP_MODIFIED"
  | "CROP_TIMELINE_ADJUSTED"
  | "CROP_STAGE_ADVANCED"
  | "CROP_ARCHIVED"
  | "HEALTH_RECORD_CREATED"
  | "RECOMMENDATION_CREATED"
  | "APPLICATION_UPDATED"
  | "TREATMENT_RESULT_CREATED"
  | "FEEDBACK_CREATED"
  | "FEEDBACK_MODIFIED"
  | "FOLLOWUP_CREATED"
  | "FOLLOWUP_UPDATED"
  | "PRODUCT_CREATED"
  | "PRODUCT_MODIFIED"
  | "PRODUCT_ARCHIVED"
  | "CROP_STAGE_MASTER_MODIFIED"
  | "DOCUMENT_VIEWED"
  | "DOCUMENT_ADDED"
  | "DATA_EXPORT"
  | "PHOTO_UPLOADED"
  | "PHOTO_DELETED";

/** Never pass passwords, raw Aadhaar, or other sensitive plaintext in `metadata`. */
export async function logAudit(params: {
  userId: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    },
  });
}
