import type { RequestHandler } from "express";

import { asyncHandler } from "../../../../shared/http/async-handler";
import { getAuthContext } from "../../../../shared/http/request-context";
import type { DisconnectGmailAccountUseCase } from "../../application/disconnect-gmail-account.use-case";
import type { GetGmailOAuthStatusUseCase } from "../../application/get-gmail-oauth-status.use-case";
import type { HandleGmailOAuthCallbackUseCase } from "../../application/handle-gmail-oauth-callback.use-case";
import type { ListGmailAccountsUseCase } from "../../application/list-gmail-accounts.use-case";
import type { ReconnectGmailAccountUseCase } from "../../application/reconnect-gmail-account.use-case";
import type { StartGmailOAuthUseCase } from "../../application/start-gmail-oauth.use-case";
import type { SyncGmailAccountUseCase } from "../../application/sync-gmail-account.use-case";
import { gmailAccountIdParamsDto, oauthCallbackQueryDto, oauthStatusQueryDto } from "./gmail-account.dtos";

export class GmailAccountController {
  public constructor(
    private readonly listGmailAccounts: ListGmailAccountsUseCase,
    private readonly startGmailOAuth: StartGmailOAuthUseCase,
    private readonly getGmailOAuthStatus: GetGmailOAuthStatusUseCase,
    private readonly handleGmailOAuthCallback: HandleGmailOAuthCallbackUseCase,
    private readonly syncGmailAccount: SyncGmailAccountUseCase,
    private readonly reconnectGmailAccount: ReconnectGmailAccountUseCase,
    private readonly disconnectGmailAccount: DisconnectGmailAccountUseCase,
  ) {}

  public readonly list: RequestHandler = asyncHandler(async (request, response) => {
    const data = await this.listGmailAccounts.execute(getAuthContext(request));
    response.json({ data });
  });

  public readonly startOAuth: RequestHandler = asyncHandler(async (request, response) => {
    const data = await this.startGmailOAuth.execute(getAuthContext(request));
    response.status(201).json({ data });
  });

  public readonly oauthStatus: RequestHandler = asyncHandler(async (request, response) => {
    const query = oauthStatusQueryDto.parse(request.query);
    const data = await this.getGmailOAuthStatus.execute(getAuthContext(request), query);
    response.json({ data });
  });

  public readonly oauthCallback: RequestHandler = asyncHandler(async (request, response) => {
    const query = oauthCallbackQueryDto.parse(request.query);
    const data = await this.handleGmailOAuthCallback.execute(query);
    response.redirect(data.redirectUrl);
  });

  public readonly sync: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = gmailAccountIdParamsDto.parse(request.params);
    const data = await this.syncGmailAccount.execute(getAuthContext(request), id);
    response.json({ data });
  });

  public readonly reconnect: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = gmailAccountIdParamsDto.parse(request.params);
    const data = await this.reconnectGmailAccount.execute(getAuthContext(request), id);
    response.json({ data });
  });

  public readonly disconnect: RequestHandler = asyncHandler(async (request, response) => {
    const { id } = gmailAccountIdParamsDto.parse(request.params);
    const data = await this.disconnectGmailAccount.execute(getAuthContext(request), id);
    response.json({ data });
  });
}
