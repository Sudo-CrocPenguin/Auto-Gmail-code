import { z } from "zod";

export const updateWorkspaceDto = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    plan: z.string().trim().min(2).max(60).optional(),
  })
  .refine((value) => value.name !== undefined || value.plan !== undefined, {
    message: "Debes enviar al menos un campo para actualizar.",
  });

