import type { EmailCategory } from "./email-category";

export interface EmailClassification {
  id: string;
  emailMessageId: string;
  primaryCategory: EmailCategory;
  secondaryCategories: EmailCategory[];
  importanceScore: number;
  spamScore: number;
  riskScore: number;
  securityScore: number;
  actionRequired: boolean;
  explanation: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface EmailActionHistoryEntry {
  id: string;
  actor: "USER" | "SYSTEM";
  action: string;
  description: string;
  createdAt: string;
}

export interface EmailSummary {
  id: string;
  gmailAccountId: string;
  subject: string;
  fromName?: string | null;
  fromEmail: string;
  snippet?: string | null;
  receivedAt: string;
  primaryCategory: EmailCategory;
  secondaryCategories: EmailCategory[];
  isImportant: boolean;
  isRead: boolean;
  isSpam: boolean;
  actionRequired: boolean;
  riskScore: number;
  securityScore: number;
  importanceScore: number;
  spamScore: number;
  attachmentCount?: number;
  classification?: EmailClassification | null;
}

export interface EmailDetail extends EmailSummary {
  accountEmail: string;
  fromDomain: string;
  toEmails: string[];
  bodyHtml: string | null;
  bodyText: string | null;
  labelIds: string[];
  hasAttachments: boolean;
  attachments: EmailAttachment[];
  reviewedAt: string | null;
  gmailUrl: string | null;
  actionHistory: EmailActionHistoryEntry[];
}

export interface EmailListQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: EmailCategory;
  isImportant?: boolean;
  isSpam?: boolean;
  actionRequired?: boolean;
  hasAttachments?: boolean;
  isRead?: boolean;
  minRiskScore?: number;
  sortBy?: "receivedAt" | "importanceScore" | "riskScore" | "securityScore";
  sortOrder?: "asc" | "desc";
}
