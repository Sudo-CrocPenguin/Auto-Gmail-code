import {
  CheckCircle2,
  ExternalLink,
  Paperclip,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { NeonButton } from "../../../shared/presentation/components/neon-button";
import { SectionPanel } from "../../../shared/presentation/components/section-panel";
import { StatusPill } from "../../../shared/presentation/components/status-pill";
import { emailCategories, type EmailCategory } from "../domain/email-category";
import type { EmailDetail, EmailListQuery, EmailSummary } from "../domain/email-message.entity";

interface InboxPanelProps {
  emails: EmailSummary[];
  isLoading: boolean;
  selectedEmail: EmailDetail | null;
  onApplyFilters: (query: EmailListQuery) => Promise<void>;
  onMarkImportant: (emailId: string) => Promise<void>;
  onMarkReviewed: (emailId: string) => Promise<void>;
  onSelectEmail: (emailId: string) => Promise<void>;
}

interface InboxFilters {
  actionRequiredOnly: boolean;
  category: EmailCategory | "";
  importantOnly: boolean;
  minRiskScore: number;
  search: string;
  sortBy: NonNullable<EmailListQuery["sortBy"]>;
  sortOrder: NonNullable<EmailListQuery["sortOrder"]>;
  unreadOnly: boolean;
}

const defaultFilters: InboxFilters = {
  actionRequiredOnly: false,
  category: "",
  importantOnly: false,
  minRiskScore: 0,
  search: "",
  sortBy: "receivedAt",
  sortOrder: "desc",
  unreadOnly: false,
};

export function InboxPanel({
  emails,
  isLoading,
  selectedEmail,
  onApplyFilters,
  onMarkImportant,
  onMarkReviewed,
  onSelectEmail,
}: InboxPanelProps) {
  const [filters, setFilters] = useState<InboxFilters>(defaultFilters);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onApplyFilters(toEmailQuery(filters));
  }

  return (
    <div className="inbox-layout">
      <SectionPanel
        action={
          <NeonButton disabled={isLoading} icon={<SlidersHorizontal size={17} />} type="submit" form="inbox-filters">
            Filtrar
          </NeonButton>
        }
        eyebrow="Bandeja unificada"
        title="Correos recientes"
      >
        <form className="inbox-filters" id="inbox-filters" onSubmit={handleSubmit}>
          <label>
            <span>Buscar</span>
            <div className="input-shell">
              <Search size={17} />
              <input
                placeholder="asunto, remitente o dominio"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </div>
          </label>

          <label>
            <span>Categoria</span>
            <select
              value={filters.category}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  category: event.target.value as EmailCategory | "",
                }))
              }
            >
              <option value="">Todas</option>
              {emailCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Orden</span>
            <select
              value={filters.sortBy}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  sortBy: event.target.value as InboxFilters["sortBy"],
                }))
              }
            >
              <option value="receivedAt">Fecha</option>
              <option value="importanceScore">Importancia</option>
              <option value="riskScore">Riesgo</option>
              <option value="securityScore">Seguridad</option>
            </select>
          </label>

          <label>
            <span>Direccion</span>
            <select
              value={filters.sortOrder}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  sortOrder: event.target.value as InboxFilters["sortOrder"],
                }))
              }
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </label>

          <label className="range-filter">
            <span>Riesgo minimo {filters.minRiskScore}</span>
            <input
              max={100}
              min={0}
              type="range"
              value={filters.minRiskScore}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  minRiskScore: Number(event.target.value),
                }))
              }
            />
          </label>

          <div className="toggle-strip">
            <label>
              <input
                checked={filters.unreadOnly}
                type="checkbox"
                onChange={(event) => setFilters((current) => ({ ...current, unreadOnly: event.target.checked }))}
              />
              <span>Nuevos</span>
            </label>
            <label>
              <input
                checked={filters.importantOnly}
                type="checkbox"
                onChange={(event) => setFilters((current) => ({ ...current, importantOnly: event.target.checked }))}
              />
              <span>Importantes</span>
            </label>
            <label>
              <input
                checked={filters.actionRequiredOnly}
                type="checkbox"
                onChange={(event) =>
                  setFilters((current) => ({ ...current, actionRequiredOnly: event.target.checked }))
                }
              />
              <span>Accion</span>
            </label>
          </div>
        </form>

        <div className="email-list">
          {emails.length ? (
            emails.map((email) => (
              <button
                className={`email-row ${selectedEmail?.id === email.id ? "email-row--active" : ""}`}
                disabled={isLoading}
                key={email.id}
                onClick={() => onSelectEmail(email.id)}
                type="button"
              >
                <div className="email-row__signal">
                  {email.isImportant ? <Star size={17} /> : <ShieldAlert size={17} />}
                </div>
                <div>
                  <strong>{email.subject}</strong>
                  <span>
                    {email.fromName ?? email.fromEmail} - {formatDate(email.receivedAt)}
                  </span>
                </div>
                <StatusPill label={email.primaryCategory} tone={email.isSpam ? "red" : "cyan"} />
                <span className="risk-meter">
                  <i style={{ width: `${clampScore(email.riskScore)}%` }} />
                </span>
                <span className="email-row__meta">
                  {email.attachmentCount ? <Paperclip size={15} /> : null}
                  {email.isRead ? "Leido" : "Nuevo"}
                </span>
              </button>
            ))
          ) : (
            <p className="empty-state">Sin correos para mostrar.</p>
          )}
        </div>
      </SectionPanel>

      <EmailDetailPanel
        email={selectedEmail}
        isLoading={isLoading}
        onMarkImportant={onMarkImportant}
        onMarkReviewed={onMarkReviewed}
      />
    </div>
  );
}

interface EmailDetailPanelProps {
  email: EmailDetail | null;
  isLoading: boolean;
  onMarkImportant: (emailId: string) => Promise<void>;
  onMarkReviewed: (emailId: string) => Promise<void>;
}

function EmailDetailPanel({ email, isLoading, onMarkImportant, onMarkReviewed }: EmailDetailPanelProps) {
  return (
    <SectionPanel eyebrow="Detalle" title={email ? "Correo seleccionado" : "Sin seleccion"}>
      {email ? (
        <article className="email-detail">
          <header className="email-detail__header">
            <div>
              <StatusPill label={email.primaryCategory} tone={email.isSpam ? "red" : "magenta"} />
              <h3>{email.subject}</h3>
              <p>{email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail}</p>
            </div>
            <div className="email-detail__actions">
              <NeonButton
                disabled={isLoading || Boolean(email.reviewedAt)}
                icon={<CheckCircle2 size={16} />}
                onClick={() => onMarkReviewed(email.id)}
                variant="secondary"
              >
                Revisado
              </NeonButton>
              <NeonButton
                disabled={isLoading || email.isImportant}
                icon={<Star size={16} />}
                onClick={() => onMarkImportant(email.id)}
              >
                Importante
              </NeonButton>
            </div>
          </header>

          <div className="score-grid">
            <Score label="Importancia" value={email.importanceScore} />
            <Score label="Riesgo" value={email.riskScore} />
            <Score label="Seguridad" value={email.securityScore} />
            <Score label="Spam" value={email.spamScore} />
          </div>

          <div className="email-detail__body">
            <p>{email.bodyText ?? email.snippet ?? "Este correo no tiene cuerpo de texto sincronizado."}</p>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Cuenta</dt>
              <dd>{email.accountEmail || email.gmailAccountId}</dd>
            </div>
            <div>
              <dt>Dominio</dt>
              <dd>{email.fromDomain || "sin dominio"}</dd>
            </div>
            <div>
              <dt>Recibido</dt>
              <dd>{formatDateTime(email.receivedAt)}</dd>
            </div>
            <div>
              <dt>Destinatarios</dt>
              <dd>{email.toEmails.join(", ") || "sin destinatarios"}</dd>
            </div>
          </dl>

          {email.attachments.length ? (
            <div className="attachment-list">
              {email.attachments.map((attachment) => (
                <span key={attachment.id}>
                  <Paperclip size={14} />
                  {attachment.filename} ({formatBytes(attachment.sizeBytes)})
                </span>
              ))}
            </div>
          ) : null}

          {email.classification?.explanation ? (
            <p className="classification-note">{email.classification.explanation}</p>
          ) : null}

          {email.gmailUrl ? (
            <a className="external-link" href={email.gmailUrl} rel="noreferrer" target="_blank">
              <ExternalLink size={15} />
              Abrir en Gmail
            </a>
          ) : null}
        </article>
      ) : (
        <p className="empty-state">Selecciona un correo para ver cuerpo, scores y acciones.</p>
      )}
    </SectionPanel>
  );
}

interface ScoreProps {
  label: string;
  value: number;
}

function Score({ label, value }: ScoreProps) {
  return (
    <div>
      <span>{label}</span>
      <strong>{clampScore(value)}</strong>
    </div>
  );
}

function toEmailQuery(filters: InboxFilters): EmailListQuery {
  return {
    page: 1,
    limit: 12,
    search: filters.search.trim() || undefined,
    category: filters.category || undefined,
    isImportant: filters.importantOnly ? true : undefined,
    isRead: filters.unreadOnly ? false : undefined,
    actionRequired: filters.actionRequiredOnly ? true : undefined,
    minRiskScore: filters.minRiskScore || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

function clampScore(value: number): number {
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
