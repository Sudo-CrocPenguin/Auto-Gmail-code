import type { AuthSession, LoginCredentials, RegisterCredentials } from "../domain/auth-session.entity";

export interface AuthRepository {
  register(credentials: RegisterCredentials): Promise<AuthSession>;
  login(credentials: LoginCredentials): Promise<AuthSession>;
  me(): Promise<Omit<AuthSession, "accessToken">>;
  logout(): Promise<void>;
}
