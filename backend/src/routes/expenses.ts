import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate.js";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
  uploadReceiptSchema,
  attachReceiptSchema,
} from "../schemas/expenseSchemas.js";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  listExpenses,
  getExpense,
  attachReceiptToExpense,
  assertCanManageExpense,
} from "../services/expenseService.js";

import { uploadReceipt } from "../services/storageService.js";

import { z } from "zod";

import { createRateLimiter } from "../middleware/rateLimit.js";

const groupParamSchema = z.object({
  groupId: z.string().uuid(),
});

const uploadRateLimit = createRateLimiter({ max: 20, windowMs: 60_000 });

export async function expenseRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.post("/expenses/receipts/upload", { preHandler: uploadRateLimit }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const input = uploadReceiptSchema.parse(request.body);
    const result = await uploadReceipt({
      userId,
      imageBase64: input.imageBase64,
      mimeType: input.mimeType,
      fileName: input.fileName,
    });
    return reply.code(201).send(result);
  });

  app.post("/groups/:groupId/expenses", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { groupId } = groupParamSchema.parse(request.params);
    const input = createExpenseSchema.parse(request.body);
    const expense = await createExpense(groupId, userId, input);
    return reply.code(201).send({ expense });
  });

  app.get("/groups/:groupId/expenses", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { groupId } = groupParamSchema.parse(request.params);
    const expenses = await listExpenses(groupId, userId);
    return reply.send({ expenses });
  });

  app.get("/expenses/:id", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = expenseIdParamSchema.parse(request.params);
    const expense = await getExpense(id, userId);
    return reply.send({ expense });
  });

  app.patch("/expenses/:id", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = expenseIdParamSchema.parse(request.params);
    const input = updateExpenseSchema.parse(request.body);
    const expense = await updateExpense(id, userId, input);
    return reply.send({ expense });
  });

  app.post("/expenses/:id/receipt", { preHandler: uploadRateLimit }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = expenseIdParamSchema.parse(request.params);
    const input = attachReceiptSchema.parse(request.body);


    // Pre-authorize user to avoid orphan file uploads on permission failure
    const existing = await getExpense(id, userId);
    await assertCanManageExpense(existing.groupId, existing.paidBy, userId);

    let receiptUrl = input.receiptUrl;
    if (!receiptUrl && input.imageBase64) {
      const uploadResult = await uploadReceipt({
        userId,
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
      });
      receiptUrl = uploadResult.path;
    }

    const expense = await attachReceiptToExpense(id, userId, receiptUrl ?? null);
    return reply.send({ expense });
  });



  app.delete("/expenses/:id", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = expenseIdParamSchema.parse(request.params);
    await deleteExpense(id, userId);
    return reply.code(204).send();
  });
}


