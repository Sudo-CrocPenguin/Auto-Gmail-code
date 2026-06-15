import { z } from "zod";

export const listAuditQueryDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  action: z.string().trim().optional(),
  userId: z.string().trim().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

