import { z } from "zod";

const conditionFieldDto = z.enum([
  "fromEmail",
  "fromDomain",
  "subject",
  "body",
  "gmailLabel",
  "hasAttachment",
  "importanceScore",
  "riskScore",
  "securityScore",
  "gmailAccountId",
  "detectedCategory",
]);

const conditionOperatorDto = z.enum(["equals", "contains", "greaterThan", "lessThan", "exists"]);
const actionTypeDto = z.enum([
  "assignCategory",
  "markImportant",
  "generateAlert",
  "markReview",
  "ignoreSpam",
  "applyInternalLabel",
  "applyGmailLabel",
  "notify",
]);

const ruleConditionDto = z.object({
  field: conditionFieldDto,
  operator: conditionOperatorDto,
  value: z.union([z.string().min(1), z.number(), z.boolean()]),
});

const ruleActionDto = z.object({
  type: actionTypeDto,
  value: z.union([z.string().min(1), z.boolean()]),
});

export const ruleIdParamsDto = z.object({
  id: z.string().min(1),
});

export const listRulesQueryDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  enabled: z
    .preprocess((value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      return value;
    }, z.boolean())
    .optional(),
  search: z.string().trim().optional(),
});

export const createRuleDto = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  conditions: z.array(ruleConditionDto).min(1).max(10),
  actions: z.array(ruleActionDto).min(1).max(10),
  priority: z.number().int().min(1).max(1000),
  enabled: z.boolean().optional(),
});

export const updateRuleDto = createRuleDto.partial().refine((value) => Object.keys(value).length > 0, {
  message: "Debes enviar al menos un campo para actualizar.",
});

