import { z } from "zod";
import type { ToolDefinition } from "../types.js";
import {
  getUserProfile,
  updateUserProfile,
  lookupUserByContact,
} from "../../services/userService.js";

export const getMyProfileTool: ToolDefinition = {
  name: "get_my_profile",
  description: "Get the current authenticated user's profile details including name, email, phone, and bio.",
  inputSchema: z.object({}),
  sensitive: false,
  async execute(_input, ctx) {
    const user = await getUserProfile(ctx.userId);
    return { success: true, data: { user } };
  },
};

export const lookupUserByContactTool: ToolDefinition = {
  name: "lookup_user_by_contact",
  description:
    "Lookup a registered user by their name (query — supports partial/fuzzy matching), phone number, or email address. Returns their user ID, name, email, and phone. Use the query parameter to search by name — e.g. query='rudransh' will match 'Rudransh Sharma'. Always try name search first before asking the user for contact details.",
  inputSchema: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    query: z.string().optional(),
  }),
  sensitive: false,
  async execute(input, _ctx) {
    const { phone, email, query } = input as {
      phone?: string;
      email?: string;
      query?: string;
    };
    if (!phone && !email && !query) {
      return {
        success: false,
        error: "At least one contact parameter (phone, email, or query) must be provided",
      };
    }
    const user = await lookupUserByContact({ phone, email, query });
    if (!user) {
      return { success: false, error: "No user found with the provided contact details" };
    }
    return { success: true, data: { user } };
  },
};

export const updateProfileTool: ToolDefinition = {
  name: "update_my_profile",
  description:
    "Update the current user's profile information (name, phone, or bio). Sensitive: requires confirmation.",
  inputSchema: z.object({
    name: z.string().min(1).max(120).optional(),
    phone: z.string().min(3).max(32).optional(),
    bio: z.string().max(255).optional(),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const updates = input as {
      name?: string;
      phone?: string;
      bio?: string;
    };
    const user = await updateUserProfile(ctx.userId, updates);
    return { success: true, data: { user } };
  },
};
