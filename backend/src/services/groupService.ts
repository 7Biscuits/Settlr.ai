import { randomUUID } from "node:crypto";
import { db } from "../database/client.js";
import { groups, type Group } from "../database/schema/groups.js";
import { groupMembers } from "../database/schema/groupMembers.js";
import {
  groupInvitations,
  type GroupInvitation,
} from "../database/schema/groupInvitations.js";
import { users } from "../database/schema/users.js";
import {
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "../utils/errors.js";
import { and, desc, eq, gt } from "drizzle-orm";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface InvitationDetails {
  id: string;
  groupId: string;
  groupName: string;
  email: string;
  status: string;
  expiresAt: Date;
  inviteUrl: string;
}

export type InviteOrAddResult =
  | {
      kind: "member_added";
      member: { id: string; name: string; email: string };
    }
  | {
      kind: "invitation_created" | "invitation_existing";
      invitation: InvitationDetails;
    };

export async function createGroup(
  userId: string,
  name: string,
): Promise<Group> {
  return db.transaction(async (tx) => {
    const [group] = await tx
      .insert(groups)
      .values({ name, createdBy: userId })
      .returning();
    await tx.insert(groupMembers).values({
      groupId: group!.id,
      userId,
      role: "owner",
    });
    return group!;
  });
}

export async function isMember(
  groupId: string,
  userId: string,
): Promise<boolean> {
  const rows = await db
    .select()
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    );
  return rows.length > 0;
}

export async function assertMember(
  groupId: string,
  userId: string,
): Promise<void> {
  if (!(await isMember(groupId, userId))) {
    throw new ForbiddenError("You are not a member of this group");
  }
}

async function assertOwner(groupId: string, userId: string): Promise<void> {
  const [membership] = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    );
  if (membership?.role !== "owner") {
    throw new ForbiddenError("Only the group owner can manage members");
  }
}

export async function listGroupsForUser(userId: string): Promise<Group[]> {
  const rows = await db
    .select({ group: groups })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, userId));
  return rows.map((r) => r.group);
}

export async function getGroup(
  groupId: string,
  userId: string,
): Promise<{
  group: Group;
  members: { id: string; name: string; email: string; role: string }[];
}> {
  await assertMember(groupId, userId);
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group) {
    throw new NotFoundError("Group not found");
  }
  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: groupMembers.role,
    })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(eq(groupMembers.groupId, groupId));
  return { group, members };
}

export async function addMemberByEmail(
  groupId: string,
  requesterId: string,
  email: string,
): Promise<{ id: string; name: string; email: string }> {
  await assertOwner(groupId, requesterId);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()));
  if (!user) {
    throw new NotFoundError("No user with that email");
  }
  if (await isMember(groupId, user.id)) {
    throw new ConflictError("User is already a member");
  }
  await db.insert(groupMembers).values({ groupId, userId: user.id });
  return { id: user.id, name: user.name, email: user.email };
}

/**
 * Adds an existing PayPilot account immediately, or creates a secure,
 * email-bound invitation for somebody who has not signed up yet.
 */
export async function inviteOrAddMemberByEmail(
  groupId: string,
  requesterId: string,
  rawEmail: string,
): Promise<InviteOrAddResult> {
  await assertOwner(groupId, requesterId);
  const email = rawEmail.toLowerCase().trim();

  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (user) {
    if (await isMember(groupId, user.id)) {
      throw new ConflictError("User is already a member");
    }
    await db.insert(groupMembers).values({ groupId, userId: user.id });
    return {
      kind: "member_added",
      member: { id: user.id, name: user.name, email: user.email },
    };
  }

  const now = new Date();
  const [pending] = await db
    .select()
    .from(groupInvitations)
    .where(
      and(
        eq(groupInvitations.groupId, groupId),
        eq(groupInvitations.email, email),
        eq(groupInvitations.status, "pending"),
        gt(groupInvitations.expiresAt, now),
      ),
    )
    .orderBy(desc(groupInvitations.createdAt));
  if (pending) {
    return {
      kind: "invitation_existing",
      invitation: toInvitationDetails(pending, group.name),
    };
  }

  const [invitation] = await db
    .insert(groupInvitations)
    .values({
      groupId,
      invitedBy: requesterId,
      email,
      token: randomUUID(),
      status: "pending",
      expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
    })
    .returning();
  if (!invitation) {
    throw new Error("Invitation creation did not return a row");
  }
  return {
    kind: "invitation_created",
    invitation: toInvitationDetails(invitation, group.name),
  };
}

export async function listGroupInvitations(
  groupId: string,
  requesterId: string,
): Promise<InvitationDetails[]> {
  await assertOwner(groupId, requesterId);
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group) throw new NotFoundError("Group not found");
  const invitations = await db
    .select()
    .from(groupInvitations)
    .where(eq(groupInvitations.groupId, groupId))
    .orderBy(desc(groupInvitations.createdAt));
  return invitations.map((invitation) => toInvitationDetails(invitation, group.name));
}

export async function getInvitationForRecipient(
  token: string,
  recipientEmail: string,
): Promise<InvitationDetails> {
  const [invitation] = await db
    .select()
    .from(groupInvitations)
    .where(eq(groupInvitations.token, token));
  if (!invitation) throw new NotFoundError("Invitation not found");
  if (invitation.email !== recipientEmail.toLowerCase().trim()) {
    throw new ForbiddenError("This invitation was sent to a different email address");
  }
  const [group] = await db.select().from(groups).where(eq(groups.id, invitation.groupId));
  if (!group) throw new NotFoundError("Group not found");
  return toInvitationDetails(invitation, group.name);
}

export async function acceptGroupInvitation(
  token: string,
  userId: string,
  userEmail: string,
): Promise<{ group: Group }> {
  return db.transaction(async (tx) => {
    const [invitation] = await tx
      .select()
      .from(groupInvitations)
      .where(eq(groupInvitations.token, token))
      .for("update");
    if (!invitation) throw new NotFoundError("Invitation not found");
    if (invitation.email !== userEmail.toLowerCase().trim()) {
      throw new ForbiddenError("This invitation was sent to a different email address");
    }
    const [group] = await tx.select().from(groups).where(eq(groups.id, invitation.groupId));
    if (!group) throw new NotFoundError("Group not found");
    if (invitation.status === "cancelled" || invitation.status === "expired") {
      throw new ConflictError("This invitation is no longer active");
    }
    if (invitation.expiresAt <= new Date()) {
      await tx
        .update(groupInvitations)
        .set({ status: "expired" })
        .where(eq(groupInvitations.id, invitation.id));
      throw new ConflictError("This invitation has expired");
    }

    await tx
      .insert(groupMembers)
      .values({ groupId: invitation.groupId, userId })
      .onConflictDoNothing();
    if (invitation.status !== "accepted") {
      await tx
        .update(groupInvitations)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(eq(groupInvitations.id, invitation.id));
    }
    return { group };
  });
}

export async function cancelGroupInvitation(
  groupId: string,
  invitationId: string,
  requesterId: string,
): Promise<void> {
  await assertOwner(groupId, requesterId);
  const [invitation] = await db
    .select()
    .from(groupInvitations)
    .where(
      and(
        eq(groupInvitations.id, invitationId),
        eq(groupInvitations.groupId, groupId),
      ),
    );
  if (!invitation) throw new NotFoundError("Invitation not found");
  if (invitation.status !== "pending") {
    throw new ConflictError("Only pending invitations can be cancelled");
  }
  await db
    .update(groupInvitations)
    .set({ status: "cancelled" })
    .where(eq(groupInvitations.id, invitationId));
}

function toInvitationDetails(
  invitation: GroupInvitation,
  groupName: string,
): InvitationDetails {
  return {
    id: invitation.id,
    groupId: invitation.groupId,
    groupName,
    email: invitation.email,
    status:
      invitation.status === "pending" && invitation.expiresAt <= new Date()
        ? "expired"
        : invitation.status,
    expiresAt: invitation.expiresAt,
    inviteUrl: `paypilot://invite/${invitation.token}`,
  };
}

export async function removeMember(
  groupId: string,
  requesterId: string,
  targetUserId: string,
): Promise<void> {
  await assertOwner(groupId, requesterId);
  const [targetMembership] = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, targetUserId),
      ),
    );
  if (!targetMembership) {
    throw new NotFoundError("User is not a member of this group");
  }
  if (targetMembership.role === "owner") {
    throw new ConflictError("The group owner cannot be removed");
  }
  await db
    .delete(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, targetUserId),
      ),
    );
}

/** Allows a non-owner to remove themself from a group without owner approval. */
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const [membership] = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    );
  if (!membership) {
    throw new NotFoundError("You are not a member of this group");
  }
  if (membership.role === "owner") {
    throw new ConflictError(
      "The group owner cannot leave. Transfer ownership or delete the group first.",
    );
  }
  await db
    .delete(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    );
}
