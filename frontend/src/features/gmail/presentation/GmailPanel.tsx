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
  const connectedAccounts = accounts.filter((account) => account.status === "CONNECTED").length;
  const totalMessages = accounts.reduce((total, account) => total + (account.totalMessages ?? 0), 0);

  return (
    <SectionPanel
      action={
        <NeonButton icon={<SatelliteDish size={18} />} onClick={onStartOAuth}>
          {accounts.length ? "Registrar otro Gmail" : "Registrar primer Gmail"}
        </NeonButton>
      }
      eyebrow="OAuth"
      title="Gmails registrados en tu usuario"
    >
      <div className="gmail-summary">
        <article>
          <strong>{accounts.length}</strong>
          <span>cuentas Gmail</span>
        </article>
        <article>
          <strong>{connectedAccounts}</strong>
          <span>conectadas</span>
        </article>
        <article>
          <strong>{totalMessages}</strong>
          <span>correos indexados</span>
        </article>
      </div>

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
                  {account.errorMessage ??
                    account.displayName ??
                    `${account.totalMessages ?? 0} mensajes indexados en este Gmail`}
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
          <p className="empty-state">
            Tu usuario aun no tiene Gmail registrados. Usa el boton para conectar una cuenta; puedes repetirlo con
            todas las cuentas Gmail que necesites.
          </p>
        )}
      </div>
    </SectionPanel>
  );
}
