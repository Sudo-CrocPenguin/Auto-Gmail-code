export type AppTheme = "light" | "dark" | "system";
export type SupportedLanguage = "es" | "en";

export interface WorkspaceSettings {
  theme: AppTheme;
  language: SupportedLanguage;
  notifications: {
    securityAlerts: boolean;
    syncErrors: boolean;
    highImportance: boolean;
    weeklyDigest: boolean;
  };
  classification: {
    autoClassify: boolean;
    requireReviewForHighRisk: boolean;
    minImportanceScoreForAlert: number;
    minRiskScoreForAlert: number;
    minSecurityScoreForAlert: number;
  };
  retention: {
    keepEmailBodiesDays: number;
    keepAuditLogsDays: number;
  };
}

export const defaultWorkspaceSettings: WorkspaceSettings = {
  theme: "system",
  language: "es",
  notifications: {
    securityAlerts: true,
    syncErrors: true,
    highImportance: true,
    weeklyDigest: false,
  },
  classification: {
    autoClassify: true,
    requireReviewForHighRisk: true,
    minImportanceScoreForAlert: 85,
    minRiskScoreForAlert: 70,
    minSecurityScoreForAlert: 80,
  },
  retention: {
    keepEmailBodiesDays: 365,
    keepAuditLogsDays: 730,
  },
};

