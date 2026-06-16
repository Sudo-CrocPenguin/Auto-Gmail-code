import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { EmailCategory } from "../domain/email-category";
import type { EmailClassification } from "../domain/email-classification.entity";
import type { EmailMessage } from "../domain/email-message.entity";
import type { EmailMessageRepository } from "../domain/email-message.repository";

export interface CorrectEmailClassificationInput {
  primaryCategory: EmailCategory;
  secondaryCategories?: EmailCategory[] | undefined;
  importanceScore?: number | undefined;
  spamScore?: number | undefined;
  riskScore?: number | undefined;
  securityScore?: number | undefined;
  actionRequired?: boolean | undefined;
  explanation?: string | undefined;
}

export class CorrectEmailClassificationUseCase {
  public constructor(
    private readonly emails: EmailMessageRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(
    context: AuthenticatedContext,
    emailId: string,
    input: CorrectEmailClassificationInput,
  ): Promise<EmailMessage> {
    const email = await this.emails.findById(emailId);
    if (!email || email.workspaceId !== context.workspaceId) {
      throw new NotFoundError("El correo no existe.", "EMAIL_NOT_FOUND");
    }

    const now = new Date().toISOString();
    const currentClassification = email.classification;
    const classification: EmailClassification = {
      id: currentClassification?.id ?? randomUUID(),
      emailMessageId: email.id,
      primaryCategory: input.primaryCategory,
      secondaryCategories: input.secondaryCategories ?? currentClassification?.secondaryCategories ?? [],
      importanceScore: input.importanceScore ?? currentClassification?.importanceScore ?? 50,
      spamScore: input.spamScore ?? currentClassification?.spamScore ?? 0,
      riskScore: input.riskScore ?? currentClassification?.riskScore ?? 0,
      securityScore: input.securityScore ?? currentClassification?.securityScore ?? 0,
      actionRequired: input.actionRequired ?? currentClassification?.actionRequired ?? false,
      explanation:
        input.explanation ??
        `Clasificacion corregida manualmente como ${input.primaryCategory}.`,
      createdAt: currentClassification?.createdAt ?? now,
      updatedAt: now,
    };

    const updatedEmail = await this.emails.update(email.id, {
      classification,
      isImportant: email.isImportant || classification.importanceScore >= 80,
      isSpam: classification.primaryCategory === "SPAM_PROBABLE" || classification.spamScore >= 80,
      actionHistory: [
        ...email.actionHistory,
        {
          id: randomUUID(),
          actor: "USER",
          action: "CLASSIFICATION_CORRECTED",
          description: `Clasificacion corregida a ${classification.primaryCategory}.`,
          createdAt: now,
        },
      ],
    });

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "EMAIL_CLASSIFICATION_CORRECTED",
      entityType: "EmailMessage",
      entityId: email.id,
      description: `Usuario corrigio clasificacion del correo a ${classification.primaryCategory}.`,
      ip: null,
      metadata: {
        previousCategory: currentClassification?.primaryCategory ?? null,
        newCategory: classification.primaryCategory,
      },
      createdAt: now,
    });

    if (!updatedEmail) {
      throw new NotFoundError("El correo no existe.", "EMAIL_NOT_FOUND");
    }

    return updatedEmail;
  }
}

