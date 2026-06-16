import type { RequestHandler } from "express";

import { asyncHandler } from "../../../../shared/http/async-handler";
import { getAuthContext } from "../../../../shared/http/request-context";
import type { CreateRuleUseCase } from "../../application/create-rule.use-case";
import type { DeleteRuleUseCase } from "../../application/delete-rule.use-case";
import type { GetRuleDetailUseCase } from "../../application/get-rule-detail.use-case";
import type { ListRulesUseCase } from "../../application/list-rules.use-case";
import type { SetRuleEnabledUseCase } from "../../application/set-rule-enabled.use-case";
import type { UpdateRuleUseCase } from "../../application/update-rule.use-case";
import { createRuleDto, listRulesQueryDto, ruleIdParamsDto, updateRuleDto } from "./rule.dtos";

export class RuleController {
  public constructor(
    private readonly listRules: ListRulesUseCase,
    private readonly getRuleDetail: GetRuleDetailUseCase,
    private readonly createRule: CreateRuleUseCase,
    private readonly updateRule: UpdateRuleUseCase,
    private readonly deleteRule: DeleteRuleUseCase,
    private readonly setRuleEnabled: SetRuleEnabledUseCase,
  ) {}

  public readonly list: RequestHandler = asyncHandler(async (request, response) => {
    const query = listRulesQueryDto.parse(request.query);
    const result = await this.listRules.execute(getAuthContext(request), query);
    response.json(result);
  });

  public readonly detail: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = ruleIdParamsDto.parse(request.params);
    const rule = await this.getRuleDetail.execute(getAuthContext(request), id);
    response.json({ data: rule });
  });

  public readonly create: RequestHandler = asyncHandler(async (request, response) => {
    const input = createRuleDto.parse(request.body);
    const rule = await this.createRule.execute(getAuthContext(request), input);
    response.status(201).json({ data: rule });
  });

  public readonly update: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = ruleIdParamsDto.parse(request.params);
    const input = updateRuleDto.parse(request.body);
    const rule = await this.updateRule.execute(getAuthContext(request), id, input);
    response.json({ data: rule });
  });

  public readonly remove: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = ruleIdParamsDto.parse(request.params);
    await this.deleteRule.execute(getAuthContext(request), id);
    response.status(204).send();
  });

  public readonly enable: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = ruleIdParamsDto.parse(request.params);
    const rule = await this.setRuleEnabled.execute(getAuthContext(request), id, true);
    response.json({ data: rule });
  });

  public readonly disable: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = ruleIdParamsDto.parse(request.params);
    const rule = await this.setRuleEnabled.execute(getAuthContext(request), id, false);
    response.json({ data: rule });
  });
}

