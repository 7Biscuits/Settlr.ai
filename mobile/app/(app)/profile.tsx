import React, { useCallback, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth/AuthContext";
import { getMeProfile, updateUserProfile } from "../../src/api/users";
import { getHealthStatus } from "../../src/api/health";
import type { HealthStatus } from "../../src/api/types";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import { Button } from "../../src/components/Button";
import { LoadingState, ErrorState } from "../../src/components/States";

export default function ProfileScreen() {
  const { user, updateUser, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [profileRes, healthRes] = await Promise.all([
        getMeProfile(),
        getHealthStatus().catch(() => ({ status: "degraded", database: "offline", timestamp: "" })),
      ]);
      const u = profileRes.user;
      setName(u.name);
      setPhone(u.phone ?? "");
      setBio(u.bio ?? "");
      setAvatarUrl(u.avatarUrl ?? "");
      updateUser(u);
      setHealth(healthRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSave() {
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await updateUserProfile({
        name: name.trim(),
        phone: phone.trim() ? phone.trim() : null,
        bio: bio.trim() ? bio.trim() : null,
        avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
      });
      updateUser(res.user);
      setEditing(false);
      setSuccessMsg("Profile updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading profile..." />;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
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
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Button
            title="←"
            variant="ghost"
            onPress={() => router.back()}
          />
          <Text className="text-2xl font-bold text-text">User Profile</Text>
        </View>
        <Button
          title={editing ? "Cancel" : "Edit"}
          variant="secondary"
          onPress={() => {
            if (editing) {
              setName(user?.name ?? "");
              setPhone(user?.phone ?? "");
              setBio(user?.bio ?? "");
              setAvatarUrl(user?.avatarUrl ?? "");
              setError(null);
            }
            setEditing(!editing);
          }}
        />
      </View>

      {error ? <ErrorState message={error} /> : null}
      {successMsg ? (
        <Card className="border-success/40 bg-success/10">
          <Text className="text-sm font-medium text-success">{successMsg}</Text>
        </Card>
      ) : null}

      {/* Avatar & Header Card */}
      <Card className="items-center gap-3 py-6">
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="h-20 w-20 rounded-full border-2 border-primary bg-surface2"
          />
        ) : (
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/20 border-2 border-primary">
            <Text className="text-3xl font-bold text-primary">
              {name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <View className="items-center gap-1">
          <Text className="text-xl font-bold text-text">{user?.name}</Text>
          <Text className="text-sm text-muted">{user?.email}</Text>
          {user?.phone ? (
            <Text className="text-xs text-muted">📞 {user.phone}</Text>
          ) : null}
        </View>
      </Card>

      {/* Profile Details / Edit Form */}
      <Card className="gap-4">
        <Text className="text-base font-semibold text-text">Account Information</Text>

        {editing ? (
          <View className="gap-3">
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Your Name"
            />
            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+1 555-0199"
            />
            <Input
              label="Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="Short bio or note"
              multiline
              numberOfLines={2}
            />
            <Input
              label="Avatar Image URL"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              placeholder="https://example.com/avatar.jpg"
              autoCapitalize="none"
            />
            <Button
              title="Save Changes"
              loading={saving}
              onPress={handleSave}
            />
          </View>
        ) : (
          <View className="gap-3">
            <View className="border-b border-border pb-2">
              <Text className="text-xs text-muted">Email</Text>
              <Text className="text-base text-text">{user?.email}</Text>
            </View>
            <View className="border-b border-border pb-2">
              <Text className="text-xs text-muted">Phone</Text>
              <Text className="text-base text-text">
                {user?.phone ? user.phone : "Not set"}
              </Text>
            </View>
            <View className="border-b border-border pb-2">
              <Text className="text-xs text-muted">Bio</Text>
              <Text className="text-base text-text">
                {user?.bio ? user.bio : "No bio added yet"}
              </Text>
            </View>
            <View className="pb-1">
              <Text className="text-xs text-muted">User ID</Text>
              <Text className="text-xs font-mono text-muted">{user?.id}</Text>
            </View>
          </View>
        )}
      </Card>

      {/* Backend Health & Connectivity */}
      <Card className="gap-2">
        <Text className="text-base font-semibold text-text">System & Connection</Text>
        <View className="flex-row items-center justify-between border-b border-border py-2">
          <Text className="text-sm text-muted">Server Status</Text>
          <View className="flex-row items-center gap-1.5">
            <View
              className={`h-2.5 w-2.5 rounded-full ${
                health?.status === "ok" ? "bg-success" : "bg-warning"
              }`}
            />
            <Text className="text-sm font-medium text-text capitalize">
              {health?.status ?? "Checking..."}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between py-2">
          <Text className="text-sm text-muted">Database</Text>
          <Text className="text-sm font-medium text-text capitalize">
            {health?.database ?? "Connected"}
          </Text>
        </View>
      </Card>

      {/* Server-Side Sign Out */}
      <Card className="gap-2">
        <Text className="text-base font-semibold text-text">Session</Text>
        <Text className="text-xs text-muted">
          Logging out will invalidate your authentication session on both this device and the backend server.
        </Text>
        <Button
          title="Sign out of PayPilot"
          variant="danger"
          onPress={signOut}
        />
      </Card>
    </ScrollView>
  );
}
