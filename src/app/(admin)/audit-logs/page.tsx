import { Metadata } from "next";
import AuditLogs from "./AuditLogs";

export const metadata: Metadata = {
  title: "Audit Logs | Tenovo",
  description:
    "Track activity across your organization, monitor changes, and maintain accountability with detailed audit logs.",
};

export default function AuditLogsPage() {
  return <AuditLogs />;
}