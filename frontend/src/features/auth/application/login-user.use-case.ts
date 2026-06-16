import type { AuthSession, LoginCredentials } from "../domain/auth-session.entity";
import type { AuthRepository } from "./auth.repository";

export class LoginUserUseCase {
  private readonly repository: AuthRepository;

  public constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  public execute(credentials: LoginCredentials): Promise<AuthSession> {
    return this.repository.login(credentials);
  }
}
