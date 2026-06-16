import { RefreshCcw, SatelliteDish } from "lucide-react";

import { NeonButton } from "../../../shared/presentation/components/neon-button";
import { SectionPanel } from "../../../shared/presentation/components/section-panel";
import { StatusPill } from "../../../shared/presentation/components/status-pill";
import type { GmailAccount } from "../domain/gmail-account.entity";

interface GmailPanelProps {
  accounts: GmailAccount[];
  onStartOAuth: () => Promise<void>;
  onSyncAccount: (accountId: string) => Promise<void>;
}

export function GmailPanel({ accounts, onStartOAuth, onSyncAccount }: GmailPanelProps) {
  return (
    <SectionPanel
      action={
        <NeonButton icon={<SatelliteDish size={18} />} onClick={onStartOAuth}>
          Conectar Gmail
        </NeonButton>
      }
      eyebrow="OAuth"
      title="Cuentas Gmail"
    >
      <div className="account-list">
        {accounts.length ? (
          accounts.map((account) => (
            <article className="account-row" key={account.id}>
              <div>
                <strong>{account.email}</strong>
                <span>{account.displayName ?? "Cuenta conectada"}</span>
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
