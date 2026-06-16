import { z } from "zod";

const syncLogStatuses = ["RUNNING", "COMPLETED", "FAILED", "SKIPPED"] as const;

export const gmailAccountIdParamsDto = z.object({
  id: z.string().min(1),
});

export const gmailSyncLogIdParamsDto = z.object({
  id: z.string().min(1),
  logId: z.string().min(1),
});

export const listGmailSyncLogsQueryDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  status: z.enum(syncLogStatuses).optional(),
});

export const oauthStatusQueryDto = z.object({
  status: z.string().optional(),
  error: z.string().optional(),
});

export const oauthCallbackQueryDto = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});
