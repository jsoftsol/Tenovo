import type { Metadata } from "next";

import DashboardClient from "./Dashboard";

export const metadata: Metadata = {
  title: "Dashboard | Tenovo",
  description: "Get an overview of your workspace, track activity, and monitor your projects in Tenovo.",
};

export default function Dashboard() {
  return (
    <DashboardClient />
  );
}
