import { z } from "zod";

export const gmailAccountIdParamsDto = z.object({
  id: z.string().min(1),
});

export const oauthStatusQueryDto = z.object({
  status: z.string().optional(),
  error: z.string().optional(),
});

