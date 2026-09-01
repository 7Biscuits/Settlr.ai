import React, { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { acceptInvitation, getInvitation } from "../../src/api/groups";
import type { GroupInvitation } from "../../src/api/types";
import { Card } from "../../src/components/Card";
import { Button } from "../../src/components/Button";
import { ErrorState, LoadingState } from "../../src/components/States";

/** Authenticated deep-link destination for a real group invitation. */
export default function InvitationScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [invitation, setInvitation] = useState<GroupInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const result = await getInvitation(token);
      setInvitation(result.invitation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load invitation");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function accept() {
    if (!token) return;
    setAccepting(true);
    setError(null);
    try {
      const { group } = await acceptInvitation(token);
      router.replace(`/(app)/groups/${group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept invitation");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) return <LoadingState label="Loading invitation..." />;
  if (error && !invitation) return <ErrorState message={error} onRetry={load} />;
  if (!invitation) return <ErrorState message="Invitation not found" />;

  const active = invitation.status === "pending";
  return (
    <ScrollView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      contentContainerStyle={{ padding: 16, justifyContent: "center", flexGrow: 1 }}
    >
      <Card className="gap-4">
        <View className="gap-1">
          <Text className="text-sm text-muted">You’ve been invited to</Text>
          <Text className="text-2xl font-bold text-text">{invitation.groupName}</Text>
          <Text className="text-sm text-muted">Sent to {invitation.email}</Text>
        </View>
        {error ? <Text className="text-sm text-danger">{error}</Text> : null}
        {active ? (
          <Button title="Join group" loading={accepting} onPress={accept} />
        ) : (
          <Text className="text-sm text-muted">
            This invitation is {invitation.status}.
          </Text>
        )}
      </Card>
    </ScrollView>
  );
}
