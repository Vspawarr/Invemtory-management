import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logAudit(entry: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata,
      },
    });
  } catch (error) {
    // Auditing must never break the primary operation
    console.error("[audit] failed to write audit log", error);
  }
}
