export interface AutomationRule {
  id: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  priority: number;
  timesApplied: number;
  createdAt?: string;
}
