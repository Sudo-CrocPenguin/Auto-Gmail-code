-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "settings" JSONB,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmail_accounts" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "watchExpiration" TIMESTAMP(3),
    "totalMessages" INTEGER NOT NULL,
    "grantedScopes" JSONB NOT NULL,
    "errorMessage" TEXT,
    "historyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmail_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmail_oauth_tokens" (
    "gmailAccountId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "encryptedIdToken" TEXT,
    "scope" TEXT,
    "tokenType" TEXT,
    "expiryDate" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmail_oauth_tokens_pkey" PRIMARY KEY ("gmailAccountId")
);

-- CreateTable
CREATE TABLE "email_messages" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "gmailAccountId" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "accountEmail" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "fromDomain" TEXT NOT NULL,
    "toEmails" JSONB NOT NULL,
    "subject" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "labelIds" JSONB NOT NULL,
    "hasAttachments" BOOLEAN NOT NULL,
    "attachments" JSONB NOT NULL,
    "isRead" BOOLEAN NOT NULL,
    "isSpam" BOOLEAN NOT NULL,
    "isImportant" BOOLEAN NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "gmailUrl" TEXT,
    "classification" JSONB,
    "actionHistory" JSONB NOT NULL,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "gmailAccountId" TEXT NOT NULL,
    "emailMessageId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sender_profiles" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "displayName" TEXT,
    "totalMessages" INTEGER NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "trustScore" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "sender_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "timesApplied" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "ip" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_workspaceId_idx" ON "users"("workspaceId");
CREATE UNIQUE INDEX "gmail_accounts_workspaceId_emailAddress_key" ON "gmail_accounts"("workspaceId", "emailAddress");
CREATE INDEX "gmail_accounts_workspaceId_idx" ON "gmail_accounts"("workspaceId");
CREATE INDEX "gmail_oauth_tokens_workspaceId_idx" ON "gmail_oauth_tokens"("workspaceId");
CREATE UNIQUE INDEX "email_messages_workspaceId_gmailAccountId_gmailMessageId_key" ON "email_messages"("workspaceId", "gmailAccountId", "gmailMessageId");
CREATE INDEX "email_messages_workspaceId_receivedAt_idx" ON "email_messages"("workspaceId", "receivedAt");
CREATE INDEX "email_messages_workspaceId_fromEmail_idx" ON "email_messages"("workspaceId", "fromEmail");
CREATE INDEX "email_messages_workspaceId_fromDomain_idx" ON "email_messages"("workspaceId", "fromDomain");
CREATE INDEX "email_messages_gmailAccountId_idx" ON "email_messages"("gmailAccountId");
CREATE INDEX "alerts_workspaceId_status_idx" ON "alerts"("workspaceId", "status");
CREATE INDEX "alerts_workspaceId_severity_idx" ON "alerts"("workspaceId", "severity");
CREATE UNIQUE INDEX "sender_profiles_workspaceId_email_key" ON "sender_profiles"("workspaceId", "email");
CREATE INDEX "sender_profiles_workspaceId_domain_idx" ON "sender_profiles"("workspaceId", "domain");
CREATE INDEX "automation_rules_workspaceId_enabled_idx" ON "automation_rules"("workspaceId", "enabled");
CREATE INDEX "automation_rules_workspaceId_priority_idx" ON "automation_rules"("workspaceId", "priority");
CREATE INDEX "audit_logs_workspaceId_createdAt_idx" ON "audit_logs"("workspaceId", "createdAt");
CREATE INDEX "audit_logs_workspaceId_action_idx" ON "audit_logs"("workspaceId", "action");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gmail_accounts" ADD CONSTRAINT "gmail_accounts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gmail_oauth_tokens" ADD CONSTRAINT "gmail_oauth_tokens_gmailAccountId_fkey" FOREIGN KEY ("gmailAccountId") REFERENCES "gmail_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_gmailAccountId_fkey" FOREIGN KEY ("gmailAccountId") REFERENCES "gmail_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_gmailAccountId_fkey" FOREIGN KEY ("gmailAccountId") REFERENCES "gmail_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_emailMessageId_fkey" FOREIGN KEY ("emailMessageId") REFERENCES "email_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sender_profiles" ADD CONSTRAINT "sender_profiles_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

