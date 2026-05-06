import { NextResponse } from 'next/server';

import { prisma } from "@/lib/prisma";
import { canManageOrganization } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { getCurrentMembership } from '@/lib/tenant';

const allowedRoles = ['Admin', 'Member', 'Viewer'] as const;

export async function GET(request: Request) {
  const membership = await getCurrentMembership();

  if (!membership) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = membership.organizationId;
  const members = await prisma.membership.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        },
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return NextResponse.json({ members })
}

export async function POST(request: Request) {
  const membership = await getCurrentMembership();

  if (!membership) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canManageOrganization(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const email = String(body.email || '').trim().toLowerCase();
  const role = String(body.role || 'Viewer').trim().toUpperCase();
  const roleNo = role as (typeof allowedRoles)[number];

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  if (!allowedRoles.includes(roleNo)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: 'User must be registered before adding to this organization' }, { status: 404 });
  }

  const userId = user.id;
  const organizationId = membership.organizationId;
  const existingMembership = await prisma.membership.findFirst({
    where: {
      userId,
      organizationId,
    }
  });

  if (existingMembership) {
    return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 400 });
  }

  const newMembership = await prisma.membership.create({
    data: {
      userId,
      organizationId,
      role: role as 'ADMIN' | 'MEMBER' | 'VIEWER',
    },
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
    userId: membership.userId,
    organizationId,
    action: 'membership.created',
    entity: 'Membership',
    entityId: membership.id,
    metadata: {
      addedUserId: userId,
      addedUserEmail: email,
      role: membership.role,
    }
  });

  return NextResponse.json({ member: newMembership }, { status: 201 });
}