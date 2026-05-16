import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/tenant";

export async function GET() {
  const membership = await getCurrentMembership();

  if (!membership) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = membership.organizationId;
  const [projectsCount, membersCount, auditLogsCount] = await Promise.all([
    prisma.project.count({ where: { organizationId } }),
    prisma.membership.count({ where: { organizationId } }),
    prisma.auditLog.count({ where: { organizationId } })
  ]);

  return NextResponse.json({
    stats: {
      projectsCount,
      membersCount,
      auditLogsCount,
      role: membership.role,
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
      }
    }
  })
}