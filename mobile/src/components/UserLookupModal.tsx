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
import { lookupUser } from "../api/users";
import { createLocalContact, searchContacts } from "../lib/contacts";
import type { ContactMatchUser } from "../api/types";

interface Props {
  visible: boolean;
  title?: string;
  onSelect: (user: ContactMatchUser) => void;
  onCancel: () => void;
}

export function UserLookupModal({
  visible,
  title = "Find or Add Contact",
  onSelect,
  onCancel,
}: Props) {
  const [mode, setMode] = useState<"search" | "create">("search");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedUser, setSearchedUser] = useState<ContactMatchUser | null>(null);

  // New Contact Fields
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

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
    } catch {
      // If not on server, check local contacts
      const local = await searchContacts(q);
      if (local.length > 0 && local[0]) {
        setSearchedUser({
          id: local[0].id,
          name: local[0].name,
          avatarUrl: null,
          phone: local[0].phoneNumbers[0] || null,
          email: local[0].emails[0] || null,
        });
      } else {
        setError(`No existing user found for "${q}". You can create a new contact below.`);
        setNewName(q);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCreateContact() {
    const name = newName.trim();
    if (!name) {
      setError("Contact name is required.");
      return;
    }

    const contact = createLocalContact(
      name,
      newPhone.trim() || undefined,
      newEmail.trim() || undefined,
    );

    onSelect({
      id: contact.id,
      name: contact.name,
      avatarUrl: null,
      phone: contact.phoneNumbers[0] || null,
      email: contact.emails[0] || null,
    });
    handleClose();
  }

  function handleClose() {
    setQuery("");
    setError(null);
    setSearchedUser(null);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setMode("search");
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
                variant={mode === "search" ? "primary" : "secondary"}
                onPress={() => {
                  setMode("search");
                  setError(null);
                }}
              />
            </View>
            <View className="flex-1">
              <Button
                title="+ New Contact"
                variant={mode === "create" ? "primary" : "secondary"}
                onPress={() => {
                  setMode("create");
                  setError(null);
                }}
              />
            </View>
          </View>

          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            {mode === "search" ? (
              <View className="gap-3">
                <Input
                  label="Search by Name, Email, or Phone"
                  placeholder="e.g. Shahil or shahil@settlr.ai"
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
                  <View className="gap-2">
                    <Text className="text-sm text-danger">{error}</Text>
                    <Button
                      title={`+ Create "${query || "New Contact"}"`}
                      variant="secondary"
                      onPress={() => {
                        setNewName(query);
                        setMode("create");
                      }}
                    />
                  </View>
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
                  Add a contact by name. Phone number and email are completely optional.
                </Text>

                <Input
                  label="Contact Name *"
                  placeholder="e.g. Kamal"
                  value={newName}
                  onChangeText={setNewName}
                />

                <Input
                  label="Phone Number (Optional)"
                  placeholder="e.g. +91 98765 00001"
                  value={newPhone}
                  onChangeText={setNewPhone}
                  keyboardType="phone-pad"
                />


                <Input
                  label="Email (Optional)"
                  placeholder="e.g. kamal@settlr.ai"
                  value={newEmail}

                  onChangeText={setNewEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                {error ? <Text className="text-sm text-danger">{error}</Text> : null}

                <Button
                  title="Add & Select Contact"
                  onPress={handleCreateContact}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
