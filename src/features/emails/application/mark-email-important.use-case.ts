import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { EmailMessage } from "../domain/email-message.entity";
import type { EmailMessageRepository } from "../domain/email-message.repository";

export class MarkEmailImportantUseCase {
  public constructor(
    private readonly emails: EmailMessageRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(context: AuthenticatedContext, emailId: string): Promise<EmailMessage> {
    const email = await this.emails.findById(emailId);
    if (!email || email.workspaceId !== context.workspaceId) {
      throw new NotFoundError("El correo no existe.", "EMAIL_NOT_FOUND");
    }

    const now = new Date().toISOString();
    const updatedClassification = email.classification
      ? {
          ...email.classification,
          importanceScore: Math.max(email.classification.importanceScore, 85),
          updatedAt: now,
        }
      : null;

    const updatedEmail = await this.emails.update(email.id, {
      isImportant: true,
      classification: updatedClassification,
      actionHistory: [
        ...email.actionHistory,
        {
          id: randomUUID(),
          actor: "USER",
          action: "EMAIL_MARKED_IMPORTANT",
          description: "Correo marcado como importante.",
          createdAt: now,
        },
      ],
    });

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "EMAIL_MARKED_IMPORTANT",
      entityType: "EmailMessage",
      entityId: email.id,
      description: "Usuario marco correo como importante.",
      ip: null,
      metadata: {},
      createdAt: now,
    });

    if (!updatedEmail) {
      throw new NotFoundError("El correo no existe.", "EMAIL_NOT_FOUND");
    }

    return updatedEmail;
  }
}

