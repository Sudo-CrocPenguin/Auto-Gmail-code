ALTER TABLE "email_messages"
  ADD COLUMN "classificationPrimaryCategory" TEXT,
  ADD COLUMN "classificationCategoryTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "classificationImportanceScore" INTEGER,
  ADD COLUMN "classificationSpamScore" INTEGER,
  ADD COLUMN "classificationRiskScore" INTEGER,
  ADD COLUMN "classificationSecurityScore" INTEGER,
  ADD COLUMN "classificationActionRequired" BOOLEAN;

UPDATE "email_messages"
SET
  "classificationPrimaryCategory" = "classification"->>'primaryCategory',
  "classificationCategoryTags" = CASE
    WHEN "classification" IS NULL THEN ARRAY[]::TEXT[]
    ELSE ARRAY(
      SELECT DISTINCT tag
      FROM (
        SELECT "classification"->>'primaryCategory' AS tag
        UNION
        SELECT jsonb_array_elements_text(COALESCE("classification"->'secondaryCategories', '[]'::jsonb)) AS tag
      ) AS tags
      WHERE tag IS NOT NULL AND tag <> ''
    )
  END,
  "classificationImportanceScore" = CASE
    WHEN "classification" ? 'importanceScore' THEN ("classification"->>'importanceScore')::INTEGER
    ELSE NULL
  END,
  "classificationSpamScore" = CASE
    WHEN "classification" ? 'spamScore' THEN ("classification"->>'spamScore')::INTEGER
    ELSE NULL
  END,
  "classificationRiskScore" = CASE
    WHEN "classification" ? 'riskScore' THEN ("classification"->>'riskScore')::INTEGER
    ELSE NULL
  END,
  "classificationSecurityScore" = CASE
    WHEN "classification" ? 'securityScore' THEN ("classification"->>'securityScore')::INTEGER
    ELSE NULL
  END,
  "classificationActionRequired" = CASE
    WHEN "classification" ? 'actionRequired' THEN ("classification"->>'actionRequired')::BOOLEAN
    ELSE NULL
  END
WHERE "classification" IS NOT NULL;

CREATE INDEX "email_messages_workspaceId_classificationPrimaryCategory_idx"
  ON "email_messages"("workspaceId", "classificationPrimaryCategory");
CREATE INDEX "email_messages_workspaceId_classificationImportanceScore_idx"
  ON "email_messages"("workspaceId", "classificationImportanceScore");
CREATE INDEX "email_messages_workspaceId_classificationRiskScore_idx"
  ON "email_messages"("workspaceId", "classificationRiskScore");
CREATE INDEX "email_messages_workspaceId_classificationSecurityScore_idx"
  ON "email_messages"("workspaceId", "classificationSecurityScore");
CREATE INDEX "email_messages_classificationCategoryTags_idx"
  ON "email_messages" USING GIN ("classificationCategoryTags");
