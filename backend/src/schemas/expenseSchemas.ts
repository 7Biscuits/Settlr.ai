import { z } from "zod";

const participantSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().nonnegative().optional(),
});

export const createExpenseSchema = z
  .object({
    description: z.string().min(1).max(255),
    amount: z.number().int().positive(),
    paidBy: z.string().uuid(),
    splitType: z.enum(["equal", "custom"]).default("equal"),
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
      new Set(data.participants.map((participant) => participant.userId)).size ===
      data.participants.length,
    { message: "Each participant can appear only once" },
  );

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
