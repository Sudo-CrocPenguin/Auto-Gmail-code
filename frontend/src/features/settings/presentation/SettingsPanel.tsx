import { Database, Languages, MoonStar } from "lucide-react";

import { SectionPanel } from "../../../shared/presentation/components/section-panel";
import { StatusPill } from "../../../shared/presentation/components/status-pill";
import type { WorkspaceSettings } from "../domain/workspace-settings.entity";

interface SettingsPanelProps {
  apiBaseUrl: string;
  settings: WorkspaceSettings | null;
}

export function SettingsPanel({ apiBaseUrl, settings }: SettingsPanelProps) {
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
      </div>
    </SectionPanel>
  );
}
