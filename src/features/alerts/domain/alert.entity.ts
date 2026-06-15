export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AlertStatus = "NEW" | "SEEN" | "RESOLVED" | "IGNORED";

export type AlertType =
  | "SECURITY_LOGIN"
  | "SECURITY_PASSWORD_CHANGE"
  | "SECURITY_VERIFICATION_CODE"
  | "SECURITY_NEW_DEVICE"
  | "FINANCIAL_PAYMENT"
  | "LEGAL_NOTICE"
  | "HIGH_IMPORTANCE"
  | "POSSIBLE_SPAM"
  | "POSSIBLE_PHISHING"
  | "SYNC_ERROR"
  | "ACCOUNT_RECONNECT_REQUIRED";

export interface Alert {
  id: string;
  workspaceId: string;
  gmailAccountId: string;
  emailMessageId: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  recommendedAction: string;
  createdAt: string;
  resolvedAt: string | null;
}

