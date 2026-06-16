import type { DataEnvelope } from "../../../shared/domain/api-response";
import { unwrapData } from "../../../shared/domain/api-response";
import type { HttpClient } from "../../../shared/infrastructure/http/http-client";
import type { GmailAccountRepository } from "../application/gmail-account.repository";
import type { GmailAccount, GmailOAuthStart } from "../domain/gmail-account.entity";

export class GmailAccountApiRepository implements GmailAccountRepository {
  private readonly http: HttpClient;

  public constructor(http: HttpClient) {
    this.http = http;
  }

  public async list(): Promise<GmailAccount[]> {
    const payload = await this.http.get<DataEnvelope<GmailAccount[]>>("/gmail/accounts");
    return unwrapData(payload);
  }

  public async startOAuth(): Promise<GmailOAuthStart> {
    const payload = await this.http.post<DataEnvelope<GmailOAuthStart>>("/gmail/oauth/start");
    return unwrapData(payload);
  }

  public async sync(accountId: string): Promise<GmailAccount> {
    const payload = await this.http.post<DataEnvelope<GmailAccount>>(`/gmail/accounts/${accountId}/sync`);
    return unwrapData(payload);
  }
}
