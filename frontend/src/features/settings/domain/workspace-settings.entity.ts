export interface WorkspaceSettings {
  theme?: "light" | "dark" | "system" | string;
  language?: "es" | "en" | string;
  notifications?: {
    securityAlerts?: boolean;
    syncErrors?: boolean;
    highImportance?: boolean;
    weeklyDigest?: boolean;
  };
  classification?: {
    autoClassify?: boolean;
    requireReviewForHighRisk?: boolean;
    minImportanceScoreForAlert?: number;
    minRiskScoreForAlert?: number;
    minSecurityScoreForAlert?: number;
  };
  retention?: {
    keepEmailBodiesDays?: number;
    keepAuditLogsDays?: number;
  };
}
