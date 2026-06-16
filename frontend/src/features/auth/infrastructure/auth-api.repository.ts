import type { DataEnvelope } from "../../../shared/domain/api-response";
import { unwrapData } from "../../../shared/domain/api-response";
import type { HttpClient } from "../../../shared/infrastructure/http/http-client";
import type { AuthRepository } from "../application/auth.repository";
import type { AuthSession, LoginCredentials } from "../domain/auth-session.entity";

export class AuthApiRepository implements AuthRepository {
  private readonly http: HttpClient;

  public constructor(http: HttpClient) {
    this.http = http;
  }

  public async login(credentials: LoginCredentials): Promise<AuthSession> {
    const payload = await this.http.post<AuthSession | DataEnvelope<AuthSession>>("/auth/login", credentials);
    return unwrapData(payload);
  }

  public async me(): Promise<Omit<AuthSession, "accessToken">> {
    const payload = await this.http.get<
      Omit<AuthSession, "accessToken"> | DataEnvelope<Omit<AuthSession, "accessToken">>
    >("/auth/me");
    return unwrapData(payload);
  }

  public async logout(): Promise<void> {
    await this.http.post("/auth/logout");
  }
}
