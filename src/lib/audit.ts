import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type CreateAuditLogInput = {
  organizationId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function createAuditLog({
  organizationId,
  userId,
  action,
  entity,
  entityId,
  metadata,
}: CreateAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      organizationId,
      userId,
      action,
      entity,
      entityId,
      metadata,
    },
  });
}