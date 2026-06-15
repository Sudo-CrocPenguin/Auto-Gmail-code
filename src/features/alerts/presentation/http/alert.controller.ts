import type { RequestHandler } from "express";

import { asyncHandler } from "../../../../shared/http/async-handler";
import { getAuthContext } from "../../../../shared/http/request-context";
import type { GetAlertDetailUseCase } from "../../application/get-alert-detail.use-case";
import type { IgnoreAlertUseCase } from "../../application/ignore-alert.use-case";
import type { ListAlertsUseCase } from "../../application/list-alerts.use-case";
import type { ResolveAlertUseCase } from "../../application/resolve-alert.use-case";
import { alertIdParamsDto, listAlertsQueryDto } from "./alert.dtos";

export class AlertController {
  public constructor(
    private readonly listAlerts: ListAlertsUseCase,
    private readonly getAlertDetail: GetAlertDetailUseCase,
    private readonly resolveAlert: ResolveAlertUseCase,
    private readonly ignoreAlert: IgnoreAlertUseCase,
  ) {}

  public readonly list: RequestHandler = asyncHandler(async (request, response) => {
    const query = listAlertsQueryDto.parse(request.query);
    const result = await this.listAlerts.execute(getAuthContext(request), query);
    response.json(result);
  });

  public readonly detail: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = alertIdParamsDto.parse(request.params);
    const alert = await this.getAlertDetail.execute(getAuthContext(request), id);
    response.json({ data: alert });
  });

  public readonly resolve: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = alertIdParamsDto.parse(request.params);
    const alert = await this.resolveAlert.execute(getAuthContext(request), id);
    response.json({ data: alert });
  });

  public readonly ignore: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = alertIdParamsDto.parse(request.params);
    const alert = await this.ignoreAlert.execute(getAuthContext(request), id);
    response.json({ data: alert });
  });
}

