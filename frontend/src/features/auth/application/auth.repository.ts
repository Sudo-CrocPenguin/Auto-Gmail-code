import type { AuthSession, LoginCredentials } from "../domain/auth-session.entity";

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  me(): Promise<Omit<AuthSession, "accessToken">>;
  logout(): Promise<void>;
}
