import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { defaultWorkspaceSettings } from "../src/features/settings/domain/workspace-settings.entity";
import {
  PrismaAuditLogRepository,
  PrismaAutomationRuleRepository,
  PrismaGmailAccountRepository,
  PrismaGmailOAuthTokenRepository,
  PrismaGmailSyncLogRepository,
  PrismaUserRepository,
  PrismaWorkspaceRepository,
  PrismaWorkspaceSettingsRepository,
} from "../src/shared/infrastructure/persistence/prisma-repositories";

const databaseUrl = process.env.PRISMA_TEST_DATABASE_URL;

if (!databaseUrl) {
  describe.skip("Prisma persistence", () => {
    it("requiere PRISMA_TEST_DATABASE_URL", () => {
      expect(databaseUrl).toBeUndefined();
    });
  });
} else {
describe("Prisma persistence", () => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  const users = new PrismaUserRepository(prisma);
  const workspaces = new PrismaWorkspaceRepository(prisma);
  const settings = new PrismaWorkspaceSettingsRepository(prisma);
  const gmailAccounts = new PrismaGmailAccountRepository(prisma);
  const oauthTokens = new PrismaGmailOAuthTokenRepository(prisma);
  const syncLogs = new PrismaGmailSyncLogRepository(prisma);
  const rules = new PrismaAutomationRuleRepository(prisma);
  const auditLogs = new PrismaAuditLogRepository(prisma);

  it("persiste entidades criticas del backend", async () => {
    const suffix = randomUUID();
    const workspaceId = `workspace_${suffix}`;
    const userId = `user_${suffix}`;
    const gmailAccountId = `gmail_${suffix}`;
    const now = new Date().toISOString();

    await workspaces.create({
      id: workspaceId,
      name: "Workspace Prisma Test",
      ownerId: userId,
      plan: "starter",
      createdAt: now,
    });

    await users.create({
      id: userId,
      workspaceId,
      name: "Prisma Test",
      email: `prisma-${suffix}@autogmail.local`,
      passwordHash: "hashed-password",
      role: "OWNER",
      createdAt: now,
    });

    await settings.update(workspaceId, {
      ...defaultWorkspaceSettings,
      theme: "dark",
    });

    await gmailAccounts.create({
      id: gmailAccountId,
      workspaceId,
      emailAddress: `prisma-${suffix}@gmail.com`,
      status: "CONNECTED",
      lastSyncAt: null,
      watchExpiration: null,
      totalMessages: 0,
      historyId: null,
      grantedScopes: ["https://www.googleapis.com/auth/gmail.readonly"],
      errorMessage: null,
      createdAt: now,
    });

    await oauthTokens.upsert({
      gmailAccountId,
      workspaceId,
      encryptedAccessToken: "encrypted-access",
      encryptedRefreshToken: "encrypted-refresh",
      encryptedIdToken: null,
      scope: "https://www.googleapis.com/auth/gmail.readonly",
      tokenType: "Bearer",
      expiryDate: Date.now() + 3600000,
      createdAt: now,
      updatedAt: now,
    });

    await syncLogs.create({
      id: `sync_${suffix}`,
      workspaceId,
      gmailAccountId,
      status: "COMPLETED",
      startedAt: now,
      finishedAt: now,
      fetchedMessages: 3,
      createdMessages: 2,
      updatedMessages: 1,
      errorMessage: null,
      metadata: { mode: "test" },
    });

    await rules.create({
      id: `rule_${suffix}`,
      workspaceId,
      name: "Regla Prisma Test",
      description: "Valida persistencia de reglas.",
      conditions: [{ field: "fromDomain", operator: "contains", value: "example.com" }],
      actions: [{ type: "markImportant", value: true }],
      priority: 10,
      enabled: true,
      timesApplied: 0,
      createdAt: now,
      updatedAt: now,
    });

    await auditLogs.create({
      id: `audit_${suffix}`,
      workspaceId,
      userId,
      action: "PRISMA_TEST",
      entityType: "Workspace",
      entityId: workspaceId,
      description: "Validacion de persistencia Prisma.",
      ip: null,
      metadata: {},
      createdAt: now,
    });

    await expect(workspaces.findById(workspaceId)).resolves.toMatchObject({ id: workspaceId });
    await expect(users.findByEmail(`prisma-${suffix}@autogmail.local`)).resolves.toMatchObject({ id: userId });
    await expect(users.update(userId, { name: "Prisma Test Actualizado" })).resolves.toMatchObject({
      id: userId,
      name: "Prisma Test Actualizado",
    });
    await expect(settings.getByWorkspaceId(workspaceId)).resolves.toMatchObject({ theme: "dark" });
    await expect(gmailAccounts.findById(gmailAccountId)).resolves.toMatchObject({ id: gmailAccountId });
    await expect(oauthTokens.findByAccountId(gmailAccountId)).resolves.toMatchObject({ gmailAccountId });
    await expect(syncLogs.findByAccount({ workspaceId, gmailAccountId, page: 1, limit: 25 })).resolves.toMatchObject({
      pagination: expect.objectContaining({ total: 1 }),
    });
    await expect(rules.findByWorkspace({ workspaceId, page: 1, limit: 25 })).resolves.toMatchObject({
      pagination: expect.objectContaining({ total: 1 }),
    });
    await expect(auditLogs.findByWorkspace({ workspaceId, page: 1, limit: 25 })).resolves.toMatchObject({
      pagination: expect.objectContaining({ total: 1 }),
    });
  });
});
}
