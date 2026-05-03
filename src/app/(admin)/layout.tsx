// src/app/(admin)/layout.tsx
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/tenant";
import AdminClientLayout from "./AdminClientLayout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/signin");
  }

  return (
    <AdminClientLayout membership={membership}>
      {children}
    </AdminClientLayout>
  );
}