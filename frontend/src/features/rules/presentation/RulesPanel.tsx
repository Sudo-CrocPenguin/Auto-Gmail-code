import { Zap } from "lucide-react";

import { SectionPanel } from "../../../shared/presentation/components/section-panel";
import { StatusPill } from "../../../shared/presentation/components/status-pill";
import type { AutomationRule } from "../domain/automation-rule.entity";

interface RulesPanelProps {
  rules: AutomationRule[];
}

export function RulesPanel({ rules }: RulesPanelProps) {
  return (
    <SectionPanel eyebrow="Automatizacion" title="Reglas operativas">
      <div className="rule-list">
        {rules.length ? (
          rules.map((rule) => (
            <article className="rule-row" key={rule.id}>
              <Zap size={19} />
              <div>
                <strong>{rule.name}</strong>
                <span>{rule.description ?? `Prioridad ${rule.priority}`}</span>
              </div>
              <StatusPill label={rule.enabled ? "Activa" : "Pausada"} tone={rule.enabled ? "green" : "amber"} />
              <span>{rule.timesApplied} usos</span>
            </article>
          ))
        ) : (
          <p className="empty-state">Sin reglas configuradas.</p>
        )}
      </div>
    </SectionPanel>
  );
}
