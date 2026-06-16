import { randomUUID } from "node:crypto";

import type { EmailCategory } from "../../emails/domain/email-category";
import type { EmailClassification } from "../../emails/domain/email-classification.entity";

export interface ClassificationSource {
  emailMessageId: string;
  fromDomain: string;
  subject: string;
  snippet: string;
  labelIds: string[];
  hasAttachments: boolean;
}

export function classifyGmailEmail(source: ClassificationSource): EmailClassification {
  const text = `${source.fromDomain} ${source.subject} ${source.snippet} ${source.labelIds.join(" ")}`.toLowerCase();
  const labelSet = new Set(source.labelIds.map((label) => label.toUpperCase()));

  let primaryCategory: EmailCategory = "UNCLASSIFIED";
  const secondaryCategories = new Set<EmailCategory>();
  let importanceScore = labelSet.has("IMPORTANT") ? 82 : 35;
  let spamScore = labelSet.has("SPAM") ? 88 : 8;
  let riskScore = 10;
  let securityScore = 5;
  let actionRequired = false;
  let explanation = "No se detectaron senales fuertes de clasificacion.";

  if (labelSet.has("CATEGORY_PROMOTIONS")) {
    primaryCategory = "PROMOTIONS";
    importanceScore = 20;
    explanation = "Gmail marco el correo como promocion.";
  }

  if (labelSet.has("CATEGORY_SOCIAL")) {
    primaryCategory = "SOCIAL";
    importanceScore = 20;
    explanation = "Gmail marco el correo como social.";
  }

  if (labelSet.has("SPAM") || hasAny(text, ["unsubscribe", "winner", "lottery", "free money"])) {
    primaryCategory = "SPAM_PROBABLE";
    spamScore = Math.max(spamScore, 82);
    riskScore = Math.max(riskScore, 55);
    explanation = "El correo tiene indicadores de spam o fue marcado como spam por Gmail.";
  }

  if (hasAny(text, ["login", "inicio de sesion", "password", "contrasena", "verification", "codigo", "2fa", "new device", "nuevo dispositivo"])) {
    primaryCategory = "SECURITY";
    secondaryCategories.add("IMPORTANT");
    importanceScore = Math.max(importanceScore, 88);
    securityScore = 92;
    riskScore = Math.max(riskScore, 45);
    actionRequired = true;
    explanation = "El contenido indica evento de seguridad, acceso, codigo o cambio de credenciales.";
  }

  if (hasAny(text, ["invoice", "factura", "payment", "pago", "receipt", "recibo", "bank", "banco", "transfer"])) {
    if (primaryCategory === "UNCLASSIFIED" || primaryCategory === "PROMOTIONS") {
      primaryCategory = "FINANCIAL";
    } else {
      secondaryCategories.add("FINANCIAL");
    }
    importanceScore = Math.max(importanceScore, source.hasAttachments ? 82 : 70);
    actionRequired = actionRequired || source.hasAttachments;
    explanation = "El correo contiene senales financieras o de pago.";
  }

  if (hasAny(text, ["legal", "judicial", "lawsuit", "demanda", "court", "juzgado", "notice", "notificacion"])) {
    primaryCategory = "LEGAL";
    secondaryCategories.add("IMPORTANT");
    importanceScore = Math.max(importanceScore, 92);
    riskScore = Math.max(riskScore, 70);
    actionRequired = true;
    explanation = "El correo contiene senales legales o judiciales que requieren revision.";
  }

  if (labelSet.has("IMPORTANT")) {
    secondaryCategories.add("IMPORTANT");
  }

  return {
    id: randomUUID(),
    emailMessageId: source.emailMessageId,
    primaryCategory,
    secondaryCategories: Array.from(secondaryCategories).filter((category) => category !== primaryCategory),
    importanceScore,
    spamScore,
    riskScore,
    securityScore,
    actionRequired,
    explanation,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function hasAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

