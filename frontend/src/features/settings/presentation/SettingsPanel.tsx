import { BellRing, BrainCircuit, Database, HardDrive, Languages, MoonStar } from "lucide-react";

import { SectionPanel } from "../../../shared/presentation/components/section-panel";
import { StatusPill } from "../../../shared/presentation/components/status-pill";
import type { WorkspaceSettings } from "../domain/workspace-settings.entity";

interface SettingsPanelProps {
  apiBaseUrl: string;
  settings: WorkspaceSettings | null;
}

export function SettingsPanel({ apiBaseUrl, settings }: SettingsPanelProps) {
  const notifications = settings?.notifications;
  const classification = settings?.classification;
  const retention = settings?.retention;

  return (
    <SectionPanel eyebrow="Sistema" title="Configuracion del workspace">
      <div className="settings-grid">
        <article>
          <MoonStar size={24} />
          <strong>Tema</strong>
          <StatusPill label={settings?.theme ?? "cyberpunk"} tone="magenta" />
        </article>
        <article>
          <Languages size={24} />
          <strong>Idioma</strong>
          <StatusPill label={settings?.language ?? "es"} tone="cyan" />
        </article>
        <article>
          <Database size={24} />
          <strong>API</strong>
          <span>{apiBaseUrl}</span>
        </article>
        <article>
          <BellRing size={24} />
          <strong>Notificaciones</strong>
          <span>Seguridad: {formatBoolean(notifications?.securityAlerts)}</span>
          <span>Sync errors: {formatBoolean(notifications?.syncErrors)}</span>
          <span>Digest: {formatBoolean(notifications?.weeklyDigest)}</span>
        </article>
        <article>
          <BrainCircuit size={24} />
          <strong>Clasificacion</strong>
          <span>Auto: {formatBoolean(classification?.autoClassify)}</span>
          <span>Riesgo alerta: {classification?.minRiskScoreForAlert ?? "n/d"}</span>
          <span>Revision alto riesgo: {formatBoolean(classification?.requireReviewForHighRisk)}</span>
        </article>
        <article>
          <HardDrive size={24} />
          <strong>Retencion</strong>
          <span>Cuerpos: {formatDays(retention?.keepEmailBodiesDays)}</span>
          <span>Auditoria: {formatDays(retention?.keepAuditLogsDays)}</span>
        </article>
      </div>
    </SectionPanel>
  );
}

function formatBoolean(value: boolean | undefined): string {
  if (value === undefined) {
    return "n/d";
  }

  return value ? "on" : "off";
}

function formatDays(value: number | undefined): string {
  if (value === undefined) {
    return "n/d";
  }

  return `${value} dias`;
}
