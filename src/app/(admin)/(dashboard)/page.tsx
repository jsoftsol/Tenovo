import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Dashboard | Tenovo",
  description: "Get an overview of your workspace, track activity, and monitor your projects in Tenovo.",
};

export default async function Dashboard() {
  const membership = await getCurrentMembership();

  if (!membership) {
    return null;
  }

  const organizationId = membership.organizationId;
  const [projectsCount, membersCount, auditLogsCount] = await Promise.all([
    prisma.project.count({ where: { organizationId } }),
    prisma.membership.count({ where: { organizationId } }),
    prisma.auditLog.count({ where: { organizationId } })
  ]);

  const cards = [
    {
      label: "Projects",
      value: projectsCount,
      description: "Tenant-scoped project records",
    },
    {
      label: "Team Members",
      value: membersCount,
      description: "Users in this organization",
    },
    {
      label: "Audit Logs",
      value: auditLogsCount,
      description: "Tracked tenant activity",
    },
    {
      label: "Your Role",
      value: membership.role,
      description: "Current organization permission level",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {membership.organization.name} Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Real-time overview for the active tenant.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {card.label}
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {card.value}
            </h2>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}