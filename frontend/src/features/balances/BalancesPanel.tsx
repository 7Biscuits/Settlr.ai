"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../services/apiClient";
import { formatAmount, type DirectedBalance } from "../../services/types";

export function BalancesPanel() {
  const [balances, setBalances] = useState<DirectedBalance[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ balances: DirectedBalance[] }>("/balances")
      .then((res) => setBalances(res.balances))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, []);

  return (
    <section className="rounded border border-gray-800 p-4">
      <h2 className="mb-3 text-lg font-semibold">Balances</h2>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <ul className="flex flex-col gap-1">
        {balances.map((b) => (
          <li
            key={b.otherUserId}
            className="flex justify-between rounded bg-gray-900 px-3 py-2"
          >
            <span>{b.otherUserName}</span>
            <span className={b.netAmount >= 0 ? "text-green-400" : "text-red-400"}>
              {b.netAmount >= 0
                ? `owes you ${formatAmount(b.netAmount)}`
                : `you owe ${formatAmount(-b.netAmount)}`}
            </span>
          </li>
        ))}
        {balances.length === 0 && (
          <li className="text-sm text-gray-500">All settled up.</li>
        )}
      </ul>
    </section>
  );
}
