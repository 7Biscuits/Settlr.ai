import React, { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { EmptyState } from "../../components/States";
import {
  ensureContactsPermission,
  searchContacts,
  type DeviceContact,
} from "../../lib/contacts";

/**
 * On-device contact picker. Requests permission on open, lets the user search,
 * and returns the chosen contact. The full address book is never sent anywhere;
 * only the selected contact's details are used locally.
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
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">(
    "unknown",
  );
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const granted = await ensureContactsPermission();
      setPermission(granted ? "granted" : "denied");
      if (granted) setResults(await searchContacts(q));
    } finally {
      setLoading(false);
    }
  }, []);

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
            <Text className="text-lg font-bold text-text">Contacts</Text>
            <Button title="Close" variant="ghost" onPress={onClose} />
          </View>

          <View className="mb-3 flex-row gap-2">
            <View className="flex-1">
              <Input
                value={query}
                onChangeText={setQuery}
                placeholder="Search contacts"
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

          {permission === "denied" ? (
            <EmptyState
              title="Contacts permission denied"
              subtitle="Enable contacts access in Settings to pick a friend."
            />
          ) : results.length === 0 ? (
            <EmptyState
              title="No contacts found"
              subtitle="Try a different search."
            />
          ) : (
            <ScrollView>
              {results.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => onSelect(c)}
                  className="border-b border-border py-3 active:opacity-70"
                >
                  <Text className="text-base text-text">{c.name}</Text>
                  <Text className="text-sm text-muted">
                    {c.phoneNumbers[0] ?? c.emails[0] ?? "No contact info"}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
