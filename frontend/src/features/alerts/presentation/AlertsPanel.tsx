import { CheckCircle2, EyeOff, Siren } from "lucide-react";

import { NeonButton } from "../../../shared/presentation/components/neon-button";
import { SectionPanel } from "../../../shared/presentation/components/section-panel";
import { StatusPill } from "../../../shared/presentation/components/status-pill";
import type { WorkspaceAlert } from "../domain/workspace-alert.entity";

interface AlertsPanelProps {
  alerts: WorkspaceAlert[];
  isLoading: boolean;
  onIgnoreAlert: (alertId: string) => Promise<void>;
  onResolveAlert: (alertId: string) => Promise<void>;
}

const severityTone = {
  LOW: "cyan",
  MEDIUM: "amber",
  HIGH: "magenta",
  CRITICAL: "red",
} as const;

export function AlertsPanel({ alerts, isLoading, onIgnoreAlert, onResolveAlert }: AlertsPanelProps) {
  return (
    <SectionPanel eyebrow="Seguridad" title="Alertas abiertas">
      <div className="alert-list">
        {alerts.length ? (
          alerts.map((alert) => (
            <article className="alert-row" key={alert.id}>
              <Siren size={20} />
              <div>
                <strong>{alert.title}</strong>
                <span>{alert.description ?? alert.recommendedAction ?? formatDateTime(alert.createdAt)}</span>
                {alert.recommendedAction ? <p>{alert.recommendedAction}</p> : null}
              </div>
              <StatusPill
                label={alert.severity}
                tone={severityTone[alert.severity as keyof typeof severityTone] ?? "cyan"}
              />
              <div className="row-actions">
                <NeonButton
                  disabled={isLoading}
                  icon={<CheckCircle2 size={15} />}
                  onClick={() => onResolveAlert(alert.id)}
                  variant="secondary"
                >
                  Resolver
                </NeonButton>
                <NeonButton
                  disabled={isLoading}
                  icon={<EyeOff size={15} />}
                  onClick={() => onIgnoreAlert(alert.id)}
                  variant="danger"
                >
                  Ignorar
                </NeonButton>
              </div>
            </article>
          ))
        ) : (
          <p className="empty-state">No hay alertas abiertas.</p>
        )}
      </div>
    </SectionPanel>
  );
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}
