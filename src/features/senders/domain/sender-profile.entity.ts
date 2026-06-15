import type { EmailCategory } from "../../emails/domain/email-category";

export type SenderStatus = "NORMAL" | "TRUSTED" | "SUSPICIOUS" | "BLOCKED";

export interface SenderProfile {
  id: string;
  workspaceId: string;
  email: string;
  domain: string;
  displayName: string | null;
  totalMessages: number;
  lastSeenAt: string;
  trustScore: number;
  riskScore: number;
  category: EmailCategory | null;
  status: SenderStatus;
}

