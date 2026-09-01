import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { addMemberByEmail } from "../../../../src/api/groups";
import { Card } from "../../../../src/components/Card";
import { Button } from "../../../../src/components/Button";
import { Input } from "../../../../src/components/Input";
import { ContactPicker } from "../../../../src/features/contacts/ContactPicker";
import type { DeviceContact } from "../../../../src/lib/contacts";
import { ApiError } from "../../../../src/api/client";

/**
 * Add a member to a group. Members are added by the email the backend knows.
 * The device contact picker helps the user find someone quickly and prefills
 * the email when a contact has one — but the backend still resolves and
 * authorizes the actual membership.
 */
export default function AddMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  function onPickContact(contact: DeviceContact) {
    setPickerOpen(false);
    if (contact.emails[0]) {
      setEmail(contact.emails[0]);
      setInfo(`Using ${contact.name}'s email.`);
    } else {
      setInfo(
        `${contact.name} has no email saved. Enter their PayPilot email to add them.`,
      );
    }
  }

  async function submit() {
    if (!id || !email.trim()) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await addMemberByEmail(id, email.trim());
      router.back();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to add member",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <Text className="text-2xl font-bold text-text">Add member</Text>

      <Card className="gap-3">
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="friend@example.com"
        />
        <Button
          title="Pick from contacts"
          variant="secondary"
          onPress={() => setPickerOpen(true)}
        />
        {info ? <Text className="text-sm text-muted">{info}</Text> : null}
        {error ? <Text className="text-sm text-danger">{error}</Text> : null}
        <Button title="Add to group" loading={loading} onPress={submit} />
      </Card>

      <ContactPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onPickContact}
      />
    </ScrollView>
  );
}
