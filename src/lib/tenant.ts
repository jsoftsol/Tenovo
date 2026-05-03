import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      organization: true,
      // user: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return membership;
}