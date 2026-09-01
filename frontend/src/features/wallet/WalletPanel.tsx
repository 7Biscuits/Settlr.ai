"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../services/apiClient";
import { formatAmount, type Transaction } from "../../services/types";

export function WalletPanel() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topupAmount, setTopupAmount] = useState("");

  async function load() {
    const [b, t] = await Promise.all([
      apiFetch<{ balance: number }>("/wallet"),
      apiFetch<{ transactions: Transaction[] }>("/wallet/transactions"),
    ]);
    setBalance(b.balance);
    setTransactions(t.transactions);
  }

  useEffect(() => {
    load();
  }, []);

  async function topUp(e: React.FormEvent) {
    e.preventDefault();
    const major = Number(topupAmount);
    if (!Number.isFinite(major) || major <= 0) return;
    await apiFetch("/wallet/topup", {
      method: "POST",
      body: JSON.stringify({
        amount: Math.round(major * 100),
        idempotencyKey: `topup-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      }),
    });
    setTopupAmount("");
    load();
  }

  return (
    <section className="rounded border border-gray-800 p-4">
      <h2 className="mb-3 text-lg font-semibold">Wallet</h2>
      <p className="mb-3 text-2xl font-bold">{formatAmount(balance)}</p>
      <form onSubmit={topUp} className="mb-3 flex gap-2">
        <input
          className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2"
          placeholder="Top up amount"
          value={topupAmount}
          onChange={(e) => setTopupAmount(e.target.value)}
        />
        <button className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-500">
          Top up
        </button>
      </form>
      <ul className="flex max-h-40 flex-col gap-1 overflow-auto">
        {transactions.map((t) => (
          <li
            key={t.id}
            className="flex justify-between rounded bg-gray-900 px-3 py-1 text-sm"
          >
            <span>{t.type}</span>
            <span>{formatAmount(t.amount)}</span>
          </li>
        ))}
        {transactions.length === 0 && (
          <li className="text-sm text-gray-500">No transactions yet.</li>
        )}
      </ul>
    </section>
  );
}
