import { randomUUID } from "node:crypto";

import type { AlertRepository } from "../../alerts/domain/alert.repository";
import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import type { EmailMessage } from "../../emails/domain/email-message.entity";
import type { EmailMessageRepository } from "../../emails/domain/email-message.repository";
import type { SenderProfileRepository } from "../../senders/domain/sender-profile.repository";
import type { GmailAccount } from "../domain/gmail-account.entity";
import type { GmailAccountRepository } from "../domain/gmail-account.repository";
import type { GmailSyncLogRepository } from "../domain/gmail-sync-log.repository";
import { GmailTokenVault } from "../infrastructure/gmail-token-vault";
import { GoogleGmailClient, type SyncedGmailMessage } from "../infrastructure/google-gmail.client";
import { AutomationRuleEngine, type AppliedAutomationRule } from "../../rules/application/automation-rule-engine.service";
import { classifyGmailEmail } from "./gmail-email-classifier";

export interface GmailSyncActor {
  workspaceId: string;
  userId: string | null;
}

export interface GmailSyncResult {
  account: GmailAccount;
  fetchedMessages: number;
  createdMessages: number;
  updatedMessages: number;
}

export class GmailSyncService {
  public constructor(
    private readonly gmailAccounts: GmailAccountRepository,
    private readonly emails: EmailMessageRepository,
    private readonly alerts: AlertRepository,
    private readonly senders: SenderProfileRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly syncLogs: GmailSyncLogRepository,
    private readonly tokenVault: GmailTokenVault,
    private readonly gmailClient: GoogleGmailClient,
    private readonly automationRuleEngine: AutomationRuleEngine,
  ) {}

  public async syncAccount(actor: GmailSyncActor, account: GmailAccount): Promise<GmailSyncResult | null> {
    const credentials = await this.tokenVault.getCredentials(account.id);
    if (!credentials?.refresh_token && !credentials?.access_token) {
      return null;
    }

    const startedAt = new Date().toISOString();
    const syncLog = await this.syncLogs.create({
      id: randomUUID(),
      workspaceId: actor.workspaceId,
      gmailAccountId: account.id,
      status: "RUNNING",
      startedAt,
      finishedAt: null,
      fetchedMessages: 0,
      createdMessages: 0,
      updatedMessages: 0,
      errorMessage: null,
      metadata: {
        previousStatus: account.status,
        mode: account.historyId ? "incremental" : "recent",
      },
    });

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
      let updatedMessages = 0;
      const appliedRules: AppliedAutomationRule[] = [];
      for (const gmailMessage of gmailMessages) {
        const mappedEmail = this.mapMessage(actor.workspaceId, account, gmailMessage);
        const ruleApplication = await this.automationRuleEngine.applyToNewEmail(mappedEmail);
        const upsertResult = await this.emails.upsertByGmailMessageId(ruleApplication.email);

        if (upsertResult.created) {
          createdMessages += 1;
          appliedRules.push(...ruleApplication.appliedRules);
          await this.createDerivedAlert(upsertResult.email);
          await this.createRuleAlerts(upsertResult.email, ruleApplication.appliedRules);
          await this.upsertSender(actor.workspaceId, upsertResult.email);
        } else {
          updatedMessages += 1;
        }
      }

      await this.automationRuleEngine.incrementTimesApplied(appliedRules);

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
          updatedMessages,
          rulesApplied: summarizeAppliedRules(appliedRules),
          messagesTotal: profile.messagesTotal,
        },
        createdAt: new Date().toISOString(),
      });

      await this.syncLogs.update(syncLog.id, {
        status: "COMPLETED",
        finishedAt: new Date().toISOString(),
        fetchedMessages: gmailMessages.length,
        createdMessages,
        updatedMessages,
        metadata: {
          ...syncLog.metadata,
          messagesTotal: profile.messagesTotal,
          historyId: profile.historyId,
          rulesApplied: summarizeAppliedRules(appliedRules),
        },
      });

      return {
        account: updatedAccount ?? account,
        fetchedMessages: gmailMessages.length,
        createdMessages,
        updatedMessages,
      };
    } catch (error) {
      const failure = resolveGmailSyncFailure(error);
      const updatedAccount = await this.gmailAccounts.update(account.id, {
        status: failure.accountStatus,
        errorMessage: failure.message,
      });

      if (failure.alert) {
        await this.createOperationalAlertIfMissing(account, failure.alert);
      }

      await this.auditLogs.create({
        id: randomUUID(),
        workspaceId: actor.workspaceId,
        userId: actor.userId,
        action: failure.auditAction,
        entityType: "GmailAccount",
        entityId: account.id,
        description: failure.auditDescription(account.emailAddress),
        ip: null,
        metadata: {
          reason: failure.reason,
          message: failure.message,
        },
        createdAt: new Date().toISOString(),
      });

      await this.syncLogs.update(syncLog.id, {
        status: "FAILED",
        finishedAt: new Date().toISOString(),
        errorMessage: failure.message,
        metadata: {
          ...syncLog.metadata,
          reason: failure.reason,
        },
      });

      return {
        account: updatedAccount ?? account,
        fetchedMessages: 0,
        createdMessages: 0,
        updatedMessages: 0,
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

  private async createRuleAlerts(email: EmailMessage, appliedRules: AppliedAutomationRule[]): Promise<void> {
    for (const rule of appliedRules.filter((appliedRule) => appliedRule.generatedAlert)) {
      await this.alerts.create({
        id: randomUUID(),
        workspaceId: email.workspaceId,
        gmailAccountId: email.gmailAccountId,
        emailMessageId: email.id,
        type: "HIGH_IMPORTANCE",
        severity: email.classification?.riskScore && email.classification.riskScore >= 75 ? "HIGH" : "MEDIUM",
        title: `Regla "${rule.name}" genero una alerta`,
        description: `La regla automatica "${rule.name}" hizo match con este correo.`,
        status: "NEW",
        recommendedAction: "Revisar el correo y validar las acciones automaticas aplicadas.",
        createdAt: new Date().toISOString(),
        resolvedAt: null,
      });
    }
  }

  private async createOperationalAlertIfMissing(
    account: GmailAccount,
    alert: {
      type: "ACCOUNT_RECONNECT_REQUIRED" | "SYNC_ERROR";
      severity: "MEDIUM" | "HIGH";
      title: string;
      description: string;
      recommendedAction: string;
    },
  ): Promise<void> {
    const existingAlerts = await this.alerts.findByWorkspace({
      workspaceId: account.workspaceId,
      status: "NEW",
      type: alert.type,
      page: 1,
      limit: 100,
    });

    const alreadyOpen = existingAlerts.data.some(
      (existingAlert) => existingAlert.gmailAccountId === account.id,
    );

    if (alreadyOpen) {
      return;
    }

    await this.alerts.create({
      id: randomUUID(),
      workspaceId: account.workspaceId,
      gmailAccountId: account.id,
      emailMessageId: null,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      status: "NEW",
      recommendedAction: alert.recommendedAction,
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

function summarizeAppliedRules(appliedRules: AppliedAutomationRule[]) {
  const countsByRule = new Map<string, { id: string; name: string; count: number }>();

  for (const rule of appliedRules) {
    const current = countsByRule.get(rule.id);
    countsByRule.set(rule.id, {
      id: rule.id,
      name: rule.name,
      count: (current?.count ?? 0) + 1,
    });
  }

  return Array.from(countsByRule.values());
}

interface GmailSyncFailure {
  reason:
    | "TOKEN_REVOKED"
    | "RATE_LIMIT"
    | "USER_RATE_LIMIT"
    | "QUOTA_EXCEEDED"
    | "HISTORY_NOT_FOUND"
    | "UNKNOWN";
  message: string;
  accountStatus: GmailAccount["status"];
  auditAction: string;
  auditDescription: (emailAddress: string) => string;
  alert?: {
    type: "ACCOUNT_RECONNECT_REQUIRED" | "SYNC_ERROR";
    severity: "MEDIUM" | "HIGH";
    title: string;
    description: string;
    recommendedAction: string;
  };
}

function resolveGmailSyncFailure(error: unknown): GmailSyncFailure {
  const message = error instanceof Error ? error.message : "Error desconocido en Gmail API.";
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("invalid_grant") ||
    normalizedMessage.includes("expired or revoked") ||
    normalizedMessage.includes("token has been expired")
  ) {
    return {
      reason: "TOKEN_REVOKED",
      message,
      accountStatus: "RECONNECT_REQUIRED",
      auditAction: "GMAIL_RECONNECT_REQUIRED",
      auditDescription: (emailAddress) => `Cuenta ${emailAddress} requiere reconexion OAuth.`,
      alert: {
        type: "ACCOUNT_RECONNECT_REQUIRED",
        severity: "HIGH",
        title: "Cuenta Gmail requiere reconexion",
        description: "Google rechazo las credenciales OAuth guardadas para esta cuenta.",
        recommendedAction: "Reconectar la cuenta Gmail desde el panel de cuentas.",
      },
    };
  }

  if (normalizedMessage.includes("userratelimitexceeded")) {
    return {
      reason: "USER_RATE_LIMIT",
      message,
      accountStatus: "ERROR",
      auditAction: "GMAIL_SYNC_RATE_LIMITED",
      auditDescription: (emailAddress) => `Sincronizacion Gmail limitada por usuario para ${emailAddress}.`,
      alert: {
        type: "SYNC_ERROR",
        severity: "MEDIUM",
        title: "Gmail limito temporalmente la cuenta",
        description: "Google aplico limite temporal a la cuenta durante la sincronizacion.",
        recommendedAction: "Esperar unos minutos y reintentar la sincronizacion.",
      },
    };
  }

  if (normalizedMessage.includes("ratelimitexceeded")) {
    return {
      reason: "RATE_LIMIT",
      message,
      accountStatus: "ERROR",
      auditAction: "GMAIL_SYNC_RATE_LIMITED",
      auditDescription: (emailAddress) => `Sincronizacion Gmail limitada por cuota para ${emailAddress}.`,
      alert: {
        type: "SYNC_ERROR",
        severity: "MEDIUM",
        title: "Gmail limito temporalmente la sincronizacion",
        description: "Google aplico limite temporal durante la sincronizacion.",
        recommendedAction: "Esperar unos minutos y reintentar la sincronizacion.",
      },
    };
  }

  if (normalizedMessage.includes("quotaexceeded")) {
    return {
      reason: "QUOTA_EXCEEDED",
      message,
      accountStatus: "ERROR",
      auditAction: "GMAIL_SYNC_QUOTA_EXCEEDED",
      auditDescription: (emailAddress) => `Cuota Gmail agotada sincronizando ${emailAddress}.`,
      alert: {
        type: "SYNC_ERROR",
        severity: "HIGH",
        title: "Cuota Gmail agotada",
        description: "La cuota disponible de Gmail API se agoto durante la sincronizacion.",
        recommendedAction: "Revisar cuotas de Google Cloud y reintentar cuando haya disponibilidad.",
      },
    };
  }

  if (normalizedMessage.includes("notfound") || normalizedMessage.includes("history")) {
    return {
      reason: "HISTORY_NOT_FOUND",
      message,
      accountStatus: "ERROR",
      auditAction: "GMAIL_HISTORY_NOT_FOUND",
      auditDescription: (emailAddress) => `HistoryId Gmail no recuperable para ${emailAddress}.`,
    };
  }

  return {
    reason: "UNKNOWN",
    message,
    accountStatus: "ERROR",
    auditAction: "GMAIL_SYNC_FAILED",
    auditDescription: (emailAddress) => `Sincronizacion Gmail fallo para ${emailAddress}.`,
    alert: {
      type: "SYNC_ERROR",
      severity: "MEDIUM",
      title: "Fallo de sincronizacion Gmail",
      description: "La sincronizacion fallo por un error no clasificado.",
      recommendedAction: "Revisar el log de sincronizacion y reintentar.",
    },
  };
}
