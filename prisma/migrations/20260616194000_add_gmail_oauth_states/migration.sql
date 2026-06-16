CREATE TABLE "gmail_oauth_states" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "nonce" TEXT NOT NULL,
    "stateHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "gmail_oauth_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gmail_oauth_states_stateHash_key" ON "gmail_oauth_states"("stateHash");
CREATE INDEX "gmail_oauth_states_workspaceId_expiresAt_idx" ON "gmail_oauth_states"("workspaceId", "expiresAt");
CREATE INDEX "gmail_oauth_states_userId_consumedAt_idx" ON "gmail_oauth_states"("userId", "consumedAt");

ALTER TABLE "gmail_oauth_states" ADD CONSTRAINT "gmail_oauth_states_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gmail_oauth_states" ADD CONSTRAINT "gmail_oauth_states_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
