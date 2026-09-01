import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "general",
  "food",
  "transport",
  "housing",
  "utilities",
  "entertainment",
  "shopping",
  "travel",
  "health",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

const participantSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().nonnegative().optional(),
  percentage: z.number().nonnegative().max(100).optional(),
  shares: z.number().int().positive().optional(),
});

export const createExpenseSchema = z
  .object({
    description: z.string().trim().min(1).max(255),
    amount: z.number().int().positive(),
    paidBy: z.string().uuid(),
    category: z.string().trim().min(1).max(50).default("general"),
    receiptUrl: z.string().url().max(1024).optional(),
    splitType: z
      .enum(["equal", "custom", "percentage", "shares"])
      .default("equal"),
    participants: z.array(participantSchema).min(1),
  })
  .refine(
    (data) =>
      data.splitType !== "custom" ||
      data.participants.every((p) => typeof p.amount === "number"),
    { message: "Custom splits require an amount for every participant" },
  )
  .refine(
    (data) =>
      data.splitType !== "percentage" ||
      data.participants.every((p) => typeof p.percentage === "number"),
    { message: "Percentage splits require a percentage for every participant" },
  )
  .refine(
    (data) =>
      data.splitType !== "shares" ||
      data.participants.every((p) => typeof p.shares === "number"),
    { message: "Shares splits require a positive shares weight for every participant" },
  )
  .refine(
    (data) =>
      new Set(data.participants.map((participant) => participant.userId)).size ===
      data.participants.length,
    { message: "Each participant can appear only once" },
  );

export const updateExpenseSchema = z
  .object({
    description: z.string().trim().min(1).max(255).optional(),
    amount: z.number().int().positive().optional(),
    paidBy: z.string().uuid().optional(),
    category: z.string().trim().min(1).max(50).optional(),
    receiptUrl: z.string().url().max(1024).nullable().optional(),
    splitType: z
      .enum(["equal", "custom", "percentage", "shares"])
      .optional(),
    participants: z.array(participantSchema).min(1).optional(),
  })
  .refine(
    (data) =>
      !data.participants ||
      new Set(data.participants.map((participant) => participant.userId)).size ===
        data.participants.length,
    { message: "Each participant can appear only once" },
  );

export const uploadReceiptSchema = z.object({
  imageBase64: z.string().min(1, "imageBase64 is required"),
  mimeType: z
    .enum(["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"])
    .default("image/jpeg"),
  fileName: z.string().max(255).optional(),
});

export const attachReceiptSchema = z.object({
  receiptUrl: z.string().url().max(1024).optional(),
  imageBase64: z.string().min(1).optional(),
  mimeType: z
    .enum(["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"])
    .optional(),
}).refine((data) => Boolean(data.receiptUrl || data.imageBase64), {
  message: "Either receiptUrl or imageBase64 must be provided",
});

export const expenseIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type UploadReceiptInput = z.infer<typeof uploadReceiptSchema>;
export type AttachReceiptInput = z.infer<typeof attachReceiptSchema>;


