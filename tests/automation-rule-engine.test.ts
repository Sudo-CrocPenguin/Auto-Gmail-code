import { describe, expect, it } from "vitest";

import type { EmailMessage } from "../src/features/emails/domain/email-message.entity";
import { AutomationRuleEngine } from "../src/features/rules/application/automation-rule-engine.service";
import type { AutomationRule } from "../src/features/rules/domain/automation-rule.entity";
import type { AutomationRuleRepository } from "../src/features/rules/domain/automation-rule.repository";

describe("AutomationRuleEngine", () => {
  it("aplica reglas habilitadas a correos nuevos e incrementa timesApplied", async () => {
    const rule: AutomationRule = {
      id: "rule_vip",
      workspaceId: "workspace_1",
      name: "Cliente VIP",
      description: "Prioriza correos de clientes VIP.",
      conditions: [
        { id: "condition_domain", field: "fromDomain", operator: "equals", value: "client.com" },
        { id: "condition_score", field: "importanceScore", operator: "greaterThan", value: 40 },
      ],
      actions: [
        { id: "action_category", type: "assignCategory", value: "CLIENTS" },
        { id: "action_important", type: "markImportant", value: true },
        { id: "action_label", type: "applyInternalLabel", value: "VIP" },
        { id: "action_alert", type: "generateAlert", value: true },
      ],
      priority: 50,
      enabled: true,
      timesApplied: 3,
      createdAt: "2026-06-16T00:00:00.000Z",
      updatedAt: "2026-06-16T00:00:00.000Z",
    };
    const updates: Array<Partial<AutomationRule>> = [];
    const repository: AutomationRuleRepository = {
      create: async (automationRule) => automationRule,
      findById: async () => rule,
      findByWorkspace: async () => ({
        data: [rule],
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
      }),
      update: async (_id, data) => {
        updates.push(data);
        return { ...rule, ...data };
      },
      delete: async () => true,
    };
    const engine = new AutomationRuleEngine(repository);

    const result = await engine.applyToNewEmail(buildEmail());

    expect(result.appliedRules).toHaveLength(1);
    expect(result.appliedRules[0]).toMatchObject({
      id: "rule_vip",
      generatedAlert: true,
    });
    expect(result.email.classification?.primaryCategory).toBe("CLIENTS");
    expect(result.email.classification?.importanceScore).toBe(85);
    expect(result.email.isImportant).toBe(true);
    expect(result.email.labelIds).toContain("internal:vip");
    expect(result.email.actionHistory.at(-1)?.action).toBe("AUTOMATION_RULE_APPLIED");

    await engine.incrementTimesApplied([...result.appliedRules, ...result.appliedRules]);

    expect(updates[0]).toMatchObject({ timesApplied: 5 });
  });
});

function buildEmail(): EmailMessage {
  return {
    id: "email_1",
    workspaceId: "workspace_1",
    gmailAccountId: "gmail_1",
    gmailMessageId: "gmail_message_1",
    threadId: "thread_1",
    accountEmail: "owner@gmail.com",
    fromEmail: "ceo@client.com",
    fromName: "Client CEO",
    fromDomain: "client.com",
    toEmails: ["owner@gmail.com"],
    subject: "Contrato urgente",
    snippet: "Necesitamos revisar el contrato.",
    bodyHtml: "<p>Necesitamos revisar el contrato.</p>",
    bodyText: "Necesitamos revisar el contrato.",
    receivedAt: "2026-06-16T00:00:00.000Z",
    labelIds: ["INBOX"],
    hasAttachments: false,
    attachments: [],
    isRead: false,
    isSpam: false,
    isImportant: false,
    reviewedAt: null,
    gmailUrl: null,
    classification: {
      id: "classification_1",
      emailMessageId: "email_1",
      primaryCategory: "UNCLASSIFIED",
      secondaryCategories: [],
      importanceScore: 45,
      spamScore: 5,
      riskScore: 20,
      securityScore: 10,
      actionRequired: false,
      explanation: "Clasificacion base.",
      createdAt: "2026-06-16T00:00:00.000Z",
      updatedAt: "2026-06-16T00:00:00.000Z",
    },
    actionHistory: [],
  };
}
