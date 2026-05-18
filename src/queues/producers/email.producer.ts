import emailQueue from "@/queues/email.queue";
import OrganizationInvitationJobData from "@/types/organization-invitation-job-data";

export async function enqueueOrganizationInvitationEmail(
  data: OrganizationInvitationJobData
) {
  return emailQueue.add("organization.invitation", data);
}