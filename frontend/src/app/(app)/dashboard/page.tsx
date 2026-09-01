"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "../../../services/apiClient";
import { GroupsPanel } from "../../../features/groups/GroupsPanel";
import { BalancesPanel } from "../../../features/balances/BalancesPanel";
import { WalletPanel } from "../../../features/wallet/WalletPanel";
import { ChatPanel } from "../../../features/ai/ChatPanel";

interface Me {
  user: { id: string; email: string; name: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me["user"] | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    apiFetch<Me>("/auth/me")
      .then((res) => setMe(res.user))
      .catch(() => router.replace("/login"))
      .finally(() => setReady(true));
  }, [router]);

  if (!ready) return <main className="p-8">Loading...</main>;
  if (!me) return null;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Welcome, {me.name}</h1>
      </header>
      <div className="grid gap-8 md:grid-cols-2">
        <GroupsPanel />
        <BalancesPanel />
        <WalletPanel />
        <ChatPanel />
      </div>
    </main>
  );
}
