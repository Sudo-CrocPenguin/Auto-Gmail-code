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

import type { GmailAccount } from "../../gmail/domain/gmail-account.entity";
import { NeonButton } from "../../../shared/presentation/components/neon-button";
import { SectionPanel } from "../../../shared/presentation/components/section-panel";
import { StatusPill } from "../../../shared/presentation/components/status-pill";
import { emailCategories, type EmailCategory } from "../domain/email-category";
import type { EmailDetail, EmailListQuery, EmailSummary } from "../domain/email-message.entity";

interface InboxPanelProps {
  accounts: GmailAccount[];
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
  gmailAccountId: string;
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
  gmailAccountId: "",
  importantOnly: false,
  minRiskScore: 0,
  search: "",
  sortBy: "receivedAt",
  sortOrder: "desc",
  unreadOnly: false,
};

export function InboxPanel({
  accounts,
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
            <span>Cuenta Gmail</span>
            <select
              value={filters.gmailAccountId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  gmailAccountId: event.target.value,
                }))
              }
            >
              <option value="">Todas tus cuentas</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.email}
                </option>
              ))}
            </select>
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

          <div className="detail-tags">
            <StatusPill label={email.isRead ? "Leido" : "No leido"} tone={email.isRead ? "green" : "amber"} />
            <StatusPill
              label={email.actionRequired ? "Requiere accion" : "Sin accion"}
              tone={email.actionRequired ? "red" : "cyan"}
            />
            {email.secondaryCategories.map((category) => (
              <StatusPill key={category} label={category} tone="cyan" />
            ))}
            {email.labelIds.map((label) => (
              <StatusPill key={label} label={label} tone="magenta" />
            ))}
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
            <div>
              <dt>Adjuntos</dt>
              <dd>{email.attachments.length}</dd>
            </div>
            <div>
              <dt>Revisado</dt>
              <dd>{email.reviewedAt ? formatDateTime(email.reviewedAt) : "pendiente"}</dd>
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

          {email.actionHistory.length ? (
            <div className="history-list">
              <strong>Historial</strong>
              {email.actionHistory.map((entry) => (
                <div key={entry.id}>
                  <span>{formatDateTime(entry.createdAt)}</span>
                  <p>
                    {entry.actor} - {entry.description || entry.action}
                  </p>
                </div>
              ))}
            </div>
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
    limit: 25,
    search: filters.search.trim() || undefined,
    category: filters.category || undefined,
    gmailAccountId: filters.gmailAccountId || undefined,
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
