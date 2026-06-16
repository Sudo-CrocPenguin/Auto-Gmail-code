export interface WorkspaceSettings {
  theme?: string;
  language?: string;
  notifications?: Record<string, unknown>;
  classification?: Record<string, unknown>;
  retention?: Record<string, unknown>;
}
