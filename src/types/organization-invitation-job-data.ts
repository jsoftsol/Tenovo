type OrganizationInvitationJobData = {
  organizationId: string;
  organizationName: string;
  invitedByUserId: string;
  invitedEmail: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
};

export default OrganizationInvitationJobData;