import React, { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { EmptyState } from "../../components/States";
import {
  createLocalContact,
  searchContacts,
  type DeviceContact,
} from "../../lib/contacts";

/**
 * Zero-permission in-app contact picker. Searches existing PayPilot users or allows
 * creating a new contact instantly with name and optional phone/email.
 */
export function ContactPicker({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (contact: DeviceContact) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DeviceContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      setResults(await searchContacts(q));
    } finally {
      setLoading(false);
    }
  }, []);

  function handleCreate() {
    if (!newName.trim()) return;
    const contact = createLocalContact(newName.trim(), newPhone.trim() || undefined);
    onSelect(contact);
    setIsCreating(false);
    setNewName("");
    setNewPhone("");
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => runSearch("")}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="h-3/4 rounded-t-3xl border-t border-border bg-surface p-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-text">
              {isCreating ? "New Contact" : "Select or Add Contact"}
            </Text>
            <Button title="Close" variant="ghost" onPress={onClose} />
          </View>

          {isCreating ? (
            <View className="gap-3">
              <Input
                label="Contact Name *"
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Sarah"
              />
              <Input
                label="Phone (Optional)"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                placeholder="e.g. +1 555 1234"
              />
              <View className="flex-row gap-2 mt-2">
                <View className="flex-1">
                  <Button
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setIsCreating(false)}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    title="Add Contact"
                    onPress={handleCreate}
                  />
                </View>
              </View>
            </View>
          ) : (
            <>
              <View className="mb-3 flex-row gap-2">
                <View className="flex-1">
                  <Input
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search name, email, or phone"
                    autoCapitalize="none"
                  />
                </View>
                <Button
                  title="Search"
                  variant="secondary"
                  loading={loading}
                  onPress={() => runSearch(query)}
                />
              </View>

              <View className="mb-3">
                <Button
                  title="+ Create New Contact"
                  variant="secondary"
                  onPress={() => {
                    setNewName(query);
                    setIsCreating(true);
                  }}
                />
              </View>

              {results.length === 0 ? (
                <EmptyState
                  title="No matching contacts found"
                  subtitle="Tap '+ Create New Contact' above to add someone."
                />
              ) : (
                <ScrollView>
                  {results.map((c: any) => (
                    <Pressable
                      key={c.id}
                      onPress={() => onSelect(c)}
                      className="flex-row items-center justify-between border-b border-border py-3 active:opacity-70"
                    >
                      <View className="gap-0.5">
                        <Text className="text-base font-semibold text-text">{c.name}</Text>
                        <Text className="text-sm text-muted">
                          {c.phoneNumbers[0] ?? c.emails[0] ?? (c.isRegistered ? "PayPilot User" : "Custom Contact")}
                        </Text>
                      </View>
                      {c.isRegistered ? (
                        <View className="rounded bg-primary/20 px-2 py-0.5">
                          <Text className="text-xs font-semibold text-primary">Registered</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
