import type { DataEnvelope } from "../../../shared/domain/api-response";
import { unwrapData } from "../../../shared/domain/api-response";
import type { HttpClient } from "../../../shared/infrastructure/http/http-client";
import type { GmailAccountRepository } from "../application/gmail-account.repository";
import type { GmailAccount, GmailOAuthStart } from "../domain/gmail-account.entity";

interface GmailAccountApiModel {
  id: string;
  email?: string;
  emailAddress?: string;
  displayName?: string | null;
  status: string;
  lastSyncAt?: string | null;
  historyId?: string | null;
  totalMessages?: number;
  errorMessage?: string | null;
}

export class GmailAccountApiRepository implements GmailAccountRepository {
  private readonly http: HttpClient;

  public constructor(http: HttpClient) {
    this.http = http;
  }

  public async list(): Promise<GmailAccount[]> {
    const payload = await this.http.get<DataEnvelope<GmailAccountApiModel[]>>("/gmail/accounts");
    return unwrapData(payload).map(normalizeGmailAccount);
  }

  public async startOAuth(): Promise<GmailOAuthStart> {
    const payload = await this.http.post<DataEnvelope<GmailOAuthStart>>("/gmail/oauth/start");
    return unwrapData(payload);
  }

  public async sync(accountId: string): Promise<GmailAccount> {
    const payload = await this.http.post<DataEnvelope<GmailAccountApiModel>>(`/gmail/accounts/${accountId}/sync`);
    return normalizeGmailAccount(unwrapData(payload));
  }
}

function normalizeGmailAccount(account: GmailAccountApiModel): GmailAccount {
  const email = account.email ?? account.emailAddress ?? "gmail-sin-email";

  return {
    id: account.id,
    email,
    emailAddress: account.emailAddress ?? email,
    displayName: account.displayName ?? null,
    status: account.status,
    lastSyncAt: account.lastSyncAt ?? null,
    historyId: account.historyId ?? null,
    totalMessages: account.totalMessages,
    errorMessage: account.errorMessage ?? null,
  };
}
