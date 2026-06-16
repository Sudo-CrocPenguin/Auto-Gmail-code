import { z } from "zod";

export const senderIdParamsDto = z.object({
  id: z.string().min(1),
});

export const listSendersQueryDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  search: z.string().trim().optional(),
  status: z.enum(["NORMAL", "TRUSTED", "SUSPICIOUS", "BLOCKED"]).optional(),
});

export const listSenderEmailsQueryDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

