import { db } from "../database/client.js";
import { groups, type Group } from "../database/schema/groups.js";
import { groupMembers } from "../database/schema/groupMembers.js";
import { users } from "../database/schema/users.js";
import {
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "../utils/errors.js";
import { and, eq } from "drizzle-orm";

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
): Promise<{ group: Group; members: { id: string; name: string; email: string }[] }> {
  await assertMember(groupId, userId);
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group) {
    throw new NotFoundError("Group not found");
  }
  const members = await db
    .select({ id: users.id, name: users.name, email: users.email })
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
  await assertMember(groupId, requesterId);
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

export async function removeMember(
  groupId: string,
  requesterId: string,
  targetUserId: string,
): Promise<void> {
  await assertMember(groupId, requesterId);
  await db
    .delete(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, targetUserId),
      ),
    );
}
