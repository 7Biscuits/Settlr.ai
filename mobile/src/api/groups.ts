import { apiFetch } from "./client";
import type { Group, GroupDetail, GroupMember } from "./types";

export function listGroups(): Promise<{ groups: Group[] }> {
  return apiFetch<{ groups: Group[] }>("/groups");
}

export function createGroup(name: string): Promise<{ group: Group }> {
  return apiFetch<{ group: Group }>("/groups", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function getGroup(id: string): Promise<GroupDetail> {
  return apiFetch<GroupDetail>(`/groups/${id}`);
}

export function addMemberByEmail(
  groupId: string,
  email: string,
): Promise<{ member: GroupMember }> {
  return apiFetch<{ member: GroupMember }>(`/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function removeMember(
  groupId: string,
  userId: string,
): Promise<void> {
  return apiFetch<void>(`/groups/${groupId}/members/${userId}`, {
    method: "DELETE",
  });
}
