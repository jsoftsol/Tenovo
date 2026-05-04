import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ACTIVE_ORG_COOKIE = "tenovo_active_org_id";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const organizationId = String(body.organizationId || "");

  if (!organizationId) {
    return NextResponse.json({ message: "Organization ID is required" }, { status: 400 });
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      organizationId,
    },
  })

  if (!membership) {
    return NextResponse.json({ message: "Membership not found for the specified organization" }, { status: 404 });
  }

  const cookieStore = await cookies();

  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ success: true, message: "Organization switched successfully" });

}