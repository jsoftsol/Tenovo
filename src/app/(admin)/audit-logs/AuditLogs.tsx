"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import AuditLogType from "@/types/auditlog";
import getErrorMessage from "@/lib/api-error";



export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLogType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        const { data } = await api.get("/audit-logs");
        setAuditLogs(data.auditLogs);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    loadAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Audit Logs
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tenant-scoped activity history for this organization.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Activity
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Action
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Entity
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  User
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Time
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">
                    Loading audit logs...
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">
                    No audit logs yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {log.action}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {log.entity}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {log.user?.name || log.user?.email || "System"}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}