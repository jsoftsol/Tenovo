type QueueStats = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
};

export default QueueStats;