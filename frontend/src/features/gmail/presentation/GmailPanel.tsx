import { RefreshCcw, SatelliteDish } from "lucide-react";

import { NeonButton } from "../../../shared/presentation/components/neon-button";
import { SectionPanel } from "../../../shared/presentation/components/section-panel";
import { StatusPill } from "../../../shared/presentation/components/status-pill";
import type { GmailAccount, GmailOAuthNotice } from "../domain/gmail-account.entity";

interface GmailPanelProps {
  accounts: GmailAccount[];
  oauthNotice: GmailOAuthNotice | null;
  onStartOAuth: () => Promise<void>;
  onSyncAccount: (accountId: string) => Promise<void>;
}

export function GmailPanel({ accounts, oauthNotice, onStartOAuth, onSyncAccount }: GmailPanelProps) {
  return (
    <SectionPanel
      action={
        <NeonButton icon={<SatelliteDish size={18} />} onClick={onStartOAuth}>
          Registrar Gmail
        </NeonButton>
      }
      eyebrow="OAuth"
      title="Cuentas Gmail"
    >
      {oauthNotice ? (
        <div className={`oauth-notice oauth-notice--${oauthNotice.status}`}>
          <strong>{oauthNotice.message}</strong>
          {oauthNotice.email ? <span>{oauthNotice.email}</span> : null}
          {oauthNotice.synced !== undefined ? <span>{oauthNotice.synced} correos sincronizados</span> : null}
        </div>
      ) : null}

      <div className="account-list">
        {accounts.length ? (
          accounts.map((account) => (
            <article className="account-row" key={account.id}>
              <div>
                <strong>{account.email}</strong>
                <span>
                  {account.errorMessage ?? account.displayName ?? `${account.totalMessages ?? 0} mensajes indexados`}
                </span>
              </div>
              <StatusPill
                label={account.status}
                tone={
                  account.status === "CONNECTED" ? "green" : account.status === "RECONNECT_REQUIRED" ? "amber" : "red"
                }
              />
              <span>{account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString() : "Sin sync"}</span>
              <NeonButton icon={<RefreshCcw size={16} />} onClick={() => onSyncAccount(account.id)} variant="secondary">
                Sync
              </NeonButton>
            </article>
          ))
        ) : (
          <p className="empty-state">No hay cuentas Gmail conectadas.</p>
        )}
      </div>
    </SectionPanel>
  );
}
