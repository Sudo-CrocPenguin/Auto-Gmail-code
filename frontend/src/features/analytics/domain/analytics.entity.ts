export interface AnalyticsSummary {
  totalEmails?: number;
  unreadEmails?: number;
  importantEmails?: number;
  openAlerts?: number;
  spamEmails?: number;
  connectedAccounts?: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

export interface EmailsByDay {
  date: string;
  count: number;
}

export interface TopSender {
  email: string;
  count: number;
  riskScore?: number;
}
