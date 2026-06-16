export interface EmailSummary {
  id: string;
  gmailAccountId: string;
  subject: string;
  fromName?: string | null;
  fromEmail: string;
  receivedAt: string;
  primaryCategory: string;
  isImportant: boolean;
  isRead: boolean;
  isSpam: boolean;
  actionRequired: boolean;
  riskScore: number;
  securityScore: number;
  importanceScore: number;
  attachmentCount?: number;
}
