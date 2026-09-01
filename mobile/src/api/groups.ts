import { apiFetch } from "./client";
import type {
  Group,
  GroupDetail,
  GroupInvitation,
  GroupMember,
  InviteOrAddResult,
} from "./types";

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

export function inviteOrAddMember(
  groupId: string,
  email: string,
): Promise<InviteOrAddResult> {
  return apiFetch<InviteOrAddResult>(`/groups/${groupId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function getInvitation(
  token: string,
): Promise<{ invitation: GroupInvitation }> {
  return apiFetch<{ invitation: GroupInvitation }>(`/invitations/${token}`);
}

export function acceptInvitation(token: string): Promise<{ group: Group }> {
  return apiFetch<{ group: Group }>(`/invitations/${token}/accept`, {
    method: "POST",
  });
}

export function listGroupInvitations(
  groupId: string,
): Promise<{ invitations: GroupInvitation[] }> {
  return apiFetch<{ invitations: GroupInvitation[] }>(
    `/groups/${groupId}/invitations`,
  );
}

export function cancelGroupInvitation(
  groupId: string,
  invitationId: string,
): Promise<void> {
  return apiFetch<void>(`/groups/${groupId}/invitations/${invitationId}`, {
    method: "DELETE",
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

export function leaveGroup(groupId: string): Promise<void> {
  return apiFetch<void>(`/groups/${groupId}/members/me`, {
    method: "DELETE",
  });
}
