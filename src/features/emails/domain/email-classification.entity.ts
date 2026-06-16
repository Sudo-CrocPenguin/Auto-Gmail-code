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

