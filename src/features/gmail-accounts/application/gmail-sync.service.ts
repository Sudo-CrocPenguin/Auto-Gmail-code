import { randomUUID } from "node:crypto";

import type { AlertRepository } from "../../alerts/domain/alert.repository";
import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import type { EmailMessage } from "../../emails/domain/email-message.entity";
import type { EmailMessageRepository } from "../../emails/domain/email-message.repository";
import type { SenderProfileRepository } from "../../senders/domain/sender-profile.repository";
import type { GmailAccount } from "../domain/gmail-account.entity";
import type { GmailAccountRepository } from "../domain/gmail-account.repository";
import { GmailTokenVault } from "../infrastructure/gmail-token-vault";
import { GoogleGmailClient, type SyncedGmailMessage } from "../infrastructure/google-gmail.client";
import { classifyGmailEmail } from "./gmail-email-classifier";

export interface GmailSyncActor {
  workspaceId: string;
  userId: string | null;
}

export interface GmailSyncResult {
  account: GmailAccount;
  fetchedMessages: number;
  createdMessages: number;
}

export class GmailSyncService {
  public constructor(
    private readonly gmailAccounts: GmailAccountRepository,
    private readonly emails: EmailMessageRepository,
    private readonly alerts: AlertRepository,
    private readonly senders: SenderProfileRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly tokenVault: GmailTokenVault,
    private readonly gmailClient: GoogleGmailClient,
  ) {}

  public async syncAccount(actor: GmailSyncActor, account: GmailAccount): Promise<GmailSyncResult | null> {
    const credentials = await this.tokenVault.getCredentials(account.id);
    if (!credentials?.refresh_token && !credentials?.access_token) {
      return null;
    }

    await this.gmailAccounts.update(account.id, {
      status: "SYNCING",
      errorMessage: null,
    });

    try {
      const profile = await this.gmailClient.getProfile(credentials);
      const gmailMessages = account.historyId
        ? await this.fetchIncrementalOrRecent(credentials, account.historyId)
        : await this.gmailClient.fetchRecentMessages(credentials);

      let createdMessages = 0;
      for (const gmailMessage of gmailMessages) {
        const upsertResult = await this.emails.upsertByGmailMessageId(
          this.mapMessage(actor.workspaceId, account, gmailMessage),
        );

        if (upsertResult.created) {
          createdMessages += 1;
          await this.createDerivedAlert(upsertResult.email);
        }

        await this.upsertSender(actor.workspaceId, upsertResult.email);
      }

      const updatedAccount = await this.gmailAccounts.update(account.id, {
        emailAddress: profile.emailAddress,
        status: "CONNECTED",
        lastSyncAt: new Date().toISOString(),
        totalMessages: profile.messagesTotal,
        historyId: profile.historyId,
        errorMessage: null,
      });

      await this.auditLogs.create({
        id: randomUUID(),
        workspaceId: actor.workspaceId,
        userId: actor.userId,
        action: "GMAIL_SYNC_COMPLETED",
        entityType: "GmailAccount",
        entityId: account.id,
        description: `Sincronizacion Gmail completada para ${profile.emailAddress}.`,
        ip: null,
        metadata: {
          fetchedMessages: gmailMessages.length,
          createdMessages,
          messagesTotal: profile.messagesTotal,
        },
        createdAt: new Date().toISOString(),
      });

      return {
        account: updatedAccount ?? account,
        fetchedMessages: gmailMessages.length,
        createdMessages,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido en Gmail API.";
      const updatedAccount = await this.gmailAccounts.update(account.id, {
        status: "ERROR",
        errorMessage: message,
      });

      await this.auditLogs.create({
        id: randomUUID(),
        workspaceId: actor.workspaceId,
        userId: actor.userId,
        action: "GMAIL_SYNC_FAILED",
        entityType: "GmailAccount",
        entityId: account.id,
        description: `Sincronizacion Gmail fallo para ${account.emailAddress}.`,
        ip: null,
        metadata: { message },
        createdAt: new Date().toISOString(),
      });

      return {
        account: updatedAccount ?? account,
        fetchedMessages: 0,
        createdMessages: 0,
      };
    }
  }

  private async fetchIncrementalOrRecent(
    credentials: NonNullable<Awaited<ReturnType<GmailTokenVault["getCredentials"]>>>,
    historyId: string,
  ) {
    try {
      return await this.gmailClient.fetchMessagesSinceHistoryId(credentials, historyId);
    } catch {
      return this.gmailClient.fetchRecentMessages(credentials);
    }
  }

  private mapMessage(
    workspaceId: string,
    account: GmailAccount,
    gmailMessage: SyncedGmailMessage,
  ): EmailMessage {
    const from = parseAddress(gmailMessage.headers.from ?? "");
    const toEmails = parseAddressList(gmailMessage.headers.to ?? "");
    const emailId = randomUUID();
    const bodyHtml = gmailMessage.bodyHtml ?? convertTextToHtml(gmailMessage.bodyText);
    const classification = classifyGmailEmail({
      emailMessageId: emailId,
      fromDomain: from.domain,
      subject: gmailMessage.headers.subject ?? "(sin asunto)",
      snippet: gmailMessage.snippet,
      labelIds: gmailMessage.labelIds,
      hasAttachments: gmailMessage.attachments.length > 0,
    });

    return {
      id: emailId,
      workspaceId,
      gmailAccountId: account.id,
      gmailMessageId: gmailMessage.gmailMessageId,
      threadId: gmailMessage.threadId,
      accountEmail: account.emailAddress,
      fromEmail: from.email,
      fromName: from.name,
      fromDomain: from.domain,
      toEmails,
      subject: gmailMessage.headers.subject ?? "(sin asunto)",
      snippet: gmailMessage.snippet,
      bodyHtml,
      receivedAt: gmailMessage.receivedAt,
      labelIds: gmailMessage.labelIds,
      hasAttachments: gmailMessage.attachments.length > 0,
      attachments: gmailMessage.attachments,
      isRead: !gmailMessage.labelIds.includes("UNREAD"),
      isSpam: gmailMessage.labelIds.includes("SPAM") || classification.spamScore >= 80,
      isImportant: gmailMessage.labelIds.includes("IMPORTANT") || classification.importanceScore >= 80,
      reviewedAt: null,
      gmailUrl: `https://mail.google.com/mail/u/${encodeURIComponent(account.emailAddress)}/#all/${gmailMessage.gmailMessageId}`,
      classification,
      actionHistory: [
        {
          id: randomUUID(),
          actor: "SYSTEM",
          action: "GMAIL_MESSAGE_SYNCED",
          description: "Correo sincronizado desde Gmail API.",
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  private async createDerivedAlert(email: EmailMessage): Promise<void> {
    const classification = email.classification;
    if (!classification) {
      return;
    }

    const shouldAlert =
      classification.securityScore >= 80 ||
      classification.riskScore >= 70 ||
      classification.importanceScore >= 90 ||
      classification.primaryCategory === "SPAM_PROBABLE";

    if (!shouldAlert) {
      return;
    }

    await this.alerts.create({
      id: randomUUID(),
      workspaceId: email.workspaceId,
      gmailAccountId: email.gmailAccountId,
      emailMessageId: email.id,
      type: resolveAlertType(classification.primaryCategory, classification.securityScore, classification.spamScore),
      severity: classification.riskScore >= 75 || classification.securityScore >= 90 ? "HIGH" : "MEDIUM",
      title: `Correo ${classification.primaryCategory.toLowerCase()} detectado`,
      description: classification.explanation,
      status: "NEW",
      recommendedAction: classification.actionRequired
        ? "Revisar el correo y confirmar si requiere accion."
        : "Validar la clasificacion cuando sea posible.",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    });
  }

  private async upsertSender(workspaceId: string, email: EmailMessage): Promise<void> {
    const existingSender = await this.senders.findByEmail(workspaceId, email.fromEmail);
    const classification = email.classification;

    if (!existingSender) {
      await this.senders.create({
        id: randomUUID(),
        workspaceId,
        email: email.fromEmail,
        domain: email.fromDomain,
        displayName: email.fromName,
        totalMessages: 1,
        lastSeenAt: email.receivedAt,
        trustScore: classification?.riskScore && classification.riskScore > 60 ? 35 : 55,
        riskScore: classification?.riskScore ?? 10,
        category: classification?.primaryCategory ?? null,
        status: classification?.riskScore && classification.riskScore > 70 ? "SUSPICIOUS" : "NORMAL",
      });
      return;
    }

    await this.senders.update(existingSender.id, {
      totalMessages: existingSender.totalMessages + 1,
      lastSeenAt:
        new Date(email.receivedAt) > new Date(existingSender.lastSeenAt)
          ? email.receivedAt
          : existingSender.lastSeenAt,
      riskScore: Math.max(existingSender.riskScore, classification?.riskScore ?? 0),
      category: existingSender.category ?? classification?.primaryCategory ?? null,
    });
  }
}

function parseAddress(value: string): { name: string | null; email: string; domain: string } {
  const match = value.match(/^(?:"?([^"<]*)"?\s*)?<([^>]+)>$/);
  const email = (match?.[2] ?? value).trim().toLowerCase();
  const name = match?.[1]?.trim() || null;
  const domain = email.includes("@") ? email.split("@").at(1) ?? "unknown" : "unknown";

  return {
    name,
    email,
    domain,
  };
}

function parseAddressList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => parseAddress(entry).email)
    .filter(Boolean);
}

function convertTextToHtml(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return `<pre>${escapeHtml(value)}</pre>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resolveAlertType(
  category: string,
  securityScore: number,
  spamScore: number,
): "SECURITY_LOGIN" | "HIGH_IMPORTANCE" | "POSSIBLE_SPAM" | "LEGAL_NOTICE" {
  if (securityScore >= 80) return "SECURITY_LOGIN";
  if (spamScore >= 80 || category === "SPAM_PROBABLE") return "POSSIBLE_SPAM";
  if (category === "LEGAL") return "LEGAL_NOTICE";
  return "HIGH_IMPORTANCE";
}
