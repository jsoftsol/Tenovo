type Job = {
  id: string;
  name: string;
  data: unknown;
  attemptsMade: number;
  finishedOn?: number;
  processedOn?: number;
  timestamp: number;
  failedReason?: string;
};

export default Job;