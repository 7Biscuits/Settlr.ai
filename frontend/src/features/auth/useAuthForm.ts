    "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setToken } from "../../services/apiClient";

interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string };
}

export function useAuthForm(mode: "login" | "register") {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(values: {
    email: string;
    password: string;
    name?: string;
  }) {
    setError(null);
    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const res = await apiFetch<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify(values),
      });
      setToken(res.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return { submit, error, loading };
}
