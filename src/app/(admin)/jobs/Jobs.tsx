import { queues } from "@/queues";
import { getCurrentMembership } from "@/lib/tenant";

export default async function Jobs() {
  const membership = await getCurrentMembership();

  if (!membership) {
    return null;
  }

  const emailQueue = queues.email;

  const [waiting, active, completed, failed, delayed, jobsList] = await Promise.all([
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

  const queueStats = {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };

  const jobs = jobsList.map((job) => ({
    id: job.id,
    name: job.name,
    data: job.data,
    attemptsMade: job.attemptsMade,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
    timestamp: job.timestamp,
    failedReason: job.failedReason,
  }));

  if (!queueStats) {
    return null;
  }

  const statCards = [
    {
      label: "Waiting",
      value: queueStats.waiting,
    },
    {
      label: "Active",
      value: queueStats.active,
    },
    {
      label: "Completed",
      value: queueStats.completed,
    },
    {
      label: "Failed",
      value: queueStats.failed,
    },
    {
      label: "Delayed",
      value: queueStats.delayed,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Queue Monitoring
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          BullMQ job visibility and distributed worker monitoring.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {card.label}
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {card.value}
            </h2>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Jobs
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Job
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Attempts
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Created
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm text-gray-500"
                  >
                    No jobs found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const status =
                    job.failedReason
                      ? "FAILED"
                      : job.finishedOn
                        ? "COMPLETED"
                        : job.processedOn
                          ? "ACTIVE"
                          : "WAITING";

                  return (
                    <tr
                      key={job.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {job.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {JSON.stringify(job.data)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {job.attemptsMade}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(job.timestamp).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-white/[0.05] dark:text-gray-300">
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}