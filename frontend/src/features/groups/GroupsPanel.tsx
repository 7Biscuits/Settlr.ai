"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../services/apiClient";
import type { Group } from "../../services/types";

export function GroupsPanel() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await apiFetch<{ groups: Group[] }>("/groups");
      setGroups(res.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await apiFetch<{ group: Group }>("/groups", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setName("");
    load();
  }

  return (
    <section className="rounded border border-gray-800 p-4">
      <h2 className="mb-3 text-lg font-semibold">Groups</h2>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <ul className="mb-3 flex flex-col gap-1">
        {groups.map((g) => (
          <li key={g.id} className="rounded bg-gray-900 px-3 py-2">
            {g.name}
          </li>
        ))}
        {groups.length === 0 && (
          <li className="text-sm text-gray-500">No groups yet.</li>
        )}
      </ul>
      <form onSubmit={createGroup} className="flex gap-2">
        <input
          className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2"
          placeholder="New group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-500">
          Add
        </button>
      </form>
    </section>
  );
}
