import sanitizeHtml from "sanitize-html";

import type { EmailMessage } from "../../domain/email-message.entity";

export function presentEmailSummary(email: EmailMessage) {
  const { bodyHtml: _bodyHtml, bodyText: _bodyText, actionHistory: _actionHistory, attachments, ...summary } = email;

  return {
    ...summary,
    attachmentCount: attachments.length,
  };
}

export function presentEmailDetail(email: EmailMessage) {
  return {
    ...email,
    bodyHtml: email.bodyHtml ? sanitizeEmailHtml(email.bodyHtml) : null,
  };
}

function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "ul",
      "ol",
      "li",
      "a",
      "blockquote",
      "code",
      "pre",
      "span",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      span: ["class"],
      table: ["class"],
      th: ["class", "colspan", "rowspan"],
      td: ["class", "colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank",
      }),
    },
  });
}
