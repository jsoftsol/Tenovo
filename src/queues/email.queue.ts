import { Queue } from "bullmq";

import { redisConnection } from "@/lib/redis";
import { QUEUE_NAMES } from "@/queues/queue-names";


import OrganizationInvitationJobData from "@/types/organization-invitation-job-data";

const emailQueue = new Queue<OrganizationInvitationJobData>(
  QUEUE_NAMES.EMAIL,
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  }
);

export default emailQueue;