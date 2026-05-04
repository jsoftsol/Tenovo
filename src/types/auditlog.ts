type AuditLogType = {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: unknown;
  createdAt: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
};

export default AuditLogType;