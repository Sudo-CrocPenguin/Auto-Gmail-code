import type { RequestHandler } from "express";

import { presentEmailSummary } from "../../../emails/presentation/http/email.presenter";
import { asyncHandler } from "../../../../shared/http/async-handler";
import { getAuthContext } from "../../../../shared/http/request-context";
import type { GetSenderDetailUseCase } from "../../application/get-sender-detail.use-case";
import type { ListSenderEmailsUseCase } from "../../application/list-sender-emails.use-case";
import type { ListSendersUseCase } from "../../application/list-senders.use-case";
import type { MarkSenderSuspiciousUseCase } from "../../application/mark-sender-suspicious.use-case";
import type { TrustSenderUseCase } from "../../application/trust-sender.use-case";
import { listSenderEmailsQueryDto, listSendersQueryDto, senderIdParamsDto } from "./sender.dtos";

export class SenderController {
  public constructor(
    private readonly listSenders: ListSendersUseCase,
    private readonly getSenderDetail: GetSenderDetailUseCase,
    private readonly trustSender: TrustSenderUseCase,
    private readonly markSenderSuspicious: MarkSenderSuspiciousUseCase,
    private readonly listSenderEmails: ListSenderEmailsUseCase,
  ) {}

  public readonly list: RequestHandler = asyncHandler(async (request, response) => {
    const query = listSendersQueryDto.parse(request.query);
    const result = await this.listSenders.execute(getAuthContext(request), query);
    response.json(result);
  });

  public readonly detail: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = senderIdParamsDto.parse(request.params);
    const sender = await this.getSenderDetail.execute(getAuthContext(request), id);
    response.json({ data: sender });
  });

  public readonly trust: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = senderIdParamsDto.parse(request.params);
    const sender = await this.trustSender.execute(getAuthContext(request), id);
    response.json({ data: sender });
  });

  public readonly suspicious: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = senderIdParamsDto.parse(request.params);
    const sender = await this.markSenderSuspicious.execute(getAuthContext(request), id);
    response.json({ data: sender });
  });

  public readonly emails: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = senderIdParamsDto.parse(request.params);
    const query = listSenderEmailsQueryDto.parse(request.query);
    const result = await this.listSenderEmails.execute(getAuthContext(request), id, query);
    response.json({
      data: result.data.map(presentEmailSummary),
      pagination: result.pagination,
    });
  });
}

