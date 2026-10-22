import { db } from "../db";

export interface LogAuditOptions {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

export async function recordAuditLog(options: LogAuditOptions) {
  try {
    return await db.auditLog.create({
      data: {
        actorId: options.actorId || null,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId || null,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        ipAddress: options.ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
