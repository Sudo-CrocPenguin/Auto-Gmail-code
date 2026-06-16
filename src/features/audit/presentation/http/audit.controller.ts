import type { RequestHandler } from "express";

import { asyncHandler } from "../../../../shared/http/async-handler";
import { getAuthContext } from "../../../../shared/http/request-context";
import type { ListAuditLogsUseCase } from "../../application/list-audit-logs.use-case";
import { listAuditQueryDto } from "./audit.dtos";

export class AuditController {
  public constructor(private readonly listAuditLogs: ListAuditLogsUseCase) {}

  public readonly list: RequestHandler = asyncHandler(async (request, response) => {
    const query = listAuditQueryDto.parse(request.query);
    const result = await this.listAuditLogs.execute(getAuthContext(request), query);
    response.json(result);
  });
}

