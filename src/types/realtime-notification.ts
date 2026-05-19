type RealtimeNotification = {
  organizationId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  createdAt: string;
};

export default RealtimeNotification;