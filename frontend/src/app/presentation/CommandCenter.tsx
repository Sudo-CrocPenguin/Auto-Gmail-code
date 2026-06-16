import { LogOut, RefreshCcw, ShieldCheck } from "lucide-react";

import { AlertsPanel } from "../../features/alerts/presentation/AlertsPanel";
import { AnalyticsPanel } from "../../features/analytics/presentation/AnalyticsPanel";
import type { AuthSession } from "../../features/auth/domain/auth-session.entity";
import type { EmailDetail, EmailListQuery } from "../../features/emails/domain/email-message.entity";
import { InboxPanel } from "../../features/emails/presentation/InboxPanel";
import type { GmailOAuthNotice } from "../../features/gmail/domain/gmail-account.entity";
import { GmailPanel } from "../../features/gmail/presentation/GmailPanel";
import type { AutomationRule, CreateAutomationRuleInput } from "../../features/rules/domain/automation-rule.entity";
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
  gmailOAuthNotice: GmailOAuthNotice | null;
  isLoading: boolean;
  overview: WorkspaceOverview;
  selectedEmail: EmailDetail | null;
  session: AuthSession;
  onApplyEmailFilters: (query: EmailListQuery) => Promise<void>;
  onCreateRule: (input: CreateAutomationRuleInput) => Promise<void>;
  onIgnoreAlert: (alertId: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onMarkEmailImportant: (emailId: string) => Promise<void>;
  onMarkEmailReviewed: (emailId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onResolveAlert: (alertId: string) => Promise<void>;
  onSelectEmail: (emailId: string) => Promise<void>;
  onSetActiveModule: (module: AppModule) => void;
  onSetRuleEnabled: (rule: AutomationRule) => Promise<void>;
  onStartOAuth: () => Promise<void>;
  onSyncAccount: (accountId: string) => Promise<void>;
}

export function CommandCenter({
  activeModule,
  apiBaseUrl,
  error,
  gmailOAuthNotice,
  isLoading,
  overview,
  selectedEmail,
  session,
  onApplyEmailFilters,
  onCreateRule,
  onIgnoreAlert,
  onLogout,
  onMarkEmailImportant,
  onMarkEmailReviewed,
  onRefresh,
  onResolveAlert,
  onSelectEmail,
  onSetActiveModule,
  onSetRuleEnabled,
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
          <GmailPanel
            accounts={overview.accounts}
            oauthNotice={gmailOAuthNotice}
            onStartOAuth={onStartOAuth}
            onSyncAccount={onSyncAccount}
          />
        ) : null}
        {activeModule === "emails" ? (
          <InboxPanel
            accounts={overview.accounts}
            emails={overview.emails}
            isLoading={isLoading}
            selectedEmail={selectedEmail}
            onApplyFilters={onApplyEmailFilters}
            onMarkImportant={onMarkEmailImportant}
            onMarkReviewed={onMarkEmailReviewed}
            onSelectEmail={onSelectEmail}
          />
        ) : null}
        {activeModule === "alerts" ? (
          <AlertsPanel
            alerts={overview.alerts}
            isLoading={isLoading}
            onIgnoreAlert={onIgnoreAlert}
            onResolveAlert={onResolveAlert}
          />
        ) : null}
        {activeModule === "rules" ? (
          <RulesPanel
            isLoading={isLoading}
            rules={overview.rules}
            onCreateRule={onCreateRule}
            onToggleRule={onSetRuleEnabled}
          />
        ) : null}
        {activeModule === "settings" ? <SettingsPanel apiBaseUrl={apiBaseUrl} settings={overview.settings} /> : null}
      </section>
    </main>
  );
}
