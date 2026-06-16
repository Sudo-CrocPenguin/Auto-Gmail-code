import { Activity, AlertTriangle, Inbox, RadioTower } from "lucide-react";

import type { WorkspaceOverview } from "../../../app/application/workspace-overview.service";
import { MetricCard } from "../../../shared/presentation/components/metric-card";
import { SectionPanel } from "../../../shared/presentation/components/section-panel";

interface AnalyticsPanelProps {
  overview: WorkspaceOverview;
}

export function AnalyticsPanel({ overview }: AnalyticsPanelProps) {
  const totalEmails = overview.summary.totalEmails ?? overview.emails.length;
  const openAlerts = overview.summary.openAlerts ?? overview.alerts.length;
  const connectedAccounts = overview.summary.connectedAccounts ?? overview.accounts.length;
  const importantEmails =
    overview.summary.importantEmails ?? overview.emails.filter((email) => email.isImportant).length;
  const maxCategory = Math.max(...overview.categories.map((category) => category.count), 1);
  const maxDaily = Math.max(...overview.emailsByDay.map((day) => day.count), 1);

  return (
    <div className="dashboard-grid">
      <MetricCard detail="mensajes indexados" icon={<Inbox size={22} />} label="Correos" tone="cyan" value={totalEmails} />
      <MetricCard
        detail="cuentas enlazadas"
        icon={<RadioTower size={22} />}
        label="Gmail"
        tone="green"
        value={connectedAccounts}
      />
      <MetricCard
        detail="pendientes de accion"
        icon={<AlertTriangle size={22} />}
        label="Alertas"
        tone="amber"
        value={openAlerts}
      />
      <MetricCard
        detail="prioridad alta"
        icon={<Activity size={22} />}
        label="Importantes"
        tone="magenta"
        value={importantEmails}
      />

      <SectionPanel eyebrow="Distribucion" title="Categorias activas">
        <div className="bar-list">
          {overview.categories.length ? (
            overview.categories.map((category) => (
              <div className="bar-row" key={category.category}>
                <span>{category.category}</span>
                <div>
                  <i style={{ width: `${Math.max((category.count / maxCategory) * 100, 8)}%` }} />
                </div>
                <strong>{category.count}</strong>
              </div>
            ))
          ) : (
            <p className="empty-state">Sin categorias sincronizadas.</p>
          )}
        </div>
      </SectionPanel>

      <SectionPanel eyebrow="Trafico" title="Correos por dia">
        <div className="sparkline">
          {overview.emailsByDay.length ? (
            overview.emailsByDay.map((day) => (
              <span key={day.date} style={{ height: `${Math.max((day.count / maxDaily) * 100, 12)}%` }}>
                <em>{day.count}</em>
              </span>
            ))
          ) : (
            <p className="empty-state">Sin trafico reciente.</p>
          )}
        </div>
      </SectionPanel>
    </div>
  );
}
