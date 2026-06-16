-- CreateTable
CREATE TABLE "gmail_sync_logs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "gmailAccountId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "fetchedMessages" INTEGER NOT NULL,
    "createdMessages" INTEGER NOT NULL,
    "updatedMessages" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "gmail_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gmail_sync_logs_workspaceId_gmailAccountId_startedAt_idx" ON "gmail_sync_logs"("workspaceId", "gmailAccountId", "startedAt");
CREATE INDEX "gmail_sync_logs_workspaceId_status_idx" ON "gmail_sync_logs"("workspaceId", "status");

-- AddForeignKey
ALTER TABLE "gmail_sync_logs" ADD CONSTRAINT "gmail_sync_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gmail_sync_logs" ADD CONSTRAINT "gmail_sync_logs_gmailAccountId_fkey" FOREIGN KEY ("gmailAccountId") REFERENCES "gmail_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
