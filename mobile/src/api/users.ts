import { apiFetch } from "./client";
import type {
  User,
  UpdateProfileInput,
  SingleLookupInput,
  ContactsLookupInput,
  ContactMatchUser,
  ContactsLookupResult,
} from "./types";

export function getMeProfile(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/users/me");
}

export function updateUserProfile(
  input: UpdateProfileInput,
): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function lookupUser(
  input: SingleLookupInput,
): Promise<{ user: ContactMatchUser }> {
  return apiFetch<{ user: ContactMatchUser }>("/users/lookup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function bulkLookupContacts(
  input: ContactsLookupInput,
): Promise<ContactsLookupResult> {
  return apiFetch<ContactsLookupResult>("/users/contacts-lookup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getUserProfile(id: string): Promise<{ user: User }> {
  return apiFetch<{ user: User }>(`/users/${id}`);
}
