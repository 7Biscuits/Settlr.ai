import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "../../components/Button";
import type { DeviceContact } from "../../lib/contacts";

/**
 * Prompts the user to choose among multiple contacts that share the same name
 * (e.g. two "Rahul"s), showing their saved name and number so the correct
 * person can be picked for the invitation.
 */
export function ContactChooser({
  visible,
  contacts,
  onSelect,
  onCancel,
}: {
  visible: boolean;
  contacts: DeviceContact[];
  onSelect: (contact: DeviceContact) => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="max-h-[70%] rounded-t-3xl border-t border-border bg-surface p-5">
          <Text className="mb-1 text-lg font-bold text-text">
            Choose a contact
          </Text>
          <Text className="mb-3 text-sm text-muted">
            Multiple contacts share this name. Pick the right person to invite.
          </Text>
          <ScrollView>
            {contacts.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => onSelect(c)}
                className="border-b border-border py-3 active:opacity-70"
              >
                <Text className="text-base text-text">{c.name}</Text>
                <Text className="text-sm text-muted">
                  {c.emails[0] ?? c.phoneNumbers[0] ?? "No email or number saved"}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View className="mt-3">
            <Button title="Cancel" variant="ghost" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
