import { NextResponse } from "next/server";
import { getCurrentMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { canManageProjects, canViewProjects } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { publishNotification } from "@/lib/realtime";

export async function GET() {
  const membership = await getCurrentMembership();

  if (!membership) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!canViewProjects(membership.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const projects = await prisma.project.findMany({
    where: {
      organizationId: membership.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const membership = await getCurrentMembership();

  if (!membership) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!canManageProjects(membership.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();

  if (!name) {
    return NextResponse.json(
      { message: "Project name is required." },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      organizationId: membership.organizationId,
    },
  });

  await createAuditLog({
    organizationId: membership.organizationId,
    userId: membership.userId,
    action: "project.created",
    entity: "Project",
    entityId: project.id,
    metadata: {
      name: project.name,
      description: project.description,
    },
  });

  await publishNotification({
    organizationId: membership.organizationId,
    title: "Project created",
    message: `${project.name} was created.`,
    type: "success",
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ project }, { status: 201 });
}