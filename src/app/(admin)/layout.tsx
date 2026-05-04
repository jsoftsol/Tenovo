// src/app/(admin)/layout.tsx
import { redirect } from "next/navigation";
import { getCurrentMembership, getUserMemberships } from "@/lib/tenant";
import ClientLayout from "./clientLayout";
import { auth } from "@/auth";
import UserType from "@/types/user";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await getCurrentMembership();
  const memberships = await getUserMemberships();
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  if (!membership) {
    redirect("/signin");
  }

  const user: UserType = {
    id: session.user.id,
    name: session.user.name || null,
    email: session.user.email || "",
    image: session.user.image || null,
  };

  return (
    <ClientLayout user={user} membership={membership} memberships={memberships}>
      {children}
    </ClientLayout>
  );
}