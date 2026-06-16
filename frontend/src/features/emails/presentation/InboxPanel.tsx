import { Paperclip, ShieldAlert, Star } from "lucide-react";

import { SectionPanel } from "../../../shared/presentation/components/section-panel";
import { StatusPill } from "../../../shared/presentation/components/status-pill";
import type { EmailSummary } from "../domain/email-message.entity";

interface InboxPanelProps {
  emails: EmailSummary[];
}

export function InboxPanel({ emails }: InboxPanelProps) {
  return (
    <SectionPanel eyebrow="Bandeja unificada" title="Correos recientes">
      <div className="email-list">
        {emails.length ? (
          emails.map((email) => (
            <article className="email-row" key={email.id}>
              <div className="email-row__signal">{email.isImportant ? <Star size={17} /> : <ShieldAlert size={17} />}</div>
              <div>
                <strong>{email.subject || "Sin asunto"}</strong>
                <span>
                  {email.fromName ?? email.fromEmail} - {new Date(email.receivedAt).toLocaleDateString()}
                </span>
              </div>
              <StatusPill label={email.primaryCategory} tone={email.isSpam ? "red" : "cyan"} />
              <span className="risk-meter">
                <i style={{ width: `${Math.min(Math.max(email.riskScore, 0), 100)}%` }} />
              </span>
              <span className="email-row__meta">
                {email.attachmentCount ? <Paperclip size={15} /> : null}
                {email.isRead ? "Leido" : "Nuevo"}
              </span>
            </article>
          ))
        ) : (
          <p className="empty-state">Sin correos para mostrar.</p>
        )}
      </div>
    </SectionPanel>
  );
}
