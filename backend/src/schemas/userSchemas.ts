import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().min(3).max(32).nullable().optional(),
    avatarUrl: z.string().url().max(512).nullable().optional(),
    bio: z.string().trim().max(255).nullable().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.phone !== undefined ||
      data.avatarUrl !== undefined ||
      data.bio !== undefined,
    { message: "At least one profile field must be provided for update" },
  );

export const singleLookupSchema = z
  .object({
    phone: z.string().trim().optional(),
    email: z.string().trim().optional(),
    query: z.string().trim().optional(),
  })
  .refine(
    (data) => Boolean(data.phone || data.email || data.query),
    { message: "At least one lookup parameter (phone, email, or query) is required" },
  );

export const contactsLookupSchema = z.object({
  phones: z.array(z.string().trim().min(1)).max(500).optional().default([]),
  emails: z.array(z.string().trim().email()).max(500).optional().default([]),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SingleLookupInput = z.infer<typeof singleLookupSchema>;
export type ContactsLookupInput = z.infer<typeof contactsLookupSchema>;
