"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import DashboardStatsType from "@/types/dashboard-stats";
import getErrorMessage from "@/lib/api-error";

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data } = await api.get("/dashboard/stats");
        setStats(data.stats);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load dashboard stats."));
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    {
      label: "Projects",
      value: stats.projectsCount,
      description: "Tenant-scoped project records",
    },
    {
      label: "Team Members",
      value: stats.membersCount,
      description: "Users in this organization",
    },
    {
      label: "Audit Logs",
      value: stats.auditLogsCount,
      description: "Tracked tenant activity",
    },
    {
      label: "Your Role",
      value: stats.role,
      description: "Current organization permission level",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {stats.organization.name} Dashboard
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