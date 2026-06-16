import { LogOut, RefreshCcw, ShieldCheck } from "lucide-react";

import { AlertsPanel } from "../../features/alerts/presentation/AlertsPanel";
import { AnalyticsPanel } from "../../features/analytics/presentation/AnalyticsPanel";
import type { AuthSession } from "../../features/auth/domain/auth-session.entity";
import { InboxPanel } from "../../features/emails/presentation/InboxPanel";
import { GmailPanel } from "../../features/gmail/presentation/GmailPanel";
import { RulesPanel } from "../../features/rules/presentation/RulesPanel";
import { SettingsPanel } from "../../features/settings/presentation/SettingsPanel";
import { NeonButton } from "../../shared/presentation/components/neon-button";
import { StatusPill } from "../../shared/presentation/components/status-pill";
import type { WorkspaceOverview } from "../application/workspace-overview.service";
import { type AppModule, navigationItems } from "../app-navigation";

interface CommandCenterProps {
  activeModule: AppModule;
  apiBaseUrl: string;
  error: string | null;
  isLoading: boolean;
  overview: WorkspaceOverview;
  session: AuthSession;
  onLogout: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onSetActiveModule: (module: AppModule) => void;
  onStartOAuth: () => Promise<void>;
  onSyncAccount: (accountId: string) => Promise<void>;
}

export function CommandCenter({
  activeModule,
  apiBaseUrl,
  error,
  isLoading,
  overview,
  session,
  onLogout,
  onRefresh,
  onSetActiveModule,
  onStartOAuth,
  onSyncAccount,
}: CommandCenterProps) {
  return (
    <main className="command-center">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="brand-mark">
            <ShieldCheck size={22} />
          </span>
          <div>
            <p>Auto-Gmail</p>
            <strong>Cyberdeck</strong>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Modulos del frontend">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                aria-current={activeModule === item.id ? "page" : undefined}
                key={item.id}
                onClick={() => onSetActiveModule(item.id)}
                title={item.label}
                type="button"
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <StatusPill label={session.workspace.plan ?? "DEMO"} tone="green" />
            <h1>{session.workspace.name}</h1>
            <p>{session.user.email}</p>
          </div>

          <div className="topbar__actions">
            <NeonButton disabled={isLoading} icon={<RefreshCcw size={17} />} onClick={onRefresh} variant="secondary">
              {isLoading ? "Sync" : "Actualizar"}
            </NeonButton>
            <NeonButton icon={<LogOut size={17} />} onClick={onLogout} variant="danger">
              Salir
            </NeonButton>
          </div>
        </header>

        {error ? <p className="workspace-error">{error}</p> : null}

        {activeModule === "dashboard" ? <AnalyticsPanel overview={overview} /> : null}
        {activeModule === "gmail" ? (
          <GmailPanel accounts={overview.accounts} onStartOAuth={onStartOAuth} onSyncAccount={onSyncAccount} />
        ) : null}
        {activeModule === "emails" ? <InboxPanel emails={overview.emails} /> : null}
        {activeModule === "alerts" ? <AlertsPanel alerts={overview.alerts} /> : null}
        {activeModule === "rules" ? <RulesPanel rules={overview.rules} /> : null}
        {activeModule === "settings" ? <SettingsPanel apiBaseUrl={apiBaseUrl} settings={overview.settings} /> : null}
      </section>
    </main>
  );
}
