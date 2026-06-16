import type { DataEnvelope } from "../../../shared/domain/api-response";
import { unwrapData } from "../../../shared/domain/api-response";
import type { HttpClient } from "../../../shared/infrastructure/http/http-client";
import type { AnalyticsRepository } from "../application/analytics.repository";
import type {
  AnalyticsSummary,
  CategoryDistribution,
  EmailsByDay,
  TopSender,
} from "../domain/analytics.entity";

export class AnalyticsApiRepository implements AnalyticsRepository {
  private readonly http: HttpClient;

  public constructor(http: HttpClient) {
    this.http = http;
  }

  public async getSummary(): Promise<AnalyticsSummary> {
    const payload = await this.http.get<DataEnvelope<AnalyticsSummary>>("/analytics/summary");
    return unwrapData(payload);
  }

  public async getCategories(): Promise<CategoryDistribution[]> {
    const payload = await this.http.get<DataEnvelope<CategoryDistribution[]>>("/analytics/categories");
    return unwrapData(payload);
  }

  public async getEmailsByDay(): Promise<EmailsByDay[]> {
    const payload = await this.http.get<DataEnvelope<EmailsByDay[]>>("/analytics/emails-by-day");
    return unwrapData(payload);
  }

  public async getTopSenders(): Promise<TopSender[]> {
    const payload = await this.http.get<DataEnvelope<TopSender[]>>("/analytics/top-senders");
    return unwrapData(payload);
  }
}
