"use client";

import { useState } from "react";
import { useAuthForm } from "./useAuthForm";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { submit, error, loading } = useAuthForm(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  return (
    <form
      className="mx-auto flex w-full max-w-sm flex-col gap-4 p-8"
      onSubmit={(e) => {
        e.preventDefault();
        submit(mode === "register" ? { email, password, name } : { email, password });
      }}
    >
      <h1 className="text-2xl font-bold">
        {mode === "login" ? "Log in" : "Create your account"}
      </h1>

      {mode === "register" && (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-400">Name</span>
          <input
            className="rounded border border-gray-700 bg-gray-900 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-400">Email</span>
        <input
          type="email"
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-400">Password</span>
        <input
          type="password"
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={mode === "register" ? 8 : 1}
          required
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {loading ? "Please wait..." : mode === "login" ? "Log in" : "Register"}
      </button>
    </form>
  );
}
