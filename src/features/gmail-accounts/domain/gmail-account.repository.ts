import type { GmailAccount } from "./gmail-account.entity";

export interface GmailAccountRepository {
  create(account: GmailAccount): Promise<GmailAccount>;
  findById(id: string): Promise<GmailAccount | null>;
  findByWorkspaceId(workspaceId: string): Promise<GmailAccount[]>;
  findByEmail(workspaceId: string, emailAddress: string): Promise<GmailAccount | null>;
  update(id: string, data: Partial<GmailAccount>): Promise<GmailAccount | null>;
  delete(id: string): Promise<boolean>;
}

