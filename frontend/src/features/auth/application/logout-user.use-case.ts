import type { AuthRepository } from "./auth.repository";

export class LogoutUserUseCase {
  private readonly repository: AuthRepository;

  public constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  public execute(): Promise<void> {
    return this.repository.logout();
  }
}
