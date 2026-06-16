import type {
  AnalyticsSummary,
  CategoryDistribution,
  EmailsByDay,
  TopSender,
} from "../domain/analytics.entity";

export interface AnalyticsRepository {
  getSummary(): Promise<AnalyticsSummary>;
  getCategories(): Promise<CategoryDistribution[]>;
  getEmailsByDay(): Promise<EmailsByDay[]>;
  getTopSenders(): Promise<TopSender[]>;
}
