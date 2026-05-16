type DashboardStatsType = {
  projectsCount: number;
  membersCount: number;
  auditLogsCount: number;
  role: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

export default DashboardStatsType;