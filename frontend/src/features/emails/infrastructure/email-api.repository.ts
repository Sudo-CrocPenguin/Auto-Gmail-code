import type { DataEnvelope, PaginatedResponse } from "../../../shared/domain/api-response";
import { unwrapData } from "../../../shared/domain/api-response";
import type { HttpClient } from "../../../shared/infrastructure/http/http-client";
import type { EmailRepository } from "../application/email.repository";
import { emailCategories, type EmailCategory } from "../domain/email-category";
import type {
  EmailActionHistoryEntry,
  EmailAttachment,
  EmailClassification,
  EmailDetail,
  EmailListQuery,
  EmailSummary,
} from "../domain/email-message.entity";

interface EmailApiMessage {
  id: string;
  gmailAccountId: string;
  subject?: string | null;
  fromName?: string | null;
  fromEmail: string;
  snippet?: string | null;
  receivedAt: string;
  isImportant?: boolean;
  isRead?: boolean;
  isSpam?: boolean;
  actionRequired?: boolean;
  primaryCategory?: string;
  secondaryCategories?: string[];
  riskScore?: number;
  securityScore?: number;
  importanceScore?: number;
  spamScore?: number;
  attachmentCount?: number;
  accountEmail?: string;
  fromDomain?: string;
  toEmails?: string[];
  bodyHtml?: string | null;
  bodyText?: string | null;
  labelIds?: string[];
  hasAttachments?: boolean;
  attachments?: EmailAttachment[];
  reviewedAt?: string | null;
  gmailUrl?: string | null;
  classification?: EmailClassification | null;
  actionHistory?: EmailActionHistoryEntry[];
}

export class EmailApiRepository implements EmailRepository {
  private readonly http: HttpClient;

  public constructor(http: HttpClient) {
    this.http = http;
  }

  public async list(query: EmailListQuery = {}): Promise<PaginatedResponse<EmailSummary>> {
    const payload = await this.http.get<PaginatedResponse<EmailApiMessage>>("/emails", {
      page: query.page ?? 1,
      limit: query.limit ?? 12,
      search: query.search,
      category: query.category,
      isImportant: query.isImportant,
      isSpam: query.isSpam,
      actionRequired: query.actionRequired,
      hasAttachments: query.hasAttachments,
      isRead: query.isRead,
      minRiskScore: query.minRiskScore,
      sortBy: query.sortBy ?? "receivedAt",
      sortOrder: query.sortOrder ?? "desc",
    });

    return {
      ...payload,
      data: payload.data.map(normalizeEmailSummary),
    };
  }

  public listRecent(): Promise<PaginatedResponse<EmailSummary>> {
    return this.list({
      page: 1,
      limit: 8,
      sortBy: "receivedAt",
      sortOrder: "desc",
    });
  }

  public async detail(emailId: string): Promise<EmailDetail> {
    const payload = await this.http.get<DataEnvelope<EmailApiMessage>>(`/emails/${emailId}`);
    return normalizeEmailDetail(unwrapData(payload));
  }

  public async markReviewed(emailId: string): Promise<EmailDetail> {
    const payload = await this.http.post<DataEnvelope<EmailApiMessage>>(`/emails/${emailId}/mark-reviewed`);
    return normalizeEmailDetail(unwrapData(payload));
  }

  public async markImportant(emailId: string): Promise<EmailDetail> {
    const payload = await this.http.post<DataEnvelope<EmailApiMessage>>(`/emails/${emailId}/mark-important`);
    return normalizeEmailDetail(unwrapData(payload));
  }
}

function normalizeEmailSummary(message: EmailApiMessage): EmailSummary {
  const classification = message.classification ?? null;

  return {
    id: message.id,
    gmailAccountId: message.gmailAccountId,
    subject: message.subject?.trim() || "Sin asunto",
    fromName: message.fromName ?? null,
    fromEmail: message.fromEmail,
    snippet: message.snippet ?? null,
    receivedAt: message.receivedAt,
    primaryCategory: coerceEmailCategory(classification?.primaryCategory ?? message.primaryCategory),
    secondaryCategories: normalizeCategories(classification?.secondaryCategories ?? message.secondaryCategories),
    isImportant: Boolean(message.isImportant),
    isRead: Boolean(message.isRead),
    isSpam: Boolean(message.isSpam),
    actionRequired: classification?.actionRequired ?? Boolean(message.actionRequired),
    riskScore: classification?.riskScore ?? message.riskScore ?? 0,
    securityScore: classification?.securityScore ?? message.securityScore ?? 0,
    importanceScore: classification?.importanceScore ?? message.importanceScore ?? 0,
    spamScore: classification?.spamScore ?? message.spamScore ?? 0,
    attachmentCount: message.attachmentCount ?? message.attachments?.length ?? 0,
    classification,
  };
}

function normalizeEmailDetail(message: EmailApiMessage): EmailDetail {
  const summary = normalizeEmailSummary(message);

  return {
    ...summary,
    accountEmail: message.accountEmail ?? "",
    fromDomain: message.fromDomain ?? message.fromEmail.split("@")[1] ?? "",
    toEmails: message.toEmails ?? [],
    bodyHtml: message.bodyHtml ?? null,
    bodyText: message.bodyText ?? message.snippet ?? null,
    labelIds: message.labelIds ?? [],
    hasAttachments: message.hasAttachments ?? Boolean(summary.attachmentCount),
    attachments: message.attachments ?? [],
    reviewedAt: message.reviewedAt ?? null,
    gmailUrl: message.gmailUrl ?? null,
    actionHistory: message.actionHistory ?? [],
  };
}

function normalizeCategories(categories: string[] | undefined): EmailCategory[] {
  return (categories ?? []).map(coerceEmailCategory);
}

function coerceEmailCategory(category: string | undefined): EmailCategory {
  if (emailCategories.includes(category as EmailCategory)) {
    return category as EmailCategory;
  }

  return "UNCLASSIFIED";
}
