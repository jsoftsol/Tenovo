import { NextResponse } from "next/server";

import { queues } from "@/queues";
import { getCurrentMembership } from "@/lib/tenant";

export async function GET() {
  const membership = await getCurrentMembership();

  if (!membership) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const emailQueue = queues.email;

  const [waiting, active, completed, failed, delayed, jobs] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),

    emailQueue.getJobs([
      "waiting",
      "active",
      "completed",
      "failed",
      "delayed",
    ], 0, 20, true),
  ]);

  return NextResponse.json({
    queues: {
      email: {
        waiting,
        active,
        completed,
        failed,
        delayed,
      },
    },

    jobs: jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      attemptsMade: job.attemptsMade,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      timestamp: job.timestamp,
      failedReason: job.failedReason,
    })),
  });
}