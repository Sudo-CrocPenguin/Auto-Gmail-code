import { Siren } from "lucide-react";

import { SectionPanel } from "../../../shared/presentation/components/section-panel";
import { StatusPill } from "../../../shared/presentation/components/status-pill";
import type { WorkspaceAlert } from "../domain/workspace-alert.entity";

interface AlertsPanelProps {
  alerts: WorkspaceAlert[];
}

const severityTone = {
  LOW: "cyan",
  MEDIUM: "amber",
  HIGH: "magenta",
  CRITICAL: "red",
} as const;

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <SectionPanel eyebrow="Seguridad" title="Alertas abiertas">
      <div className="alert-list">
        {alerts.length ? (
          alerts.map((alert) => (
            <article className="alert-row" key={alert.id}>
              <Siren size={20} />
              <div>
                <strong>{alert.title}</strong>
                <span>{alert.description ?? new Date(alert.createdAt).toLocaleString()}</span>
              </div>
              <StatusPill
                label={alert.severity}
                tone={severityTone[alert.severity as keyof typeof severityTone] ?? "cyan"}
              />
              <StatusPill label={alert.status} tone="green" />
            </article>
          ))
        ) : (
          <p className="empty-state">No hay alertas abiertas.</p>
        )}
      </div>
    </SectionPanel>
  );
}
