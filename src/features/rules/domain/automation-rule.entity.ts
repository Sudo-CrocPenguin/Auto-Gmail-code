import type { EmailCategory } from "../../emails/domain/email-category";

export type RuleConditionField =
  | "fromEmail"
  | "fromDomain"
  | "subject"
  | "body"
  | "gmailLabel"
  | "hasAttachment"
  | "importanceScore"
  | "riskScore"
  | "securityScore"
  | "gmailAccountId"
  | "detectedCategory";

export type RuleConditionOperator =
  | "equals"
  | "contains"
  | "greaterThan"
  | "lessThan"
  | "exists";

export interface RuleCondition {
  id: string;
  field: RuleConditionField;
  operator: RuleConditionOperator;
  value: string | number | boolean;
}

export type RuleActionType =
  | "assignCategory"
  | "markImportant"
  | "generateAlert"
  | "markReview"
  | "ignoreSpam"
  | "applyInternalLabel"
  | "applyGmailLabel"
  | "notify";

export interface RuleAction {
  id: string;
  type: RuleActionType;
  value: EmailCategory | string | boolean;
}

export interface AutomationRule {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  enabled: boolean;
  timesApplied: number;
  createdAt: string;
  updatedAt: string;
}

