import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { GmailTokenVault } from "../../gmail-accounts/infrastructure/gmail-token-vault";
import { GoogleGmailClient } from "../../gmail-accounts/infrastructure/google-gmail.client";
import { environment } from "../../../shared/config/environment";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { AppError } from "../../../shared/domain/errors/app-error";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { EmailAttachment } from "../domain/email-message.entity";
import type { EmailMessageRepository } from "../domain/email-message.repository";

export interface DownloadEmailAttachmentOutput {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  contentBase64: string;
  encoding: "base64";
}

const blockedMimeTypes = new Set([
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-sh",
  "application/x-bat",
  "application/x-executable",
]);
const blockedExtensions = [".exe", ".bat", ".cmd", ".sh", ".js", ".vbs", ".scr", ".msi"];

export class DownloadEmailAttachmentUseCase {
  public constructor(
    private readonly emails: EmailMessageRepository,
    private readonly tokenVault: GmailTokenVault,
    private readonly gmailClient: GoogleGmailClient,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(
    context: AuthenticatedContext,
    emailId: string,
    attachmentId: string,
  ): Promise<DownloadEmailAttachmentOutput> {
    const email = await this.emails.findById(emailId);
    if (!email || email.workspaceId !== context.workspaceId) {
      throw new NotFoundError("El correo no existe.", "EMAIL_NOT_FOUND");
    }

    const attachment = email.attachments.find((currentAttachment) => currentAttachment.id === attachmentId);
    if (!attachment) {
      throw new NotFoundError("El adjunto no existe.", "EMAIL_ATTACHMENT_NOT_FOUND");
    }

    validateAttachmentMetadata(attachment);

    const credentials = await this.tokenVault.getCredentials(email.gmailAccountId);
    if (!credentials?.refresh_token && !credentials?.access_token) {
      throw new AppError("La cuenta Gmail requiere reconexion para descargar adjuntos.", 409, "GMAIL_RECONNECT_REQUIRED");
    }

    const content = await this.gmailClient.fetchAttachment(credentials, email.gmailMessageId, attachment.id);
    if (content.length > environment.google.attachmentMaxBytes) {
      throw new AppError("El adjunto supera el tamano maximo permitido.", 413, "EMAIL_ATTACHMENT_TOO_LARGE", {
        maxBytes: environment.google.attachmentMaxBytes,
        actualBytes: content.length,
      });
    }

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "EMAIL_ATTACHMENT_DOWNLOADED",
      entityType: "EmailMessage",
      entityId: email.id,
      description: `Usuario descargo adjunto ${attachment.filename}.`,
      ip: null,
      metadata: {
        attachmentId: attachment.id,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
      },
      createdAt: new Date().toISOString(),
    });

    return {
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      sizeBytes: content.length,
      contentBase64: content.toString("base64"),
      encoding: "base64",
    };
  }
}

function validateAttachmentMetadata(attachment: EmailAttachment): void {
  if (attachment.sizeBytes > environment.google.attachmentMaxBytes) {
    throw new AppError("El adjunto supera el tamano maximo permitido.", 413, "EMAIL_ATTACHMENT_TOO_LARGE", {
      maxBytes: environment.google.attachmentMaxBytes,
      actualBytes: attachment.sizeBytes,
    });
  }

  const mimeType = attachment.mimeType.toLowerCase();
  const filename = attachment.filename.toLowerCase();

  if (blockedMimeTypes.has(mimeType) || blockedExtensions.some((extension) => filename.endsWith(extension))) {
    throw new AppError("El tipo de adjunto no esta permitido.", 415, "EMAIL_ATTACHMENT_MIME_BLOCKED", {
      mimeType: attachment.mimeType,
      filename: attachment.filename,
    });
  }
}
