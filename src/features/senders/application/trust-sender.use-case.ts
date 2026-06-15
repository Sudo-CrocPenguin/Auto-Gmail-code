import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { SenderProfile } from "../domain/sender-profile.entity";
import type { SenderProfileRepository } from "../domain/sender-profile.repository";

export class TrustSenderUseCase {
  public constructor(
    private readonly senders: SenderProfileRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(context: AuthenticatedContext, senderId: string): Promise<SenderProfile> {
    const sender = await this.senders.findById(senderId);
    if (!sender || sender.workspaceId !== context.workspaceId) {
      throw new NotFoundError("El remitente no existe.", "SENDER_NOT_FOUND");
    }

    const updatedSender = await this.senders.update(sender.id, {
      status: "TRUSTED",
      trustScore: Math.max(sender.trustScore, 90),
      riskScore: Math.min(sender.riskScore, 15),
    });

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "SENDER_MARKED_TRUSTED",
      entityType: "SenderProfile",
      entityId: sender.id,
      description: `Remitente ${sender.email} marcado como confiable.`,
      ip: null,
      metadata: { previousStatus: sender.status },
      createdAt: new Date().toISOString(),
    });

    if (!updatedSender) {
      throw new NotFoundError("El remitente no existe.", "SENDER_NOT_FOUND");
    }

    return updatedSender;
  }
}

