import React, { useState } from "react";
import { Image, Modal, Pressable, Text, View } from "react-native";
import { Button } from "./Button";
import { Input } from "./Input";
import { Card } from "./Card";
import { uploadReceipt } from "../api/expenses";

interface Props {
  receiptUrl?: string | null;
  onReceiptChange: (url: string | null) => void;
}

export function ReceiptPicker({ receiptUrl, onReceiptChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [base64Input, setBase64Input] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  async function handleUploadBase64() {
    if (!base64Input.trim()) {
      setError("Please enter or paste image Base64 data.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const res = await uploadReceipt({
        imageBase64: base64Input.trim(),
        mimeType: "image/jpeg",
        fileName: "receipt.jpg",
      });
      onReceiptChange(res.url);
      setModalOpen(false);
      setBase64Input("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload receipt image.");
    } finally {
      setUploading(false);
    }
  }

  function handleAddUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setError("Please enter a valid URL (http:// or https://).");
      return;
    }
    onReceiptChange(trimmed);
    setModalOpen(false);
    setUrlInput("");
    setError(null);
  }

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-medium text-text">Receipt / Attachment</Text>
        {receiptUrl ? (
          <Button
            title="Remove"
            variant="danger"
            onPress={() => onReceiptChange(null)}
          />
        ) : (
          <Button
            title="+ Attach receipt"
            variant="secondary"
            onPress={() => {
              setError(null);
              setModalOpen(true);
            }}
          />
        )}
      </View>

      {receiptUrl ? (
        <Card className="flex-row items-center justify-between bg-surface2">
          <Pressable
            className="flex-row items-center gap-3"
            onPress={() => setPreviewModalOpen(true)}
          >
            <Image
              source={{ uri: receiptUrl }}
              className="h-14 w-14 rounded-lg bg-surface"
              resizeMode="cover"
            />
            <View className="gap-0.5">
              <Text className="text-sm font-medium text-text">Receipt attached</Text>
              <Text className="text-xs text-primary">Tap to view full receipt</Text>
            </View>
          </Pressable>
        </Card>
      ) : (
        <Text className="text-xs text-muted">No receipt attached.</Text>
      )}

      {/* Attachment Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl border-t border-border bg-surface p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-text">Attach Receipt</Text>
              <Pressable onPress={() => setModalOpen(false)} className="p-1">
                <Text className="text-lg text-muted">✕</Text>
              </Pressable>
            </View>

            <View className="gap-4">
              <View className="gap-2">
                <Input
                  label="Receipt Image URL"
                  placeholder="https://example.com/receipt.jpg"
                  value={urlInput}
                  onChangeText={setUrlInput}
                  autoCapitalize="none"
                />
                <Button title="Attach from URL" variant="secondary" onPress={handleAddUrl} />
              </View>

              <View className="flex-row items-center gap-2">
                <View className="flex-1 border-t border-border" />
                <Text className="text-xs text-muted">OR UPLOAD BASE64</Text>
                <View className="flex-1 border-t border-border" />
              </View>

              <View className="gap-2">
                <Input
                  label="Upload Image (Base64)"
                  placeholder="Paste base64 image data..."
                  value={base64Input}
                  onChangeText={setBase64Input}
                  multiline
                  numberOfLines={3}
                />
                <Button
                  title="Upload to Supabase Storage"
                  loading={uploading}
                  onPress={handleUploadBase64}
                />
              </View>

              {error ? <Text className="text-sm text-danger">{error}</Text> : null}
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Preview Modal */}
      <Modal visible={previewModalOpen} transparent animationType="fade" onRequestClose={() => setPreviewModalOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/90 p-4">
          <Pressable
            onPress={() => setPreviewModalOpen(false)}
            className="absolute right-4 top-12 z-10 rounded-full bg-surface2 px-3 py-1.5"
          >
            <Text className="text-base font-bold text-text">Close ✕</Text>
          </Pressable>
          {receiptUrl ? (
            <Image
              source={{ uri: receiptUrl }}
              className="h-4/5 w-full rounded-2xl"
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
