import type { EmailClassification } from "./email-classification.entity";

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

export interface EmailMessage {
  id: string;
  workspaceId: string;
  gmailAccountId: string;
  gmailMessageId: string;
  threadId: string;
  accountEmail: string;
  fromEmail: string;
  fromName: string | null;
  fromDomain: string;
  toEmails: string[];
  subject: string;
  snippet: string;
  bodyHtml: string | null;
  receivedAt: string;
  labelIds: string[];
  hasAttachments: boolean;
  attachments: EmailAttachment[];
  isRead: boolean;
  isSpam: boolean;
  isImportant: boolean;
  reviewedAt: string | null;
  gmailUrl: string | null;
  classification: EmailClassification | null;
  actionHistory: EmailActionHistoryEntry[];
}

