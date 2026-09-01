import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate.js";
import { createExpenseSchema } from "../schemas/expenseSchemas.js";
import {
  createExpense,
  listExpenses,
  getExpense,
} from "../services/expenseService.js";

export async function expenseRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.post("/groups/:groupId/expenses", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { groupId } = request.params as { groupId: string };
    const input = createExpenseSchema.parse(request.body);
    const expense = await createExpense(groupId, userId, input);
    return reply.code(201).send({ expense });
  });

  app.get("/groups/:groupId/expenses", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { groupId } = request.params as { groupId: string };
    const expenses = await listExpenses(groupId, userId);
    return reply.send({ expenses });
  });

  app.get("/expenses/:id", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };
    const expense = await getExpense(id, userId);
    return reply.send({ expense });
  });
}
