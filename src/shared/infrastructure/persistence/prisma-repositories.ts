import type { Prisma, PrismaClient } from "@prisma/client";

import { paginate } from "../../application/pagination";
import type { Alert } from "../../../features/alerts/domain/alert.entity";
import type { AlertQueryParams, AlertRepository } from "../../../features/alerts/domain/alert.repository";
import type { AuditLog } from "../../../features/audit/domain/audit-log.entity";
import type { AuditLogRepository, AuditQueryParams } from "../../../features/audit/domain/audit-log.repository";
import type { User } from "../../../features/auth/domain/user.entity";
import type { UserRepository } from "../../../features/auth/domain/user.repository";
import type { EmailCategory } from "../../../features/emails/domain/email-category";
import type { EmailClassification } from "../../../features/emails/domain/email-classification.entity";
import type { EmailActionHistoryEntry, EmailAttachment, EmailMessage } from "../../../features/emails/domain/email-message.entity";
import type { EmailMessageRepository, EmailQueryParams } from "../../../features/emails/domain/email-message.repository";
import type { GmailAccount } from "../../../features/gmail-accounts/domain/gmail-account.entity";
import type { GmailAccountRepository } from "../../../features/gmail-accounts/domain/gmail-account.repository";
import type { GmailOAuthToken } from "../../../features/gmail-accounts/domain/gmail-oauth-token.entity";
import type { GmailOAuthTokenRepository } from "../../../features/gmail-accounts/domain/gmail-oauth-token.repository";
import type { GmailSyncLog } from "../../../features/gmail-accounts/domain/gmail-sync-log.entity";
import type { GmailSyncLogQueryParams, GmailSyncLogRepository } from "../../../features/gmail-accounts/domain/gmail-sync-log.repository";
import type { AutomationRule, RuleAction, RuleCondition } from "../../../features/rules/domain/automation-rule.entity";
import type { AutomationRuleRepository, RuleQueryParams } from "../../../features/rules/domain/automation-rule.repository";
import type { SenderProfile } from "../../../features/senders/domain/sender-profile.entity";
import type { SenderProfileRepository, SenderQueryParams } from "../../../features/senders/domain/sender-profile.repository";
import { defaultWorkspaceSettings, type WorkspaceSettings } from "../../../features/settings/domain/workspace-settings.entity";
import type { WorkspaceSettingsRepository } from "../../../features/settings/domain/workspace-settings.repository";
import type { Workspace } from "../../../features/workspace/domain/workspace.entity";
import type { WorkspaceRepository } from "../../../features/workspace/domain/workspace.repository";

function toDate(value: string | null): Date | null {
  return value ? new Date(value) : null;
}

function toDateRequired(value: string): Date {
  return new Date(value);
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toIsoRequired(value: Date): string {
  return value.toISOString();
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function fromJson<T>(value: Prisma.JsonValue, fallback: T): T {
  return (value ?? fallback) as T;
}

function includesInsensitive(value: string | null, search: string): boolean {
  return value?.toLowerCase().includes(search.toLowerCase()) ?? false;
}

function mapUser(user: Prisma.UserGetPayload<object>): User {
  return {
    id: user.id,
    workspaceId: user.workspaceId,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role as User["role"],
    createdAt: toIsoRequired(user.createdAt),
  };
}

function mapWorkspace(workspace: Prisma.WorkspaceGetPayload<object>): Workspace {
  return {
    id: workspace.id,
    name: workspace.name,
    ownerId: workspace.ownerId,
    plan: workspace.plan,
    createdAt: toIsoRequired(workspace.createdAt),
  };
}

function mapGmailAccount(account: Prisma.GmailAccountGetPayload<object>): GmailAccount {
  return {
    id: account.id,
    workspaceId: account.workspaceId,
    emailAddress: account.emailAddress,
    status: account.status as GmailAccount["status"],
    lastSyncAt: toIso(account.lastSyncAt),
    watchExpiration: toIso(account.watchExpiration),
    totalMessages: account.totalMessages,
    historyId: account.historyId,
    grantedScopes: fromJson<string[]>(account.grantedScopes, []),
    errorMessage: account.errorMessage,
    createdAt: toIsoRequired(account.createdAt),
  };
}

function mapGmailOAuthToken(token: Prisma.GmailOAuthTokenGetPayload<object>): GmailOAuthToken {
  return {
    gmailAccountId: token.gmailAccountId,
    workspaceId: token.workspaceId,
    encryptedAccessToken: token.encryptedAccessToken,
    encryptedRefreshToken: token.encryptedRefreshToken,
    encryptedIdToken: token.encryptedIdToken,
    scope: token.scope,
    tokenType: token.tokenType,
    expiryDate: token.expiryDate === null ? null : Number(token.expiryDate),
    createdAt: toIsoRequired(token.createdAt),
    updatedAt: toIsoRequired(token.updatedAt),
  };
}

function mapGmailSyncLog(log: Prisma.GmailSyncLogGetPayload<object>): GmailSyncLog {
  return {
    id: log.id,
    workspaceId: log.workspaceId,
    gmailAccountId: log.gmailAccountId,
    status: log.status as GmailSyncLog["status"],
    startedAt: toIsoRequired(log.startedAt),
    finishedAt: toIso(log.finishedAt),
    fetchedMessages: log.fetchedMessages,
    createdMessages: log.createdMessages,
    updatedMessages: log.updatedMessages,
    errorMessage: log.errorMessage,
    metadata: fromJson<Record<string, unknown>>(log.metadata, {}),
  };
}

function mapEmail(email: Prisma.EmailMessageGetPayload<object>): EmailMessage {
  return {
    id: email.id,
    workspaceId: email.workspaceId,
    gmailAccountId: email.gmailAccountId,
    gmailMessageId: email.gmailMessageId,
    threadId: email.threadId,
    accountEmail: email.accountEmail,
    fromEmail: email.fromEmail,
    fromName: email.fromName,
    fromDomain: email.fromDomain,
    toEmails: fromJson<string[]>(email.toEmails, []),
    subject: email.subject,
    snippet: email.snippet,
    bodyHtml: email.bodyHtml,
    receivedAt: toIsoRequired(email.receivedAt),
    labelIds: fromJson<string[]>(email.labelIds, []),
    hasAttachments: email.hasAttachments,
    attachments: fromJson<EmailAttachment[]>(email.attachments, []),
    isRead: email.isRead,
    isSpam: email.isSpam,
    isImportant: email.isImportant,
    reviewedAt: toIso(email.reviewedAt),
    gmailUrl: email.gmailUrl,
    classification: fromJson<EmailClassification | null>(email.classification, null),
    actionHistory: fromJson<EmailActionHistoryEntry[]>(email.actionHistory, []),
  };
}

function mapAlert(alert: Prisma.AlertGetPayload<object>): Alert {
  return {
    id: alert.id,
    workspaceId: alert.workspaceId,
    gmailAccountId: alert.gmailAccountId,
    emailMessageId: alert.emailMessageId,
    type: alert.type as Alert["type"],
    severity: alert.severity as Alert["severity"],
    title: alert.title,
    description: alert.description,
    status: alert.status as Alert["status"],
    recommendedAction: alert.recommendedAction,
    createdAt: toIsoRequired(alert.createdAt),
    resolvedAt: toIso(alert.resolvedAt),
  };
}

function mapSender(sender: Prisma.SenderProfileGetPayload<object>): SenderProfile {
  return {
    id: sender.id,
    workspaceId: sender.workspaceId,
    email: sender.email,
    domain: sender.domain,
    displayName: sender.displayName,
    totalMessages: sender.totalMessages,
    lastSeenAt: toIsoRequired(sender.lastSeenAt),
    trustScore: sender.trustScore,
    riskScore: sender.riskScore,
    category: sender.category as EmailCategory | null,
    status: sender.status as SenderProfile["status"],
  };
}

function mapRule(rule: Prisma.AutomationRuleGetPayload<object>): AutomationRule {
  return {
    id: rule.id,
    workspaceId: rule.workspaceId,
    name: rule.name,
    description: rule.description,
    conditions: fromJson<RuleCondition[]>(rule.conditions, []),
    actions: fromJson<RuleAction[]>(rule.actions, []),
    priority: rule.priority,
    enabled: rule.enabled,
    timesApplied: rule.timesApplied,
    createdAt: toIsoRequired(rule.createdAt),
    updatedAt: toIsoRequired(rule.updatedAt),
  };
}

function mapAuditLog(log: Prisma.AuditLogGetPayload<object>): AuditLog {
  return {
    id: log.id,
    workspaceId: log.workspaceId,
    userId: log.userId,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    description: log.description,
    ip: log.ip,
    metadata: fromJson<Record<string, unknown>>(log.metadata, {}),
    createdAt: toIsoRequired(log.createdAt),
  };
}

export class PrismaUserRepository implements UserRepository {
  public constructor(private readonly client: PrismaClient) {}

  public async create(user: User): Promise<User> {
    const createdUser = await this.client.user.create({
      data: {
        ...user,
        createdAt: toDateRequired(user.createdAt),
      },
    });
    return mapUser(createdUser);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const user = await this.client.user.findUnique({
      where: { email },
    });
    return user ? mapUser(user) : null;
  }

  public async findById(id: string): Promise<User | null> {
    const user = await this.client.user.findUnique({
      where: { id },
    });
    return user ? mapUser(user) : null;
  }

  public async update(id: string, data: Parameters<UserRepository["update"]>[1]): Promise<User | null> {
    const user = await this.client.user.update({ where: { id }, data }).catch(() => null);
    return user ? mapUser(user) : null;
  }
}

export class PrismaWorkspaceRepository implements WorkspaceRepository {
  public constructor(private readonly client: PrismaClient) {}

  public async create(workspace: Workspace): Promise<Workspace> {
    const createdWorkspace = await this.client.workspace.create({
      data: {
        ...workspace,
        createdAt: toDateRequired(workspace.createdAt),
      },
    });
    return mapWorkspace(createdWorkspace);
  }

  public async findById(id: string): Promise<Workspace | null> {
    const workspace = await this.client.workspace.findUnique({ where: { id } });
    return workspace ? mapWorkspace(workspace) : null;
  }

  public async findByOwnerId(ownerId: string): Promise<Workspace | null> {
    const workspace = await this.client.workspace.findFirst({ where: { ownerId } });
    return workspace ? mapWorkspace(workspace) : null;
  }

  public async update(id: string, data: Partial<Pick<Workspace, "name" | "plan">>): Promise<Workspace | null> {
    const workspace = await this.client.workspace
      .update({ where: { id }, data })
      .catch(() => null);
    return workspace ? mapWorkspace(workspace) : null;
  }
}

export class PrismaWorkspaceSettingsRepository implements WorkspaceSettingsRepository {
  public constructor(private readonly client: PrismaClient) {}

  public async getByWorkspaceId(workspaceId: string): Promise<WorkspaceSettings> {
    const workspace = await this.client.workspace.findUnique({
      where: { id: workspaceId },
      select: { settings: true },
    });

    return fromJson<WorkspaceSettings>(workspace?.settings ?? null, defaultWorkspaceSettings);
  }

  public async update(workspaceId: string, settings: WorkspaceSettings): Promise<WorkspaceSettings> {
    const workspace = await this.client.workspace.update({
      where: { id: workspaceId },
      data: { settings: toJson(settings) },
      select: { settings: true },
    });

    return fromJson<WorkspaceSettings>(workspace.settings, defaultWorkspaceSettings);
  }
}

export class PrismaGmailAccountRepository implements GmailAccountRepository {
  public constructor(private readonly client: PrismaClient) {}

  public async create(account: GmailAccount): Promise<GmailAccount> {
    const createdAccount = await this.client.gmailAccount.create({
      data: {
        ...account,
        lastSyncAt: toDate(account.lastSyncAt),
        watchExpiration: toDate(account.watchExpiration),
        grantedScopes: toJson(account.grantedScopes),
        createdAt: toDateRequired(account.createdAt),
      },
    });
    return mapGmailAccount(createdAccount);
  }

  public async findById(id: string): Promise<GmailAccount | null> {
    const account = await this.client.gmailAccount.findUnique({ where: { id } });
    return account ? mapGmailAccount(account) : null;
  }

  public async findByWorkspaceId(workspaceId: string): Promise<GmailAccount[]> {
    const accounts = await this.client.gmailAccount.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    });
    return accounts.map(mapGmailAccount);
  }

  public async findByEmail(workspaceId: string, emailAddress: string): Promise<GmailAccount | null> {
    const account = await this.client.gmailAccount.findUnique({
      where: {
        workspaceId_emailAddress: {
          workspaceId,
          emailAddress,
        },
      },
    });
    return account ? mapGmailAccount(account) : null;
  }

  public async update(id: string, data: Partial<GmailAccount>): Promise<GmailAccount | null> {
    const updateData: Prisma.GmailAccountUpdateInput = {};
    if (data.emailAddress !== undefined) updateData.emailAddress = data.emailAddress;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.lastSyncAt !== undefined) updateData.lastSyncAt = toDate(data.lastSyncAt);
    if (data.watchExpiration !== undefined) updateData.watchExpiration = toDate(data.watchExpiration);
    if (data.totalMessages !== undefined) updateData.totalMessages = data.totalMessages;
    if (data.historyId !== undefined) updateData.historyId = data.historyId;
    if (data.grantedScopes !== undefined) updateData.grantedScopes = toJson(data.grantedScopes);
    if (data.errorMessage !== undefined) updateData.errorMessage = data.errorMessage;

    const account = await this.client.gmailAccount.update({ where: { id }, data: updateData }).catch(() => null);
    return account ? mapGmailAccount(account) : null;
  }

  public async delete(id: string): Promise<boolean> {
    await this.client.gmailAccount.delete({ where: { id } }).catch(() => null);
    return true;
  }
}

export class PrismaGmailOAuthTokenRepository implements GmailOAuthTokenRepository {
  public constructor(private readonly client: PrismaClient) {}

  public async upsert(token: GmailOAuthToken): Promise<GmailOAuthToken> {
    const data = {
      workspaceId: token.workspaceId,
      encryptedAccessToken: token.encryptedAccessToken,
      encryptedRefreshToken: token.encryptedRefreshToken,
      encryptedIdToken: token.encryptedIdToken,
      scope: token.scope,
      tokenType: token.tokenType,
      expiryDate: token.expiryDate === null ? null : BigInt(token.expiryDate),
      createdAt: toDateRequired(token.createdAt),
      updatedAt: toDateRequired(token.updatedAt),
    };

    const upsertedToken = await this.client.gmailOAuthToken.upsert({
      where: { gmailAccountId: token.gmailAccountId },
      create: {
        gmailAccountId: token.gmailAccountId,
        ...data,
      },
      update: data,
    });

    return mapGmailOAuthToken(upsertedToken);
  }

  public async findByAccountId(gmailAccountId: string): Promise<GmailOAuthToken | null> {
    const token = await this.client.gmailOAuthToken.findUnique({ where: { gmailAccountId } });
    return token ? mapGmailOAuthToken(token) : null;
  }

  public async deleteByAccountId(gmailAccountId: string): Promise<boolean> {
    await this.client.gmailOAuthToken.delete({ where: { gmailAccountId } }).catch(() => null);
    return true;
  }
}

export class PrismaGmailSyncLogRepository implements GmailSyncLogRepository {
  public constructor(private readonly client: PrismaClient) {}

  public async create(log: GmailSyncLog): Promise<GmailSyncLog> {
    const createdLog = await this.client.gmailSyncLog.create({
      data: this.toPersistence(log),
    });
    return mapGmailSyncLog(createdLog);
  }

  public async findById(id: string): Promise<GmailSyncLog | null> {
    const log = await this.client.gmailSyncLog.findUnique({ where: { id } });
    return log ? mapGmailSyncLog(log) : null;
  }

  public async findByAccount(params: GmailSyncLogQueryParams) {
    const where: Prisma.GmailSyncLogWhereInput = {
      workspaceId: params.workspaceId,
      gmailAccountId: params.gmailAccountId,
    };
    if (params.status) where.status = params.status;

    const [logs, total] = await Promise.all([
      this.client.gmailSyncLog.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.client.gmailSyncLog.count({ where }),
    ]);

    return {
      data: logs.map(mapGmailSyncLog),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  public async update(id: string, data: Partial<GmailSyncLog>): Promise<GmailSyncLog | null> {
    const updateData: Prisma.GmailSyncLogUpdateInput = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.finishedAt !== undefined) updateData.finishedAt = toDate(data.finishedAt);
    if (data.fetchedMessages !== undefined) updateData.fetchedMessages = data.fetchedMessages;
    if (data.createdMessages !== undefined) updateData.createdMessages = data.createdMessages;
    if (data.updatedMessages !== undefined) updateData.updatedMessages = data.updatedMessages;
    if (data.errorMessage !== undefined) updateData.errorMessage = data.errorMessage;
    if (data.metadata !== undefined) updateData.metadata = toJson(data.metadata);

    const log = await this.client.gmailSyncLog.update({ where: { id }, data: updateData }).catch(() => null);
    return log ? mapGmailSyncLog(log) : null;
  }

  private toPersistence(log: GmailSyncLog): Prisma.GmailSyncLogUncheckedCreateInput {
    return {
      id: log.id,
      workspaceId: log.workspaceId,
      gmailAccountId: log.gmailAccountId,
      status: log.status,
      startedAt: toDateRequired(log.startedAt),
      finishedAt: toDate(log.finishedAt),
      fetchedMessages: log.fetchedMessages,
      createdMessages: log.createdMessages,
      updatedMessages: log.updatedMessages,
      errorMessage: log.errorMessage,
      metadata: toJson(log.metadata),
    };
  }
}

export class PrismaEmailMessageRepository implements EmailMessageRepository {
  public constructor(private readonly client: PrismaClient) {}

  public async upsertByGmailMessageId(email: EmailMessage): Promise<{ email: EmailMessage; created: boolean }> {
    const existingEmail = await this.findByGmailMessageId(
      email.workspaceId,
      email.gmailAccountId,
      email.gmailMessageId,
    );

    const data = this.toEmailPersistence(email);
    const updateData: Prisma.EmailMessageUncheckedUpdateInput = {
      threadId: email.threadId,
      accountEmail: email.accountEmail,
      fromEmail: email.fromEmail,
      fromName: email.fromName,
      fromDomain: email.fromDomain,
      toEmails: toJson(email.toEmails),
      subject: email.subject,
      snippet: email.snippet,
      bodyHtml: email.bodyHtml,
      receivedAt: toDateRequired(email.receivedAt),
      labelIds: toJson(email.labelIds),
      hasAttachments: email.hasAttachments,
      attachments: toJson(email.attachments),
      isRead: email.isRead,
      isSpam: email.isSpam,
      isImportant: email.isImportant,
      gmailUrl: email.gmailUrl,
      classification: existingEmail?.classification ? toJson(existingEmail.classification) : toJson(email.classification),
      reviewedAt: existingEmail?.reviewedAt ? toDate(existingEmail.reviewedAt) : toDate(email.reviewedAt),
      actionHistory:
        existingEmail && existingEmail.actionHistory.length > 0
          ? toJson(existingEmail.actionHistory)
          : toJson(email.actionHistory),
    };

    const savedEmail = await this.client.emailMessage.upsert({
      where: {
        workspaceId_gmailAccountId_gmailMessageId: {
          workspaceId: email.workspaceId,
          gmailAccountId: email.gmailAccountId,
          gmailMessageId: email.gmailMessageId,
        },
      },
      create: data,
      update: updateData,
    });

    return {
      email: mapEmail(savedEmail),
      created: !existingEmail,
    };
  }

  public async findById(id: string): Promise<EmailMessage | null> {
    const email = await this.client.emailMessage.findUnique({ where: { id } });
    return email ? mapEmail(email) : null;
  }

  public async findByGmailMessageId(
    workspaceId: string,
    gmailAccountId: string,
    gmailMessageId: string,
  ): Promise<EmailMessage | null> {
    const email = await this.client.emailMessage.findUnique({
      where: {
        workspaceId_gmailAccountId_gmailMessageId: {
          workspaceId,
          gmailAccountId,
          gmailMessageId,
        },
      },
    });
    return email ? mapEmail(email) : null;
  }

  public async findByWorkspace(params: EmailQueryParams) {
    const where: Prisma.EmailMessageWhereInput = {
      workspaceId: params.workspaceId,
    };
    if (params.gmailAccountId) where.gmailAccountId = params.gmailAccountId;
    if (params.fromEmail) where.fromEmail = params.fromEmail;
    if (params.fromDomain) where.fromDomain = params.fromDomain;
    if (params.isImportant !== undefined) where.isImportant = params.isImportant;
    if (params.isSpam !== undefined) where.isSpam = params.isSpam;
    if (params.hasAttachments !== undefined) where.hasAttachments = params.hasAttachments;
    if (params.isRead !== undefined) where.isRead = params.isRead;
    if (params.dateFrom || params.dateTo) {
      where.receivedAt = {};
      if (params.dateFrom) where.receivedAt.gte = new Date(params.dateFrom);
      if (params.dateTo) where.receivedAt.lte = new Date(params.dateTo);
    }

    let emails = (await this.client.emailMessage.findMany({
      where,
      orderBy: { receivedAt: params.sortOrder ?? "desc" },
    })).map(mapEmail);

    const search = params.search?.trim().toLowerCase();
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
      if (params.category && classification?.primaryCategory !== params.category && !classification?.secondaryCategories.includes(params.category)) return false;
      if (params.actionRequired !== undefined && classification?.actionRequired !== params.actionRequired) return false;
      if (params.minImportanceScore !== undefined && (classification?.importanceScore ?? 0) < params.minImportanceScore) return false;
      if (params.minRiskScore !== undefined && (classification?.riskScore ?? 0) < params.minRiskScore) return false;
      if (params.minSecurityScore !== undefined && (classification?.securityScore ?? 0) < params.minSecurityScore) return false;
      return true;
    });

    const sortBy = params.sortBy ?? "receivedAt";
    const sortOrder = params.sortOrder ?? "desc";
    emails = [...emails].sort((left, right) => {
      const leftValue = resolveEmailSortValue(left, sortBy);
      const rightValue = resolveEmailSortValue(right, sortBy);
      const comparison = leftValue > rightValue ? 1 : leftValue < rightValue ? -1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return paginate(emails, params);
  }

  public async update(id: string, data: Partial<EmailMessage>): Promise<EmailMessage | null> {
    const updateData: Prisma.EmailMessageUpdateInput = {};
    if (data.classification !== undefined) updateData.classification = toJson(data.classification);
    if (data.isImportant !== undefined) updateData.isImportant = data.isImportant;
    if (data.isSpam !== undefined) updateData.isSpam = data.isSpam;
    if (data.isRead !== undefined) updateData.isRead = data.isRead;
    if (data.reviewedAt !== undefined) updateData.reviewedAt = toDate(data.reviewedAt);
    if (data.actionHistory !== undefined) updateData.actionHistory = toJson(data.actionHistory);
    if (data.bodyHtml !== undefined) updateData.bodyHtml = data.bodyHtml;
    if (data.labelIds !== undefined) updateData.labelIds = toJson(data.labelIds);
    if (data.attachments !== undefined) updateData.attachments = toJson(data.attachments);

    const email = await this.client.emailMessage.update({ where: { id }, data: updateData }).catch(() => null);
    return email ? mapEmail(email) : null;
  }

  private toEmailPersistence(email: EmailMessage): Prisma.EmailMessageUncheckedCreateInput {
    return {
      id: email.id,
      workspaceId: email.workspaceId,
      gmailAccountId: email.gmailAccountId,
      gmailMessageId: email.gmailMessageId,
      threadId: email.threadId,
      accountEmail: email.accountEmail,
      fromEmail: email.fromEmail,
      fromName: email.fromName,
      fromDomain: email.fromDomain,
      toEmails: toJson(email.toEmails),
      subject: email.subject,
      snippet: email.snippet,
      bodyHtml: email.bodyHtml,
      receivedAt: toDateRequired(email.receivedAt),
      labelIds: toJson(email.labelIds),
      hasAttachments: email.hasAttachments,
      attachments: toJson(email.attachments),
      isRead: email.isRead,
      isSpam: email.isSpam,
      isImportant: email.isImportant,
      reviewedAt: toDate(email.reviewedAt),
      gmailUrl: email.gmailUrl,
      classification: toJson(email.classification),
      actionHistory: toJson(email.actionHistory),
    };
  }
}

export class PrismaAlertRepository implements AlertRepository {
  public constructor(private readonly client: PrismaClient) {}

  public async create(alert: Alert): Promise<Alert> {
    const createdAlert = await this.client.alert.create({ data: this.toPersistence(alert) });
    return mapAlert(createdAlert);
  }

  public async findById(id: string): Promise<Alert | null> {
    const alert = await this.client.alert.findUnique({ where: { id } });
    return alert ? mapAlert(alert) : null;
  }

  public async findByWorkspace(params: AlertQueryParams) {
    const where: Prisma.AlertWhereInput = { workspaceId: params.workspaceId };
    if (params.status) where.status = params.status;
    if (params.severity) where.severity = params.severity;
    if (params.type) where.type = params.type;

    const [alerts, total] = await Promise.all([
      this.client.alert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.client.alert.count({ where }),
    ]);

    return {
      data: alerts.map(mapAlert),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  public async update(id: string, data: Partial<Alert>): Promise<Alert | null> {
    const updateData: Prisma.AlertUpdateInput = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.resolvedAt !== undefined) updateData.resolvedAt = toDate(data.resolvedAt);
    if (data.severity !== undefined) updateData.severity = data.severity;
    if (data.description !== undefined) updateData.description = data.description;

    const alert = await this.client.alert.update({ where: { id }, data: updateData }).catch(() => null);
    return alert ? mapAlert(alert) : null;
  }

  private toPersistence(alert: Alert): Prisma.AlertUncheckedCreateInput {
    return {
      ...alert,
      createdAt: toDateRequired(alert.createdAt),
      resolvedAt: toDate(alert.resolvedAt),
    };
  }
}

export class PrismaSenderProfileRepository implements SenderProfileRepository {
  public constructor(private readonly client: PrismaClient) {}

  public async create(sender: SenderProfile): Promise<SenderProfile> {
    const createdSender = await this.client.senderProfile.create({
      data: {
        ...sender,
        lastSeenAt: toDateRequired(sender.lastSeenAt),
      },
    });
    return mapSender(createdSender);
  }

  public async findById(id: string): Promise<SenderProfile | null> {
    const sender = await this.client.senderProfile.findUnique({ where: { id } });
    return sender ? mapSender(sender) : null;
  }

  public async findByEmail(workspaceId: string, email: string): Promise<SenderProfile | null> {
    const sender = await this.client.senderProfile.findUnique({
      where: { workspaceId_email: { workspaceId, email } },
    });
    return sender ? mapSender(sender) : null;
  }

  public async findByWorkspace(params: SenderQueryParams) {
    const where: Prisma.SenderProfileWhereInput = { workspaceId: params.workspaceId };
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: "insensitive" } },
        { domain: { contains: params.search, mode: "insensitive" } },
        { displayName: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [senders, total] = await Promise.all([
      this.client.senderProfile.findMany({
        where,
        orderBy: { totalMessages: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.client.senderProfile.count({ where }),
    ]);

    return {
      data: senders.map(mapSender),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  public async update(id: string, data: Partial<SenderProfile>): Promise<SenderProfile | null> {
    const updateData: Prisma.SenderProfileUpdateInput = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.trustScore !== undefined) updateData.trustScore = data.trustScore;
    if (data.riskScore !== undefined) updateData.riskScore = data.riskScore;
    if (data.totalMessages !== undefined) updateData.totalMessages = data.totalMessages;
    if (data.lastSeenAt !== undefined) updateData.lastSeenAt = toDateRequired(data.lastSeenAt);
    if (data.category !== undefined) updateData.category = data.category;
    if (data.displayName !== undefined) updateData.displayName = data.displayName;

    const sender = await this.client.senderProfile.update({ where: { id }, data: updateData }).catch(() => null);
    return sender ? mapSender(sender) : null;
  }
}

export class PrismaAutomationRuleRepository implements AutomationRuleRepository {
  public constructor(private readonly client: PrismaClient) {}

  public async create(rule: AutomationRule): Promise<AutomationRule> {
    const createdRule = await this.client.automationRule.create({
      data: this.toPersistence(rule),
    });
    return mapRule(createdRule);
  }

  public async findById(id: string): Promise<AutomationRule | null> {
    const rule = await this.client.automationRule.findUnique({ where: { id } });
    return rule ? mapRule(rule) : null;
  }

  public async findByWorkspace(params: RuleQueryParams) {
    const where: Prisma.AutomationRuleWhereInput = { workspaceId: params.workspaceId };
    if (params.enabled !== undefined) where.enabled = params.enabled;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [rules, total] = await Promise.all([
      this.client.automationRule.findMany({
        where,
        orderBy: { priority: "asc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.client.automationRule.count({ where }),
    ]);

    return {
      data: rules.map(mapRule),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }

  public async update(id: string, data: Partial<AutomationRule>): Promise<AutomationRule | null> {
    const updateData: Prisma.AutomationRuleUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.conditions !== undefined) updateData.conditions = toJson(data.conditions);
    if (data.actions !== undefined) updateData.actions = toJson(data.actions);
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.timesApplied !== undefined) updateData.timesApplied = data.timesApplied;
    if (data.updatedAt !== undefined) updateData.updatedAt = toDateRequired(data.updatedAt);

    const rule = await this.client.automationRule.update({ where: { id }, data: updateData }).catch(() => null);
    return rule ? mapRule(rule) : null;
  }

  public async delete(id: string): Promise<boolean> {
    await this.client.automationRule.delete({ where: { id } }).catch(() => null);
    return true;
  }

  private toPersistence(rule: AutomationRule): Prisma.AutomationRuleUncheckedCreateInput {
    return {
      ...rule,
      conditions: toJson(rule.conditions),
      actions: toJson(rule.actions),
      createdAt: toDateRequired(rule.createdAt),
      updatedAt: toDateRequired(rule.updatedAt),
    };
  }
}

export class PrismaAuditLogRepository implements AuditLogRepository {
  public constructor(private readonly client: PrismaClient) {}

  public async create(log: AuditLog): Promise<AuditLog> {
    const createdLog = await this.client.auditLog.create({
      data: {
        ...log,
        metadata: toJson(log.metadata),
        createdAt: toDateRequired(log.createdAt),
      },
    });
    return mapAuditLog(createdLog);
  }

  public async findByWorkspace(params: AuditQueryParams) {
    const where: Prisma.AuditLogWhereInput = { workspaceId: params.workspaceId };
    if (params.action) where.action = params.action;
    if (params.userId) where.userId = params.userId;
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
      if (params.dateTo) where.createdAt.lte = new Date(params.dateTo);
    }

    const [logs, total] = await Promise.all([
      this.client.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.client.auditLog.count({ where }),
    ]);

    return {
      data: logs.map(mapAuditLog),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
      },
    };
  }
}

function resolveEmailSortValue(
  email: EmailMessage,
  sortBy: NonNullable<EmailQueryParams["sortBy"]>,
): number {
  if (sortBy === "receivedAt") return new Date(email.receivedAt).getTime();
  if (sortBy === "importanceScore") return email.classification?.importanceScore ?? 0;
  if (sortBy === "riskScore") return email.classification?.riskScore ?? 0;
  return email.classification?.securityScore ?? 0;
}
