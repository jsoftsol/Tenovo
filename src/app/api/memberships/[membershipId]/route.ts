import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/tenant";
import { canManageOrganization } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

const allowedRoles = ['ADMIN', 'MEMBER', 'VIEWER'] as const;

type Params = {
  params: Promise<{ membershipId: string }>
}

export async function PATCH(request: Request, { params }: Params) {
  const currentMembership = await getCurrentMembership();

  if (!currentMembership) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canManageOrganization(currentMembership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { membershipId } = await params;
  const body = await request.json();
  const role = String(body.role || '').trim().toUpperCase();

  if (!allowedRoles.includes(role as (typeof allowedRoles)[number])) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const targetMembership = await prisma.membership.findFirst({ where: { id: membershipId, organizationId: currentMembership.organizationId } });

  if (!targetMembership) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
  }

  if (targetMembership.role === 'OWNER') {
    return NextResponse.json({ error: 'Cannot change role of the owner' }, { status: 400 });
  }

  const updatedMembership = await prisma.membership.update({
    where: { id: membershipId },
    data: { role: role as "ADMIN" | "MEMBER" | "VIEWER" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    }
  });

  await createAuditLog({
    organizationId: currentMembership.organizationId,
    userId: currentMembership.userId,
    action: 'membership role updated',
    entity: "membership",
    entityId: updatedMembership.id,
    metadata: {
      previousRole: targetMembership.role,
      newRole: updatedMembership.role,
      targetUserId: updatedMembership.userId
    }
  });

  return NextResponse.json({ member: updatedMembership });
}

export async function DELETE(_request: Request, { params }: Params) {
  const currentMembership = await getCurrentMembership();

  if (!currentMembership) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!canManageOrganization(currentMembership.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { membershipId } = await params;

  const targetMembership = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      organizationId: currentMembership.organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!targetMembership) {
    return NextResponse.json({ message: "Membership not found." }, { status: 404 });
  }

  if (targetMembership.role === "OWNER") {
    return NextResponse.json({ message: "Owner cannot be removed." }, { status: 400 });
  }

  if (targetMembership.userId === currentMembership.userId) {
    return NextResponse.json({ message: "You cannot remove yourself." }, { status: 400 });
  }

  await prisma.membership.delete({
    where: {
      id: membershipId,
    },
  });

  await createAuditLog({
    organizationId: currentMembership.organizationId,
    userId: currentMembership.userId,
    action: "membership.removed",
    entity: "Membership",
    entityId: membershipId,
    metadata: {
      removedUserId: targetMembership.userId,
      removedUserEmail: targetMembership.user.email,
      previousRole: targetMembership.role,
    },
  });

  return NextResponse.json({ success: true });
}