import { z } from "zod";

import { emailCategories } from "../../domain/email-category";

const booleanQuery = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

const optionalNumberQuery = z.preprocess((value) => {
  if (value === undefined || value === "") return undefined;
  return Number(value);
}, z.number().min(0).max(100).optional());

const optionalBooleanQuery = booleanQuery.optional();
const emailCategoryDto = z.enum(emailCategories);

export const emailIdParamsDto = z.object({
  id: z.string().min(1),
});

export const emailAttachmentParamsDto = z.object({
  id: z.string().min(1),
  attachmentId: z.string().min(1),
});

export const listEmailsQueryDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  search: z.string().trim().optional(),
  gmailAccountId: z.string().trim().optional(),
  fromEmail: z.string().trim().email().optional(),
  fromDomain: z.string().trim().optional(),
  category: emailCategoryDto.optional(),
  isImportant: optionalBooleanQuery,
  isSpam: optionalBooleanQuery,
  actionRequired: optionalBooleanQuery,
  hasAttachments: optionalBooleanQuery,
  isRead: optionalBooleanQuery,
  minImportanceScore: optionalNumberQuery,
  minRiskScore: optionalNumberQuery,
  minSecurityScore: optionalNumberQuery,
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(["receivedAt", "importanceScore", "riskScore", "securityScore"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const correctClassificationDto = z.object({
  primaryCategory: emailCategoryDto,
  secondaryCategories: z.array(emailCategoryDto).optional(),
  importanceScore: z.number().min(0).max(100).optional(),
  spamScore: z.number().min(0).max(100).optional(),
  riskScore: z.number().min(0).max(100).optional(),
  securityScore: z.number().min(0).max(100).optional(),
  actionRequired: z.boolean().optional(),
  explanation: z.string().trim().min(3).max(1000).optional(),
});
