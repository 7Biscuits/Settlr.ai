import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { listGroups, createGroup } from "../../../src/api/groups";
import type { Group } from "../../../src/api/types";
import { Card } from "../../../src/components/Card";
import { Button } from "../../../src/components/Button";
import { Input } from "../../../src/components/Input";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../../src/components/States";

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { groups } = await listGroups();
      setGroups(groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function submit() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createGroup(name.trim());
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <LoadingState label="Loading groups..." />;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor="#3b82f6"
        />
      }
    >
      <Text className="text-2xl font-bold text-text">Groups</Text>

      <Card className="gap-3">
        <Text className="text-base font-medium text-text">New group</Text>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="e.g. Goa Trip"
        />
        <Button title="Create group" loading={creating} onPress={submit} />
      </Card>

      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          subtitle="Create a group above to start splitting expenses."
        />
      ) : (
        <View className="gap-2">
          {groups.map((g) => (
            <Card key={g.id}>
              <Text
                className="text-base font-medium text-text"
                onPress={() => router.push(`/(app)/groups/${g.id}`)}
              >
                {g.name}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
