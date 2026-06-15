import { paginate } from "../../application/pagination";
import type { AlertQueryParams, AlertRepository } from "../../../features/alerts/domain/alert.repository";
import type { AuditLogRepository, AuditQueryParams } from "../../../features/audit/domain/audit-log.repository";
import type { UserRepository } from "../../../features/auth/domain/user.repository";
import type { EmailQueryParams, EmailMessageRepository } from "../../../features/emails/domain/email-message.repository";
import type { GmailAccountRepository } from "../../../features/gmail-accounts/domain/gmail-account.repository";
import type { GmailOAuthTokenRepository } from "../../../features/gmail-accounts/domain/gmail-oauth-token.repository";
import type { AutomationRuleRepository, RuleQueryParams } from "../../../features/rules/domain/automation-rule.repository";
import type { SenderProfileRepository, SenderQueryParams } from "../../../features/senders/domain/sender-profile.repository";
import type { WorkspaceRepository } from "../../../features/workspace/domain/workspace.repository";
import type { InMemoryDatabase } from "./in-memory-database";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function includesInsensitive(value: string | null, search: string): boolean {
  return value?.toLowerCase().includes(search.toLowerCase()) ?? false;
}

export class InMemoryUserRepository implements UserRepository {
  public constructor(private readonly database: InMemoryDatabase) {}

  public async create(user: Parameters<UserRepository["create"]>[0]) {
    this.database.users.push(clone(user));
    return clone(user);
  }

  public async findByEmail(email: string) {
    const user = this.database.users.find(
      (currentUser) => currentUser.email.toLowerCase() === email.toLowerCase(),
    );
    return user ? clone(user) : null;
  }

  public async findById(id: string) {
    const user = this.database.users.find((currentUser) => currentUser.id === id);
    return user ? clone(user) : null;
  }
}

export class InMemoryWorkspaceRepository implements WorkspaceRepository {
  public constructor(private readonly database: InMemoryDatabase) {}

  public async create(workspace: Parameters<WorkspaceRepository["create"]>[0]) {
    this.database.workspaces.push(clone(workspace));
    return clone(workspace);
  }

  public async findById(id: string) {
    const workspace = this.database.workspaces.find((currentWorkspace) => currentWorkspace.id === id);
    return workspace ? clone(workspace) : null;
  }

  public async findByOwnerId(ownerId: string) {
    const workspace = this.database.workspaces.find(
      (currentWorkspace) => currentWorkspace.ownerId === ownerId,
    );
    return workspace ? clone(workspace) : null;
  }

  public async update(id: string, data: Parameters<WorkspaceRepository["update"]>[1]) {
    const workspace = this.database.workspaces.find((currentWorkspace) => currentWorkspace.id === id);
    if (!workspace) {
      return null;
    }

    Object.assign(workspace, data);
    return clone(workspace);
  }
}

export class InMemoryGmailAccountRepository implements GmailAccountRepository {
  public constructor(private readonly database: InMemoryDatabase) {}

  public async create(account: Parameters<GmailAccountRepository["create"]>[0]) {
    this.database.gmailAccounts.push(clone(account));
    return clone(account);
  }

  public async findById(id: string) {
    const account = this.database.gmailAccounts.find((currentAccount) => currentAccount.id === id);
    return account ? clone(account) : null;
  }

  public async findByWorkspaceId(workspaceId: string) {
    return clone(
      this.database.gmailAccounts.filter((currentAccount) => currentAccount.workspaceId === workspaceId),
    );
  }

  public async findByEmail(workspaceId: string, emailAddress: string) {
    const account = this.database.gmailAccounts.find(
      (currentAccount) =>
        currentAccount.workspaceId === workspaceId &&
        currentAccount.emailAddress.toLowerCase() === emailAddress.toLowerCase(),
    );
    return account ? clone(account) : null;
  }

  public async update(id: string, data: Parameters<GmailAccountRepository["update"]>[1]) {
    const account = this.database.gmailAccounts.find((currentAccount) => currentAccount.id === id);
    if (!account) {
      return null;
    }

    Object.assign(account, data);
    return clone(account);
  }

  public async delete(id: string) {
    const initialLength = this.database.gmailAccounts.length;
    this.database.gmailAccounts = this.database.gmailAccounts.filter(
      (currentAccount) => currentAccount.id !== id,
    );
    return this.database.gmailAccounts.length !== initialLength;
  }
}

export class InMemoryGmailOAuthTokenRepository implements GmailOAuthTokenRepository {
  public constructor(private readonly database: InMemoryDatabase) {}

  public async upsert(token: Parameters<GmailOAuthTokenRepository["upsert"]>[0]) {
    const index = this.database.gmailOAuthTokens.findIndex(
      (currentToken) => currentToken.gmailAccountId === token.gmailAccountId,
    );

    if (index === -1) {
      this.database.gmailOAuthTokens.push(clone(token));
      return clone(token);
    }

    this.database.gmailOAuthTokens[index] = clone(token);
    return clone(token);
  }

  public async findByAccountId(gmailAccountId: string) {
    const token = this.database.gmailOAuthTokens.find(
      (currentToken) => currentToken.gmailAccountId === gmailAccountId,
    );
    return token ? clone(token) : null;
  }

  public async deleteByAccountId(gmailAccountId: string) {
    const initialLength = this.database.gmailOAuthTokens.length;
    this.database.gmailOAuthTokens = this.database.gmailOAuthTokens.filter(
      (currentToken) => currentToken.gmailAccountId !== gmailAccountId,
    );
    return this.database.gmailOAuthTokens.length !== initialLength;
  }
}

export class InMemoryEmailMessageRepository implements EmailMessageRepository {
  public constructor(private readonly database: InMemoryDatabase) {}

  public async upsertByGmailMessageId(email: Parameters<EmailMessageRepository["upsertByGmailMessageId"]>[0]) {
    const index = this.database.emails.findIndex(
      (currentEmail) =>
        currentEmail.workspaceId === email.workspaceId &&
        currentEmail.gmailAccountId === email.gmailAccountId &&
        currentEmail.gmailMessageId === email.gmailMessageId,
    );

    if (index === -1) {
      this.database.emails.push(clone(email));
      return { email: clone(email), created: true };
    }

    const existingEmail = this.database.emails[index];
    if (!existingEmail) {
      this.database.emails.push(clone(email));
      return { email: clone(email), created: true };
    }
    const updatedEmail = {
      ...email,
      id: existingEmail.id,
      classification: existingEmail.classification ?? email.classification,
      reviewedAt: existingEmail.reviewedAt,
      actionHistory: existingEmail.actionHistory.length > 0 ? existingEmail.actionHistory : email.actionHistory,
    };
    this.database.emails[index] = clone(updatedEmail);

    return { email: clone(updatedEmail), created: false };
  }

  public async findById(id: string) {
    const email = this.database.emails.find((currentEmail) => currentEmail.id === id);
    return email ? clone(email) : null;
  }

  public async findByGmailMessageId(workspaceId: string, gmailAccountId: string, gmailMessageId: string) {
    const email = this.database.emails.find(
      (currentEmail) =>
        currentEmail.workspaceId === workspaceId &&
        currentEmail.gmailAccountId === gmailAccountId &&
        currentEmail.gmailMessageId === gmailMessageId,
    );
    return email ? clone(email) : null;
  }

  public async findByWorkspace(params: EmailQueryParams) {
    const search = params.search?.trim().toLowerCase();
    let emails = this.database.emails.filter((email) => email.workspaceId === params.workspaceId);

    if (search) {
      emails = emails.filter(
        (email) =>
          includesInsensitive(email.subject, search) ||
          includesInsensitive(email.snippet, search) ||
          includesInsensitive(email.fromEmail, search) ||
          includesInsensitive(email.fromName, search) ||
          includesInsensitive(email.fromDomain, search),
      );
    }

    emails = emails.filter((email) => {
      const classification = email.classification;

      if (params.gmailAccountId && email.gmailAccountId !== params.gmailAccountId) return false;
      if (params.fromEmail && email.fromEmail.toLowerCase() !== params.fromEmail.toLowerCase()) return false;
      if (params.fromDomain && email.fromDomain.toLowerCase() !== params.fromDomain.toLowerCase()) return false;
      if (params.category && classification?.primaryCategory !== params.category && !classification?.secondaryCategories.includes(params.category)) return false;
      if (params.isImportant !== undefined && email.isImportant !== params.isImportant) return false;
      if (params.isSpam !== undefined && email.isSpam !== params.isSpam) return false;
      if (params.actionRequired !== undefined && classification?.actionRequired !== params.actionRequired) return false;
      if (params.hasAttachments !== undefined && email.hasAttachments !== params.hasAttachments) return false;
      if (params.isRead !== undefined && email.isRead !== params.isRead) return false;
      if (params.minImportanceScore !== undefined && (classification?.importanceScore ?? 0) < params.minImportanceScore) return false;
      if (params.minRiskScore !== undefined && (classification?.riskScore ?? 0) < params.minRiskScore) return false;
      if (params.minSecurityScore !== undefined && (classification?.securityScore ?? 0) < params.minSecurityScore) return false;
      if (params.dateFrom && new Date(email.receivedAt) < new Date(params.dateFrom)) return false;
      if (params.dateTo && new Date(email.receivedAt) > new Date(params.dateTo)) return false;

      return true;
    });

    const sortBy = params.sortBy ?? "receivedAt";
    const sortOrder = params.sortOrder ?? "desc";

    emails = [...emails].sort((left, right) => {
      const leftValue = this.resolveSortValue(left, sortBy);
      const rightValue = this.resolveSortValue(right, sortBy);
      const comparison = leftValue > rightValue ? 1 : leftValue < rightValue ? -1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return paginate(clone(emails), params);
  }

  public async update(id: string, data: Parameters<EmailMessageRepository["update"]>[1]) {
    const email = this.database.emails.find((currentEmail) => currentEmail.id === id);
    if (!email) {
      return null;
    }

    Object.assign(email, data);
    return clone(email);
  }

  private resolveSortValue(
    email: Parameters<EmailMessageRepository["update"]>[1] & { receivedAt?: string },
    sortBy: NonNullable<EmailQueryParams["sortBy"]>,
  ): number {
    if (sortBy === "receivedAt") {
      return new Date(email.receivedAt ?? 0).getTime();
    }

    if (sortBy === "importanceScore") return email.classification?.importanceScore ?? 0;
    if (sortBy === "riskScore") return email.classification?.riskScore ?? 0;
    return email.classification?.securityScore ?? 0;
  }
}

export class InMemoryAlertRepository implements AlertRepository {
  public constructor(private readonly database: InMemoryDatabase) {}

  public async create(alert: Parameters<AlertRepository["create"]>[0]) {
    this.database.alerts.push(clone(alert));
    return clone(alert);
  }

  public async findById(id: string) {
    const alert = this.database.alerts.find((currentAlert) => currentAlert.id === id);
    return alert ? clone(alert) : null;
  }

  public async findByWorkspace(params: AlertQueryParams) {
    let alerts = this.database.alerts.filter((alert) => alert.workspaceId === params.workspaceId);

    if (params.status) alerts = alerts.filter((alert) => alert.status === params.status);
    if (params.severity) alerts = alerts.filter((alert) => alert.severity === params.severity);
    if (params.type) alerts = alerts.filter((alert) => alert.type === params.type);

    alerts = [...alerts].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );

    return paginate(clone(alerts), params);
  }

  public async update(id: string, data: Parameters<AlertRepository["update"]>[1]) {
    const alert = this.database.alerts.find((currentAlert) => currentAlert.id === id);
    if (!alert) {
      return null;
    }

    Object.assign(alert, data);
    return clone(alert);
  }
}

export class InMemorySenderProfileRepository implements SenderProfileRepository {
  public constructor(private readonly database: InMemoryDatabase) {}

  public async create(sender: Parameters<SenderProfileRepository["create"]>[0]) {
    this.database.senders.push(clone(sender));
    return clone(sender);
  }

  public async findById(id: string) {
    const sender = this.database.senders.find((currentSender) => currentSender.id === id);
    return sender ? clone(sender) : null;
  }

  public async findByEmail(workspaceId: string, email: string) {
    const sender = this.database.senders.find(
      (currentSender) =>
        currentSender.workspaceId === workspaceId &&
        currentSender.email.toLowerCase() === email.toLowerCase(),
    );
    return sender ? clone(sender) : null;
  }

  public async findByWorkspace(params: SenderQueryParams) {
    const search = params.search?.trim().toLowerCase();
    let senders = this.database.senders.filter((sender) => sender.workspaceId === params.workspaceId);

    if (search) {
      senders = senders.filter(
        (sender) =>
          includesInsensitive(sender.email, search) ||
          includesInsensitive(sender.domain, search) ||
          includesInsensitive(sender.displayName, search),
      );
    }

    if (params.status) {
      senders = senders.filter((sender) => sender.status === params.status);
    }

    senders = [...senders].sort((left, right) => right.totalMessages - left.totalMessages);

    return paginate(clone(senders), params);
  }

  public async update(id: string, data: Parameters<SenderProfileRepository["update"]>[1]) {
    const sender = this.database.senders.find((currentSender) => currentSender.id === id);
    if (!sender) {
      return null;
    }

    Object.assign(sender, data);
    return clone(sender);
  }
}

export class InMemoryAutomationRuleRepository implements AutomationRuleRepository {
  public constructor(private readonly database: InMemoryDatabase) {}

  public async create(rule: Parameters<AutomationRuleRepository["create"]>[0]) {
    this.database.rules.push(clone(rule));
    return clone(rule);
  }

  public async findById(id: string) {
    const rule = this.database.rules.find((currentRule) => currentRule.id === id);
    return rule ? clone(rule) : null;
  }

  public async findByWorkspace(params: RuleQueryParams) {
    const search = params.search?.trim().toLowerCase();
    let rules = this.database.rules.filter((rule) => rule.workspaceId === params.workspaceId);

    if (search) {
      rules = rules.filter(
        (rule) => includesInsensitive(rule.name, search) || includesInsensitive(rule.description, search),
      );
    }

    if (params.enabled !== undefined) {
      rules = rules.filter((rule) => rule.enabled === params.enabled);
    }

    rules = [...rules].sort((left, right) => left.priority - right.priority);

    return paginate(clone(rules), params);
  }

  public async update(id: string, data: Parameters<AutomationRuleRepository["update"]>[1]) {
    const rule = this.database.rules.find((currentRule) => currentRule.id === id);
    if (!rule) {
      return null;
    }

    Object.assign(rule, data);
    return clone(rule);
  }

  public async delete(id: string) {
    const initialLength = this.database.rules.length;
    this.database.rules = this.database.rules.filter((currentRule) => currentRule.id !== id);
    return this.database.rules.length !== initialLength;
  }
}

export class InMemoryAuditLogRepository implements AuditLogRepository {
  public constructor(private readonly database: InMemoryDatabase) {}

  public async create(log: Parameters<AuditLogRepository["create"]>[0]) {
    this.database.auditLogs.push(clone(log));
    return clone(log);
  }

  public async findByWorkspace(params: AuditQueryParams) {
    let logs = this.database.auditLogs.filter((log) => log.workspaceId === params.workspaceId);

    if (params.action) logs = logs.filter((log) => log.action === params.action);
    if (params.userId) logs = logs.filter((log) => log.userId === params.userId);
    if (params.dateFrom) logs = logs.filter((log) => new Date(log.createdAt) >= new Date(params.dateFrom ?? ""));
    if (params.dateTo) logs = logs.filter((log) => new Date(log.createdAt) <= new Date(params.dateTo ?? ""));

    logs = [...logs].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );

    return paginate(clone(logs), params);
  }
}
