export const emailCategories = [
  "SECURITY",
  "IMPORTANT",
  "FINANCIAL",
  "LEGAL",
  "CLIENTS",
  "PERSONAL",
  "PROMOTIONS",
  "SPAM_PROBABLE",
  "UPDATES",
  "SOCIAL",
  "REVIEW",
  "UNCLASSIFIED",
] as const;

export type EmailCategory = (typeof emailCategories)[number];
