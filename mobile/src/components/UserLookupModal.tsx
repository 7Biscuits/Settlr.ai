import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Input } from "./Input";
import { Button } from "./Button";
import { Card } from "./Card";
import { LoadingState } from "./States";
import { lookupUser, bulkLookupContacts } from "../api/users";
import { ensureContactsPermission, searchContacts } from "../lib/contacts";
import type { ContactMatchUser } from "../api/types";

interface Props {
  visible: boolean;
  title?: string;
  onSelect: (user: ContactMatchUser) => void;
  onCancel: () => void;
}

export function UserLookupModal({
  visible,
  title = "Find PayPilot User",
  onSelect,
  onCancel,
}: Props) {
  const [tab, setTab] = useState<"search" | "contacts">("search");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedUser, setSearchedUser] = useState<ContactMatchUser | null>(null);
  const [matchedContacts, setMatchedContacts] = useState<ContactMatchUser[]>([]);
  const [contactsScanned, setContactsScanned] = useState(false);

  async function handleSearch() {
    const q = query.trim();
    if (!q) {
      setError("Please enter a name, email, or phone number.");
      return;
    }
    setLoading(true);
    setError(null);
    setSearchedUser(null);
    try {
      const isEmail = q.includes("@");
      const isPhone = /^[+\d\s()-]+$/.test(q);
      const res = await lookupUser({
        email: isEmail ? q : undefined,
        phone: !isEmail && isPhone ? q : undefined,
        query: !isEmail && !isPhone ? q : undefined,
      });
      setSearchedUser(res.user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No registered user found.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleScanContacts() {
    setLoading(true);
    setError(null);
    try {
      const granted = await ensureContactsPermission();
      if (!granted) {
        setError("Contacts permission is required to find registered contacts.");
        setLoading(false);
        return;
      }
      const localContacts = await searchContacts("");
      const phones: string[] = [];
      const emails: string[] = [];
      for (const c of localContacts) {
        phones.push(...c.phoneNumbers);
        emails.push(...c.emails);
      }

      if (phones.length === 0 && emails.length === 0) {
        setError("No contacts found on device with phone or email.");
        setContactsScanned(true);
        setLoading(false);
        return;
      }

      const res = await bulkLookupContacts({
        phones: phones.slice(0, 300),
        emails: emails.slice(0, 300),
      });
      setMatchedContacts(res.matched);
      setContactsScanned(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to match contacts.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setQuery("");
    setError(null);
    setSearchedUser(null);
    setMatchedContacts([]);
    setContactsScanned(false);
    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="max-h-[85%] rounded-t-3xl border-t border-border bg-surface p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-text">{title}</Text>
            <Pressable onPress={handleClose} className="p-1">
              <Text className="text-lg text-muted">✕</Text>
            </Pressable>
          </View>

          <View className="mb-4 flex-row gap-2">
            <View className="flex-1">
              <Button
                title="Search User"
                variant={tab === "search" ? "primary" : "secondary"}
                onPress={() => {
                  setTab("search");
                  setError(null);
                }}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Device Contacts"
                variant={tab === "contacts" ? "primary" : "secondary"}
                onPress={() => {
                  setTab("contacts");
                  setError(null);
                  if (!contactsScanned) void handleScanContacts();
                }}
              />
            </View>
          </View>

          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            {tab === "search" ? (
              <View className="gap-3">
                <Input
                  label="Search by Email, Phone, or Name"
                  placeholder="e.g. alex@example.com or +14155552671"
                  value={query}
                  onChangeText={(t) => {
                    setQuery(t);
                    if (error) setError(null);
                  }}
                  autoCapitalize="none"
                />
                <Button
                  title="Search"
                  loading={loading}
                  onPress={handleSearch}
                />

                {error ? (
                  <Text className="text-sm text-danger">{error}</Text>
                ) : null}

                {searchedUser ? (
                  <Card className="gap-2 border-primary/40 bg-surface2">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                          <Text className="text-base font-bold text-primary">
                            {searchedUser.name.slice(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-base font-semibold text-text">
                            {searchedUser.name}
                          </Text>
                          {searchedUser.email ? (
                            <Text className="text-xs text-muted">
                              {searchedUser.email}
                            </Text>
                          ) : null}
                          {searchedUser.phone ? (
                            <Text className="text-xs text-muted">
                              {searchedUser.phone}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <Button
                        title="Select"
                        onPress={() => {
                          onSelect(searchedUser);
                          handleClose();
                        }}
                      />
                    </View>
                  </Card>
                ) : null}
              </View>
            ) : (
              <View className="gap-3">
                <Text className="text-xs text-muted">
                  Match people in your address book who have registered PayPilot accounts.
                </Text>

                {loading ? (
                  <LoadingState label="Scanning contacts..." />
                ) : null}

                {error ? (
                  <Text className="text-sm text-danger">{error}</Text>
                ) : null}

                {contactsScanned && matchedContacts.length === 0 && !loading ? (
                  <Card>
                    <Text className="text-sm text-muted">
                      No contacts found on PayPilot. Try searching by email or name.
                    </Text>
                  </Card>
                ) : null}

                {matchedContacts.map((contact) => (
                  <Card key={contact.id} className="gap-2 bg-surface2">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                          <Text className="text-base font-bold text-primary">
                            {contact.name.slice(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-base font-semibold text-text">
                            {contact.name}
                          </Text>
                          {contact.email ? (
                            <Text className="text-xs text-muted">
                              {contact.email}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <Button
                        title="Select"
                        onPress={() => {
                          onSelect(contact);
                          handleClose();
                        }}
                      />
                    </View>
                  </Card>
                ))}

                <Button
                  title="Rescan Contacts"
                  variant="secondary"
                  onPress={handleScanContacts}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
