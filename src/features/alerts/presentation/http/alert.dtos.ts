import { z } from "zod";

export const alertIdParamsDto = z.object({
  id: z.string().min(1),
});

export const listAlertsQueryDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  status: z.enum(["NEW", "SEEN", "RESOLVED", "IGNORED"]).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  type: z
    .enum([
      "SECURITY_LOGIN",
      "SECURITY_PASSWORD_CHANGE",
      "SECURITY_VERIFICATION_CODE",
      "SECURITY_NEW_DEVICE",
      "FINANCIAL_PAYMENT",
      "LEGAL_NOTICE",
      "HIGH_IMPORTANCE",
      "POSSIBLE_SPAM",
      "POSSIBLE_PHISHING",
      "SYNC_ERROR",
      "ACCOUNT_RECONNECT_REQUIRED",
    ])
    .optional(),
});

