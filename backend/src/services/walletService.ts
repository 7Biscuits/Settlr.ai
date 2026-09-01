import { db, type DbExecutor } from "../database/client.js";
import { wallets, type Wallet } from "../database/schema/wallets.js";
import { transactions, type Transaction } from "../database/schema/transactions.js";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../utils/errors.js";
import { and, eq, or, desc } from "drizzle-orm";

export async function getOrCreateWallet(userId: string): Promise<Wallet> {
  return db.transaction((tx) => getOrCreateWalletTx(tx, userId));
}

export async function getWalletBalance(userId: string): Promise<number> {
  const wallet = await getOrCreateWallet(userId);
  return wallet.balance;
}

/**
 * Sandbox top-up. Adds demo funds to the user's wallet. No real payment
 * provider is involved. Idempotent via `idempotencyKey`.
 */
export async function topUp(
  userId: string,
  amount: number,
  idempotencyKey: string,
): Promise<{ balance: number; transaction: Transaction }> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new ValidationError("Top-up amount must be a positive integer");
  }
  return db.transaction(async (tx) => {
    const existingTxn = await findByIdempotencyKey(tx, idempotencyKey);
    if (existingTxn) {
      assertMatchingTransaction(existingTxn, {
        type: "topup",
        toUserId: userId,
        amount,
      });
      const w = await getOrCreateWalletTx(tx, userId);
      return { balance: w.balance, transaction: existingTxn };
    }

    const [wallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .for("update");
    const current = wallet ?? (await insertWalletTx(tx, userId));

    const newBalance = current.balance + amount;
    await tx
      .update(wallets)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(wallets.id, current.id));

    const [txn] = await tx
      .insert(transactions)
      .values({
        type: "topup",
        toUserId: userId,
        amount,
        status: "completed",
        idempotencyKey,
      })
      .returning();

    return { balance: newBalance, transaction: txn! };
  });
}

/**
 * Transfers demo funds from one user's wallet to another atomically.
 * Enforces an insufficient-funds check and idempotent execution. Returns the
 * completed transaction. Never leaves partial state.
 */
export async function transferFunds(
  fromUserId: string,
  toUserId: string,
  amount: number,
  idempotencyKey: string,
): Promise<Transaction> {
  if (fromUserId === toUserId) {
    throw new ValidationError("Cannot transfer to yourself");
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new ValidationError("Transfer amount must be a positive integer");
  }

  return db.transaction((tx) =>
    transferFundsInTransaction(tx, {
      fromUserId,
      toUserId,
      amount,
      idempotencyKey,
      type: "transfer",
    }),
  );
}

export async function listTransactions(
  userId: string,
  pagination?: { limit?: number; offset?: number },
): Promise<Transaction[]> {
  const limit = pagination?.limit ?? 50;
  const offset = pagination?.offset ?? 0;
  return db
    .select()
    .from(transactions)
    .where(
      or(
        eq(transactions.fromUserId, userId),
        eq(transactions.toUserId, userId),
      ),
    )
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);
}


// --- transaction-scoped helpers ---

type Tx = DbExecutor;

async function findByIdempotencyKey(
  tx: Tx,
  key: string,
): Promise<Transaction | undefined> {
  const [row] = await tx
    .select()
    .from(transactions)
    .where(eq(transactions.idempotencyKey, key));
  return row;
}

async function selectWalletForUpdate(
  tx: Tx,
  userId: string,
): Promise<Wallet | undefined> {
  const [row] = await tx
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .for("update");
  return row;
}

async function insertWalletTx(tx: Tx, userId: string): Promise<Wallet> {
  const [row] = await tx
    .insert(wallets)
    .values({ userId, balance: 0 })
    .onConflictDoNothing()
    .returning();
  if (row) return row;

  const existing = await selectWalletForUpdate(tx, userId);
  if (!existing) {
    throw new NotFoundError("User wallet could not be created");
  }
  return existing;
}

async function getOrCreateWalletTx(tx: Tx, userId: string): Promise<Wallet> {
  return (
    (await selectWalletForUpdate(tx, userId)) ??
    (await insertWalletTx(tx, userId))
  );
}

export { and, eq };

export async function transferFundsInTransaction(
  tx: Tx,
  input: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    idempotencyKey: string;
    type: "transfer" | "settlement";
  },
): Promise<Transaction> {
  const { fromUserId, toUserId, amount, idempotencyKey, type } = input;
  const existingTxn = await findByIdempotencyKey(tx, idempotencyKey);
  if (existingTxn) {
    assertMatchingTransaction(existingTxn, {
      type,
      fromUserId,
      toUserId,
      amount,
    });
    return existingTxn;
  }

  // Lock wallets in a stable order so two opposite-direction transfers cannot
  // deadlock while waiting on each other's row.
  const [firstUserId, secondUserId] =
    fromUserId < toUserId ? [fromUserId, toUserId] : [toUserId, fromUserId];
  const firstWallet = await getOrCreateWalletTx(tx, firstUserId);
  const secondWallet = await getOrCreateWalletTx(tx, secondUserId);
  const fromWallet = fromUserId === firstUserId ? firstWallet : secondWallet;
  const toWallet = toUserId === firstUserId ? firstWallet : secondWallet;

  if (fromWallet.balance < amount) {
    throw new ConflictError("Insufficient wallet funds");
  }

  await tx
    .update(wallets)
    .set({ balance: fromWallet.balance - amount, updatedAt: new Date() })
    .where(eq(wallets.id, fromWallet.id));
  await tx
    .update(wallets)
    .set({ balance: toWallet.balance + amount, updatedAt: new Date() })
    .where(eq(wallets.id, toWallet.id));

  const [txn] = await tx
    .insert(transactions)
    .values({
      type,
      fromUserId,
      toUserId,
      amount,
      status: "completed",
      idempotencyKey,
    })
    .returning();
  if (!txn) {
    throw new Error("Transaction creation did not return a row");
  }
  return txn;
}

function assertMatchingTransaction(
  transaction: Transaction,
  expected: {
    type: "topup" | "transfer" | "settlement";
    fromUserId?: string;
    toUserId?: string;
    amount: number;
  },
): void {
  if (
    transaction.type !== expected.type ||
    transaction.fromUserId !== (expected.fromUserId ?? null) ||
    transaction.toUserId !== (expected.toUserId ?? null) ||
    transaction.amount !== expected.amount
  ) {
    throw new ConflictError(
      "This idempotency key was already used for a different transaction",
    );
  }
}

export { findByIdempotencyKey, assertMatchingTransaction };
