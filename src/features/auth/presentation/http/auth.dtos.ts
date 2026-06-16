import { z } from "zod";

export const registerUserDto = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  password: z.string().min(8).max(120),
  workspaceName: z.string().trim().min(2).max(120),
  acceptTerms: z.literal(true, {
    message: "Debes aceptar los terminos para crear la cuenta.",
  }),
});

export const loginUserDto = z.object({
  email: z.string().trim().email().max(180),
  password: z.string().min(1).max(120),
});

export const changePasswordDto = z.object({
  currentPassword: z.string().min(1).max(120),
  newPassword: z.string().min(8).max(120),
});
