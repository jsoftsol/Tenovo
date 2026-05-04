import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const ACTIVE_ORG_COOKIE = "tenovo_active_org_id";

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });
}

export async function getCurrentMembership() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;
  const cookieStore = await cookies();
  const organizationId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  if (organizationId) {
    const activeMembership = await prisma.membership.findFirst({
      where: {
        userId,
        organizationId,
      },
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (activeMembership) {
      return activeMembership;
    }
  }


  const membership = await prisma.membership.findFirst({
    where: {
      userId,
    },
    include: {
      organization: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });


  return membership;
}

export async function getUserMemberships() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  const userId = session.user.id;
  const memberships = await prisma.membership.findMany({
    where: {
      userId,
    },
    include: {
      organization: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return memberships;
}