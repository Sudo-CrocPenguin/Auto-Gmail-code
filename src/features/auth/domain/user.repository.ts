import type { User } from "./user.entity";

export type UserUpdateData = Partial<Pick<User, "name" | "email" | "passwordHash" | "role">>;

export interface UserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  update(id: string, data: UserUpdateData): Promise<User | null>;
}
