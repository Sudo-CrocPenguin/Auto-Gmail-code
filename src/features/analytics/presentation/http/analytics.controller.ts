import type { RequestHandler } from "express";

import { asyncHandler } from "../../../../shared/http/async-handler";
import { getAuthContext } from "../../../../shared/http/request-context";
import type { GetAccountAnalyticsUseCase } from "../../application/get-account-analytics.use-case";
import type { GetAnalyticsSummaryUseCase } from "../../application/get-analytics-summary.use-case";
import type { GetCategoryDistributionUseCase } from "../../application/get-category-distribution.use-case";
import type { GetEmailsByDayUseCase } from "../../application/get-emails-by-day.use-case";
import type { GetTopSendersUseCase } from "../../application/get-top-senders.use-case";

export class AnalyticsController {
  public constructor(
    private readonly getSummary: GetAnalyticsSummaryUseCase,
    private readonly getEmailsByDay: GetEmailsByDayUseCase,
    private readonly getCategoryDistribution: GetCategoryDistributionUseCase,
    private readonly getTopSenders: GetTopSendersUseCase,
    private readonly getAccountAnalytics: GetAccountAnalyticsUseCase,
  ) {}

  public readonly summary: RequestHandler = asyncHandler(async (request, response) => {
    const data = await this.getSummary.execute(getAuthContext(request));
    response.json({ data });
  });

  public readonly emailsByDay: RequestHandler = asyncHandler(async (request, response) => {
    const data = await this.getEmailsByDay.execute(getAuthContext(request));
    response.json({ data });
  });

  public readonly categories: RequestHandler = asyncHandler(async (request, response) => {
    const data = await this.getCategoryDistribution.execute(getAuthContext(request));
    response.json({ data });
  });

  public readonly topSenders: RequestHandler = asyncHandler(async (request, response) => {
    const data = await this.getTopSenders.execute(getAuthContext(request));
    response.json({ data });
  });

  public readonly accounts: RequestHandler = asyncHandler(async (request, response) => {
    const data = await this.getAccountAnalytics.execute(getAuthContext(request));
    response.json({ data });
  });
}

