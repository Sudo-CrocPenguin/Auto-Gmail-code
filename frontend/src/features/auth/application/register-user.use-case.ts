import type { AuthSession, RegisterCredentials } from "../domain/auth-session.entity";
import type { AuthRepository } from "./auth.repository";

export class RegisterUserUseCase {
  private readonly repository: AuthRepository;

  public constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  public execute(credentials: RegisterCredentials): Promise<AuthSession> {
    return this.repository.register(credentials);
  }
}
