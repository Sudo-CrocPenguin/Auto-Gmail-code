import type { RequestHandler } from "express";

import { asyncHandler } from "../../../../shared/http/async-handler";
import { getAuthContext } from "../../../../shared/http/request-context";
import type { CorrectEmailClassificationUseCase } from "../../application/correct-email-classification.use-case";
import type { GetEmailDetailUseCase } from "../../application/get-email-detail.use-case";
import type { ListEmailsUseCase } from "../../application/list-emails.use-case";
import type { MarkEmailImportantUseCase } from "../../application/mark-email-important.use-case";
import type { MarkEmailReviewedUseCase } from "../../application/mark-email-reviewed.use-case";
import { correctClassificationDto, emailIdParamsDto, listEmailsQueryDto } from "./email.dtos";
import { presentEmailDetail, presentEmailSummary } from "./email.presenter";

export class EmailController {
  public constructor(
    private readonly listEmails: ListEmailsUseCase,
    private readonly getEmailDetail: GetEmailDetailUseCase,
    private readonly correctEmailClassification: CorrectEmailClassificationUseCase,
    private readonly markEmailReviewed: MarkEmailReviewedUseCase,
    private readonly markEmailImportant: MarkEmailImportantUseCase,
  ) {}

  public readonly list: RequestHandler = asyncHandler(async (request, response) => {
    const query = listEmailsQueryDto.parse(request.query);
    const result = await this.listEmails.execute(getAuthContext(request), query);

    response.json({
      data: result.data.map(presentEmailSummary),
      pagination: result.pagination,
    });
  });

  public readonly detail: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = emailIdParamsDto.parse(request.params);
    const email = await this.getEmailDetail.execute(getAuthContext(request), id);
    response.json({ data: presentEmailDetail(email) });
  });

  public readonly correctClassification: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = emailIdParamsDto.parse(request.params);
    const input = correctClassificationDto.parse(request.body);
    const email = await this.correctEmailClassification.execute(getAuthContext(request), id, input);
    response.json({ data: presentEmailDetail(email) });
  });

  public readonly markReviewed: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = emailIdParamsDto.parse(request.params);
    const email = await this.markEmailReviewed.execute(getAuthContext(request), id);
    response.json({ data: presentEmailDetail(email) });
  });

  public readonly markImportant: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = emailIdParamsDto.parse(request.params);
    const email = await this.markEmailImportant.execute(getAuthContext(request), id);
    response.json({ data: presentEmailDetail(email) });
  });
}

