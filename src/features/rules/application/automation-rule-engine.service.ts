import { randomUUID } from "node:crypto";

import { emailCategories, type EmailCategory } from "../../emails/domain/email-category";
import type { EmailClassification } from "../../emails/domain/email-classification.entity";
import type { EmailMessage } from "../../emails/domain/email-message.entity";
import type { AutomationRule, RuleAction, RuleCondition } from "../domain/automation-rule.entity";
import type { AutomationRuleRepository } from "../domain/automation-rule.repository";

export interface AppliedAutomationRule {
  id: string;
  name: string;
  timesApplied: number;
  generatedAlert: boolean;
  actionDescriptions: string[];
}

export interface RuleApplicationResult {
  email: EmailMessage;
  appliedRules: AppliedAutomationRule[];
}

export class AutomationRuleEngine {
  public constructor(private readonly rules: AutomationRuleRepository) {}

  public async applyToNewEmail(email: EmailMessage): Promise<RuleApplicationResult> {
    const enabledRules = await this.rules.findByWorkspace({
      workspaceId: email.workspaceId,
      enabled: true,
      page: 1,
      limit: 100,
    });
    const orderedRules = [...enabledRules.data].sort((left, right) => right.priority - left.priority);
    let nextEmail = cloneEmail(email);
    const appliedRules: AppliedAutomationRule[] = [];

    for (const rule of orderedRules) {
      if (!rule.conditions.every((condition) => matchesCondition(nextEmail, condition))) {
        continue;
      }

      const result = applyRuleActions(nextEmail, rule);
      nextEmail = addRuleHistory(result.email, rule, result.actionDescriptions);
      appliedRules.push({
        id: rule.id,
        name: rule.name,
        timesApplied: rule.timesApplied,
        generatedAlert: result.generatedAlert,
        actionDescriptions: result.actionDescriptions,
      });
    }

    return {
      email: nextEmail,
      appliedRules,
    };
  }

  public async incrementTimesApplied(appliedRules: AppliedAutomationRule[]): Promise<void> {
    const countsByRule = new Map<string, { rule: AppliedAutomationRule; count: number }>();

    for (const rule of appliedRules) {
      const current = countsByRule.get(rule.id);
      countsByRule.set(rule.id, {
        rule,
        count: (current?.count ?? 0) + 1,
      });
    }

    for (const { rule, count } of countsByRule.values()) {
      await this.rules.update(rule.id, {
        timesApplied: rule.timesApplied + count,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

function applyRuleActions(
  email: EmailMessage,
  rule: AutomationRule,
): { email: EmailMessage; generatedAlert: boolean; actionDescriptions: string[] } {
  let nextEmail = email;
  let generatedAlert = false;
  const actionDescriptions: string[] = [];

  for (const action of rule.actions) {
    const result = applyRuleAction(nextEmail, action);
    nextEmail = result.email;
    generatedAlert = generatedAlert || result.generatedAlert;
    actionDescriptions.push(result.description);
  }

  return {
    email: nextEmail,
    generatedAlert,
    actionDescriptions,
  };
}

function applyRuleAction(
  email: EmailMessage,
  action: RuleAction,
): { email: EmailMessage; generatedAlert: boolean; description: string } {
  switch (action.type) {
    case "assignCategory": {
      const category = typeof action.value === "string" && isEmailCategory(action.value) ? action.value : null;
      if (!category) {
        return { email, generatedAlert: false, description: "Categoria invalida ignorada" };
      }

      return {
        email: assignCategory(email, category, `Regla automatica asigno categoria ${category}.`),
        generatedAlert: false,
        description: `Categoria asignada a ${category}`,
      };
    }
    case "markImportant": {
      const enabled = toBoolean(action.value);
      return {
        email: {
          ...boostImportance(email, enabled),
          isImportant: enabled,
        },
        generatedAlert: false,
        description: enabled ? "Marcado como importante" : "Importancia desactivada",
      };
    }
    case "generateAlert":
      return {
        email,
        generatedAlert: toBoolean(action.value),
        description: "Alerta solicitada por regla",
      };
    case "markReview": {
      if (!toBoolean(action.value)) {
        return { email, generatedAlert: false, description: "Revision omitida por regla" };
      }

      return {
        email: markForReview(email),
        generatedAlert: false,
        description: "Marcado para revision",
      };
    }
    case "ignoreSpam": {
      if (!toBoolean(action.value)) {
        return { email, generatedAlert: false, description: "Spam conservado por regla" };
      }

      return {
        email: lowerSpamSignal(email),
        generatedAlert: false,
        description: "Spam ignorado por regla",
      };
    }
    case "applyInternalLabel":
      return {
        email: addInternalLabel(email, String(action.value)),
        generatedAlert: false,
        description: `Etiqueta interna aplicada: ${String(action.value)}`,
      };
    case "applyGmailLabel":
      return {
        email,
        generatedAlert: false,
        description: `Etiqueta Gmail pendiente: ${String(action.value)}`,
      };
    case "notify":
      return {
        email,
        generatedAlert: false,
        description: `Notificacion registrada: ${String(action.value)}`,
      };
  }
}

function matchesCondition(email: EmailMessage, condition: RuleCondition): boolean {
  const actualValue = resolveConditionValue(email, condition.field);

  switch (condition.operator) {
    case "exists":
      return valueExists(actualValue);
    case "equals":
      return compareEquals(actualValue, condition.value);
    case "contains":
      return compareContains(actualValue, condition.value);
    case "greaterThan":
      return compareNumber(actualValue, condition.value, (actual, expected) => actual > expected);
    case "lessThan":
      return compareNumber(actualValue, condition.value, (actual, expected) => actual < expected);
  }
}

function resolveConditionValue(email: EmailMessage, field: RuleCondition["field"]): string | number | boolean | string[] | null {
  switch (field) {
    case "fromEmail":
      return email.fromEmail;
    case "fromDomain":
      return email.fromDomain;
    case "subject":
      return email.subject;
    case "body":
      return [email.snippet, email.bodyHtml].filter(Boolean).join(" ");
    case "gmailLabel":
      return email.labelIds;
    case "hasAttachment":
      return email.hasAttachments;
    case "importanceScore":
      return email.classification?.importanceScore ?? null;
    case "riskScore":
      return email.classification?.riskScore ?? null;
    case "securityScore":
      return email.classification?.securityScore ?? null;
    case "gmailAccountId":
      return email.gmailAccountId;
    case "detectedCategory":
      return email.classification
        ? [email.classification.primaryCategory, ...email.classification.secondaryCategories]
        : null;
  }
}

function assignCategory(email: EmailMessage, category: EmailCategory, explanation: string): EmailMessage {
  return updateClassification(email, (classification) => {
    const previousCategory = classification.primaryCategory;
    const secondaryCategories = new Set(classification.secondaryCategories);

    if (previousCategory !== category) {
      secondaryCategories.add(previousCategory);
    }

    return {
      ...classification,
      primaryCategory: category,
      secondaryCategories: Array.from(secondaryCategories).filter((current) => current !== category),
      actionRequired: classification.actionRequired || category === "REVIEW",
      explanation: appendExplanation(classification.explanation, explanation),
      updatedAt: new Date().toISOString(),
    };
  });
}

function boostImportance(email: EmailMessage, enabled: boolean): EmailMessage {
  return updateClassification(email, (classification) => ({
    ...classification,
    importanceScore: enabled ? Math.max(classification.importanceScore, 85) : classification.importanceScore,
    updatedAt: new Date().toISOString(),
  }));
}

function markForReview(email: EmailMessage): EmailMessage {
  return assignCategory(
    updateClassification(email, (classification) => ({
      ...classification,
      actionRequired: true,
      updatedAt: new Date().toISOString(),
    })),
    "REVIEW",
    "Regla automatica marco el correo para revision.",
  );
}

function lowerSpamSignal(email: EmailMessage): EmailMessage {
  const updatedEmail = updateClassification(email, (classification) => ({
    ...classification,
    primaryCategory: classification.primaryCategory === "SPAM_PROBABLE" ? "UNCLASSIFIED" : classification.primaryCategory,
    spamScore: Math.min(classification.spamScore, 20),
    explanation: appendExplanation(classification.explanation, "Regla automatica redujo senal de spam."),
    updatedAt: new Date().toISOString(),
  }));

  return {
    ...updatedEmail,
    isSpam: false,
  };
}

function addInternalLabel(email: EmailMessage, value: string): EmailMessage {
  const label = `internal:${value.trim().toLowerCase().replaceAll(/\s+/g, "-")}`;

  if (!value.trim() || email.labelIds.includes(label)) {
    return email;
  }

  return {
    ...email,
    labelIds: [...email.labelIds, label],
  };
}

function updateClassification(
  email: EmailMessage,
  updater: (classification: EmailClassification) => EmailClassification,
): EmailMessage {
  if (!email.classification) {
    return email;
  }

  return {
    ...email,
    classification: updater({
      ...email.classification,
      secondaryCategories: [...email.classification.secondaryCategories],
    }),
  };
}

function addRuleHistory(email: EmailMessage, rule: AutomationRule, actionDescriptions: string[]): EmailMessage {
  return {
    ...email,
    actionHistory: [
      ...email.actionHistory,
      {
        id: randomUUID(),
        actor: "SYSTEM",
        action: "AUTOMATION_RULE_APPLIED",
        description: `Regla "${rule.name}" aplicada: ${actionDescriptions.join(", ")}.`,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

function cloneEmail(email: EmailMessage): EmailMessage {
  return {
    ...email,
    labelIds: [...email.labelIds],
    toEmails: [...email.toEmails],
    attachments: email.attachments.map((attachment) => ({ ...attachment })),
    actionHistory: email.actionHistory.map((entry) => ({ ...entry })),
    classification: email.classification
      ? {
          ...email.classification,
          secondaryCategories: [...email.classification.secondaryCategories],
        }
      : null,
  };
}

function valueExists(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
}

function compareEquals(actual: unknown, expected: RuleCondition["value"]): boolean {
  if (Array.isArray(actual)) {
    return actual.some((entry) => compareEquals(entry, expected));
  }

  return normalizeComparable(actual) === normalizeComparable(expected);
}

function compareContains(actual: unknown, expected: RuleCondition["value"]): boolean {
  const normalizedExpected = normalizeComparable(expected);

  if (Array.isArray(actual)) {
    return actual.some((entry) => normalizeComparable(entry).includes(normalizedExpected));
  }

  return normalizeComparable(actual).includes(normalizedExpected);
}

function compareNumber(
  actual: unknown,
  expected: RuleCondition["value"],
  comparator: (actual: number, expected: number) => boolean,
): boolean {
  const actualNumber = Number(actual);
  const expectedNumber = Number(expected);

  if (Number.isNaN(actualNumber) || Number.isNaN(expectedNumber)) {
    return false;
  }

  return comparator(actualNumber, expectedNumber);
}

function normalizeComparable(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function toBoolean(value: RuleAction["value"]): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  return String(value).toLowerCase() !== "false";
}

function isEmailCategory(value: string): value is EmailCategory {
  return emailCategories.includes(value as EmailCategory);
}

function appendExplanation(current: string, addition: string): string {
  return `${current} ${addition}`.trim();
}
