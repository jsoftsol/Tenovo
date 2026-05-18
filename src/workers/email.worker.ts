import "dotenv/config";
import { Worker } from "bullmq";

import { redisConnection } from "@/lib/redis";
import { QUEUE_NAMES } from "@/queues/queue-names";

const worker = new Worker(
  QUEUE_NAMES.EMAIL,
  async (job) => {
    if (job.name === "organization.invitation") {
      const {
        organizationName,
        invitedEmail,
        role,
      } = job.data;

      console.log("Sending organization invitation email", {
        to: invitedEmail,
        organizationName,
        role,
      });

      // Later: will replace this with real email provider.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(`Invitation email sent to ${invitedEmail}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`Email job completed: ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`Email job failed: ${job?.id}`, error);
});

console.log("Email worker started");