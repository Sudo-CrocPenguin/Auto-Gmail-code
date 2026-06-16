CREATE TABLE "app_sessions" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "app_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "app_sessions_userId_revokedAt_idx" ON "app_sessions"("userId", "revokedAt");
CREATE INDEX "app_sessions_workspaceId_idx" ON "app_sessions"("workspaceId");

ALTER TABLE "app_sessions" ADD CONSTRAINT "app_sessions_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "app_sessions" ADD CONSTRAINT "app_sessions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
