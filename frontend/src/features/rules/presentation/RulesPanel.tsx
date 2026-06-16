import { Plus, Power, PowerOff, Zap } from "lucide-react";
import { useState, type FormEvent } from "react";

import { emailCategories, type EmailCategory } from "../../emails/domain/email-category";
import { NeonButton } from "../../../shared/presentation/components/neon-button";
import { SectionPanel } from "../../../shared/presentation/components/section-panel";
import { StatusPill } from "../../../shared/presentation/components/status-pill";
import type {
  AutomationRule,
  CreateAutomationRuleInput,
  RuleActionType,
  RuleConditionField,
  RuleConditionOperator,
} from "../domain/automation-rule.entity";

interface RulesPanelProps {
  isLoading: boolean;
  rules: AutomationRule[];
  onCreateRule: (input: CreateAutomationRuleInput) => Promise<void>;
  onToggleRule: (rule: AutomationRule) => Promise<void>;
}

interface RuleDraft {
  actionType: RuleActionType;
  actionValue: string;
  conditionField: RuleConditionField;
  conditionOperator: RuleConditionOperator;
  conditionValue: string;
  enabled: boolean;
  name: string;
  priority: number;
}

const defaultDraft: RuleDraft = {
  actionType: "assignCategory",
  actionValue: "REVIEW",
  conditionField: "fromDomain",
  conditionOperator: "contains",
  conditionValue: "",
  enabled: true,
  name: "",
  priority: 100,
};

const conditionFields: Array<{ label: string; value: RuleConditionField }> = [
  { label: "Dominio", value: "fromDomain" },
  { label: "Remitente", value: "fromEmail" },
  { label: "Asunto", value: "subject" },
  { label: "Cuerpo", value: "body" },
  { label: "Categoria", value: "detectedCategory" },
];

const actionTypes: Array<{ label: string; value: RuleActionType }> = [
  { label: "Asignar categoria", value: "assignCategory" },
  { label: "Marcar importante", value: "markImportant" },
  { label: "Marcar revision", value: "markReview" },
  { label: "Generar alerta", value: "generateAlert" },
  { label: "Etiqueta interna", value: "applyInternalLabel" },
];

export function RulesPanel({ isLoading, rules, onCreateRule, onToggleRule }: RulesPanelProps) {
  const [draft, setDraft] = useState<RuleDraft>(defaultDraft);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.name.trim() || !draft.conditionValue.trim()) {
      return;
    }

    await onCreateRule({
      name: draft.name.trim(),
      description: buildDescription(draft),
      priority: draft.priority,
      enabled: draft.enabled,
      conditions: [
        {
          field: draft.conditionField,
          operator: draft.conditionOperator,
          value: draft.conditionValue.trim(),
        },
      ],
      actions: [
        {
          type: draft.actionType,
          value: resolveActionValue(draft),
        },
      ],
    });

    setDraft((current) => ({
      ...defaultDraft,
      actionType: current.actionType,
      conditionField: current.conditionField,
    }));
  }

  return (
    <div className="rules-layout">
      <SectionPanel eyebrow="Automatizacion" title="Crear regla rapida">
        <form className="rule-editor" onSubmit={handleSubmit}>
          <label>
            <span>Nombre</span>
            <input
              placeholder="Ej: priorizar facturas"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>

          <label>
            <span>Campo</span>
            <select
              value={draft.conditionField}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  conditionField: event.target.value as RuleConditionField,
                }))
              }
            >
              {conditionFields.map((field) => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Operador</span>
            <select
              value={draft.conditionOperator}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  conditionOperator: event.target.value as RuleConditionOperator,
                }))
              }
            >
              <option value="contains">Contiene</option>
              <option value="equals">Igual a</option>
            </select>
          </label>

          <label>
            <span>Valor</span>
            <input
              placeholder="stripe.com, Google, factura..."
              value={draft.conditionValue}
              onChange={(event) => setDraft((current) => ({ ...current, conditionValue: event.target.value }))}
            />
          </label>

          <label>
            <span>Accion</span>
            <select
              value={draft.actionType}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  actionType: event.target.value as RuleActionType,
                  actionValue: defaultActionValue(event.target.value as RuleActionType),
                }))
              }
            >
              {actionTypes.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </label>

          <ActionValueControl draft={draft} onChange={(value) => setDraft((current) => ({ ...current, actionValue: value }))} />

          <label>
            <span>Prioridad</span>
            <input
              min={1}
              max={1000}
              type="number"
              value={draft.priority}
              onChange={(event) => setDraft((current) => ({ ...current, priority: Number(event.target.value) }))}
            />
          </label>

          <label className="check-row">
            <input
              checked={draft.enabled}
              type="checkbox"
              onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))}
            />
            <span>Activar al crear</span>
          </label>

          <NeonButton disabled={isLoading} icon={<Plus size={16} />} type="submit">
            Crear regla
          </NeonButton>
        </form>
      </SectionPanel>

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
                <NeonButton
                  disabled={isLoading}
                  icon={rule.enabled ? <PowerOff size={15} /> : <Power size={15} />}
                  onClick={() => onToggleRule(rule)}
                  variant={rule.enabled ? "danger" : "secondary"}
                >
                  {rule.enabled ? "Pausar" : "Activar"}
                </NeonButton>
              </article>
            ))
          ) : (
            <p className="empty-state">Sin reglas configuradas.</p>
          )}
        </div>
      </SectionPanel>
    </div>
  );
}

interface ActionValueControlProps {
  draft: RuleDraft;
  onChange: (value: string) => void;
}

function ActionValueControl({ draft, onChange }: ActionValueControlProps) {
  if (draft.actionType === "assignCategory") {
    return (
      <label>
        <span>Categoria</span>
        <select value={draft.actionValue} onChange={(event) => onChange(event.target.value)}>
          {emailCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (draft.actionType === "applyInternalLabel" || draft.actionType === "generateAlert") {
    return (
      <label>
        <span>Valor accion</span>
        <input value={draft.actionValue} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }

  return (
    <div className="rule-editor__static">
      <span>Valor accion</span>
      <StatusPill label="true" tone="green" />
    </div>
  );
}

function buildDescription(draft: RuleDraft): string {
  return `${draft.conditionField} ${draft.conditionOperator} ${draft.conditionValue.trim()} -> ${draft.actionType}`;
}

function resolveActionValue(draft: RuleDraft): EmailCategory | string | boolean {
  if (draft.actionType === "markImportant" || draft.actionType === "markReview") {
    return true;
  }

  return draft.actionValue.trim() || defaultActionValue(draft.actionType);
}

function defaultActionValue(actionType: RuleActionType): string {
  if (actionType === "generateAlert") {
    return "HIGH_IMPORTANCE";
  }

  if (actionType === "applyInternalLabel") {
    return "front-regla";
  }

  return "REVIEW";
}
