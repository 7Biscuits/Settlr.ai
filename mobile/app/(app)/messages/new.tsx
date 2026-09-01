import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input } from "../../../src/components/Input";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { LoadingState } from "../../../src/components/States";
import { lookupUser, bulkLookupContacts } from "../../../src/api/users";
import { initiateConversation } from "../../../src/api/messages";
import { ensureContactsPermission, searchContacts } from "../../../src/lib/contacts";
import type { ContactMatchUser } from "../../../src/api/types";

export default function NewMessageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<"search" | "contacts">("search");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
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
        setError("Contacts permission is required to match registered users.");
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
        err instanceof Error ? err.message : "Failed to scan device contacts.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStartConversation(recipientId: string) {
    setStartingChat(true);
    setError(null);
    try {
      const detail = await initiateConversation({ recipientId });
      router.replace(`/(app)/messages/${detail.conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start conversation.");
    } finally {
      setStartingChat(false);
    }
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-2 border-b border-border p-4">
        <Button
          title="←"
          variant="ghost"
          onPress={() => router.back()}
        />
        <Text className="text-2xl font-bold text-text">New Message</Text>
      </View>

      <View className="p-4 gap-3">
        <View className="flex-row gap-2">
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

        {error ? <Text className="text-sm text-danger">{error}</Text> : null}

        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
          {tab === "search" ? (
            <View className="gap-3">
              <Input
                label="Find user by Email, Phone, or Name"
                placeholder="e.g. john@example.com"
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
                      </View>
                    </View>
                    <Button
                      title="Chat"
                      loading={startingChat}
                      onPress={() => handleStartConversation(searchedUser.id)}
                    />
                  </View>
                </Card>
              ) : null}
            </View>
          ) : (
            <View className="gap-3">
              {loading ? (
                <LoadingState label="Matching contacts..." />
              ) : null}

              {contactsScanned && matchedContacts.length === 0 && !loading ? (
                <Card>
                  <Text className="text-sm text-muted">
                    No contacts found on PayPilot. Try searching by email above.
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
                      title="Chat"
                      loading={startingChat}
                      onPress={() => handleStartConversation(contact.id)}
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
  );
}
