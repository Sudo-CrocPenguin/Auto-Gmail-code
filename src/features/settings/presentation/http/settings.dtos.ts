import { z } from "zod";

export const workspaceSettingsDto = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["es", "en"]),
  notifications: z.object({
    securityAlerts: z.boolean(),
    syncErrors: z.boolean(),
    highImportance: z.boolean(),
    weeklyDigest: z.boolean(),
  }),
  classification: z.object({
    autoClassify: z.boolean(),
    requireReviewForHighRisk: z.boolean(),
    minImportanceScoreForAlert: z.number().int().min(0).max(100),
    minRiskScoreForAlert: z.number().int().min(0).max(100),
    minSecurityScoreForAlert: z.number().int().min(0).max(100),
  }),
  retention: z.object({
    keepEmailBodiesDays: z.number().int().min(0).max(3650),
    keepAuditLogsDays: z.number().int().min(30).max(3650),
  }),
});

